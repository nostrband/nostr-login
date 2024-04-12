import 'nostr-login-components';
import { Modal, AuthNostrService, NostrExtensionService, Banner, Popup, NostrParams, Nostr, ProcessManager } from './modules';
import { NostrLoginOptions } from './types';
import { localStorageGetItem, localStorageSetItem } from './utils';
import { LOCAL_STORE_KEY } from './const';

export class NostrLoginInitializer {
  public extensionManager: NostrExtensionService;
  public params: NostrParams;
  public authNostrService: AuthNostrService;
  public nostr: Nostr;
  public processManager: ProcessManager;
  public popupManager: Popup;
  public bannerManager: Banner;
  public modalManager: Modal;

  constructor() {
    this.params = new NostrParams();
    this.nostr = new Nostr(this);
    this.popupManager = new Popup(this);
    this.authNostrService = new AuthNostrService(this);
    this.extensionManager = new NostrExtensionService(this);
    this.processManager = new ProcessManager(this);
    this.modalManager = new Modal(this);
    this.bannerManager = new Banner(this);
  }

  public init = async (opt: NostrLoginOptions) => {
    // skip if it's already started
    if (window.nostr) {
      this.extensionManager.checkExtension();
      return;
    }

    // set ourselves as nostr

    // @ts-ignore
    window.nostr = this.nostr;

    // watch out for extension trying to overwrite us
    setInterval(() => this.extensionManager.checkExtension(), 100);

    // force darkMode from init options
    if ('darkMode' in opt) {
      localStorageSetItem('nl-dark-mode', `${opt.darkMode}`);
    }

    // launch
    if (opt.iife) {
      this.bannerManager.launchAuthBanner(opt);
    } else {
      this.modalManager.connectModals(opt);
    }

    if (opt) {
      this.params.optionsModal = { ...opt };
    }

    try {
      // read conf from localstore
      const info = localStorageGetItem(LOCAL_STORE_KEY);

      if (!info) {
        return;
      }

      console.log('Step 1 -----------------------------');

      if (info.extension && info.pubkey) {
        // assume we're signed in, setExtension will check if
        // we still have the extension and will logout if smth is wrong
        console.log('Step 2 -----------------------------');
        this.authNostrService.onAuth('login', info);

        if (this.params.nostrExtension) {
          await this.extensionManager.setExtension(info.pubkey);
        }
      } else if (info.pubkey && info.sk && info.relays && info.relays[0]) {
        console.log('Step 3 -----------------------------');
        await this.authNostrService.initSigner(info);

        this.authNostrService.onAuth('login', info);
      } else {
        console.log('nostr login bad stored info', info);
      }
    } catch (e) {
      console.log('nostr login init error', e);

      await this.authNostrService.logout();
    }
  };

  public logout = async () => {
    await this.authNostrService.logout();
  };
}

const initializer = new NostrLoginInitializer();

export const { init, logout } = initializer;

document.addEventListener('nlLogout', logout);
