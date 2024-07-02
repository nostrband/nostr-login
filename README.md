Nostr-Login
===========

This library is a powerful `window.nostr` provider.

```
<script src='https://www.unpkg.com/nostr-login@latest/dist/unpkg.js'></script>
```

Just add the above script to your HTML and 
get a nice UI for users to login with Nostr Connect (nip46), with an extension, read-only login,
account switching, OAuth-like sign up, etc. Your app just talks to the `window.nostr`, the rest is handled by `nostr-login`.

See it in action on [nostr.band](https://nostr.band).

## Options

You can set these attributes to the `script` tag to customize the behavior:
- `data-dark-mode` - `true`/`false`, default will use the browser's color theme
- `data-bunkers` - the comma-separated list of domain names of Nostr Connect (nip46) providers for sign up, i.e. `nsec.app,highlighter.com`
- `data-perms` - the comma-separated list of [permissions](https://github.com/nostr-protocol/nips/blob/master/46.md#requested-permissions) requested by the app over Nostr Connect, i.e. `sign_event:1,nip04_encrypt`
- `data-theme` - color themes, one of `default`, `ocean`, `lemonade`, `purple`
- `data-no-banner` - if `true`, do not show the `nostr-login` banner, will need to launch the modals using event dispatch, see below
- `data-methods` - comma-separated list of allowed auth methods, method names: `connect`, `extension`, `readOnly`, `local`, all allowed by default.
- `data-otp-request-url` - URL for requesting OTP code
- `data-otp-reply-url` - URL for replying with OTP code
- `data-title` - title for the welcome screen
- `data-description` - description for the welcome screen

Example:
```
<script src='https://www.unpkg.com/nostr-login@latest/dist/unpkg.js' data-perms="sign_event:1,sign_event:0" data-theme="ocean"></script>
```

## Updating the UI

Whenever user performs an auth-related action using `nostr-login`, a `nlAuth` event will be dispatched on the `document`, which you can listen
to in order to update your UI (show user profile, etc):

```
document.addEventListener('nlAuth', (e) => {
  // type is login, signup or logout
  if (e.detail.type === 'login' || e.detail.type === 'signup') {
    onLogin();  // get pubkey with window.nostr and show user profile
  } else {
    onLogout()  // clear local user data, hide profile info 
  }
})
```

## Launching, logout, etc

The `nostr-login` auth modals will be automatically launched whenever you
make a call to `window.nostr` if user isn't authed yet. However, you can also launch the auth flow by dispatching a custom `nlLaunch` event:

```
document.dispatchEvent(new CustomEvent('nlLaunch', { detail: 'welcome' }));
```

The `detail` event payload can be empty, or can be one of `welcome`, `signup`, `login`, `login-bunker-url`, `login-read-only`, `switch-account`.

To trigger logout in the `nostr-login`, you can dispatch a `nlLogout` event:

```
document.dispatchEvent(new Event("nlLogout"));
```

To change dark mode in the `nostr-login`, you can dispatch a `nlDarkMode` event, with detail as `darkMode` boolean:

```
document.dispatchEvent(new CustomEvent("nlDarkMode", { detail: true }));
```

## Use as a package

Install `nostr-login` package with `npm` and then:

```
import { init as initNostrLogin } from "nostr-login"

// make sure this is called before any
// window.nostr calls are made
initNostrLogin({/*options*/})

```

Now the `window.nostr` will be initialized and on your first call
to it the auth flow will be launched if user isn't authed yet.

You can also launch the auth flow yourself:

```
import { launch as launchNostrLoginDialog } from "nostr-login"

// make sure init() was called 

// on your signup button click
function onSignupClick() {
  // launch signup screen
  launchNostrLoginDialog({
    startScreen: 'signup'
  })
}
```

### Next.js Fix for Server Side Rendering (SSR)

`nostr-login` calls `document` which is unavailable for server-side rendering. You will have build errors. To fix this, you can import `nostr-login` on the client side in your component with a `useEffect` like this:

```javascript
  useEffect(() => {
    import('nostr-login')
      .then(async ({ init }) => {
        init({
          // options
        })
      })
      .catch((error) => console.log('Failed to load nostr-login', error));
  }, []);
```
Note: even if your component has `"use client"` in the first line, this fix still may be necessary.

---

API:
- `init(opts)` - set mapping of window.nostr to nostr-login
- `launch(startScreen)` - launch nostr-login UI
- `logout()` - drop the current nip46 connection 

Options:
- `theme` - same as `data-theme` above
- `startScreen` - same as `startScreen` for `nlLaunch` event above
- `bunkers` - same as `data-bunkers` above
- `devOverrideBunkerOrigin` - for testing, overrides the bunker origin for local setup
- `onAuth: (npub: string, options: NostrLoginAuthOptions)` - a callback to provide instead of listening to `nlAuth` event
- `perms` - same as `data-perms` above
- `darkMode` - same as `data-dark-mode` above
- `noBanner` - same as `data-no-banner` above
- `isSignInWithExtension` - `true` to bring the *Sign in with exception* button into main list of options, `false` to hide to the *Advanced*, default will behave as `true` if extension is detected.

## OTP login

If you supply both `data-otp-request-url` and `data-otp-reply-url` then "Login with DM" button will appear on the welcome screen. 

When user enters their nip05 or npub, a GET request is made to `<data-otp-request-url>[?&]pubkey=<user-pubkey>`. Server should send
a DM with one-time code to that pubkey and should return 200.

After user enters the code, a GET request is made to `<data-otp-reply-url>[?&]pubkey=<user-pubkey>&code=<code>`. Server should check that code matches the pubkey and hasn't expired, and should return 200 status and an optional payload. Nostr-login will deliver the payload as `otpData` field in `nlAuth` event, and will save the payload in localstore and will deliver it again as `nlAuth` on page reload.

The reply payload may be used to supply the session token. If token is sent by the server as a cookie then payload might be empty, otherwise the payload should be used by the app to extract the token and use it in future API calls to the server.


## TODO

- fetch bunker list using NIP-89
- Amber support
- allow use without the UIs
- add timeout handling
- more at [issues](https://github.com/nostrband/nostr-login/issues)
