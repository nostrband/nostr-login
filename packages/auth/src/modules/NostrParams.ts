import { Info } from 'nostr-login-components/dist/types/types';
import { NostrLoginOptions } from '../types';

class NostrParams {
  public userInfo: Info | null;
  public typeAuthMethod: string;
  public optionsModal: NostrLoginOptions;
  constructor() {
    this.userInfo = null;
    this.typeAuthMethod = '';

    this.optionsModal = {
      theme: 'default',
      startScreen: 'welcome',
      devOverrideBunkerOrigin: '',
    };
  }
}

export default NostrParams;
