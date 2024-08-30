export enum CURRENT_MODULE {
  WELCOME = 'welcome',
  WELCOME_LOGIN = 'welcome-login',
  WELCOME_SIGNUP = 'welcome-signup',
  INFO = 'info',
  LOGIN_BUNKER_URL = 'login-bunker-url',
  LOGIN_READ_ONLY = 'login-read-only',
  CONFIRM_LOGOUT = 'confirm-logout',
  IMPORT_FLOW = 'import',
  LOGIN = 'login',
  SIGNUP = 'signup',
  LOCAL_SIGNUP = 'local-signup',
  EXTENSION = 'extension',
  LOADING = 'loading',
  PREVIOUSLY_LOGGED = 'switch-account',
  LOGIN_OTP = 'otp',
  CONNECT = 'connect',
  CONNECTION_STRING = 'connection-string',
}

export enum METHOD_MODULE {
  LOGIN = 'login',
  SIGNUP = 'signup',
  LOGOUT = 'logout',
  CONFIRM = 'confirm',
}

export type AuthMethod = 'connect' | 'readOnly' | 'extension' | 'local' | 'otp';

export interface Info {
  // must be present
  pubkey: string;

  // connect or local methods
  sk?: string;

  // connect method only
  relays?: string[];

  // connect/readOnly
  nip05?: string;

  // connect w/ bunkerUrl
  bunkerUrl?: string;

  // from kind:0 profile
  picture?: string;
  name?: string;

  // nip46 bunker URL secret
  token?: string;

  // session type
  authMethod: AuthMethod;

  // what otp auth reply returned,
  // may be empty if cookies are used, or may contain session
  // token to be used for future api calls
  otpData?: string;
}

export type RecentType = Pick<Info, 'nip05' | 'picture' | 'pubkey' | 'name' | 'bunkerUrl' | 'authMethod'>;

export type NlTheme = 'default' | 'ocean' | 'lemonade' | 'purple' | 'crab';

export interface ConnectionString {
  name: string;
  img: string;
  link: string;
  relay: string;
}
