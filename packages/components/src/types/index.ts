export enum CURRENT_MODULE {
  WELCOME = 'welcome',
  INFO = 'info',
  LOGIN_BUNKER_URL = 'login-bunker-url',
  LOGIN_READ_ONLY = 'login-read-only',
  LOGIN = 'login',
  SIGNUP = 'signup',
  EXTENSION = 'extension',
  LOADING = 'loading',
  PREVIOUSLY_LOGGED = 'switch-account',
}

export enum METHOD_MODULE {
  LOGIN = 'login',
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
