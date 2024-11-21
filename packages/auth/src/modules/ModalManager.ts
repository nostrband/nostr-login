import { NostrLoginOptions, StartScreens, TypeModal } from '../types';
import { checkNip05, getBunkerUrl, getDarkMode, localStorageRemoveRecent, localStorageSetItem } from '../utils';
import { AuthNostrService, NostrExtensionService, NostrParams } from '.';
import { EventEmitter } from 'tseep';
import { ConnectionString, Info, RecentType } from 'nostr-login-components/dist/types/types';
import { nip19 } from 'nostr-tools';
import { setDarkMode } from '..';

class ModalManager extends EventEmitter {
  private modal: TypeModal | null = null;
  private params: NostrParams;
  private extensionService: NostrExtensionService;
  private authNostrService: AuthNostrService;
  private launcherPromise?: Promise<void>;
  private accounts: Info[] = [];
  private recents: RecentType[] = [];
  private opt?: NostrLoginOptions;

  constructor(params: NostrParams, authNostrService: AuthNostrService, extensionManager: NostrExtensionService) {
    super();
    this.params = params;
    this.extensionService = extensionManager;
    this.authNostrService = authNostrService;
  }

  public async waitReady() {
    if (this.launcherPromise) {
      try {
        await this.launcherPromise;
      } catch {}
      this.launcherPromise = undefined;
    }
  }

  public async launch(opt: NostrLoginOptions) {
    // mutex
    if (this.launcherPromise) await this.waitReady();

    this.opt = opt;

    const dialog = document.createElement('dialog');
    this.modal = document.createElement('nl-auth');
    this.modal.accounts = this.accounts;
    this.modal.recents = this.recents;

    this.modal.setAttribute('dark-mode', String(getDarkMode(opt)));

    if (opt.theme) {
      this.modal.setAttribute('theme', opt.theme);
    }

    if (opt.startScreen) {
      this.modal.setAttribute('start-screen', opt.startScreen);
    }

    if (opt.bunkers) {
      this.modal.setAttribute('bunkers', opt.bunkers);
    } else {
      let bunkers = 'nsec.app,highlighter.com';
      // if (opt.dev) bunkers += ',new.nsec.app';
      this.modal.setAttribute('bunkers', bunkers);
    }

    if (opt.methods !== undefined) {
      this.modal.authMethods = opt.methods;
    }

    if (opt.localSignup !== undefined) {
      this.modal.localSignup = opt.localSignup;
    }

    if (opt.title) {
      this.modal.welcomeTitle = opt.title;
    }

    if (opt.description) {
      this.modal.welcomeDescription = opt.description;
    }

    this.modal.hasExtension = this.extensionService.hasExtension();
    this.modal.hasOTP = !!opt.otpRequestUrl && !!opt.otpReplyUrl;

    this.modal.isLoadingExtension = false;
    this.modal.isLoading = false;

    [this.modal.connectionString, this.modal.connectionStringServices] = await this.authNostrService.getNostrConnectServices();

    dialog.appendChild(this.modal);
    document.body.appendChild(dialog);

    let otpPubkey = '';

    this.launcherPromise = new Promise<void>((ok, err) => {
      dialog.addEventListener('close', () => {
        // noop if already resolved
        err(new Error('Closed'));

        this.authNostrService.resetAuth();

        if (this.modal) {
          // it's reset on modal creation
          // // reset state
          // this.modal.isLoading = false;
          // this.modal.authUrl = '';
          // this.modal.iframeUrl = '';
          // this.modal.error = '';
          // this.modal.isLoadingExtension = false;

          // drop it
          // @ts-ignore
          document.body.removeChild(this.modal.parentNode);
          this.modal = null;
        }
      });

      const done = async (ok: () => void) => {
        if (this.modal) this.modal.isLoading = false;
        await this.authNostrService.endAuth();
        dialog.close();
        this.modal = null;
        ok();
      };

      const exec = async (
        body: () => Promise<void>,
        options?: {
          start?: boolean;
          end?: boolean;
        },
      ) => {
        if (this.modal) {
          this.modal.isLoading = true;
        }

        try {
          if (!options || options.start) await this.authNostrService.startAuth();
          await body();
          if (!options || options.end) await done(ok);
        } catch (e: any) {
          console.log('error', e);
          if (this.modal) {
            this.modal.isLoading = false;
            this.modal.authUrl = '';
            this.modal.iframeUrl = '';
            this.modal.error = e.toString();
          }
        }
      };

      const login = async (name: string, domain?: string) => {
        await exec(async () => {
          // convert name to bunker url
          const bunkerUrl = await getBunkerUrl(name, this.params.optionsModal);

          // connect to bunker by url
          await this.authNostrService.authNip46('login', { name, bunkerUrl, domain });
        });
      };

      const signup = async (name: string) => {
        await exec(async () => {
          // create acc on service and get bunker url
          const { bunkerUrl, sk } = await this.authNostrService.createAccount(name);

          // connect to bunker by url
          await this.authNostrService.authNip46('signup', { name, bunkerUrl, sk });
        });
      };

      const exportKeys = async () => {
        try {
          await navigator.clipboard.writeText(this.authNostrService.exportKeys());
          localStorageSetItem('backupKey', 'true');
        } catch (err) {
          console.error('Failed to copy to clipboard: ', err);
        }
      };

      const importKeys = async (cs: ConnectionString) => {
        await exec(async () => {
          const { iframeUrl } = cs;
          const link = this.authNostrService.prepareImportUrl(cs.link);

          if (this.modal && iframeUrl) {
            // we pass the link down to iframe so it could open it
            this.modal.authUrl = link;
            this.modal.iframeUrl = iframeUrl;
            this.modal.isLoading = false;
            console.log('nostrconnect authUrl', this.modal.authUrl, this.modal.iframeUrl);
          }

          await this.authNostrService.importAndConnect(cs);
        });
      };

      const nostrConnect = async (cs?: ConnectionString) => {
        await exec(async () => {
          const { relay, domain, link, iframeUrl } = cs || {};
          console.log('nostrConnect', cs, relay, domain, link, iframeUrl);

          if (this.modal) {
            if (iframeUrl) {
              // we pass the link down to iframe so it could open it
              this.modal.authUrl = link;
              this.modal.iframeUrl = iframeUrl;
              this.modal.isLoading = false;
              console.log('nostrconnect authUrl', this.modal.authUrl, this.modal.iframeUrl);
            }

            if (!cs) this.modal.isLoading = false;
          }

          await this.authNostrService.nostrConnect(relay, { domain, link, iframeUrl });
        });
      };

      const localSignup = async (name?: string) => {
        await exec(async () => {
          if (!name) throw new Error('Please enter some nickname');
          await this.authNostrService.localSignup(name);
        });
      };

      if (!this.modal) throw new Error('WTH?');

      this.modal.addEventListener('handleContinue', () => {
        if (this.modal) {
          this.modal.isLoading = true;
          this.emit('onAuthUrlClick', this.modal.authUrl);
        }
      });

      this.modal.addEventListener('nlLogin', (event: any) => {
        login(event.detail);
      });

      this.modal.addEventListener('nlSignup', (event: any) => {
        signup(event.detail);
      });

      this.modal.addEventListener('nlLocalSignup', (event: any) => {
        localSignup(event.detail);
      });

      this.modal.addEventListener('nlImportAccount', (event: any) => {
        importKeys(event.detail);
      });

      this.modal.addEventListener('nlExportKeys', (event: any) => {
        exportKeys();
      });

      this.modal.addEventListener('handleLogoutBanner', () => {
        this.emit('onLogoutBanner');
      });

      this.modal.addEventListener('nlNostrConnect', (event: any) => {
        nostrConnect(event.detail);
      });

      this.modal.addEventListener('nlNostrConnectDefault', () => {
        nostrConnect();
      });

      this.modal.addEventListener('nlSwitchAccount', (event: any) => {
        const eventInfo: Info = event.detail as Info;

        this.emit('onSwitchAccount', eventInfo);

        // wait a bit, if dialog closes before
        // switching finishes then launched promise rejects

        // FIXME this calls resetAuth which then prevents
        // endAuth from getting properly called. 300 is not
        // enough to init iframe, so there should be a
        // feedback from switchAccount here
        setTimeout(() => dialog.close(), 300);
      });

      this.modal.addEventListener('nlLoginRecentAccount', async (event: any) => {
        const userInfo: Info = event.detail as Info;

        if (userInfo.authMethod === 'readOnly') {
          this.authNostrService.setReadOnly(userInfo.pubkey);
          dialog.close();
        } else if (userInfo.authMethod === 'otp') {
          try {
            this.modal!.dispatchEvent(
              new CustomEvent('nlLoginOTPUser', {
                detail: userInfo.nip05 || userInfo.pubkey,
              }),
            );
          } catch (e) {
            console.error(e);
          }
        } else if (userInfo.authMethod === 'extension') {
          await this.extensionService.trySetExtensionForPubkey(userInfo.pubkey);
          dialog.close();
        } else {
          const input = userInfo.bunkerUrl || userInfo.nip05;
          if (!input) throw new Error('Bad connect info');
          login(input, userInfo.domain);
        }
      });

      this.modal.addEventListener('nlRemoveRecent', (event: any) => {
        localStorageRemoveRecent(event.detail as RecentType);
        this.emit('updateAccounts');
      });

      const nameToPubkey = async (nameNpub: string) => {
        let pubkey = '';
        if (nameNpub.includes('@')) {
          const { error, pubkey: nip05pubkey } = await checkNip05(nameNpub);
          if (nip05pubkey) pubkey = nip05pubkey;
          else throw new Error(error);
        } else if (nameNpub.startsWith('npub')) {
          const { type, data } = nip19.decode(nameNpub);
          if (type === 'npub') pubkey = data as string;
          else throw new Error('Bad npub');
        } else if (nameNpub.trim().length === 64) {
          pubkey = nameNpub.trim();
          nip19.npubEncode(pubkey); // check
        }
        return pubkey;
      };

      this.modal.addEventListener('nlLoginReadOnly', async (event: any) => {
        await exec(async () => {
          const nameNpub = event.detail;
          const pubkey = await nameToPubkey(nameNpub);
          this.authNostrService.setReadOnly(pubkey);
        });
      });

      this.modal.addEventListener('nlLoginExtension', async () => {
        if (!this.extensionService.hasExtension()) {
          throw new Error('No extension');
        }

        await exec(async () => {
          if (!this.modal) return;
          this.modal.isLoadingExtension = true;
          await this.extensionService.setExtension();
          this.modal.isLoadingExtension = false;
        });
      });

      this.modal.addEventListener('nlLoginOTPUser', async (event: any) => {
        await exec(
          async () => {
            if (!this.modal) return;

            const nameNpub = event.detail;
            const pubkey = await nameToPubkey(nameNpub);
            const url = this.opt!.otpRequestUrl! + (this.opt!.otpRequestUrl!.includes('?') ? '&' : '?') + 'pubkey=' + pubkey;
            const r = await fetch(url);
            if (r.status !== 200) {
              console.warn('nostr-login: bad otp reply', r);
              throw new Error('Failed to send DM');
            }

            // switch to 'enter code' mode
            this.modal.isOTP = true;

            // remember for code handler below
            otpPubkey = pubkey;

            // spinner off
            this.modal.isLoading = false;
          },
          { start: true },
        );
      });

      this.modal.addEventListener('nlLoginOTPCode', async (event: any) => {
        await exec(
          async () => {
            if (!this.modal) return;
            const code = event.detail;
            const url = this.opt!.otpReplyUrl! + (this.opt!.otpRequestUrl!.includes('?') ? '&' : '?') + 'pubkey=' + otpPubkey + '&code=' + code;
            const r = await fetch(url);
            if (r.status !== 200) {
              console.warn('nostr-login: bad otp reply', r);
              throw new Error('Invalid code');
            }

            const data = await r.text();
            this.authNostrService.setOTP(otpPubkey, data);

            this.modal.isOTP = false;
          },
          { end: true },
        );
      });

      this.modal.addEventListener('nlCheckSignup', async (event: any) => {
        const { available, taken, error } = await checkNip05(event.detail);
        if (this.modal) {
          this.modal.error = String(error);

          if (!error && taken) {
            this.modal.error = 'Already taken';
          }

          this.modal.signupNameIsAvailable = available;
        }
      });

      this.modal.addEventListener('nlCheckLogin', async (event: any) => {
        const { available, taken, error } = await checkNip05(event.detail);
        if (this.modal) {
          this.modal.error = String(error);
          if (available) {
            this.modal.error = 'Name not found';
          }
          this.modal.loginIsGood = taken;
        }
      });

      const cancel = () => {
        if (this.modal) {
          this.modal.isLoading = false;
        }

        // this.authNostrService.cancelListenNostrConnect();

        dialog.close();
        err(new Error('Cancelled'));
      };
      this.modal.addEventListener('stopFetchHandler', cancel);
      this.modal.addEventListener('nlCloseModal', cancel);

      this.modal.addEventListener('nlChangeDarkMode', (event: any) => {
        setDarkMode(event.detail);
        document.dispatchEvent(new CustomEvent('nlDarkMode', { detail: event.detail }));
      });

      this.on('onIframeAuthUrlCallEnd', () => {
        dialog.close();
        this.modal = null;
        ok();
      });

      dialog.showModal();
    });

    return this.launcherPromise;
  }

  public async showIframeUrl(url: string) {
    // make sure we consume the previous promise,
    // otherwise launch will start await-ing
    // before modal is created and setting iframeUrl will fail
    await this.waitReady();

    this.launch({
      startScreen: 'iframe' as StartScreens,
    }).catch(() => console.log('closed auth iframe'));

    this.modal!.authUrl = url;
  }

  public connectModals(defaultOpt: NostrLoginOptions) {
    const initialModals = async (opt: NostrLoginOptions) => {
      await this.launch(opt);
    };

    const nlElements = document.getElementsByTagName('nl-button');

    for (let i = 0; i < nlElements.length; i++) {
      const theme = nlElements[i].getAttribute('nl-theme');
      const startScreen = nlElements[i].getAttribute('start-screen');

      const elementOpt = {
        ...defaultOpt,
      };
      if (theme) elementOpt.theme = theme;

      switch (startScreen as StartScreens) {
        case 'login':
        case 'login-bunker-url':
        case 'login-read-only':
        case 'signup':
        case 'switch-account':
        case 'welcome':
          elementOpt.startScreen = startScreen as StartScreens;
      }

      nlElements[i].addEventListener('click', function () {
        initialModals(elementOpt);
      });
    }
  }

  public onAuthUrl(url: string) {
    if (this.modal) {
      this.modal.authUrl = url;
      this.modal.isLoading = false;
    }
  }

  public onIframeUrl(url: string) {
    if (this.modal) {
      console.log('modal iframe url', url);
      this.modal.iframeUrl = url;
    }
  }

  public onCallEnd() {
    if (this.modal && this.modal.authUrl && this.params.userInfo?.iframeUrl) {
      this.emit('onIframeAuthUrlCallEnd');
    }
  }

  public onUpdateAccounts(accounts: Info[], recents: RecentType[]) {
    this.accounts = accounts;
    this.recents = recents;
    if (!this.modal) return;
    this.modal.accounts = accounts;
    this.modal.recents = recents;
  }

  public onDarkMode(dark: boolean) {
    if (this.modal) this.modal.darkMode = dark;
  }
}

export default ModalManager;
