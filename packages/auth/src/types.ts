import { Info } from 'nostr-login-components/dist/types/types';

export interface NostrLoginAuthOptions {
  localNsec?: string;
  relays?: string[];
  type: 'login' | 'signup' | 'logout';
  method?: 'connect' | 'readOnly' | 'extension';
}

// NOTE: must be a subset of CURRENT_MODULE enum
export type StartScreens = 'welcome' | 'signup' | 'login' | 'login-bunker-url' | 'login-read-only' | 'switch-account';


export interface NostrLoginOptions {
  // optional
  theme?: string;
  startScreen?: StartScreens;
  bunkers?: string;
  onAuth?: (npub: string, options: NostrLoginAuthOptions) => void;
  perms?: string;
  darkMode?: boolean;

  // do not show the banner, modals must be `launch`-ed 
  noBanner?: boolean;

  // forward reqs to this bunker origin for testing
  devOverrideBunkerOrigin?: string;
  isSignInWithExtension?: boolean;
}

export interface IBanner {
  userInfo?: Info | null;
  titleBanner?: string;
  isLoading?: boolean;
  listNotifies?: string[];
  accounts?: Info[];
  isOpen?: boolean;
  darkMode?: boolean;
  notify?: {
    confirm?: number;
    url?: string;
    timeOut?: {
      domain?: string | undefined;
    };
  };
}

export type TypeBanner = IBanner & HTMLElement;

export interface IModal {
  authUrl?: string;
  isLoading?: boolean;
  isLoadingExtension?: boolean;
  isSignInWithExtension?: boolean;
  error?: string;
  signupNameIsAvailable?: string | boolean;
  loginIsGood?: string | boolean;
  isFetchCreateAccount?: boolean;
  recents?: RecentType[];
  accounts?: Info[];
  darkMode?: boolean;
}

export type TypeModal = IModal & HTMLElement;

export interface Response {
  result?: string;
  error?: string;
}

export type RecentType = Pick<Info, 'nip05' | 'picture' | 'pubkey' | 'name' | 'bunkerUrl' | 'authMethod'>;
