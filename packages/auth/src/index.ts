/* eslint-disable */
// @ts-nocheck
import 'nostr-login-components';
import NDK, { NDKNip46Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { getEventHash, generatePrivateKey, nip19, getPublicKey } from 'nostr-tools';

export interface NostrLoginAuthOptions {
  localNsec: string;
  relays: string[];
  type: 'login' | 'signup';
}

export interface NostrLoginOptions {
  // optional
  theme?: string;
  startScreen?: string;
  bunkers?: string;
  onAuth?: (npub: string, options: NostrLoginAuthOptions) => void;
  redirect?: boolean;
  redirectUri?: string;

  // forward reqs to this bunker origin for testing
  devOverrideBunkerOrigin?: string;
}

const LOCALSTORE_KEY = '__nostrlogin_nip46';
const LOCALSTORE_KEY_TMP = '__nostrlogin_nip46_tmp';
const REDIRECT_CONFIRM_PARAM = 'nostr_login_confirm';
const ndk = new NDK({
  enableOutboxModel: false,
});
let signer: NDKNip46Signer | null = null;
let signerPromise = null;
let launcherPromise = null;
let popup = null;
let optionsModal: NostrLoginOptions = {
  theme: 'default',
  startScreen: 'welcome',
  devOverrideBunkerOrigin: '',
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
    event.sig = await signer.sign(event);
    return event;
  },
  async getRelays() {
    // FIXME implement!
    return {};
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

export const launch = async (opt: NostrLoginOptions) => {
  // mutex
  if (launcherPromise) await launcherPromise;

  const dialog = document.createElement('dialog');
  const modal = document.createElement('nl-auth');

  if (opt.theme) {
    modal.setAttribute('theme', opt.theme);
  }

  if (opt.startScreen) {
    modal.setAttribute('start-screen', opt.startScreen);
  }

  if (opt.bunkers) {
    modal.setAttribute('bunkers', opt.bunkers);
  }

  dialog.appendChild(modal);
  document.body.appendChild(dialog);

  launcherPromise = new Promise(ok => {
    const login = (name: string) => {
      modal.error = 'Please confirm in your key storage app.';
      // convert name to bunker url
      getBunkerUrl(name)
        // connect to bunker by url
        .then(bunkerUrl => authNip46('login', bunkerUrl))
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

    const signup = (name: string) => {
      modal.error = 'Please confirm in your key storage app.';
      // create acc on service and get bunker url
      createAccount(name)
        // connect to bunker by url
        .then(({ bunkerUrl, sk }) => authNip46('signup', bunkerUrl, sk))
        .then(() => {
          modal.isFetchCreateAccount = false;
          dialog.close();
          ok();
        })
        .catch(e => {
          console.log('error', e);
          modal.isFetchCreateAccount = false;
          modal.error = e.toString();
        });
    };

    const checkNip05 = async (nip05: string) => {
      let available = false;
      let taken = false;
      let error = '';
      await (async () => {
        if (!nip05 || !nip05.includes('@')) return;

        const [name, domain] = nip05.toLocaleLowerCase().split('@');
        if (!name) return;

        const REGEXP = new RegExp(/^[\w-.]+@([\w-]+\.)+[\w-]{2,8}$/g);
        if (!REGEXP.test(nip05)) {
          error = 'Invalid name';
          return;
        }

        if (!domain) {
          error = 'Select service';
          return;
        }

        const url = `https://${domain}/.well-known/nostr.json?name=${name.toLowerCase()}`;
        try {
          const r = await fetch(url);
          const d = await r.json();
          if (d.names[name]) {
            taken = true;
            return;
          }
        } catch {}

        available = true;
      })();

      return [available, taken, error];
    };

    modal.addEventListener('nlLogin', event => {
      login(event.detail);
    });

    modal.addEventListener('nlSignup', event => {
      signup(event.detail);
    });

    modal.addEventListener('nlCheckSignup', async event => {
      const [available, taken, error] = await checkNip05(event.detail);
      modal.error = error;
      if (!error && taken) modal.error = 'Already taken';
      modal.signupNameIsAvailable = available;
    });

    modal.addEventListener('nlCheckLogin', async event => {
      const [available, taken, error] = await checkNip05(event.detail);
      modal.error = error;
      if (available) modal.error = 'Name not found';
      modal.loginIsGood = taken;
    });

    modal.addEventListener('nlCloseModal', () => {
      modal.isFetchLogin = false;
      dialog.close();
      ok();
    });

    dialog.showModal();
  });

  return launcherPromise;
};

async function getBunkerUrl(value: string) {
  if (!value) return '';

  if (value.startsWith('bunker://')) return value;

  if (value.includes('@')) {
    const [name, domain] = value.toLocaleLowerCase().split('@');
    const origin = optionsModal.devOverrideBunkerOrigin || `https://${domain}`;
    const bunkerUrl = `${origin}/.well-known/nostr.json?name=_`;
    const userUrl = `${origin}/.well-known/nostr.json?name=${name}`;
    const bunker = await fetch(bunkerUrl);
    const bunkerData = await bunker.json();
    const bunkerPubkey = bunkerData.names['_'];
    const bunkerRelays = bunkerData.nip46[bunkerPubkey];
    const user = await fetch(userUrl);
    const userData = await user.json();
    const userPubkey = userData.names[name];
    // console.log({
    //     bunkerData, userData, bunkerPubkey, bunkerRelays, userPubkey,
    //     name, domain, origin
    // })
    if (!bunkerRelays.length) throw new Error('Bunker relay not provided');
    return `bunker://${userPubkey}?relay=${bunkerRelays[0]}`;
  }

  throw new Error('Invalid user name or bunker url');
}

function bunkerUrlToInfo(bunkerUrl, sk = '') {
  const url = new URL(bunkerUrl);
  return {
    pubkey: url.hostname || url.pathname.split('//')[1],
    sk: sk || generatePrivateKey(),
    relays: url.searchParams.getAll('relay'),
  };
}

async function createAccount(nip05: string) {
  const [name, domain] = nip05.split('@');
  // we're gonna need it
  ensurePopup();

  // bunker's own url
  const bunkerUrl = await getBunkerUrl(`_@${domain}`);
  console.log("create account bunker's url", bunkerUrl);

  // parse bunker url and generate local nsec
  const info = bunkerUrlToInfo(bunkerUrl);

  // init signer to talk to the bunker (not the user!)
  await initSigner(info, { preparePopup: true, leavePopup: true });

  const params = [
    name,
    domain,
    // email?
  ];

  // due to a buggy sendRequest implementation it never resolves
  // the promise that it returns, so we have to provide a
  // callback and wait on it
  console.log('signer', signer);
  const r = await new Promise(ok => {
    signer!.rpc.sendRequest(info.pubkey, 'create_account', params, undefined, ok);
  });

  console.log('create_account pubkey', r);
  if (r.result === 'error') throw new Error(r.error);

  return {
    bunkerUrl: `bunker://${r.result}?relay=${info.relays[0]}`,
    sk: info.sk, // reuse the same local key
  };
}

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
  // wait until competing requests are finished
  if (signerPromise) await signerPromise;
  if (launcherPromise) await launcherPromise;

  // still no signer? request auth from user
  if (!signer) {
    await launch({
      ...optionsModal,
    });
  }

  // give up
  if (!signer) throw new Error('Rejected by user');
}

async function initSigner(info, { connect = false, preparePopup = false, leavePopup = false } = {}) {
  // mutex
  if (signerPromise) await signerPromise;

  signerPromise = new Promise(async (ok, err) => {
    try {
      for (const r of info.relays) ndk.addExplicitRelay(r, undefined);

      // wait until we connect, otherwise
      // signer won't start properly
      await ndk.connect();

      // console.log('creating signer', { info, connect });

      // create and prepare the signer
      signer = new NDKNip46Signer(ndk, info.pubkey, new NDKPrivateKeySigner(info.sk));

      // OAuth flow
      signer.on('authUrl', authUrl => {
        console.log('nostr login auth url', authUrl);

        if (optionsModal.redirect) {

          // put current connection info to tmp key,
          // when we're redirected back w/ nostr_login_confirm param
          // we will pick this info from storage and connect
          if (optionsModal.redirect)
            window.localStorage.setItem(LOCALSTORE_KEY_TMP, JSON.stringify(info));    
      
          const redirectUriBase = `${optionsModal.redirectUri || window.location.href}`;
          const pubkey = getPublicKey(info.sk);
          const redirectUri = `${redirectUriBase}${redirectUriBase.includes('?') ? '&' : '?'}${REDIRECT_CONFIRM_PARAM}=${pubkey}`;
          const url = `${authUrl}${authUrl.includes('?') ? '&' : '?'}redirect_uri=${encodeURIComponent(redirectUri)}`
          
          // let the localstore write happen
          setTimeout(() => window.location.href = url, 100);
        } else {
          // if it fails we will either return 'failed'
          // to the window.nostr caller, or show proper error
          // in our modal
          ensurePopup();

          popup.location.href = authUrl;
          popup.resizeTo(400, 700);
        }
      });

      // pre-launch a popup if it won't be blocked,
      // only when we're expecting it
      if (connect || preparePopup) if (navigator.userActivation.isActive) ensurePopup();

      // if we're doing it for the first time then
      // we should send 'connect' NIP46 request
      if (connect) await signer.blockUntilReady();

      // console.log('created signer');

      // make ure it's closed
      if (!leavePopup) closePopup();

      ok();
    } catch (e) {
      // make sure signer isn't set
      signer = null;
      err(e);
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

  // redirect mode means we will first redirect user to the 
  // bunker site, and then it will redirect us back where we should
  // pick up and reuse the temporarily stored connection info
  if (optionsModal.redirect) {
    const params = new URLSearchParams(window.location.search);
    const pubkey = params.get(REDIRECT_CONFIRM_PARAM);
    // have confirm param?
    if (pubkey) {
      try {
        // read conf from localstore
        const info = JSON.parse(window.localStorage.getItem(LOCALSTORE_KEY_TMP));
        const infoPubkey = getPublicKey(info.sk)
        if (info && pubkey === infoPubkey && info.relays && info.relays[0]) {
          window.localStorage.removeItem(LOCALSTORE_KEY_TMP)
          window.localStorage.setItem(LOCALSTORE_KEY, JSON.stringify(info))
          const url = new URL(window.location.href)
          url.searchParams.delete(REDIRECT_CONFIRM_PARAM)
          window.history.pushState({}, '', url)
          console.log("nostr login confirmed local pubkey", pubkey);
        }
      } catch (e) {
        console.log("nostr login failed to confirm", e);
      }
    }
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

function ensurePopup() {
  if (optionsModal.redirect) return;

  // user might have closed it already
  if (!popup || popup.closed) {
    // NOTE: do not set noreferrer, bunker might use referrer to
    // simplify the naming of the connected app.
    // NOTE: do not pass noopener, otherwise null is returned
    // and we can't pre-populate the Loading... message,
    // instead we set opener=null below
    popup = window.open('about:blank', '_blank', 'width=100,height=50');
    console.log('popup', popup);
    if (!popup) throw new Error('Popup blocked. Try again, please!');

    // emulate noopener without passing it
    popup.opener = null;
  }

  // initial state
  popup.document.write('Loading...');
}

function closePopup() {
  // make sure we release the popup
  try {
    popup?.close();
    popup = null;
  } catch {}
}

async function authNip46(type: 'login' | 'signup', bunkerUrl, sk = '') {
  try {
    const info = bunkerUrlToInfo(bunkerUrl, sk);
    // console.log('nostr login auth info', info);
    if (!info.pubkey || !info.sk || !info.relays[0]) {
      throw new Error(`Bad bunker url ${bunkerUrl}`);
    }

    const r = await initSigner(info, { connect: true });

    // only save after successfull login
    window.localStorage.setItem(LOCALSTORE_KEY, JSON.stringify(info));

    // callback
    if (optionsModal.onAuth) {
      try {
        optionsModal.onAuth(nip19.npubEncode(info.pubkey), {
          localNsec: nip19.nsecEncode(info.sk),
          relays: info.relays,
          type,
        });
      } catch (e) {
        console.log('onAuth error', e);
      }
    }

    // result
    return r;
  } catch (e) {
    console.log('nostr login auth failed', e);
    // make ure it's closed
    closePopup();
    throw e;
  }
}

export async function logout() {
  // clear localstore from user data
  signer = null;
  for (const r of ndk.pool.relays.keys()) ndk.pool.removeRelay(r);
  window.localStorage.removeItem(LOCALSTORE_KEY);
}
