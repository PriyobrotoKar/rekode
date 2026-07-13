import httpProxy from '@fastify/http-proxy';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';

import { client } from './lib/redis';

declare module 'fastify' {
  interface FastifyRequest {
    containerPort?: string;
  }
}

const INJECTED_SCRIPT = `<script>
(function () {
  function report() {
    window.parent.postMessage({
      type: 'urlchange',
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
    }, '*');
  }

  report();

  const push = history.pushState.bind(history);
  history.pushState = (...args) => { push(...args); report(); };

  const replace = history.replaceState.bind(history);
  history.replaceState = (...args) => { replace(...args); report(); };

  window.addEventListener('popstate', report);

  window.addEventListener('message', (e) => {
    if (e.data.type === 'urlback') history.back();
    if (e.data.type === 'urlforward') history.forward();
    if (e.data.type === 'urlreload') window.location.reload();
  });
})();
</script>`;

function injectScript(html: string): string {
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${INJECTED_SCRIPT}`);
  }
  if (html.includes('<html')) {
    return html.replace(/<html[^>]*>/, (match) => `${match}${INJECTED_SCRIPT}`);
  }
  return `${INJECTED_SCRIPT}${html}`;
}

function getUpstreamUrl(request: FastifyRequest): string {
  const name = request.host?.split('.')[0] ?? '';
  const port = request.containerPort || '4321';
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

  const targetUrl = `${upstreamUrl}${request.url}`;

  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers: {
      ...request.headers,
      host: new URL(upstreamUrl).host,
      'x-forwarded-host': request.headers.host ?? '',
      'x-forwarded-proto': 'http',
    } as HeadersInit,
  });

  const contentType = upstreamResponse.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    // Defense in depth: even with the check above, drain/cancel rather than
    // abandoning a half-read upstream connection if this path is ever hit.
    await upstreamResponse.body?.cancel().catch(() => {});
    return false;
  }

  const html = await upstreamResponse.text();
  const injected = injectScript(html);

  // ...rest unchanged

  // Forward upstream headers, strip problematic ones
  upstreamResponse.headers.forEach((value, key) => {
    if (
      [
        'content-security-policy',
        'content-security-policy-report-only',
        'content-encoding',
        'content-length',
        'transfer-encoding',
      ].includes(key)
    )
      return;
    reply.header(key, value);
  });

  reply
    .code(upstreamResponse.status)
    .header('content-type', 'text/html; charset=utf-8')
    .send(injected);

  return true;
}

const proxy = Fastify({ logger: false });

function resolveTargetPort(request: FastifyRequest): string {
  const isWs = request.headers?.upgrade?.toLowerCase() === 'websocket';
  const path = (request.url ?? '').split('?')[0];
  const isTerminalSocket = isWs && path === '/';
  const port = isTerminalSocket ? '9999' : (request.containerPort || '4321');

    if (isWs) {
      console.log('[ws-route]', {
        host: request.host,
        path,
        containerPortOnRequest: request.containerPort,
        resolvedPort: port,
      });
    }

    return port;
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
      return `http://${name}:${resolveTargetPort(request)}`;
    },
    rewriteRequestHeaders: (request, headers) => {
      const name = request.host?.split('.')[0] ?? '';
      const port = resolveTargetPort(request as FastifyRequest);
      return {
        ...headers,
        host: `${name}:${port}`,
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
    rewriteRequestHeaders: (headers, request) => {
      const name = request.host?.split('.')[0] ?? '';
      const port = resolveTargetPort(request as FastifyRequest);
      return {
        ...headers,
        host: `${name}:${port}`,
      };
    },
  },
  disableCache: true,
  cacheURLs: 0,
});

export { proxy };
