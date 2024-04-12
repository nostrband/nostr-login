import { bunkerUrlToInfo, localStorageSetItem } from '../utils';
import { LOCAL_STORE_KEY } from '../const';
import { AuthNostrService } from './index';

class Nip46Service {
  private authNostrService: AuthNostrService;
  constructor(authNostrService: AuthNostrService) {
    this.authNostrService = authNostrService;
  }

  public async authNip46(type: 'login' | 'signup', name: string, bunkerUrl: string, sk = '') {
    try {
      const info = bunkerUrlToInfo(bunkerUrl, sk);
      info.nip05 = name;

      // console.log('nostr login auth info', info);
      if (!info.pubkey || !info.sk || !info.relays?.[0]) {
        throw new Error(`Bad bunker url ${bunkerUrl}`);
      }

      const r = await this.authNostrService.initSigner(info, { connect: true });

      // only save after successfull login
      localStorageSetItem(LOCAL_STORE_KEY, JSON.stringify(info));

      // callback
      this.authNostrService.onAuth(type, info);

      // result
      return r;
    } catch (e) {
      console.log('nostr login auth failed', e);
      // make ure it's closed
      // this.popupManager.closePopup();
      throw e;
    }
  }
}

export default Nip46Service;
