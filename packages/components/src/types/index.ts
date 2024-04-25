export enum CURRENT_MODULE {
  WELCOME = 'welcome',
  INFO = 'info',
  SIGNIN_BUNKER_URL = 'signin-bunker-url',
  SIGNIN_READ_ONLY = 'signin-read-only',
  SIGNIN = 'signin',
  SIGNUP = 'signup',
  EXTENSION = 'extension',
  LOADING = 'loading',
  PREVIOUSLY_LOGGED = 'previously-logged',
}

export enum METHOD_MODULE {
  SIGNIN = 'signin',
  SIGNUP = 'signup',
  LOGOUT = 'logout',
  CONFIRM = 'confirm',
}

export interface Info {
  pubkey: string;
  sk?: string;
  relays?: string[];
  nip05?: string;
  picture?: string;
  extension?: boolean;
  readonly?: boolean;
  name?: string;
  bunkerUrl?: string;
  typeAuthMethod?: string;
}

export type RecentType = Pick<Info, 'nip05' | 'picture' | 'pubkey' | 'readonly' | 'extension' | 'name' | 'bunkerUrl' | 'typeAuthMethod'>;

export type NlTheme = 'default' | 'ocean' | 'lemonade' | 'purple';
