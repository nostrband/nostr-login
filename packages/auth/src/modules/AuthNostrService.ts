import { bunkerUrlToInfo, fetchProfile, getBunkerUrl, localStorageGetItem, localStorageRemoveItem, localStorageSetItem } from '../utils';
import { LOCAL_STORE_KEY, LOGGED_IN_ACCOUNTS, RECENT_ACCOUNTS } from '../const';
import { Info } from 'nostr-login-components/dist/types/types';
import { getEventHash, getPublicKey, nip19 } from 'nostr-tools';
import { NostrLoginAuthOptions, RecentType, Response } from '../types';
import NDK, { NDKNip46Signer, NDKPrivateKeySigner, NDKRpcResponse, NDKUser } from '@nostr-dev-kit/ndk';
import { NostrParams } from './';
import { EventEmitter } from 'tseep';

class AuthNostrService extends EventEmitter {
  private ndk: NDK;
  public profileNdk: NDK;
  private signer: NDKNip46Signer | null = null;
  private params: NostrParams;
  public signerPromise?: Promise<void>;
  public launcherPromise?: Promise<void>;

  constructor(params: NostrParams) {
    super();
    this.params = params;
    this.ndk = new NDK({
      enableOutboxModel: false,
    });

    this.profileNdk = new NDK({
      enableOutboxModel: true,
      explicitRelayUrls: ['wss://relay.nostr.band/all', 'wss://purplepag.es'],
    });
    this.profileNdk.connect();
  }

  public hasSigner() {
    return !!this.signer;
  }

  public async waitReady() {
    if (this.signerPromise) {
      try {
        await this.signerPromise;
      } catch {}
    }

    if (this.launcherPromise) {
      try {
        await this.launcherPromise;
      } catch {}
    }
  }

  public setReadOnly(pubkey: string) {
    const info = { pubkey };
    localStorageSetItem(LOCAL_STORE_KEY, JSON.stringify(info));
    this.onAuth('login', info);
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
    const eventToAddAccount = Boolean(this.params.userInfo);

    // init signer to talk to the bunker (not the user!)
    await this.initSigner(info, { eventToAddAccount });

    const params = [
      name,
      domain,
      '', // email
      this.params.optionsModal.perms || '',
    ];

    // due to a buggy sendRequest implementation it never resolves
    // the promise that it returns, so we have to provide a
    // callback and wait on it
    console.log('signer', this.signer);
    const r = await new Promise<Response>(ok => {
      this.signer!.rpc.sendRequest(info.pubkey, 'create_account', params, undefined, ok);
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
    this.signer = null;

    for (const r of this.ndk.pool.relays.keys()) {
      this.ndk.pool.removeRelay(r);
    }

    const user: Info = localStorageGetItem(LOCAL_STORE_KEY);
    const recentUser = { nip05: user.nip05, picture: user.picture ? user.picture : '', pubkey: user.pubkey };

    const loggedInAccounts: Info[] = localStorageGetItem(LOGGED_IN_ACCOUNTS) || [];
    const recentsAccounts: RecentType[] = localStorageGetItem(RECENT_ACCOUNTS) || [];
    let recents: RecentType[] = [];

    if (Boolean(recentsAccounts.length)) {
      const index = recentsAccounts.findIndex((el: RecentType) => el.pubkey === recentUser.pubkey);

      if (index !== -1) {
        recents = [...recentsAccounts];
        recents[index] = recentUser;
      } else {
        recents = [...recentsAccounts, recentUser];
      }
    } else {
      recents = [recentUser];
    }

    localStorageSetItem(RECENT_ACCOUNTS, JSON.stringify(recents));

    localStorageSetItem(LOGGED_IN_ACCOUNTS, JSON.stringify(loggedInAccounts.filter(el => el.pubkey !== user.pubkey)));
    localStorageRemoveItem(LOCAL_STORE_KEY);

    // clear localstore from user data
    this.onAuth('logout');
  }

  public onAuth(type: 'login' | 'signup' | 'logout', info: Info | null = null) {
    if (info?.pubkey !== this.params.userInfo?.pubkey) {
      const event = new CustomEvent('nlAuth', { detail: { type: 'logout' } });
      document.dispatchEvent(event);
    }

    this.params.userInfo = info;

    this.emit('onUserInfo', info);

    if (info) {
      // async profile fetch
      fetchProfile(info, this.profileNdk).then(p => {
        if (this.params.userInfo !== info) return;

        this.params.userInfo = {
          ...this.params.userInfo,
          picture: p?.image || p?.picture,
        };

        this.emit('onUserInfo', info);
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

  public async initSigner(info: Info, { connect = false, eventToAddAccount = false } = {}) {
    // mutex
    if (this.signerPromise) {
      try {
        await this.signerPromise;
      } catch {}
    }

    this.signerPromise = new Promise<void>(async (ok, err) => {
      try {
        if (info.relays) {
          for (const r of info.relays) {
            this.ndk.addExplicitRelay(r, undefined);
          }
        }

        // wait until we connect, otherwise
        // signer won't start properly
        await this.ndk.connect();

        // console.log('creating signer', { info, connect });
        // create and prepare the signer
        this.signer = new NDKNip46Signer(this.ndk, info.pubkey, new NDKPrivateKeySigner(info.sk));

        // OAuth flow
        this.signer.on('authUrl', url => {
          console.log('nostr login auth url', url);
          this.emit('onAuthUrl', { url, eventToAddAccount });
        });

        // if we're doing it for the first time then
        // we should send 'connect' NIP46 request
        if (connect) {
          // since ndk doesn't yet support perms param
          // we reimplement the 'connect' call here
          // await signer.blockUntilReady();

          await new Promise<void>((ok, err) => {
            if (this.signer && info.sk) {
              const connectParams = [getPublicKey(info.sk), '', this.params.optionsModal.perms || ''];

              this.signer.rpc.sendRequest(info.pubkey!, 'connect', connectParams, 24133, (response: NDKRpcResponse) => {
                if (response.result === 'ack') {
                  ok();
                } else {
                  err(response.error);
                }
              });
            }
          });
        }

        ok();
      } catch (e) {
        // make sure signer isn't set
        this.signer = null;
        err(e);
      }
    });

    return this.signerPromise;
  }

  public async authNip46(type: 'login' | 'signup', name: string, bunkerUrl: string, sk = '') {
    try {
      const info = bunkerUrlToInfo(bunkerUrl, sk);
      info.nip05 = name;

      // console.log('nostr login auth info', info);
      if (!info.pubkey || !info.sk || !info.relays?.[0]) {
        throw new Error(`Bad bunker url ${bunkerUrl}`);
      }

      const eventToAddAccount = Boolean(this.params.userInfo);

      const r = await this.initSigner(info, { connect: true, eventToAddAccount });

      // only save after successfull login
      localStorageSetItem(LOCAL_STORE_KEY, JSON.stringify(info));

      const loggedInAccounts: Info[] = localStorageGetItem(LOGGED_IN_ACCOUNTS) || [];
      const recentAccounts: RecentType[] = localStorageGetItem(RECENT_ACCOUNTS) || [];
      let accounts: Info[] = [];

      if (Boolean(loggedInAccounts.length)) {
        const index = loggedInAccounts.findIndex((el: Info) => el.pubkey === info.pubkey);

        if (index !== -1) {
          accounts = [...loggedInAccounts];
          accounts[index] = info;
        } else {
          accounts = [...loggedInAccounts, info];
        }
      } else {
        accounts = [info];
      }

      localStorageSetItem(RECENT_ACCOUNTS, JSON.stringify(recentAccounts.filter(el => el.pubkey !== info.pubkey)));
      localStorageSetItem(LOGGED_IN_ACCOUNTS, JSON.stringify(accounts));
      this.emit('onSetAccounts', accounts);

      // callback
      this.onAuth(type, info);

      // result
      return r;
    } catch (e) {
      console.log('nostr login auth failed', e);
      // make ure it's closed
      // this.popupManager.closePopup();
      throw e;
    }
  }

  public async signEvent(event: any) {
    event.pubkey = this.signer?.remotePubkey;
    event.id = getEventHash(event);
    event.sig = await this.signer?.sign(event);
    console.log('signed', { event });
    return event;
  }

  public async encrypt(pubkey: string, plaintext: string) {
    return this.signer?.encrypt(new NDKUser({ pubkey }), plaintext);
  }

  public async decrypt(pubkey: string, ciphertext: string) {
    return this.signer?.decrypt(new NDKUser({ pubkey }), ciphertext);
  }
}

export default AuthNostrService;
