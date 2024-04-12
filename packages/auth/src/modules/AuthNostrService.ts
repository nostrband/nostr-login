import { bunkerUrlToInfo, fetchProfile, getBunkerUrl, localStorageRemoveItem } from '../utils';
import { LOCAL_STORE_KEY } from '../const';
import { Info } from 'nostr-login-components/dist/types/types';
import { getPublicKey, nip19 } from 'nostr-tools';
import { NostrLoginAuthOptions, Response } from '../types';
import { NDKNip46Signer, NDKPrivateKeySigner, NDKRpcResponse } from '@nostr-dev-kit/ndk';
import { NostrParams, Popup } from './';

class AuthNostrService {
  private params: NostrParams;
  private popupManager: Popup;

  constructor(params: NostrParams, popupManager: Popup) {
    this.params = params;
    this.popupManager = popupManager;
  }

  public async createAccount(nip05: string) {
    const [name, domain] = nip05.split('@');
    // we're gonna need it
    // ensurePopup();

    // bunker's own url
    const bunkerUrl = await getBunkerUrl(`_@${domain}`, this.params.optionsModal);
    console.log("create account bunker's url", bunkerUrl);

    // parse bunker url and generate local nsec
    const info = bunkerUrlToInfo(bunkerUrl);

    // init signer to talk to the bunker (not the user!)
    await this.initSigner(info, { preparePopup: true, leavePopup: true });

    const params = [
      name,
      domain,
      '', // email
      this.params.optionsModal.perms || '',
    ];

    // due to a buggy sendRequest implementation it never resolves
    // the promise that it returns, so we have to provide a
    // callback and wait on it
    console.log('signer', this.params.signer);
    const r = await new Promise<Response>(ok => {
      this.params.signer!.rpc.sendRequest(info.pubkey, 'create_account', params, undefined, ok);
    });

    console.log('create_account pubkey', r);
    if (r.result === 'error') {
      throw new Error(r.error);
    }

    return {
      bunkerUrl: `bunker://${r.result}?relay=${info.relays?.[0]}`,
      sk: info.sk, // reuse the same local key
    };
  }

  public async logout() {
    this.params.signer = null;

    for (const r of this.params.ndk.pool.relays.keys()) {
      this.params.ndk.pool.removeRelay(r);
    }

    localStorageRemoveItem(LOCAL_STORE_KEY);

    // replace back
    if (window.nostr === this.params.nostrExtension) {
      // @ts-ignore
      window.nostr = this.nostr;
    }

    // clear localstore from user data
    this.onAuth('logout');
  }

  public onAuth(type: 'login' | 'signup' | 'logout', info: Info | null = null) {
    this.params.userInfo = info;

    if (this.params.banner) {
      this.params.banner.userInfo = this.params.userInfo;
      if (this.params.userInfo) {
        this.params.banner.titleBanner = this.params.userInfo.sk ? 'You are logged in' : 'You are using extension';
      } else {
        this.params.banner.titleBanner = '';
      } // 'Use with Nostr';
    }

    if (info) {
      // async profile fetch
      fetchProfile(info, this.params.profileNdk).then(p => {
        if (this.params.userInfo !== info) return;

        this.params.userInfo = {
          ...this.params.userInfo,
          picture: p?.image || p?.picture,
        };

        if (this.params.banner) {
          this.params.banner.userInfo = this.params.userInfo;
        }
      });
    }

    try {
      const npub = info ? nip19.npubEncode(info.pubkey) : '';

      const options: NostrLoginAuthOptions = {
        type,
      };

      if (type !== 'logout') {
        if (info && info.sk) {
          options.localNsec = nip19.nsecEncode(info.sk);
        }

        if (info && info.relays) {
          options.relays = info.relays;
        }
      }

      const event = new CustomEvent('nlAuth', { detail: options });
      document.dispatchEvent(event);

      if (this.params.optionsModal.onAuth) {
        this.params.optionsModal.onAuth(npub, options);
      }
    } catch (e) {
      console.log('onAuth error', e);
    }
  }

  public async initSigner(info: Info, { connect = false, preparePopup = false, leavePopup = false } = {}) {
    // mutex
    if (this.params.signerPromise) {
      try {
        await this.params.signerPromise;
      } catch {}
    }

    this.params.signerPromise = new Promise<void>(async (ok, err) => {
      try {
        if (info.relays) {
          for (const r of info.relays) {
            this.params.ndk.addExplicitRelay(r, undefined);
          }
        }

        // wait until we connect, otherwise
        // signer won't start properly
        await this.params.ndk.connect();

        // console.log('creating signer', { info, connect });
        // create and prepare the signer
        this.params.signer = new NDKNip46Signer(this.params.ndk, info.pubkey, new NDKPrivateKeySigner(info.sk));
        // OAuth flow
        this.params.signer.on('authUrl', url => {
          console.log('nostr login auth url', url);

          if (Boolean(this.params.callTimer)) {
            clearTimeout(this.params.callTimer);
          }

          if (this.params.userInfo) {
            // show the 'Please confirm' banner
            if (this.params.banner) {
              // banner.isLoading = false;
              this.params.banner.notify = {
                confirm: Date.now(),
                url,
              };
            }
          } else {
            // if it fails we will either return 'failed'
            // to the window.nostr caller, or show proper error
            // in our modal
            if (this.params.modal) {
              this.params.modal.authUrl = url;
              this.params.modal.isLoading = false;
            }
          }
        });

        // pre-launch a popup if it won't be blocked,
        // only when we're expecting it
        // if (connect || preparePopup) if (navigator.userActivation.isActive) ensurePopup(); ?????????????????

        // if we're doing it for the first time then
        // we should send 'connect' NIP46 request
        if (connect) {
          // since ndk doesn't yet support perms param
          // we reimplement the 'connect' call here
          // await signer.blockUntilReady();

          await new Promise<void>((ok, err) => {
            if (this.params.signer && info.sk) {
              const connectParams = [getPublicKey(info.sk), '', this.params.optionsModal.perms || ''];

              this.params.signer.rpc.sendRequest(info.pubkey!, 'connect', connectParams, 24133, (response: NDKRpcResponse) => {
                if (response.result === 'ack') {
                  ok();
                } else {
                  err(response.error);
                }
              });
            }
          });
        }

        // console.log('created signer');

        // make sure it's closed
        if (!leavePopup) {
          this.popupManager.closePopup();
        }

        ok();
      } catch (e) {
        // make sure signer isn't set
        this.params.signer = null;
        err(e);
      }
    });

    return this.params.signerPromise;
  }
}

export default AuthNostrService;
