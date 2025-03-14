import { Info, AuthMethod, ConnectionString, RecentType, BannerNotify } from 'nostr-login-components/dist/types/types';

export interface NostrLoginAuthOptions {
  localNsec?: string;
  relays?: string[];
  type: 'login' | 'signup' | 'logout';
  method?: AuthMethod;
  pubkey?: string;
  otpData?: string;
  name?: string;
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

  // deprecated, use methods=['local']
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

  // relay list to override hardcoded `OUTBOX_RELAYS` constant
  outboxRelays?: string[];

  // dev mode
  dev?: boolean;

  // use start.njump.me instead of local signup
  signupNstart?: boolean;

  // list of npubs to auto/suggest-follow on signup
  followNpubs?: string;

  // when method call auth needed, instead of showing
  // the modal, we start waiting for incoming nip46
  // connection and send the nostrconnect string using
  // nlNeedAuth event
  customNostrConnect?: boolean;
}

export interface IBanner {
  userInfo?: Info | null;
  titleBanner?: string;
  isLoading?: boolean;
  listNotifies?: string[];
  accounts?: Info[];
  isOpen?: boolean;
  darkMode?: boolean;
  notify?: BannerNotify;
}

export type TypeBanner = IBanner & HTMLElement;

export interface IModal {
  authUrl?: string;
  iframeUrl?: string;
  isLoading?: boolean;
  isOTP?: boolean;
  isLoadingExtension?: boolean;
  localSignup?: boolean;
  signupNjump?: boolean;
  njumpIframe?: string;
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
