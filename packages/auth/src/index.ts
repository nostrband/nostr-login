/* eslint-disable */
// @ts-nocheck
import 'nostr-login-components';
import NDK, { NDKNip46Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { getEventHash, generatePrivateKey } from 'nostr-tools';

export interface NostrLoginOptions {
  // optional
  theme?: string;
  startScreen?: string;
}

const LOCALSTORE_KEY = '__nostrlogin_nip46';
const ndk = new NDK({
  enableOutboxModel: false,
});
let signer = null;
let signerPromise = null;
let optionsModal: NostrLoginOptions = {
  theme: 'default',
  startScreen: 'welcome',
};

const nostr = {
  async getPublicKey() {
    await ensureSigner();
    return signer.remotePubkey;
  },
  async signEvent(event) {
    await ensureSigner();
    event.pubkey = signer.remotePubkey;
    event.id = getEventHash(event);
    event.sig = signer.sign(event);
    return event;
  },
  async getRelays() {
    // FIXME implement!
    return {}
  },
  nip04: {
    async encrypt(pubkey, plaintext) {
      await ensureSigner();
      return signer.encrypt(pubkey, plaintext);
    },
    async decrypt(pubkey, ciphertext) {
      await ensureSigner();
      return signer.decrypt(pubkey, ciphertext);
    },
  },
};

export const launch = (opt: NostrLoginOptions) => {

  const dialog = document.createElement('dialog');
  const modal = document.createElement('nl-auth');

  if (opt.theme) {
    modal.setAttribute('theme', opt.theme);
  }

  if (opt.startScreen) {
    modal.setAttribute('start-screen', opt.startScreen);
  }

  dialog.appendChild(modal);
  document.body.appendChild(dialog);

  return new Promise((ok) => {
    const handleBunkerUrl = (url: string) => {
      modal.error = 'Please confirm in your key storage app.';
      authNip46(url)
        .then(() => {
          modal.isFetchLogin = false;
          dialog.close();
          ok();
        })
        .catch(e => {
          console.log('error', e);
          modal.isFetchLogin = false;
          modal.error = e.toString();
        });
    };

    modal.addEventListener('handleGetValue', event => {
      handleBunkerUrl(event.detail);
    });

    modal.addEventListener('handleCloseModal', () => {
      handleBunkerUrl();
    });

    dialog.showModal();
  });
};

const connectModals = (defaultOpt: NostrLoginOptions) => {
  const initialModals = async (opt: NostrLoginOptions) => {
    await launch(opt);
  };

  const nlElements = document.getElementsByTagName('nl-button');

  for (let i = 0; i < nlElements.length; i++) {
    const theme = nlElements[i].getAttribute('nl-theme');
    const startScreen = nlElements[i].getAttribute('start-screen');

    const elementOpt = {
      ...defaultOpt,
    };
    if (theme) elementOpt.theme = theme;
    if (startScreen) elementOpt.startScreen = startScreen;

    nlElements[i].addEventListener('click', function () {
      initialModals(elementOpt);
    });
  }
};

async function ensureSigner() {
  // wait until competing request is finished
  if (signerPromise) await signerPromise;

  // still no signer? request auth from user
  if (!signer) {
    await launch({
      ...optionsModal
    });
  }

  // give up
  if (!signer) throw new Error('Rejected by user');
}

async function initSigner(info) {
  signerPromise = new Promise(async (ok, err) => {
    try {
      for (const r of info.relays) ndk.addExplicitRelay(r, undefined);

      // wait until we connect, otherwise
      // signer won't start properly
      await ndk.connect();

      // create and prepare the signer
      signer = new NDKNip46Signer(ndk, info.pubkey, new NDKPrivateKeySigner(info.sk));

      // pre-open the popup to make sure it's not blocked by browser
      const popup = window.open('about:blank', '_blank', 'width=100,height=50');
      popup.document.write("Loading...");

      // OAuth flow
      signer.on('authUrl', url => {
        popup.location.href = url;
        popup.resizeTo(600, 600);
        //window.open(url, 'auth', 'width=600,height=600');
      });

      // connect
      await signer.blockUntilReady();

      ok();
    } catch (e) {
      // make sure signer isn't set
      signer = null;
      err(e);
    } finally {
      // reset
      signerPromise = null;
    }
  });

  return signerPromise;
}

export async function init(opt: NostrLoginOptions) {
  // skip if it's already started or
  // if there is nip07 extension
  if (window.nostr) return;

  window.nostr = nostr;

  connectModals(opt);

  if (opt) {
    optionsModal = { ...opt };
  }

  try {
    // read conf from localstore
    const info = JSON.parse(window.localStorage.getItem(LOCALSTORE_KEY));
    if (info && info.pubkey && info.sk && info.relays && info.relays[0]) {
      return initSigner(info);
    } else {
      console.log('nostr login bad stored info', info);
    }
  } catch (e) {
    console.log('nostr login init error', e);
    logout();
  }
}

export async function authNip46(bunkerUrl) {
  try {
    const url = new URL(bunkerUrl);
    const info = {
      pubkey: url.pathname.split('//')[1],
      sk: generatePrivateKey(),
      relays: url.searchParams.getAll('relay'),
    };
    console.log('nostr login auth info', info);
    if (!info.pubkey || !info.sk || !info.relays[0]) throw new Error(`Bad bunker url ${bunkerUrl}`);

    const r = await initSigner(info);

    // only save after successfull login
    window.localStorage.setItem(LOCALSTORE_KEY, JSON.stringify(info));

    // result
    return r;
  } catch (e) {
    console.log('nostr login auth failed', e);
    throw e;
  }
}

export async function logout() {
  // clear localstore from user data
  signer = null;
  for (const r of ndk.pool.relays.keys()) ndk.pool.removeRelay(r);
  window.localStorage.removeItem(LOCALSTORE_KEY);
}
