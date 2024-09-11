import { localStorageAddAccount, bunkerUrlToInfo, isBunkerUrl, fetchProfile, getBunkerUrl, localStorageRemoveCurrentAccount, createProfile, getIcon } from '../utils';
import { ConnectionString, Info } from 'nostr-login-components/dist/types/types';
import { generatePrivateKey, getEventHash, getPublicKey, nip19 } from 'nostr-tools';
import { NostrLoginAuthOptions, Response } from '../types';
import NDK, { NDKEvent, NDKNip46Signer, NDKPrivateKeySigner, NDKRpcResponse, NDKUser, NDKRpcRequest } from '@nostr-dev-kit/ndk';
import { NostrParams } from './';
import { EventEmitter } from 'tseep';
import { Signer } from './Nostr';
import { Nip44 } from '../utils/nip44';

const OUTBOX_RELAYS = ['wss://user.kindpag.es', 'wss://purplepag.es', 'wss://relay.nos.social'];
const DEFAULT_NOSTRCONNECT_RELAY = 'wss://relay.nsec.app/';
const NOSTRCONNECT_APPS: ConnectionString[] = [
  {
    name: 'Nsec.app',
    domain: 'nsec.app',
    canImport: true,
    img: 'https://nsec.app/assets/favicon.ico',
    link: 'https://use.nsec.app/<nostrconnect>',
    relay: 'wss://relay.nsec.app/',
  },
  {
    name: 'Amber',
    img: 'https://raw.githubusercontent.com/greenart7c3/Amber/master/app/src/main/res/mipmap-hdpi/ic_launcher.webp',
    link: '<nostrconnect>',
    relay: 'wss://relay.nsec.app/',
  },
  {
    name: 'Other key stores',
    img: '',
    link: '<nostrconnect>',
    relay: 'wss://relay.nsec.app/',
  },
];

class AuthNostrService extends EventEmitter implements Signer {
  private ndk: NDK;
  private profileNdk: NDK;
  private signer: NDKNip46Signer | null = null;
  private localSigner: NDKPrivateKeySigner | null = null;
  private params: NostrParams;
  private signerPromise?: Promise<string | undefined>;
  private launcherPromise?: Promise<void>;
  private nip44Codec = new Nip44();
  private nostrConnectKey: string = '';
  private nostrConnectSecret: string = '';

  nip04: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
  };
  nip44: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
  };

  constructor(params: NostrParams) {
    super();
    this.params = params;
    this.ndk = new NDK({
      enableOutboxModel: false,
    });

    this.profileNdk = new NDK({
      enableOutboxModel: true,
      explicitRelayUrls: OUTBOX_RELAYS,
    });
    this.profileNdk.connect();

    this.nip04 = {
      encrypt: this.encrypt04.bind(this),
      decrypt: this.decrypt04.bind(this),
    };
    this.nip44 = {
      encrypt: this.encrypt44.bind(this),
      decrypt: this.decrypt44.bind(this),
    };
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

  public async nostrConnect(relay?: string, importConnect = false) {
    relay = relay || DEFAULT_NOSTRCONNECT_RELAY;

    const info: Info = {
      authMethod: 'connect',
      pubkey: '', // unknown yet!
      sk: this.nostrConnectKey,
      relays: [relay],
    };

    const remotePubkey = await this.initSigner(info, { listen: true });

    // signer learns the remote pubkey
    if (!remotePubkey) throw new Error('Bad remote pubkey');
    info.pubkey = remotePubkey;
    info.bunkerUrl = `bunker://${remotePubkey}?relay=${relay}`;

    // callback
    if (!importConnect) this.onAuth('login', info);

    return info;
  }

  public async getNostrConnectServices(): Promise<[string, ConnectionString[]]> {
    this.nostrConnectKey = generatePrivateKey();
    this.nostrConnectSecret = Math.random().toString(36).substring(7);

    const pubkey = getPublicKey(this.nostrConnectKey);
    const meta = {
      name: document.location.host,
      url: document.location.href,
      icon: await getIcon(),
      perms: this.params.optionsModal.perms,
    };
    const nostrconnect = `nostrconnect://${pubkey}?metadata=${encodeURIComponent(JSON.stringify(meta))}&secret=${this.nostrConnectSecret}`;

    // if we've got local keys then we're using this method
    // to import local keys to these services
    const nsec = this.localSigner ? '#import=' + nip19.nsecEncode(this.localSigner.privateKey!) : '';

    // copy defaults
    const apps = NOSTRCONNECT_APPS.map(a => ({ ...a }));
    for (const a of apps) {
      let relay = DEFAULT_NOSTRCONNECT_RELAY;
      if (a.link.startsWith('https://')) {
        const url = new URL(a.link);
        try {
          const info = await (await fetch(`${url.origin}/.well-known/nostr.json`)).json();
          const pubkey = info.names['_'];
          const relays = info.nip46[pubkey] as string[];
          if (relays && relays.length) relay = relays[0];
        } catch (e) {
          console.log('Bad app info', e, url);
        }
      }
      const nc = nostrconnect + '&relay=' + relay + nsec;
      a.link = a.link.replace('<nostrconnect>', nc);
    }

    return [nostrconnect + nsec, apps];
  }

  public async localSignup(name: string) {
    const sk = generatePrivateKey();
    const pubkey = getPublicKey(sk);
    const info: Info = {
      pubkey,
      sk,
      name,
      authMethod: 'local',
    };
    console.log(`localSignup name: ${name}`);
    await this.setLocal(info, true);
  }

  public async setLocal(info: Info, create?: boolean) {
    this.releaseSigner();
    this.localSigner = new NDKPrivateKeySigner(info.sk);

    if (create) await createProfile(info, this.profileNdk, this.localSigner, this.params.optionsModal.signupRelays);

    this.onAuth('login', info);
  }

  public async importAndConnect(relay: string) {
    const info = await this.nostrConnect(relay, true);

    // logout to remove local keys from storage
    // but keep the connect signer
    await this.logout(/*keepSigner*/ true);

    // release local one
    this.localSigner = null;

    // notify app that we've switched to 'connect' keys
    this.onAuth('login', info);
  }

  public setReadOnly(pubkey: string) {
    const info: Info = { pubkey, authMethod: 'readOnly' };
    this.onAuth('login', info);
  }

  public setExtension(pubkey: string) {
    const info: Info = { pubkey, authMethod: 'extension' };
    this.onAuth('login', info);
  }

  public setOTP(pubkey: string, data: string) {
    const info: Info = { pubkey, authMethod: 'otp', otpData: data };
    this.onAuth('login', info);
  }

  public async setConnect(info: Info) {
    this.releaseSigner();
    await this.initSigner(info);
    this.onAuth('login', info);
  }

  public async createAccount(nip05: string) {
    const [name, domain] = nip05.split('@');

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

  private releaseSigner() {
    this.signer = null;
    this.localSigner = null;

    // disconnect from signer relays
    for (const r of this.ndk.pool.relays.keys()) {
      this.ndk.pool.removeRelay(r);
    }
  }

  public async logout(keepSigner = false) {
    if (!keepSigner) this.releaseSigner();

    // move current to recent
    localStorageRemoveCurrentAccount();

    // notify everyone
    this.onAuth('logout');

    this.emit('updateAccounts');
  }

  private setUserInfo(userInfo: Info | null) {
    this.params.userInfo = userInfo;
    this.emit('onUserInfo', userInfo);

    if (userInfo) {
      localStorageAddAccount(userInfo);
      this.emit('updateAccounts');
    }
  }

  private onAuth(type: 'login' | 'signup' | 'logout', info: Info | null = null) {
    if (type !== 'logout' && !info) throw new Error('No user info in onAuth');

    // make sure we emulate logout first
    if (info && this.params.userInfo && (info.pubkey !== this.params.userInfo.pubkey || info.authMethod !== this.params.userInfo.authMethod)) {
      const event = new CustomEvent('nlAuth', { detail: { type: 'logout' } });
      console.log('nostr-login auth', event.detail);
      document.dispatchEvent(event);
    }

    this.setUserInfo(info);

    if (info) {
      // async profile fetch
      fetchProfile(info, this.profileNdk).then(p => {
        if (this.params.userInfo !== info) return;

        const userInfo = {
          ...this.params.userInfo,
          picture: p?.image || p?.picture,
          name: p?.name || p?.displayName || p?.nip05 || nip19.npubEncode(info.pubkey),
          // NOTE: do not overwrite info.nip05 with the one from profile!
          // info.nip05 refers to nip46 provider,
          // profile.nip05 is just a fancy name that user has chosen
          // nip05: p?.nip05
        };

        this.setUserInfo(userInfo);
      });
    }

    try {
      const npub = info ? nip19.npubEncode(info.pubkey) : '';

      const options: NostrLoginAuthOptions = {
        type,
      };

      if (type !== 'logout') {
        options.pubkey = info!.pubkey;

        if (info!.sk) {
          options.localNsec = nip19.nsecEncode(info!.sk);
        }

        if (info!.relays) {
          options.relays = info!.relays;
        }

        if (info!.otpData) {
          options.otpData = info!.otpData;
        }

        options.method = info!.authMethod || 'connect';
      }

      const event = new CustomEvent('nlAuth', { detail: options });
      console.log('nostr-login auth', options);
      document.dispatchEvent(event);

      if (this.params.optionsModal.onAuth) {
        this.params.optionsModal.onAuth(npub, options);
      }
    } catch (e) {
      console.log('onAuth error', e);
    }
  }

  public async initSigner(info: Info, { listen = false, connect = false, eventToAddAccount = false } = {}) {
    // mutex
    if (this.signerPromise) {
      try {
        await this.signerPromise;
      } catch {}
    }

    this.signerPromise = new Promise<string | undefined>(async (ok, err) => {
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
        if (!listen) {
          this.signer.on('authUrl', url => {
            console.log('nostr login auth url', url);
            this.emit('onAuthUrl', { url, eventToAddAccount });
          });
        }

        // nostrconnect: flow
        if (listen) {
          // ndk doesn't support nostrconnect:
          // we just listed to an unsolicited reply to
          // our pubkey and if it's ack - we're fine
          const pubkey = getPublicKey(info.sk!);
          console.log('nostr-login listening for conn to', pubkey);
          const sub = await this.signer.rpc.subscribe({
            'kinds': [24133],
            '#p': [pubkey],
          });
          sub.on('event', async (event: NDKEvent) => {
            // console.log("ack?", event);
            try {
              const parsedEvent = await this.signer!.rpc.parseEvent(event);
              // console.log("parsedEvent", parsedEvent);
              if (!(parsedEvent as NDKRpcRequest).method) {
                const response = parsedEvent as NDKRpcResponse;

                // ignore
                if (response.result === 'auth_url') return;

                // FIXME for now accept 'ack' replies, later on only
                // accept secrets
                if (response.result === 'ack' || response.result === this.nostrConnectSecret) {
                  // now ensure the remote pubkey
                  this.signer!.remotePubkey = event.pubkey;
                  this.signer!.remoteUser = new NDKUser({ pubkey: event.pubkey });
                  info.pubkey = event.pubkey;

                  ok(event.pubkey);
                } else {
                  err(response.error);
                }
              }
            } catch (e) {
              console.log('error parsing event', e, event.rawEvent());
            }
            // done
            sub.stop();
          });
        } else {
          // bunker-url based flow

          // if we're doing it for the first time then
          // we should send 'connect' NIP46 request
          if (connect) {
            // since ndk doesn't yet support perms param
            // we reimplement the 'connect' call here
            // await signer.blockUntilReady();

            await new Promise<void>((ok, err) => {
              if (this.signer && info.sk) {
                const connectParams = [info.pubkey!, info.token || '', this.params.optionsModal.perms || ''];
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

          // resolve after we've connected, if required
          ok(undefined);
        }
      } catch (e) {
        console.log('initSigner failure', e);
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
      if (isBunkerUrl(name)) info.bunkerUrl = name;
      else info.nip05 = name;

      // console.log('nostr login auth info', info);
      if (!info.pubkey || !info.sk || !info.relays?.[0]) {
        throw new Error(`Bad bunker url ${bunkerUrl}`);
      }

      const eventToAddAccount = Boolean(this.params.userInfo);

      await this.initSigner(info, { connect: true, eventToAddAccount });

      // callback
      this.onAuth(type, info);
    } catch (e) {
      console.log('nostr login auth failed', e);
      // make ure it's closed
      // this.popupManager.closePopup();
      throw e;
    }
  }

  public async signEvent(event: any) {
    if (this.localSigner) {
      event.pubkey = getPublicKey(this.localSigner.privateKey!);
      event.id = getEventHash(event);
      event.sig = await this.localSigner.sign(event);
    } else {
      event.pubkey = this.signer?.remotePubkey;
      event.id = getEventHash(event);
      event.sig = await this.signer?.sign(event);
    }
    console.log('signed', { event });
    return event;
  }

  private async codec_call(method: string, pubkey: string, param: string) {
    return new Promise<string>((resolve, reject) => {
      this.signer!.rpc.sendRequest(this.signer!.remotePubkey!, method, [pubkey, param], 24133, (response: NDKRpcResponse) => {
        if (!response.error) {
          resolve(response.result);
        } else {
          reject(response.error);
        }
      });
    });
  }

  public async encrypt04(pubkey: string, plaintext: string) {
    if (this.localSigner) {
      return this.localSigner.encrypt(new NDKUser({ pubkey }), plaintext);
    } else {
      return this.signer!.encrypt(new NDKUser({ pubkey }), plaintext);
    }
  }

  public async decrypt04(pubkey: string, ciphertext: string) {
    if (this.localSigner) {
      return this.localSigner.decrypt(new NDKUser({ pubkey }), ciphertext);
    } else {
      // decrypt is broken in ndk v2.3.1, and latest
      // ndk v2.8.1 doesn't allow to override connect easily,
      // so we reimplement and fix decrypt here as a temporary fix

      return this.codec_call('nip04_decrypt', pubkey, ciphertext);
    }
  }

  public async encrypt44(pubkey: string, plaintext: string) {
    if (this.localSigner) {
      return this.nip44Codec.encrypt(this.localSigner.privateKey!, pubkey, plaintext);
    } else {
      // no support of nip44 in ndk yet
      return this.codec_call('nip44_encrypt', pubkey, plaintext);
    }
  }

  public async decrypt44(pubkey: string, ciphertext: string) {
    if (this.localSigner) {
      return this.nip44Codec.decrypt(this.localSigner.privateKey!, pubkey, ciphertext);
    } else {
      // no support of nip44 in ndk yet
      return this.codec_call('nip44_decrypt', pubkey, ciphertext);
    }
  }
}

export default AuthNostrService;
