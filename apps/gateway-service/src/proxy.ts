import httpProxy from '@fastify/http-proxy';
import { injectScript } from '@rekode/preview-bridge/server';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { request as undiciRequest } from 'undici';

import { client } from './lib/redis';

declare module 'fastify' {
  interface FastifyRequest {
    containerPort?: string;
  }
}

// const INJECTED_SCRIPT = `<script>
// (function () {
//   function report() {
//     window.parent.postMessage({
//       type: 'urlchange',
//       pathname: window.location.pathname,
//       search: window.location.search,
//       hash: window.location.hash,
//     }, '*');
//   }

//   report();

//   const push = history.pushState.bind(history);
//   history.pushState = (...args) => { push(...args); report(); };

//   const replace = history.replaceState.bind(history);
//   history.replaceState = (...args) => { replace(...args); report(); };

//   window.addEventListener('popstate', report);

//   window.addEventListener('message', (e) => {
//     if (e.data.type === 'urlback') history.back();
//     if (e.data.type === 'urlforward') history.forward();
//     if (e.data.type === 'urlreload') window.location.reload();
//   });
// })();
// </script>`;

// function injectScript(html: string): string {
//   if (html.includes('<head>')) {
//     return html.replace('<head>', `<head>${INJECTED_SCRIPT}`);
//   }
//   if (html.includes('<html')) {
//     return html.replace(/<html[^>]*>/, (match) => `${match}${INJECTED_SCRIPT}`);
//   }
//   return `${INJECTED_SCRIPT}${html}`;
// }

function getContainerName(request: FastifyRequest): string {
  return request.host?.split('.')[0] ?? '';
}

function getContainerPort(request: FastifyRequest): string {
  return request.containerPort || '4321';
}

// Vite auto-allows *.localhost hosts, so we send this as the Host header
// while still connecting to the container by its Docker DNS name.
function getViteHost(name: string, port: string): string {
  return `${name}.localhost:${port}`;
}

function getUpstreamUrl(request: FastifyRequest): string {
  const name = getContainerName(request);
  const port = getContainerPort(request);
  return `http://${name}:${port}`;
}

function isNavigationRequest(request: FastifyRequest): boolean {
  if (request.method !== 'GET') return false;
  const dest = (request.headers['sec-fetch-dest'] as string | undefined) ?? '';
  // 'document' = direct top-level load, 'iframe' = loading inside your preview iframe.
  // Deliberately excludes 'empty' — that's fetch()/XHR/EventSource/WebSocket,
  // which is exactly what was causing RSC data fetches to hit this path.
  return dest === 'document' || dest === 'iframe';
}

async function fetchAndInject(
  request: FastifyRequest,
  reply: FastifyReply,
  upstreamUrl: string,
): Promise<boolean> {
  if (!isNavigationRequest(request)) return false;

  const name = getContainerName(request);
  const port = getContainerPort(request);
  const targetUrl = `${upstreamUrl}${request.url}`;

  // undici.request honours the host header we pass, unlike fetch() which
  // always uses the URL authority. We send <name>.localhost:<port> so Vite's
  // host-check middleware accepts the request (it auto-allows *.localhost).
  const { statusCode, headers: upstreamHeaders, body } = await undiciRequest(targetUrl, {
    method: request.method as 'GET',
    headers: {
      ...request.headers,
      host: getViteHost(name, port),
      'x-forwarded-host': request.headers.host ?? '',
      'x-forwarded-proto': 'http',
    },
  });

  const contentType = (upstreamHeaders['content-type'] as string | undefined) ?? '';
  if (!contentType.includes('text/html')) {
    await body.dump().catch(() => {});
    return false;
  }

  const html = await body.text();
  const injected = injectScript(html, {
    targetOrigin: 'http://localhost:3000',
  });

  // Forward upstream headers, strip problematic ones
  for (const [key, value] of Object.entries(upstreamHeaders)) {
    if (
      [
        'content-security-policy',
        'content-security-policy-report-only',
        'content-encoding',
        'content-length',
        'transfer-encoding',
      ].includes(key)
    )
      continue;
    if (value !== undefined) reply.header(key, value as string);
  }

  reply
    .code(statusCode)
    .header('content-type', 'text/html; charset=utf-8')
    .send(injected);

  return true;
}

const proxy = Fastify({ logger: false });

function resolveTargetPort(request: FastifyRequest): string {
  const isWs = request.headers?.upgrade?.toLowerCase() === 'websocket';
  const path = (request.url ?? '').split('?')[0];
  const isTerminalSocket = isWs && path === '/';
  return isTerminalSocket ? '9999' : getContainerPort(request);
}

proxy.register(httpProxy, {
  upstream: '',
  websocket: true,
  preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
    const name = request.host?.split('.')[0];
    if (!name) return;
    const port = await client.get(`container:${name}`);
    request.containerPort = port || undefined;
    const upstreamUrl = getUpstreamUrl(request);
    const handled = await fetchAndInject(request, reply, upstreamUrl);
    if (handled) {
      return reply;
    }
  },
  replyOptions: {
    getUpstream: (request) => {
      const name = request.host?.split('.')[0] ?? '';
      return `http://${name}:${resolveTargetPort(request as FastifyRequest)}`;
    },
    rewriteRequestHeaders: (request, headers) => {
      const name = request.host?.split('.')[0] ?? '';
      const port = resolveTargetPort(request as FastifyRequest);
      return {
        ...headers,
        host: getViteHost(name, port),
        'x-forwarded-host': request.headers.host ?? '',
        'x-forwarded-proto': 'http',
      };
    },
    rewriteHeaders: (headers, req) => {
      const newHeaders = { ...headers };
      if (newHeaders['content-length']) {
        delete newHeaders['transfer-encoding'];
      }
      delete newHeaders['content-security-policy'];
      delete newHeaders['content-security-policy-report-only'];
      if (newHeaders['location']) {
        const externalHost = req?.headers?.host ?? '';
        newHeaders['location'] = newHeaders['location'].replace(
          /^http:\/\/[^/]+/,
          `http://${externalHost}`,
        );
      }
      return newHeaders;
    },
  },
  wsClientOptions: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rewriteRequestHeaders: (headers: Record<string, string>, request: any) => {
      const name = (request.host as string | undefined)?.split('.')[0] ?? '';
      const port = resolveTargetPort(request as FastifyRequest);
      return {
        ...headers,
        host: getViteHost(name, port),
      };
    },
  },
  disableCache: true,
  cacheURLs: 0,
});

export { proxy };
