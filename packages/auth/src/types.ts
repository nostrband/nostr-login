import { Info, AuthMethod, ConnectionString } from 'nostr-login-components/dist/types/types';

export interface NostrLoginAuthOptions {
  localNsec?: string;
  relays?: string[];
  type: 'login' | 'signup' | 'logout';
  method?: AuthMethod;
  pubkey?: string;
  otpData?: string;
}

// NOTE: must be a subset of CURRENT_MODULE enum
export type StartScreens =
  | 'welcome'
  | 'welcome-login'
  | 'welcome-signup'
  | 'signup'
  | 'local-signup'
  | 'login'
  | 'otp'
  | 'connect'
  | 'login-bunker-url'
  | 'login-read-only'
  | 'connection-string'
  | 'switch-account'
  | 'import';

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
  localSignup?: boolean;

  // allowed auth methods
  methods?: AuthMethod[];

  // otp endpoints
  otpRequestUrl?: string;
  otpReplyUrl?: string;

  // welcome screen's title/desc
  title?: string;
  description?: string;

  // comma-separated list of relays added 
  // to relay list of new profiles created with local signup
  signupRelays?: string;
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
  isOTP?: boolean;
  isLoadingExtension?: boolean;
  localSignup?: boolean;
  authMethods?: AuthMethod[];
  hasExtension?: boolean;
  hasOTP?: boolean;
  error?: string;
  signupNameIsAvailable?: string | boolean;
  loginIsGood?: string | boolean;
  recents?: RecentType[];
  accounts?: Info[];
  darkMode?: boolean;
  welcomeTitle?: string;
  welcomeDescription?: string;
  connectionString?: string;
  connectionStringServices?: ConnectionString[];
}

export type TypeModal = IModal & HTMLElement;

export interface Response {
  result?: string;
  error?: string;
}

export type RecentType = Pick<Info, 'nip05' | 'picture' | 'pubkey' | 'name' | 'bunkerUrl' | 'authMethod'>;
