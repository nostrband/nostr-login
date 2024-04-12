import { localStorageSetItem } from '../utils';
import { LOCAL_STORE_KEY } from '../const';
import { NostrLoginInitializer } from '../index';
import { AuthNostrService, NostrParams } from './';

class NostrExtensionService {
  private params: NostrParams;
  private authNostrService: AuthNostrService;

  constructor(props: NostrLoginInitializer) {
    this.params = props.params;
    this.authNostrService = props.authNostrService;
  }

  public checkExtension() {
    console.log('checkExtension');
    // @ts-ignore
    if (!this.params.nostrExtension && window.nostr !== this.nostr) {
      this.initExtension();
    }
  }

  private initExtension() {
    // @ts-ignore
    this.params.nostrExtension = window.nostr;
    // @ts-ignore
    window.nostr = this.nostr;
    if (this.params.userInfo?.extension) {
      this.setExtension(this.params.userInfo.pubkey);
    }
    // in the worst case of app saving the nostrExtension reference
    // it will be calling it directly, not a big deal
  }

  public async setExtension(expectedPubkey?: string) {
    window.nostr = this.params.nostrExtension;
    // @ts-ignore
    const pubkey = await window.nostr.getPublicKey();
    if (expectedPubkey && expectedPubkey !== pubkey) {
      await this.authNostrService.logout();
    } else {
      const info = { pubkey, extension: true };
      localStorageSetItem(LOCAL_STORE_KEY, JSON.stringify(info));

      this.authNostrService.onAuth('login', info);
    }
  }
}

export default NostrExtensionService;
