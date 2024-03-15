export enum CURRENT_MODULE {
  WELCOME = 'welcome',
  INFO = 'info',
  SIGNIN = 'signin',
  SIGNUP = 'signup',
}

export enum METHOD_MODULE {
  SIGNIN = 'signin',
  LOGOUT = 'logout',
}

export interface Info {
  pubkey: string;
  sk: string;
  relays: string[];
  nip05?: string;
}
