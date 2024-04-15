import { NostrLoginOptions, TypeBanner } from '../types';
import { ModalManager, NostrParams, Popup, AuthNostrService } from '.';
import { Info } from 'nostr-login-components/dist/types/types';
import { EventEmitter } from 'tseep';

class BannerManager extends EventEmitter {
  private banner: TypeBanner | null = null;
  private listNotifies: string[] = [];

  private params: NostrParams;

  constructor(params: NostrParams) {
    super();
    this.params = params;
  }

  public onAuthUrl(url: string) {
    if (this.banner) {
      // banner.isLoading = false;
      this.banner.notify = {
        confirm: Date.now(),
        url,
      };
    }
  }

  public onUserInfo(info: Info | null) {
    if (this.banner) {
      this.banner.userInfo = info;
      if (info) {
        this.banner.titleBanner = info.sk ? 'You are logged in' : 'You are using extension';
      } else {
        this.banner.titleBanner = '';
      } // 'Use with Nostr';
    }
  }

  public onCallTimeout() {
    if (this.banner) {
      this.banner.notify = {
        confirm: Date.now(),
        timeOut: { domain: this.params.userInfo?.nip05?.split('@')[1] },
      };
    }
  }

  public onCallStart() {
    if (this.banner) {
      this.banner.isLoading = true;
    }
  }

  public onCallEnd() {
    if (this.banner) {
      this.banner.isLoading = false;
    }
  }

  public launchAuthBanner(opt: NostrLoginOptions) {
    this.banner = document.createElement('nl-banner');

    this.banner.addEventListener('handleLoginBanner', (event: any) => {
      this.emit('launch', event.detail);
    });

    this.banner.addEventListener('handleLogoutBanner', async () => {
      this.emit('logout');
    });

    this.banner.addEventListener('handleNotifyConfirmBanner', (event: any) => {
      this.emit('onAuthUrlClick', event.detail);
    });

    this.banner.addEventListener('handleSetConfirmBanner', (event: any) => {
      this.listNotifies.push(event.detail);

      if (this.banner) {
        this.banner.listNotifies = this.listNotifies;
      }
    });

    this.banner.addEventListener('handleOpenWelcomeModal', () => {
      this.emit('launch');
    });

    this.banner.addEventListener('handleRetryConfirmBanner', () => {
      const url = this.listNotifies.pop();
      // FIXME go to nip05 domain?
      if (!url) {
        return;
      }

      if (this.banner) {
        this.banner.listNotifies = this.listNotifies;
      }

      this.emit('onAuthUrlClick', url);
    });

    document.body.appendChild(this.banner);
  }
}

export default BannerManager;
