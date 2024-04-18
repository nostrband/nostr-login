import 'nostr-login-components';
import { AuthNostrService, NostrExtensionService, Popup, NostrParams, Nostr, ProcessManager, BannerManager, ModalManager } from './modules';
import { NostrLoginOptions } from './types';
import { localStorageGetItem, localStorageSetItem } from './utils';
import {LOCAL_STORE_KEY} from './const';

export class NostrLoginInitializer {
  public extensionService: NostrExtensionService;
  public params: NostrParams;
  public authNostrService: AuthNostrService;
  public nostr: Nostr;
  public processManager: ProcessManager;
  public popupManager: Popup;
  public bannerManager: BannerManager;
  public modalManager: ModalManager;

  constructor() {
    this.params = new NostrParams();
    this.processManager = new ProcessManager();
    this.popupManager = new Popup();
    this.bannerManager = new BannerManager(this.params);
    this.authNostrService = new AuthNostrService(this.params);
    this.extensionService = new NostrExtensionService(this.params, this.authNostrService);
    this.modalManager = new ModalManager(this.params, this.authNostrService, this.extensionService);
    this.nostr = new Nostr(this.params, this.processManager, this.extensionService, this.authNostrService, this.modalManager);

    this.processManager.on('onCallTimeout', () => {
      this.bannerManager.onCallTimeout();
    });

    this.processManager.on('onCallEnd', () => {
      this.bannerManager.onCallEnd();
    });

    this.processManager.on('onCallStart', () => {
      this.bannerManager.onCallStart();
    });

    this.authNostrService.on('onAuthUrl', url => {
      this.processManager.onAuthUrl();

      if (this.params.userInfo) {
        // show the 'Please confirm' banner
        this.bannerManager.onAuthUrl(url);
      } else {
        // if it fails we will either return 'failed'
        // to the window.nostr caller, or show proper error
        // in our modal
        this.modalManager.onAuthUrl(url);
      }
    });

    this.authNostrService.on('onSetAccounts', accounts => {
      this.bannerManager.onSetAccounts(accounts);
    });

    this.authNostrService.on('onUserInfo', info => {
      this.bannerManager.onUserInfo(info);
    });

    this.modalManager.on('onAuthUrlClick', url => {
      this.popupManager.ensurePopup(url);
    });

    this.bannerManager.on('logout', () => {
      this.authNostrService.logout();
    });

    this.bannerManager.on('onAuthUrlClick', url => {
      this.popupManager.ensurePopup(url);
    });

    this.bannerManager.on('onSwitchAccount', async (info) => {
      await this.authNostrService.initSigner(info);

      this.authNostrService.onAuth("login", info);
    });

    this.bannerManager.on('launch', startScreen => {
      const options = startScreen
        ? {
            startScreen,
          }
        : this.params.optionsModal;

      this.modalManager.launch(options).catch(() => {}); // don't throw if cancelled
    });
  }

  public init = async (opt: NostrLoginOptions) => {
    // skip if it's already started
    if (window.nostr) {
      this.extensionService.checkExtension(this.nostr);
      return;
    }

    // set ourselves as nostr

    // @ts-ignore
    window.nostr = this.nostr;

    // watch out for extension trying to overwrite us
    setInterval(() => this.extensionService.checkExtension(this.nostr), 100);

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

      if (info.extension && info.pubkey) {
        // assume we're signed in, setExtension will check if
        // we still have the extension and will logout if smth is wrong
        this.authNostrService.onAuth('login', info);

        await this.extensionService.trySetExtensionForPubkey(info.pubkey);
      } else if (info.pubkey && info.sk && info.relays && info.relays[0]) {
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
    // replace back
    this.extensionService.unsetExtension();

    await this.authNostrService.logout();
  };
}

const initializer = new NostrLoginInitializer();

export const { init, logout } = initializer;

document.addEventListener('nlLogout', logout);
