import { NostrLoginOptions } from '../types';
import { getBunkerUrl } from '../utils';
import { NostrLoginInitializer } from '../index';
import { AuthNostrService, NostrExtensionService, Popup, NostrParams, Test, Nip46Service, AccountService } from './';

class Modal {
  private params: NostrParams;
  private popupManager: Popup;
  private extensionManager: NostrExtensionService;
  private nip46Service: Nip46Service;
  private accountService: AccountService;

  constructor(params: NostrParams, nip46Service: Nip46Service, extensionManager: NostrExtensionService, popupManager: Popup, accountService: AccountService) {
    this.params = params;
    this.popupManager = popupManager;
    this.extensionManager = extensionManager;
    this.nip46Service = nip46Service;
    this.accountService = accountService;
  }

  public async launch(opt: NostrLoginOptions) {
    // mutex
    if (this.params.launcherPromise) {
      try {
        await this.params.launcherPromise;
      } catch {}
    }

    const dialog = document.createElement('dialog');
    this.params.modal = document.createElement('nl-auth');

    if (opt.theme) {
      this.params.modal.setAttribute('theme', opt.theme);
    }

    if (opt.startScreen) {
      this.params.modal.setAttribute('start-screen', opt.startScreen);
    }

    if (opt.bunkers) {
      this.params.modal.setAttribute('bunkers', opt.bunkers);
    }

    if (opt.isSignInWithExtension !== undefined) {
      this.params.modal.isSignInWithExtension = opt.isSignInWithExtension;
    } else {
      this.params.modal.isSignInWithExtension = !!this.params.nostrExtension;
    }

    this.params.modal.isLoadingExtension = false;
    this.params.modal.isLoading = false;

    dialog.appendChild(this.params.modal);
    document.body.appendChild(dialog);

    this.params.launcherPromise = new Promise<void>((ok, err) => {
      dialog.addEventListener('close', () => {
        // noop if already resolved?
        err(new Error('Closed'));

        if (this.params.modal) {
          // reset state
          this.params.modal.isLoading = false;
          this.params.modal.authUrl = '';
          this.params.modal.error = '';
          this.params.modal.isLoadingExtension = false;

          // drop it
          // @ts-ignore
          document.body.removeChild(this.params.modal.parentNode);
          this.params.modal = null;
        }
      });

      const login = (name: string) => {
        // modal.error = 'Please confirm in your key storage app.';
        if (this.params.modal) {
          this.params.modal.isLoading = true;
        }
        // convert name to bunker url
        getBunkerUrl(name, this.params.optionsModal)
          // connect to bunker by url
          .then(bunkerUrl => this.nip46Service.authNip46('login', name, bunkerUrl))
          .then(() => {
            if (this.params.modal) {
              this.params.modal.isLoading = false;
            }
            dialog.close();
            ok();
          })
          .catch((e: Error) => {
            console.log('error', e);
            if (this.params.modal) {
              this.params.modal.isLoading = false;
              this.params.modal.error = e.toString();
            }
          });
      };

      const signup = (name: string) => {
        //modal.error = 'Please confirm in your key storage app.';
        // create acc on service and get bunker url
        this.accountService
          .createAccount(name)
          // connect to bunker by url
          .then(({ bunkerUrl, sk }) => this.nip46Service.authNip46('signup', name, bunkerUrl, sk))
          .then(() => {
            if (this.params.modal) {
              this.params.modal.isFetchCreateAccount = false;
            }
            dialog.close();
            ok();
          })
          .catch((e: Error) => {
            console.log('error', e);
            if (this.params.modal) {
              this.params.modal.isFetchCreateAccount = false;
              this.params.modal.error = e.toString();
            }
          });
      };

      const checkNip05 = async (nip05: string) => {
        let available = false;
        let taken = false;
        let error = '';
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
              taken = true;
              return;
            }
          } catch {}

          available = true;
        })();

        return [available, taken, error];
      };

      if (this.params.modal) {
        this.params.modal.addEventListener('handleContinue', () => {
          if (this.params.modal) {
            this.params.modal.isLoading = true;
            this.popupManager.ensurePopup(this.params.modal.authUrl);
          }
        });

        this.params.modal.addEventListener('stopFetchHandler', () => {
          if (this.params.modal) {
            this.params.modal.isLoading = false;
          }
          dialog.close();
          err(new Error('Cancelled'));
        });

        this.params.modal.addEventListener('nlLogin', (event: any) => {
          login(event.detail);
        });

        this.params.modal.addEventListener('nlSignup', (event: any) => {
          signup(event.detail);
        });

        this.params.modal.addEventListener('nlLoginExtension', async () => {
          console.log('nostr login extension', this.params.nostrExtension);
          if (!this.params.nostrExtension) {
            throw new Error('No extension');
          }

          if (this.params.modal) {
            try {
              this.params.modal.isLoadingExtension = true;

              await this.extensionManager.setExtension();

              this.params.modal.isLoadingExtension = false;

              dialog.close();

              ok();
            } catch (e) {
              console.log('test error', e);
              // @ts-ignore
              this.params.modal.error = e.toString();
            }
          }
        });

        this.params.modal.addEventListener('nlCheckSignup', async (event: any) => {
          const [available, taken, error] = await checkNip05(event.detail);
          if (this.params.modal) {
            this.params.modal.error = String(error);

            if (!error && taken) {
              this.params.modal.error = 'Already taken';
            }

            this.params.modal.signupNameIsAvailable = available;
          }
        });

        this.params.modal.addEventListener('nlCheckLogin', async (event: any) => {
          const [available, taken, error] = await checkNip05(event.detail);
          if (this.params.modal) {
            this.params.modal.error = String(error);
            if (available) {
              this.params.modal.error = 'Name not found';
            }
            this.params.modal.loginIsGood = taken;
          }
        });

        this.params.modal.addEventListener('nlCloseModal', () => {
          if (this.params.modal) {
            this.params.modal.isLoading = false;
          }

          dialog.close();

          err(new Error('Cancelled'));
        });
      }

      dialog.showModal();
    });

    return this.params.launcherPromise;
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
}

export default Modal;
