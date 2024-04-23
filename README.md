Nostr-Login
===========

This library is a powerful `window.nostr` provider.

```
<script src='https://www.unpkg.com/nostr-login@latest/dist/unpkg.js'></script>
```

Just add the above script to your HTML and 
get a nice UI for users to login with an extension, with Nostr Connect (nip46), read-only login,
account switching, OAuth-like sign up, etc. Your app just talks to the `window.nostr`, the
rest is handled by `nostr-login`.

See it in action on [nostr.band](https://nostr.band).

## Advanced usage

To use as a module:

```
import { init as initNostrLogin } from "nostr-login"

// make sure this is called before any
// window.nostr calls are made
initNostrLogin({/*options*/})

```

That's it, now whenever window.nostr call is made, it will be proxied
to the user's key storage app or extension. On the first call, a dialog is shown to
let users go through sign up or log in flow.

You can also customize the experience and trigger the login dialogs 
yourself:

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

API:
- `init(opts)` - set mapping of window.nostr to nostr-login
- `launch(opts)` - launch nostr-login UI
- `logout()` - drop the current nip46 connection 

Options:
- `theme` - 'default' | 'ocean' | 'lemonade' | 'purple' 
- `startScreen` - 'welcome' | 'signin' | 'signup'
- `bunkers` - comma-separated list of bunkers, i.e. nsec.app,nsecbunker.com
- `devOverrideBunkerOrigin` - for testing, overrides the bunker origin for local setup

TODO:
- fetch bunker list using NIP-89
- add timeout handling
