import { Info } from 'nostr-login-components/dist/types/types';
import NDK, { NDKUser } from '@nostr-dev-kit/ndk';
import { generatePrivateKey } from 'nostr-tools';
import { NostrLoginOptions } from '../types';

export const localStorageSetItem = (key: string, value: string) => {
  localStorage.setItem(key, value);
};

export const localStorageGetItem = (key: string) => {
  const value = window.localStorage.getItem(key);

  if (value) {
    return JSON.parse(value);
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

export const bunkerUrlToInfo = (bunkerUrl: string, sk = ''): Info => {
  const url = new URL(bunkerUrl);

  return {
    pubkey: url.hostname || url.pathname.split('//')[1],
    sk: sk || generatePrivateKey(),
    relays: url.searchParams.getAll('relay'),
  };
};

export const getBunkerUrl = async (value: string, optionsModal: NostrLoginOptions) => {
  if (!value) {
    return '';
  }

  if (value.startsWith('bunker://')) {
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
