import { NostrLoginOptions } from '../types';
import { NostrLoginInitializer } from '../index';
import { Modal, NostrParams, Popup, AuthNostrService } from './';

class Banner {
  private params: NostrParams;
  private authNostrService: AuthNostrService;
  private popupManager: Popup;
  private modalManager: Modal;

  constructor(params: NostrParams, authNostrService: AuthNostrService, popupManager: Popup, modalManager: Modal) {
    this.params = params;
    this.authNostrService = authNostrService;
    this.popupManager = popupManager;
    this.modalManager = modalManager;
  }

  public launchAuthBanner(opt: NostrLoginOptions) {
    this.params.banner = document.createElement('nl-banner');

    this.params.banner.addEventListener('handleLoginBanner', (event: any) => {
      const startScreen = event.detail;

      this.modalManager
        .launch({
          startScreen,
        })
        .catch(() => {}); // don't throw if cancelled
    });

    this.params.banner.addEventListener('handleLogoutBanner', async () => {
      await this.authNostrService.logout();
    });

    this.params.banner.addEventListener('handleNotifyConfirmBanner', (event: any) => {
      this.popupManager.ensurePopup(event.detail);
    });

    this.params.banner.addEventListener('handleSetConfirmBanner', (event: any) => {
      this.params.listNotifies.push(event.detail);

      if (this.params.banner) {
        this.params.banner.listNotifies = this.params.listNotifies;
      }
    });

    this.params.banner.addEventListener('handleOpenWelcomeModal', () => {
      this.modalManager.launch(this.params.optionsModal).catch(() => {});
    });

    this.params.banner.addEventListener('handleRetryConfirmBanner', () => {
      const url = this.params.listNotifies.pop();
      // FIXME go to nip05 domain?
      if (!url) {
        return;
      }

      if (this.params.banner) {
        this.params.banner.listNotifies = this.params.listNotifies;
      }

      this.popupManager.ensurePopup(url);
    });

    document.body.appendChild(this.params.banner);
  }
}

export default Banner;
