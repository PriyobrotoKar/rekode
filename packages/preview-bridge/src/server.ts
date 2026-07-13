import { getInjectScript } from './lib/constants.js';

interface PreviewBridgeScriptOptions {
  targetOrigin: string;
}

export function injectScript(html: string, options: PreviewBridgeScriptOptions) {
  const script = getInjectScript(options.targetOrigin);

  if (html.includes('</body>')) {
    return html.replace('</body>', `${script}</body>`);
  }

  return html + script;
}
