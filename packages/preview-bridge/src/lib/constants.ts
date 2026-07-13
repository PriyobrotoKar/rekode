export const getInjectScript = (targetOrigin: string) => `
  <script>
    (function(){
      const targetOrigin = ${JSON.stringify(targetOrigin)};

      function report(type){
        const data = {
          type,
          url: location.href,
          timestamp: Date.now(),
        }

        window.parent.postMessage(data, targetOrigin);
      }

      report('ready');

      const _pushState = history.pushState;
      const _replaceState = history.replaceState;

      history.pushState = function(){
        _pushState.apply(this, arguments);
        report('url_change');
      }

      history.replaceState = function(){
        _replaceState.apply(this, arguments);
        report('url_change');
      }

      window.addEventListener('popstate', function(){ report('url_change') });
      window.addEventListener('hashchange', function(){ report('url_change') });

      window.addEventListener('message', (e) => {
        if (e.origin !== targetOrigin) return;

        if (e.data.type === 'url_back') history.back();
        if (e.data.type === 'url_forward') history.forward();
        if (e.data.type === 'url_reload') window.location.reload();
      });
    })();
  </script>
`;
