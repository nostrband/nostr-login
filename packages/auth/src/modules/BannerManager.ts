import { NostrLoginOptions, TypeBanner } from '../types';
import { NostrParams } from '.';
import { Info } from 'nostr-login-components/dist/types/types';
import { EventEmitter } from 'tseep';
import { getDarkMode } from '../utils';
import { ReadyListener } from './Nip46';

class BannerManager extends EventEmitter {
  private banner: TypeBanner | null = null;
  private iframeReady?: ReadyListener;

  private params: NostrParams;

  constructor(params: NostrParams) {
    super();
    this.params = params;
  }

  public onAuthUrl(url: string, iframeUrl: string) {
    if (this.banner) {
      if (url)
        this.banner.notify = {
          mode: iframeUrl ? 'iframeAuthUrl' : 'authUrl',
          url,
        };
      else
        this.banner.notify = {
          mode: '',
        };
    }
  }

  public onIframeRestart(iframeUrl: string) {
    if (this.banner) {
      this.iframeReady = new ReadyListener(['rebinderDone', 'rebinderError'], new URL(iframeUrl).origin);
      this.banner.notify = {
        mode: 'rebind',
        url: iframeUrl,
      };
    }
  }

  public onUserInfo(info: Info | null) {
    if (this.banner) {
      this.banner.userInfo = info;
    }
  }

  public onCallTimeout() {
    if (this.banner) {
      this.banner.notify = {
        mode: 'timeout',
      };
    }
  }

  public onCallStart() {
    if (this.banner) {
      this.banner.isLoading = true;
    }
  }

  public async onCallEnd() {
    if (this.banner) {
      if (this.iframeReady) {
        await this.iframeReady.wait();
        this.iframeReady = undefined;
      }
      this.banner.isLoading = false;
      this.banner.notify = { mode: '' };
    }
  }

  public onUpdateAccounts(accounts: Info[]) {
    if (this.banner) {
      this.banner.accounts = accounts;
    }
  }

  public onDarkMode(dark: boolean) {
    if (this.banner) this.banner.darkMode = dark;
  }

  public launchAuthBanner(opt: NostrLoginOptions) {
    this.banner = document.createElement('nl-banner');

    this.banner.setAttribute('dark-mode', String(getDarkMode(opt)));

    if (opt.theme) this.banner.setAttribute('theme', opt.theme);
    if (opt.noBanner) this.banner.setAttribute('hidden-mode', 'true');

    this.banner.addEventListener('handleLoginBanner', (event: any) => {
      this.emit('launch', event.detail);
    });

    this.banner.addEventListener('handleConfirmLogout', () => {
      this.emit('onConfirmLogout');
    });

    this.banner.addEventListener('handleLogoutBanner', async () => {
      this.emit('logout');
    });

    this.banner.addEventListener('handleImportModal', (event: any) => {
      this.emit('import');
    });

    this.banner.addEventListener('handleNotifyConfirmBanner', (event: any) => {
      this.emit('onAuthUrlClick', event.detail);
    });

    this.banner.addEventListener('handleNotifyConfirmBannerIframe', (event: any) => {
      this.emit('onIframeAuthUrlClick', event.detail);
    });

    this.banner.addEventListener('handleSwitchAccount', (event: any) => {
      this.emit('onSwitchAccount', event.detail);
    });

    this.banner.addEventListener('handleOpenWelcomeModal', () => {
      this.emit('launch', this.params.optionsModal.startScreen);

      if (this.banner) {
        this.banner.isOpen = false;
      }
    });

    // this.banner.addEventListener('handleRetryConfirmBanner', () => {
    //   const url = this.listNotifies.pop();
    //   // FIXME go to nip05 domain?
    //   if (!url) {
    //     return;
    //   }

    //   if (this.banner) {
    //     this.banner.listNotifies = this.listNotifies;
    //   }

    //   this.emit('onAuthUrlClick', url);
    // });

    document.body.appendChild(this.banner);
  }
}

export default BannerManager;
