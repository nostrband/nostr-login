/* eslint-disable */
// @ts-nocheck
import 'nostr-login-components';
import NDK, { NDKNip46Signer, NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
import { getEventHash, generatePrivateKey, nip19, getPublicKey } from 'nostr-tools';
import { Info } from 'nostr-login-components/dist/types/types';

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
  darkMode?: boolean;

  iife?: boolean; // for unpkg module

  // forward reqs to this bunker origin for testing
  devOverrideBunkerOrigin?: string;
}

const TIMEOUT = 5000; // 5 sec
const LOCALSTORE_KEY = '__nostrlogin_nip46';
const ndk = new NDK({
  enableOutboxModel: false,
});
const profileNdk = new NDK({
  enableOutboxModel: true,
  explicitRelayUrls: ["wss://relay.nostr.band/all", "wss://purplepag.es"]
});
profileNdk.connect()

let signer: NDKNip46Signer | null = null;
let signerPromise = null;
let launcherPromise = null;
let popup = null;
let userInfo: Info | null = null;
let callCount = 0;
let callTimer = undefined;
let optionsModal: NostrLoginOptions = {
  theme: 'default',
  startScreen: 'welcome',
  devOverrideBunkerOrigin: '',
};

let banner: HTMLElement | null = null;
const listNotifies: string[] = [];

let nostrExtension = undefined

const nostr = {
  async getPublicKey() {
    await ensureSigner();
    if (userInfo) return userInfo.pubkey;
    else throw new Error('No user');
  },
  async signEvent(event) {
    await ensureSigner();
    return wait(async () => {
      event.pubkey = signer.remotePubkey;
      event.id = getEventHash(event);
      event.sig = await signer.sign(event);
      console.log("signed", { event });
      return event;
    });
  },
  async getRelays() {
    // FIXME implement!
    return {};
  },
  nip04: {
    async encrypt(pubkey, plaintext) {
      await ensureSigner();
      return wait(async () => await signer.encrypt(pubkey, plaintext));
    },
    async decrypt(pubkey, ciphertext) {
      await ensureSigner();
      return wait(async () => await signer.decrypt(pubkey, ciphertext));
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

  if (opt.isSignInWithExtension !== undefined) {
    modal.isSignInWithExtension = opt.isSignInWithExtension;
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
          setWindowNostr();
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
          setWindowNostr();
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

    modal.addEventListener('nlLoginExtension', async (event) => {
      console.log("nostr login extension", window.nostr)
      if (!window.nostr) return
      const pubkey = await window.nostr.getPublicKey()
      onAuth('login', { pubkey })
    });

    modal.addEventListener('nlSignup', event => {
      signup(event.detail);
    });

    modal.addEventListener('handleRemoveWindowNostr', event => {
      console.log('handleRemoveWindowNostr')
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

async function wait(cb) {
  if (!callTimer) 
    callTimer = setTimeout(onCallTimeout, TIMEOUT);

  if (!callCount) await onCallStart();
  callCount++;

  let error;
  let result;
  try {
    result = await cb();
  } catch (e) {
    error = e;
  }

  callCount--;
  await onCallEnd();

  if (callTimer) clearTimeout(callTimer);
  callTimer = undefined;

  if (error) throw error;
  return result;
}

async function onCallStart() {
  // set spinner - we've started talking to the key storage
  if (banner) banner.isLoading = true;
}

async function onCallEnd() {
  // remove spinner - we've finished talking to the key storage,
  // also hide the 'Not responding' banner
  if (banner) banner.isLoading = false;
}

async function onCallTimeout() {
  // show 'Not responding' banner, hide when onCallEnd happens,
  // may be called multiple times - should check if banner is already visible
  // рано падает таймаут
  if (banner) {
    // banner.isLoading = false;
    banner.notify = {
      confirm: Date.now(),
      timeOut: { domain: userInfo?.nip05?.split('@')[1] },
    };
  }
}

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

const launchEnsurePopup = (url: string) => {
  ensurePopup();

  popup.location.href = url;

  popup.resizeTo(400, 700);
};

const launchAuthBanner = (opt: NostrLoginOptions) => {
  banner = document.createElement('nl-banner');

  banner.addEventListener('handleLoginBanner', event => {
    const startScreen = event.detail;
    launch({
      startScreen,
    });
  });

  banner.addEventListener('handleLogoutBanner', event => {
    logout();
  });

  banner.addEventListener('handleNotifyConfirmBanner', event => {
    launchEnsurePopup(event.detail);
  });

  banner.addEventListener('handleSetConfirmBanner', event => {
    listNotifies.push(event.detail);

    banner.listNotifies = listNotifies;
  });

  banner.addEventListener('handleOpenWelcomeModal', event => {
    launch(optionsModal)
  });

  banner.addEventListener('handleRetryConfirmBanner', () => {
    const url = listNotifies.pop();
    // FIXME go to nip05 domain? 
    if (!url) return;

    banner.listNotifies = listNotifies;

    launchEnsurePopup(url);
  });

  document.body.appendChild(banner);
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

        if (callTimer) clearTimeout(callTimer);

        if (userInfo) {
          // show the 'Please confirm' banner
          if (banner) {
            // banner.isLoading = false;
            banner.notify = {
              confirm: Date.now(),
              url,
            };
          }
        } else {
          // if it fails we will either return 'failed'
          // to the window.nostr caller, or show proper error
          // in our modal
          launchEnsurePopup(url);
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

      // make sure it's closed
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
  // skip if it's already started 
  if (window.nostr === nostr) return

  // set watcher to set window.nostr if extension 
  // isn't found
  setTimeout(() => {
    if (!window.nostr) {
      console.log("nostr login set window.nostr")
      window.nostr = nostr
    }
  }, 1000)

  // force darkMode from init options
  if ('darkMode' in opt) {
    localStorage.setItem('nl-dark-mode', `${opt.darkMode}`);
  }

  // launch
  if (opt.iife) {
    launchAuthBanner(opt);
  } else {
    connectModals(opt);
  }

  if (opt) {
    optionsModal = { ...opt };
  }

  try {
    // read conf from localstore
    const info = JSON.parse(window.localStorage.getItem(LOCALSTORE_KEY));
    if (!info) return;

    if (info.extension && info.pubkey) {
      onAuth('login', { pubkey: info.pubkey });
    } else if (info.pubkey && info.sk && info.relays && info.relays[0]) {
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

async function fetchProfile(info: Info) {
  const user = new NDKUser({ pubkey: info.pubkey });
  user.ndk = profileNdk;
  return await user.fetchProfile();
}

function setWindowNostr() {
  // save the extension
  if (window.nostr !== nostr) nostrExtension = window.nostr

  // set ourselves as nip07 handler
  window.nostr = nostr    
}

function onAuth(type: 'login' | 'signup' | 'logout', info: Info = null) {

  userInfo = info;
  if (banner) {
    banner.userInfo = userInfo;
    if (userInfo)
      banner.titleBanner = 'You are logged in';
    else
      banner.titleBanner = ''; // 'Use with Nostr';
  }

  if (info) {
    // async profile fetch
    fetchProfile(info).then(p => {
      if (userInfo !== info) return;
      userInfo = {
        ...userInfo,
        picture: p?.image || p?.picture
      };
      banner.userInfo = userInfo;
    })
  }

  try {
    const npub = info ? nip19.npubEncode(info.pubkey) : '';

    const options: NostrLoginAuthOptions = {
      type,
    };

    if (type !== 'logout') {
      options.localNsec = nip19.nsecEncode(info.sk);
      options.relays = info.relays;
    }

    if (optionsModal.onAuth)
      optionsModal.onAuth(npub, options);

    const event = new CustomEvent("nlAuth", { "detail": options });
    document.dispatchEvent(event);

  } catch (e) {
    console.log('onAuth error', e);
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
  // restore the extension
  if (nostrExtension) window.nostr = nostrExtension

  signer = null;
  for (const r of ndk.pool.relays.keys()) ndk.pool.removeRelay(r);
  window.localStorage.removeItem(LOCALSTORE_KEY);

  // clear localstore from user data
  onAuth('logout');
}
