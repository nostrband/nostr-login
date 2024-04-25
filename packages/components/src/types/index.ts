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
    // must be present
    pubkey: string;

    // connect method only
    sk?: string;
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
    authMethod: 'connect' | 'readOnly' | 'extension';
}

export type RecentType = Pick<Info, 'nip05' | 'picture' | 'pubkey' | 'name' | 'bunkerUrl' | 'authMethod'>;

export type NlTheme = 'default' | 'ocean' | 'lemonade' | 'purple';
