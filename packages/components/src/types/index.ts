export enum CURRENT_MODULE {
  WELCOME = 'welcome',
  INFO = 'info',
  SIGNIN = 'signin',
  SIGNUP = 'signup',
}

export enum METHOD_MODULE {
  SIGNIN = 'signin',
  SIGNUP = 'signup',
  LOGOUT = 'logout',
  CONFIRM = 'confirm',
}

export interface Info {
  pubkey: string;
  sk: string;
  relays: string[];
  nip05?: string;
  picture?: string;
}
