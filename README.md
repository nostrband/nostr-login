Nostr-Login
===========

This library enables NIP-46 Nostr Connect in your app. It installs a custom window.nostr object that will proxy your NIP-07 calls to
the NIP-46 calls for remote signing. The library provides several UI
screens to let users set up the NIP-46 connection, it also supports
the new OAuth-like flow that is very smooth.

Usage:
`
import { init as initNostrLogin } from "nostr-login"

// make sure this is called before any
// window.nostr calls are made
initNostrLogin({/*options*/})

`

That's it, now whenever window.nostr call is made, it will be proxied
to the user's key storage app. On the first call, a dialog is shown to
let users go through sign up or log in flow.

You can also customize the experience and trigger the login dialogs 
yourself:

`
import { launch as launchNostrLoginDialog } from "nostr-login"

// make sure init() was called 

// on your signup button click
function onSignupClick() {
  // launch signup screen
  launchNostrLoginDialog({
    startScreen: 'signup'
  })
}
`

Options:
- `theme` - 'default' | 'ocean' | 'lemonade' | 'purple' 
- `startScreen` - 'welcome' | 'signin' | 'signup'
- `bunkers` - comma-separated list of bunkers, i.e. nsec.app,nsecbunker.com
- `devOverrideBunkerOrigin` - for testing, overrides the bunker origin for local setup

TODO:
- fetch bunker list using NIP-89
- improve handling of popup blocks
- add timeout handling