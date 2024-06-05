import { Info, AuthMethod } from 'nostr-login-components/dist/types/types';

export interface NostrLoginAuthOptions {
  localNsec?: string;
  relays?: string[];
  type: 'login' | 'signup' | 'logout';
  method?: AuthMethod;
  pubkey?: string;
}

// NOTE: must be a subset of CURRENT_MODULE enum
export type StartScreens = 'welcome' | 'signup' | 'login' | 'login-bunker-url' | 'login-read-only' | 'switch-account' | 'import';

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

  // use local signup instead of nostr connect
  localSignup?: boolean

  // allowed auth methods
  methods?: AuthMethod[];
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
  localSignup?: boolean;
  authMethods?: AuthMethod[];
  hasExtension?: boolean;
  error?: string;
  signupNameIsAvailable?: string | boolean;
  loginIsGood?: string | boolean;
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
