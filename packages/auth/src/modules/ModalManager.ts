import {NostrLoginOptions, RecentType, TypeModal} from '../types';
import {getBunkerUrl, localStorageGetItem} from '../utils';
import { AuthNostrService, NostrExtensionService, NostrParams } from '.';
import { EventEmitter } from 'tseep';
import { LOGGED_IN_ACCOUNTS, RECENT_ACCOUNTS } from '../const';
import { Info } from 'nostr-login-components/dist/types/types';
import { nip19 } from 'nostr-tools';

class ModalManager extends EventEmitter {
  private modal: TypeModal | null = null;
  private params: NostrParams;
  private extensionService: NostrExtensionService;
  private authNostrService: AuthNostrService;
  private launcherPromise?: Promise<void>;

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

    if (opt.theme) {
      this.modal.setAttribute('theme', opt.theme);
    }

    if (opt.startScreen) {
      this.modal.setAttribute('start-screen', opt.startScreen);
    }

    if (opt.bunkers) {
      this.modal.setAttribute('bunkers', opt.bunkers);
    }

    if (opt.isSignInWithExtension !== undefined) {
      this.modal.isSignInWithExtension = opt.isSignInWithExtension;
    } else {
      this.modal.isSignInWithExtension = this.extensionService.hasExtension();
    }

    this.modal.isLoadingExtension = false;
    this.modal.isLoading = false;

    dialog.appendChild(this.modal);
    document.body.appendChild(dialog);

    this.launcherPromise = new Promise<void>((ok, err) => {
      dialog.addEventListener('close', () => {
        // noop if already resolved?
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
        // modal.error = 'Please confirm in your key storage app.';
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
        //modal.error = 'Please confirm in your key storage app.';
        // create acc on service and get bunker url
        this.authNostrService
          .createAccount(name)
          // connect to bunker by url
          .then(({ bunkerUrl, sk }) => this.authNostrService.authNip46('signup', name, bunkerUrl, sk))
          .then(() => {
            if (this.modal) {
              this.modal.isFetchCreateAccount = false;
            }
            dialog.close();
            ok();
          })
          .catch((e: Error) => {
            console.log('error', e);
            if (this.modal) {
              this.modal.isFetchCreateAccount = false;
              this.modal.error = e.toString();
            }
          });
      };

      const checkNip05 = async (nip05: string) => {
        let available = false;
        let error = '';
        let pubkey = '';
        await (async () => {
          if (!nip05 || !nip05.includes('@')) return;

          const [name, domain] = nip05.toLocaleLowerCase().split('@');
          if (!name) return;

          const REGEXP = new RegExp(/^[\w-.]+@([\w-]+\.)+[\w-]{2,8}$/g);
          if (!REGEXP.test(nip05)) {
            error = 'Invalid name';
            return;
          }

          if (!domain) {
            error = 'Select service';
            return;
          }

          const url = `https://${domain}/.well-known/nostr.json?name=${name.toLowerCase()}`;
          try {
            const r = await fetch(url);
            const d = await r.json();
            if (d.names[name]) {
              pubkey = d.names[name];
              return;
            }
          } catch {}

          available = true;
        })();

        return {
          available,
          taken: pubkey != '',
          error,
          pubkey,
        };
      };

      if (this.modal) {
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

        this.modal.addEventListener('nlSwitchAccount', (event: any) => {
          const accounts: Info[] = localStorageGetItem(LOGGED_IN_ACCOUNTS) || [];

          const userInfo = accounts.find(el => el.pubkey === event.detail);

          this.emit('onSwitchAccount', userInfo);

          dialog.close();
        });

        this.modal.addEventListener('nlLoginRecentAccount', (event: any) => {
          const recents: RecentType[] = localStorageGetItem(RECENT_ACCOUNTS) || [];

          const userInfo = recents.find(el => el.pubkey === event.detail);

          if (userInfo && userInfo.nip05) {
            login(userInfo.nip05);
          }
        });

        this.modal.addEventListener('nlLoginReadOnly', async (event: any) => {
          console.log('nlLoginReadOnly', event.detail);
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
              console.log('test error', e);
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
      }

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
      if (startScreen) elementOpt.startScreen = startScreen;

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
}

export default ModalManager;
