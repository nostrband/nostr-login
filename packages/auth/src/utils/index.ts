import { Info } from 'nostr-login-components/dist/types/types';
import NDK, { NDKEvent, NDKRelaySet, NDKSigner, NDKUser } from '@nostr-dev-kit/ndk';
import { generatePrivateKey } from 'nostr-tools';
import { NostrLoginOptions, RecentType } from '../types';

const LOCAL_STORE_KEY = '__nostrlogin_nip46';
const LOGGED_IN_ACCOUNTS = '__nostrlogin_accounts';
const RECENT_ACCOUNTS = '__nostrlogin_recent';

export const localStorageSetItem = (key: string, value: string) => {
  localStorage.setItem(key, value);
};

export const localStorageGetItem = (key: string) => {
  const value = window.localStorage.getItem(key);

  if (value) {
    try {
      return JSON.parse(value);
    } catch {}
  }

  return null;
};

export const localStorageRemoveItem = (key: string) => {
  localStorage.removeItem(key);
};

export const fetchProfile = async (info: Info, profileNdk: NDK) => {
  const user = new NDKUser({ pubkey: info.pubkey });

  user.ndk = profileNdk;

  return await user.fetchProfile();
};

export const createProfile = async (info: Info, profileNdk: NDK, signer: NDKSigner) => {
  const origin = window.location.origin;
  const meta = {
    name: info.name,
    about: `I joined Nostr on ${origin}}`,
  };

  const event = new NDKEvent(profileNdk, {
    kind: 0,
    created_at: Math.floor(Date.now() / 1000),
    pubkey: info.pubkey,
    content: JSON.stringify(meta),
    tags: [],
  });

  await event.sign(signer);
  console.log("signed profile", event);
  await event.publish(NDKRelaySet.fromRelayUrls([
    'wss://nostr.mutinywallet.com',
    'wss://purplepag.es',
    'wss://user.kindpag.es',
    'wss://relay.damus.io',
    'wss://nos.lol',
  ], profileNdk));
  console.log("published profile", event);
};

export const bunkerUrlToInfo = (bunkerUrl: string, sk = ''): Info => {
  const url = new URL(bunkerUrl);

  return {
    pubkey: url.hostname || url.pathname.split('//')[1],
    sk: sk || generatePrivateKey(),
    relays: url.searchParams.getAll('relay'),
    token: url.searchParams.get('secret') || '',
    authMethod: 'connect',
  };
};

export const isBunkerUrl = (value: string) => value.startsWith('bunker://');

export const getBunkerUrl = async (value: string, optionsModal: NostrLoginOptions) => {
  if (!value) {
    return '';
  }

  if (isBunkerUrl(value)) {
    return value;
  }

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
    if (!bunkerRelays.length) {
      throw new Error('Bunker relay not provided');
    }

    return `bunker://${userPubkey}?relay=${bunkerRelays[0]}`;
  }

  throw new Error('Invalid user name or bunker url');
};

export const checkNip05 = async (nip05: string) => {
  let available = false;
  let error = '';
  let pubkey = '';
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
        pubkey = d.names[name];
        return;
      }
    } catch {}

    available = true;
  })();

  return {
    available,
    taken: pubkey != '',
    error,
    pubkey,
  };
};

const upgradeInfo = (info: Info | RecentType) => {
  if ('typeAuthMethod' in info) delete info['typeAuthMethod'];

  if (!info.authMethod) {
    if ('extension' in info && info['extension']) info.authMethod = 'extension';
    else if ('readOnly' in info && info['readOnly']) info.authMethod = 'readOnly';
    else info.authMethod = 'connect';
  }

  if (info.nip05 && isBunkerUrl(info.nip05)) {
    info.bunkerUrl = info.nip05;
    info.nip05 = '';
  }
};

export const localStorageAddAccount = (info: Info) => {
  // make current
  localStorageSetItem(LOCAL_STORE_KEY, JSON.stringify(info));

  const loggedInAccounts: Info[] = localStorageGetItem(LOGGED_IN_ACCOUNTS) || [];
  const recentAccounts: RecentType[] = localStorageGetItem(RECENT_ACCOUNTS) || [];

  // upgrade first
  loggedInAccounts.forEach(a => upgradeInfo(a));
  recentAccounts.forEach(a => upgradeInfo(a));

  // upsert new info into accounts
  const accounts: Info[] = loggedInAccounts;
  const index = loggedInAccounts.findIndex((el: Info) => el.pubkey === info.pubkey && el.authMethod === info.authMethod);
  if (index !== -1) {
    accounts[index] = info;
  } else {
    accounts.push(info);
  }

  // remove new info from recent
  const recents = recentAccounts.filter(el => el.pubkey !== info.pubkey || el.authMethod !== info.authMethod);

  localStorageSetItem(RECENT_ACCOUNTS, JSON.stringify(recents));
  localStorageSetItem(LOGGED_IN_ACCOUNTS, JSON.stringify(accounts));
};

export const localStorageRemoveCurrentAccount = () => {
  const user: Info = localStorageGetItem(LOCAL_STORE_KEY);
  if (!user) return;

  // make sure it's valid
  upgradeInfo(user);

  // remove secret fields
  const recentUser: RecentType = { ...user };

  // make sure session keys are dropped
  // @ts-ignore
  delete recentUser['sk'];
  // @ts-ignore
  delete recentUser['otpData'];

  // get accounts and recent
  const loggedInAccounts: Info[] = localStorageGetItem(LOGGED_IN_ACCOUNTS) || [];
  const recentsAccounts: RecentType[] = localStorageGetItem(RECENT_ACCOUNTS) || [];

  // upgrade first
  loggedInAccounts.forEach(a => upgradeInfo(a));
  recentsAccounts.forEach(a => upgradeInfo(a));

  const recents: RecentType[] = recentsAccounts;
  if (recentUser.authMethod === 'connect' && recentUser.bunkerUrl && recentUser.bunkerUrl.includes('secret=')) {
    console.log('nostr login bunker conn with a secret not saved to recent');
  } else {
    // upsert to recent
    const index = recentsAccounts.findIndex((el: RecentType) => el.pubkey === recentUser.pubkey && el.authMethod === recentUser.authMethod);
    if (index !== -1) {
      recents[index] = recentUser;
    } else {
      recents.push(recentUser);
    }
  }

  // remove from accounts
  const accounts = loggedInAccounts.filter(el => el.pubkey !== user.pubkey || el.authMethod !== user.authMethod);

  // update accounts and recent, clear current
  localStorageSetItem(RECENT_ACCOUNTS, JSON.stringify(recents));
  localStorageSetItem(LOGGED_IN_ACCOUNTS, JSON.stringify(accounts));
  localStorageRemoveItem(LOCAL_STORE_KEY);
};

export const localStorageRemoveRecent = (user: RecentType) => {
  const recentsAccounts: RecentType[] = localStorageGetItem(RECENT_ACCOUNTS) || [];
  recentsAccounts.forEach(a => upgradeInfo(a));
  const recents = recentsAccounts.filter(el => el.pubkey !== user.pubkey || el.authMethod !== user.authMethod);
  localStorageSetItem(RECENT_ACCOUNTS, JSON.stringify(recents));
};

export const localStorageGetRecents = (): RecentType[] => {
  const recents: RecentType[] = localStorageGetItem(RECENT_ACCOUNTS) || [];
  recents.forEach(r => upgradeInfo(r));
  return recents;
};

export const localStorageGetAccounts = (): Info[] => {
  const accounts: Info[] = localStorageGetItem(LOGGED_IN_ACCOUNTS) || [];
  accounts.forEach(a => upgradeInfo(a));
  return accounts;
};

export const localStorageGetCurrent = (): Info | null => {
  const info = localStorageGetItem(LOCAL_STORE_KEY);
  if (info) upgradeInfo(info);
  return info;
};

export const setDarkMode = (dark: boolean) => {
  localStorageSetItem('nl-dark-mode', dark ? 'true' : 'false');
}

export const getDarkMode = (opt: NostrLoginOptions) => {
  const getDarkMode = localStorageGetItem('nl-dark-mode');
  if (getDarkMode) {
    // user already changed it
    return !!JSON.parse(getDarkMode);
  } else if (opt.darkMode !== undefined) {
    // app provided an option
    return opt.darkMode;
  } else {
    // auto-detect
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    } else {
      return false;
    }
  }
}
