import { AuthNostrService, Nostr, NostrParams } from './';
import { EventEmitter } from 'tseep';

class NostrExtensionService extends EventEmitter {
  private params: NostrParams;
  private authNostrService: AuthNostrService;
  private nostrExtension: any | undefined;

  constructor(params: NostrParams, authNostrService: AuthNostrService) {
    super();
    this.params = params;
    this.authNostrService = authNostrService;
  }

  public startCheckingExtension(nostr: Nostr) {
    this.checkExtension(nostr);

    // watch out for extension trying to overwrite us
    setInterval(() => this.checkExtension(nostr), 100);
  }

  private checkExtension(nostr: Nostr) {
    // @ts-ignore
    if (!this.nostrExtension && window.nostr && window.nostr !== nostr) {
      this.initExtension(nostr);
    }
  }

  public getExtension() {
    return this.nostrExtension;
  }

  public hasExtension() {
    return !!this.nostrExtension;
  }

  private initExtension(nostr: Nostr) {
    // @ts-ignore
    this.nostrExtension = window.nostr;
    // @ts-ignore
    window.nostr = nostr;
    // we're signed in with extesions? well execute that
    if (this.params.userInfo?.extension) {
      this.trySetExtensionForPubkey(this.params.userInfo.pubkey);
    }
    // in the worst case of app saving the nostrExtension reference
    // it will be calling it directly, not a big deal
  }

  public async trySetExtensionForPubkey(expectedPubkey: string) {
    if (this.nostrExtension) {
      this.setExtensionReadPubkey(expectedPubkey);
    }
  }

  public async setExtension() {
    this.setExtensionReadPubkey();
  }

  public unsetExtension() {
    if (window.nostr === this.nostrExtension) {
      // @ts-ignore
      window.nostr = this.nostr;
    }
  }

  private async setExtensionReadPubkey(expectedPubkey?: string) {
    window.nostr = this.nostrExtension;
    // @ts-ignore
    const pubkey = await window.nostr.getPublicKey();
    if (expectedPubkey && expectedPubkey !== pubkey) {
      await this.authNostrService.logout();
    } else {
      const info = { pubkey, extension: true };

      this.authNostrService.onAuth('login', info);
    }
  }
}

export default NostrExtensionService;
