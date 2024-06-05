import { Nostr, NostrParams } from './';
import { EventEmitter } from 'tseep';

class NostrExtensionService extends EventEmitter {
  private params: NostrParams;
  private nostrExtension: any | undefined;

  constructor(params: NostrParams) {
    super();
    this.params = params;
  }

  public startCheckingExtension(nostr: Nostr) {
    if (this.checkExtension(nostr)) return;

    // watch out for extension trying to overwrite us
    const to = setInterval(() => {
      if (this.checkExtension(nostr)) clearTimeout(to);
    }, 100);
  }

  private checkExtension(nostr: Nostr) {
    // @ts-ignore
    if (!this.nostrExtension && window.nostr && window.nostr !== nostr) {
      this.initExtension(nostr);
      return true;
    }
    return false;
  }

  private async initExtension(nostr: Nostr, lastTry?: boolean) {
    // @ts-ignore
    this.nostrExtension = window.nostr;
    // @ts-ignore
    window.nostr = nostr;
    // we're signed in with extesions? well execute that
    if (this.params.userInfo?.authMethod === 'extension') {
      await this.trySetExtensionForPubkey(this.params.userInfo.pubkey);
    }

    // schedule another check
    if (!lastTry) {
      setTimeout(() => {
        // NOTE: we can't know if user has >1 extension and thus
        // if the current one we detected is the actual 'last one'
        // that will set the window.nostr. So the simplest
        // solution is to wait a bit more, hoping that if one
        // extension started then the rest are likely to start soon,
        // and then just capture the most recent one

        // @ts-ignore
        if (window.nostr !== nostr && this.nostrExtension !== window.nostr) {
          this.initExtension(nostr, true);
        }
      }, 300);
    }

    // in the worst case of app saving the nostrExtension reference
    // it will be calling it directly, not a big deal
  }

  private async setExtensionReadPubkey(expectedPubkey?: string) {
    window.nostr = this.nostrExtension;
    // @ts-ignore
    const pubkey = await window.nostr.getPublicKey();
    if (expectedPubkey && expectedPubkey !== pubkey) {
      this.emit('extensionLogout');
    } else {
      this.emit('extensionLogin', pubkey);
    }
  }

  public async trySetExtensionForPubkey(expectedPubkey: string) {
    if (this.nostrExtension) {
      return this.setExtensionReadPubkey(expectedPubkey);
    }
  }

  public async setExtension() {
    return this.setExtensionReadPubkey();
  }

  public unsetExtension(nostr: Nostr) {
    if (window.nostr === this.nostrExtension) {
      // @ts-ignore
      window.nostr = nostr;
    }
  }

  public getExtension() {
    return this.nostrExtension;
  }

  public hasExtension() {
    return !!this.nostrExtension;
  }
}

export default NostrExtensionService;
