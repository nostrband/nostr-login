/* eslint-disable */
// @ts-nocheck
import 'nostr-login-components';
import NDK, { NDKNip46Signer, NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
import { getEventHash, generatePrivateKey, nip19, getPublicKey } from 'nostr-tools';

export interface NostrLoginAuthOptions {
  localNsec: string;
  relays: string[];
  type: 'login' | 'signup' | 'logout';
}

export interface NostrLoginOptions {
  // optional
  theme?: string;
  startScreen?: string;
  bunkers?: string;
  onAuth?: (npub: string, options: NostrLoginAuthOptions) => void;
  perms?: string;

  // forward reqs to this bunker origin for testing
  devOverrideBunkerOrigin?: string;
}

interface Info {
  pubkey: string;
  sk: string;
  relays: string[];
  nip05?: string;
}

const LOCALSTORE_KEY = '__nostrlogin_nip46';
const ndk = new NDK({
  enableOutboxModel: false,
});
let signer: NDKNip46Signer | null = null;
let signerPromise = null;
let launcherPromise = null;
let popup = null;
let userInfo: Info | null = null;
let optionsModal: NostrLoginOptions = {
  theme: 'default',
  startScreen: 'welcome',
  devOverrideBunkerOrigin: '',
};

const nostr = {
  async getPublicKey() {
    await ensureSigner();
    if (userInfo)
      return userInfo.pubkey;
    else
      throw new Error("No user");
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
        .then(bunkerUrl => authNip46('login', name, bunkerUrl))
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
        .then(({ bunkerUrl, sk }) => authNip46('signup', name, bunkerUrl, sk))
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

function bunkerUrlToInfo(bunkerUrl, sk = ''): Info {
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
    '', // email
    optionsModal.perms || '',
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
      signer.on('authUrl', url => {
        console.log('nostr login auth url', url);

        if (userInfo) {
          // FIXME show the 'Please confirm' banner
          // and run the code below when user clicks.
          ensurePopup();

          popup.location.href = url;

          popup.resizeTo(400, 700);
        } else {
          // if it fails we will either return 'failed'
          // to the window.nostr caller, or show proper error
          // in our modal
          ensurePopup();

          popup.location.href = url;

          popup.resizeTo(400, 700);
        }
      });

      // pre-launch a popup if it won't be blocked,
      // only when we're expecting it
      if (connect || preparePopup) if (navigator.userActivation.isActive) ensurePopup();

      // if we're doing it for the first time then
      // we should send 'connect' NIP46 request
      if (connect) {
        // since ndk doesn't yet support perms param
        // we reimplement the 'connect' call here
        // await signer.blockUntilReady();

        const connectParams = [getPublicKey(info.sk), '', optionsModal.perms || ''];
        await new Promise((ok, err) => {
          signer.rpc.sendRequest(info.pubkey!, 'connect', connectParams, 24133, (response: NDKRpcResponse) => {
            if (response.result === 'ack') {
              ok();
            } else {
              err(response.error);
            }
          });
        });
      }

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

  try {
    // read conf from localstore
    const info = JSON.parse(window.localStorage.getItem(LOCALSTORE_KEY));
    if (info && info.pubkey && info.sk && info.relays && info.relays[0]) {
      await initSigner(info);
      onAuth('login', info);
    } else {
      console.log('nostr login bad stored info', info);
    }
  } catch (e) {
    console.log('nostr login init error', e);
    logout();
  }
}

function ensurePopup() {
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

function onAuth(type: 'login' | 'signup' | 'logout', info?: Info) {
  userInfo = info;

  if (optionsModal.onAuth) {
    try {
      const npub = info ? nip19.npubEncode(info.pubkey) : '';
      const options: NostrLoginAuthOptions = {
        type,
      };
      if (type !== 'logout') {
        options.localNsec = nip19.nsecEncode(info.sk);
        options.relays = info.relays;
      }
      optionsModal.onAuth(npub, options);
    } catch (e) {
      console.log('onAuth error', e);
    }
  }
}

async function authNip46(type: 'login' | 'signup', name, bunkerUrl, sk = '') {
  try {
    const info = bunkerUrlToInfo(bunkerUrl, sk);
    info.nip05 = name;

    // console.log('nostr login auth info', info);
    if (!info.pubkey || !info.sk || !info.relays[0]) {
      throw new Error(`Bad bunker url ${bunkerUrl}`);
    }

    const r = await initSigner(info, { connect: true });

    // only save after successfull login
    window.localStorage.setItem(LOCALSTORE_KEY, JSON.stringify(info));

    // callback
    onAuth(type, info);

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
  onAuth('logout');
  signer = null;
  for (const r of ndk.pool.relays.keys()) ndk.pool.removeRelay(r);
  window.localStorage.removeItem(LOCALSTORE_KEY);
}
