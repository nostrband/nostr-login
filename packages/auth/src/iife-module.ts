import { init } from './index';
import { NostrLoginOptions } from './types';

// wrap to hide local vars
(() => {
  // currentScript only visible in global scope code, not event handlers
  const cs = document.currentScript;
  document.addEventListener('DOMContentLoaded', async () => {
    const options: NostrLoginOptions = {
    };

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
      if (noBanner === 'true') options.noBanner = true;

      const localSignup = cs.getAttribute('data-local-signup');
      if (localSignup === 'false') options.noLocalSignup = false;
    }

    init(options);
  });
})();
