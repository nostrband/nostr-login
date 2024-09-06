import { init } from './index';
import { NostrLoginOptions, StartScreens } from './types';

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

      const startScreen = cs.getAttribute('data-start-screen');
      if (startScreen) options.startScreen = startScreen as StartScreens;

      const perms = cs.getAttribute('data-perms');
      if (perms) options.perms = perms;

      const theme = cs.getAttribute('data-theme');
      if (theme) options.theme = theme;

      const noBanner = cs.getAttribute('data-no-banner');
      if (noBanner) options.noBanner = noBanner === 'true';

      const localSignup = cs.getAttribute('data-local-signup');
      if (localSignup) options.localSignup = localSignup === 'true';

      const otpRequestUrl = cs.getAttribute('data-otp-request-url');
      if (otpRequestUrl) options.otpRequestUrl = otpRequestUrl;

      const otpReplyUrl = cs.getAttribute('data-otp-reply-url');
      if (otpReplyUrl) options.otpReplyUrl = otpReplyUrl;

      if (!!otpRequestUrl !== !!otpReplyUrl)
        console.warn("nostr-login: need request and reply urls for OTP auth");

      const methods = cs.getAttribute('data-methods');
      if (methods) {
        // @ts-ignore
        options.methods = methods
          .trim()
          .split(',')
          .filter(m => !!m);
      }

      const title = cs.getAttribute('data-title');
      if (title) options.title = title;

      const description = cs.getAttribute('data-description');
      if (description) options.description = description;

      console.log("nostr-login options", options);
    }

    init(options);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
