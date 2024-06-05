import { init } from './index';
import { NostrLoginOptions } from './types';

// wrap to hide local vars
(() => {
  // currentScript only visible in global scope code, not event handlers
  const cs = document.currentScript;
  const start = async () => {
    const options: NostrLoginOptions = {};

    if (cs) {
      const dm = cs.getAttribute('data-dark-mode');
      if (dm) options.darkMode = dm === 'true';

      const bunkers = cs.getAttribute('data-bunkers');
      if (bunkers) options.bunkers = bunkers;

      const perms = cs.getAttribute('data-perms');
      if (perms) options.perms = perms;

      const theme = cs.getAttribute('data-theme');
      if (theme) options.theme = theme;

      const noBanner = cs.getAttribute('data-no-banner');
      if (noBanner) options.noBanner = noBanner === 'true';

      const localSignup = cs.getAttribute('data-local-signup');
      if (localSignup) options.localSignup = localSignup === 'true';

      const methods = cs.getAttribute('data-methods');
      if (methods) {
        // @ts-ignore
        options.methods = methods
          .trim()
          .split(',')
          .filter(m => !!m);
      }
      console.log("nostr-login options", options);
    }

    init(options);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
