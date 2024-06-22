import { NostrLoginOptions, RecentType, StartScreens, TypeModal } from '../types';
import { checkNip05, getBunkerUrl, getDarkMode, localStorageRemoveRecent } from '../utils';
import { AuthNostrService, NostrExtensionService, NostrParams } from '.';
import { EventEmitter } from 'tseep';
import { Info } from 'nostr-login-components/dist/types/types';
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
    }
  }

  public async launch(opt: NostrLoginOptions) {
    // mutex
    if (this.launcherPromise) {
      try {
        await this.launcherPromise;
      } catch {}
    }

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
      this.modal.setAttribute('bunkers', "nsec.app,highlighter.com");
    }

    if (opt.methods !== undefined) {
      this.modal.authMethods = opt.methods;
    }

    if (opt.localSignup !== undefined) {
      this.modal.localSignup = opt.localSignup;
    }

    this.modal.hasExtension = this.extensionService.hasExtension();

    this.modal.isLoadingExtension = false;
    this.modal.isLoading = false;

    dialog.appendChild(this.modal);
    document.body.appendChild(dialog);

    this.launcherPromise = new Promise<void>((ok, err) => {
      dialog.addEventListener('close', () => {
        // noop if already resolved
        err(new Error('Closed'));

        if (this.modal) {
          // reset state
          this.modal.isLoading = false;
          this.modal.authUrl = '';
          this.modal.error = '';
          this.modal.isLoadingExtension = false;

          // drop it
          // @ts-ignore
          document.body.removeChild(this.modal.parentNode);
          this.modal = null;
        }
      });

      const login = (name: string) => {
        if (this.modal) {
          this.modal.isLoading = true;
        }
        // convert name to bunker url
        getBunkerUrl(name, this.params.optionsModal)
          // connect to bunker by url
          .then(bunkerUrl => this.authNostrService.authNip46('login', name, bunkerUrl))
          .then(() => {
            if (this.modal) {
              this.modal.isLoading = false;
            }
            dialog.close();
            ok();
          })
          .catch((e: Error) => {
            console.log('error', e);
            if (this.modal) {
              this.modal.isLoading = false;
              this.modal.error = e.toString();
            }
          });
      };

      const signup = (name: string) => {
        if (this.modal) {
          this.modal.isLoading = true;
        }

        // create acc on service and get bunker url
        this.authNostrService
          .createAccount(name)
          // connect to bunker by url
          .then(({ bunkerUrl, sk }) => this.authNostrService.authNip46('signup', name, bunkerUrl, sk))
          .then(() => {
            if (this.modal) {
              this.modal.isLoading = false;
            }
            dialog.close();
            ok();
          })
          .catch((e: Error) => {
            console.log('error', e);
            if (this.modal) {
              this.modal.isLoading = false;
              this.modal.error = e.toString();
            }
          });
      };

      const importKeys = (bunker: string) => {
        if (this.modal) {
          this.modal.isLoading = true;
        }

        this.authNostrService
          .importCurrentUser(bunker)
          .then(() => {
            if (this.modal) {
              this.modal.isLoading = false;
            }
            dialog.close();
            ok();
          })
          .catch((e: Error) => {
            console.log('error', e);
            if (this.modal) {
              this.modal.isLoading = false;
              this.modal.error = e.toString();
            }
          });
      };

      if (!this.modal) throw new Error('WTH?');

      this.modal.addEventListener('handleContinue', () => {
        if (this.modal) {
          this.modal.isLoading = true;
          this.emit('onAuthUrlClick', this.modal.authUrl);
        }
      });

      this.modal.addEventListener('stopFetchHandler', () => {
        if (this.modal) {
          this.modal.isLoading = false;
        }
        dialog.close();
        err(new Error('Cancelled'));
      });

      this.modal.addEventListener('nlLogin', (event: any) => {
        login(event.detail);
      });

      this.modal.addEventListener('nlSignup', (event: any) => {
        signup(event.detail);
      });

      this.modal.addEventListener('nlLocalSignup', (event: any) => {
        this.authNostrService.localSignup(event.detail);
        dialog.close();
      });

      this.modal.addEventListener('nlImportAccount', (event: any) => {
        importKeys(event.detail);
      });

      this.modal.addEventListener('nlSwitchAccount', (event: any) => {
        const eventInfo: Info = event.detail as Info;

        this.emit('onSwitchAccount', eventInfo);

        // wait a bit, if dialog closes before
        // switching finishes then launched promise rejects
        setTimeout(() => dialog.close(), 300);
      });

      this.modal.addEventListener('nlLoginRecentAccount', async (event: any) => {
        const userInfo: Info = event.detail as Info;

        if (userInfo.authMethod === 'readOnly') {
          this.authNostrService.setReadOnly(userInfo.pubkey);
          dialog.close();
        } else if (userInfo.authMethod === 'extension') {
          await this.extensionService.trySetExtensionForPubkey(userInfo.pubkey);
          dialog.close();
        } else {
          const input = userInfo.bunkerUrl || userInfo.nip05;
          if (!input) throw new Error('Bad connect info');
          login(input);
        }
      });

      this.modal.addEventListener('nlRemoveRecent', (event: any) => {
        localStorageRemoveRecent(event.detail as RecentType);
        this.emit('updateAccounts');
      });

      this.modal.addEventListener('nlLoginReadOnly', async (event: any) => {
        if (!this.modal) return;

        this.modal.isLoading = true;

        const nameNpub = event.detail;
        try {
          let pubkey = '';
          if (nameNpub.includes('@')) {
            const { error, pubkey: nip05pubkey } = await checkNip05(nameNpub);
            if (nip05pubkey) pubkey = nip05pubkey;
            else throw new Error(error);
          } else {
            const { type, data } = nip19.decode(nameNpub);
            if (type === 'npub') pubkey = data as string;
            else throw new Error('Bad npub');
          }

          this.authNostrService.setReadOnly(pubkey);

          this.modal.isLoading = false;
          dialog.close();
          ok();
        } catch (e: any) {
          console.log('error', e);
          this.modal.isLoading = false;
          this.modal.error = e.toString() || e;
        }
      });

      this.modal.addEventListener('nlLoginExtension', async () => {
        if (!this.extensionService.hasExtension()) {
          throw new Error('No extension');
        }

        if (this.modal) {
          try {
            this.modal.isLoadingExtension = true;

            await this.extensionService.setExtension();

            this.modal.isLoadingExtension = false;

            dialog.close();

            ok();
          } catch (e) {
            console.log('extension error', e);
            // @ts-ignore
            this.modal.error = e.toString();
          }
        }
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

      this.modal.addEventListener('nlCloseModal', () => {
        if (this.modal) {
          this.modal.isLoading = false;
        }

        dialog.close();

        err(new Error('Cancelled'));
      });

      this.modal.addEventListener('nlChangeDarkMode', (event: any) => {
        setDarkMode(event.detail);
        document.dispatchEvent(new CustomEvent('nlDarkMode', { detail: event.detail }));
      });

      dialog.showModal();
    });

    return this.launcherPromise;
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
