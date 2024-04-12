import 'nostr-login-components';
import { Modal, AuthNostrService, NostrExtensionService, Banner, Popup, NostrParams, Nostr, ProcessManager, Test, Nip46Service, AccountService } from './modules';
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
  public test: Test;
  public nip46Service: Nip46Service;
  public accountService: AccountService;

  constructor() {
    this.params = new NostrParams();
    this.processManager = new ProcessManager(this.params);
    this.popupManager = new Popup(this.params);
    this.authNostrService = new AuthNostrService(this.params, this.popupManager);
    this.nip46Service = new Nip46Service(this.authNostrService);
    this.extensionManager = new NostrExtensionService(this.params, this.authNostrService);
    this.accountService = new AccountService(this.params, this.authNostrService);
    this.modalManager = new Modal(this.params, this.nip46Service, this.extensionManager, this.popupManager, this.accountService);
    this.test = new Test(this.params, this.modalManager);
    this.nostr = new Nostr(this.params, this.test, this.processManager);
    this.bannerManager = new Banner(this.params, this.authNostrService, this.popupManager, this.modalManager);
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
