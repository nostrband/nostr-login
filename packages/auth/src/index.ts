/* eslint-disable */
// @ts-nocheck
import 'nostr-login-components';
import NDK, { NDKNip46Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { getEventHash, generatePrivateKey } from 'nostr-tools';

export const launch = opt => {
  const dialog = document.createElement('dialog');
  const modal = document.createElement('nl-auth');

  dialog.appendChild(modal);
  document.body.appendChild(dialog);

  return new Promise(resolve => {
    modal.addEventListener('handleGetValue', event => {
      const inputValue = event.detail;

      resolve(inputValue);
    });

    modal.addEventListener('handleCloseModal', event => {
      dialog.close();
      const inputValue = event.detail;

      resolve(inputValue);
    });

    dialog.showModal();
    if (opt && opt.theme) {
      modal.setAttribute('theme', opt.theme);
    }

    if (opt && opt.startScreen) {
      modal.setAttribute('start-screen', opt.startScreen);
    }
  });
};

const connectModals = () => {
  const initialModals = async opt => {
    const bunkerUrl = await launch(opt);

    console.log({ bunkerUrl });
  };

  const nlElements = document.getElementsByTagName('nl-button');

  for (let i = 0; i < nlElements.length; i++) {
    const theme = nlElements[i].getAttribute('nl-theme');
    const startScreen = nlElements[i].getAttribute('start-screen');

    nlElements[i].addEventListener('click', function () {
      initialModals({
        theme,
        startScreen,
      });
    });
  }
};

const LOCALSTORE_KEY = '__nostrlogin_nip46';
const ndk = new NDK({
  enableOutboxModel: false,
});
let signer = null;
let signerPromise = null;
let optionsModal = {
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

async function ensureSigner() {
  // wait until competing request is finished
  if (signerPromise) await signerPromise;

  // still no signer? request auth from user
  if (!signer) {
    // FIXME show the signup/login modal
    const bunkerUrl = await launch(optionsModal);
    await authNip46(bunkerUrl);
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

export async function init(opt) {
  // skip if it's already started or
  // if there is nip07 extension
  if (window.nostr) return;

  window.nostr = nostr;

  connectModals();

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

    window.localStorage.setItem(LOCALSTORE_KEY, JSON.stringify(info));
    return initSigner(info);
  } catch (e) {
    console.log('nostr login auth failed', e);
  }
}

export async function logout() {
  // clear localstore from user data
  signer = null;
  for (const r of ndk.pool.relays.keys()) ndk.pool.removeRelay(r);
  window.localStorage.removeItem(LOCALSTORE_KEY);
}
