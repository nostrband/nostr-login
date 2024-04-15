import { Info } from 'nostr-login-components/dist/types/types';
import NDK from '@nostr-dev-kit/ndk';
import { NostrLoginOptions, TypeModal } from '../types';

class NostrParams {
  public userInfo: Info | null;
  public optionsModal: NostrLoginOptions;
  constructor() {
    this.userInfo = null;

    this.optionsModal = {
      theme: 'default',
      startScreen: 'welcome',
      devOverrideBunkerOrigin: '',
    };
  }
}

export default NostrParams;
