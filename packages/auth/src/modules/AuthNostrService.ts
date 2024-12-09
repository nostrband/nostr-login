import { localStorageAddAccount, bunkerUrlToInfo, isBunkerUrl, fetchProfile, getBunkerUrl, localStorageRemoveCurrentAccount, createProfile, getIcon } from '../utils';
import { ConnectionString, Info } from 'nostr-login-components/dist/types/types';
import { generatePrivateKey, getEventHash, getPublicKey, nip19 } from 'nostr-tools';
import { NostrLoginAuthOptions, Response } from '../types';
import NDK, { NDKEvent, NDKNip46Signer, NDKRpcResponse, NDKUser, NostrEvent } from '@nostr-dev-kit/ndk';
import { NostrParams } from './';
import { EventEmitter } from 'tseep';
import { Signer } from './Nostr';
import { Nip44 } from '../utils/nip44';
import { IframeNostrRpc, ReadyListener } from './Nip46';
import { PrivateKeySigner } from './Signer';

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
    img: 'https://raw.githubusercontent.com/greenart7c3/Amber/refs/heads/master/assets/android-icon.svg',
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
  private localSigner: PrivateKeySigner | null = null;
  private params: NostrParams;
  private signerPromise?: Promise<string | undefined>;
  // private launcherPromise?: Promise<void>;
  private readyPromise?: Promise<void>;
  private readyCallback?: () => void;
  private nip44Codec = new Nip44();
  private nostrConnectKey: string = '';
  private nostrConnectSecret: string = '';
  private iframe?: HTMLIFrameElement;
  private starterReady?: ReadyListener;

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

  public isIframe() {
    return !!this.iframe;
  }

  public async waitReady() {
    if (this.signerPromise) {
      try {
        await this.signerPromise;
      } catch {}
    }

    // if (this.launcherPromise) {
    //   try {
    //     await this.launcherPromise;
    //   } catch {}
    // }

    if (this.readyPromise) {
      try {
        await this.readyPromise;
      } catch {}
    }
  }

  public async nostrConnect(
    relay?: string,
    {
      domain = '',
      link = '',
      iframeUrl = '',
      importConnect = false,
    }: {
      domain?: string;
      link?: string;
      importConnect?: boolean;
      iframeUrl?: string;
    } = {},
  ) {
    relay = relay || DEFAULT_NOSTRCONNECT_RELAY;

    const info: Info = {
      authMethod: 'connect',
      pubkey: '', // unknown yet!
      sk: this.nostrConnectKey,
      domain: domain,
      relays: [relay],
      iframeUrl,
    };

    console.log('nostrconnect info', info, link);

    // non-iframe flow
    if (link && !iframeUrl) window.open(link, '_blank', 'width=400,height=700');

    // init nip46 signer
    const remotePubkey = await this.initSigner(info, { listen: true });

    // signer learns the remote pubkey
    if (!remotePubkey) throw new Error('Bad remote pubkey');
    info.pubkey = remotePubkey;
    info.bunkerUrl = `bunker://${remotePubkey}?relay=${relay}`;

    // callback
    if (!importConnect) this.onAuth('login', info);

    return info;
  }

  public async createNostrConnect(relay?: string) {
    this.nostrConnectKey = generatePrivateKey();
    this.nostrConnectSecret = Math.random().toString(36).substring(7);

    const pubkey = getPublicKey(this.nostrConnectKey);
    const meta = {
      name: encodeURIComponent(document.location.host),
      url: encodeURIComponent(document.location.href),
      icon: encodeURIComponent(await getIcon()),
      perms: encodeURIComponent(this.params.optionsModal.perms || ''),
    };

    return `nostrconnect://${pubkey}?image=${meta.icon}&url=${meta.url}&name=${meta.name}&perms=${meta.perms}&secret=${this.nostrConnectSecret}${relay ? `&relay=${relay}` : ''}`;
  }

  public async getNostrConnectServices(): Promise<[string, ConnectionString[]]> {
    const nostrconnect = await this.createNostrConnect();

    // copy defaults
    const apps = NOSTRCONNECT_APPS.map(a => ({ ...a }));
    // if (this.params.optionsModal.dev) {
    //   apps.push({
    //     name: 'Dev.Nsec.app',
    //     domain: 'new.nsec.app',
    //     canImport: true,
    //     img: 'https://new.nsec.app/assets/favicon.ico',
    //     link: 'https://dev.nsec.app/<nostrconnect>',
    //     relay: 'wss://relay.nsec.app/',
    //   });
    // }

    for (const a of apps) {
      let relay = DEFAULT_NOSTRCONNECT_RELAY;
      if (a.link.startsWith('https://')) {
        let domain = a.domain || new URL(a.link).hostname;
        try {
          const info = await (await fetch(`https://${domain}/.well-known/nostr.json`)).json();
          const pubkey = info.names['_'];
          const relays = info.nip46[pubkey] as string[];
          if (relays && relays.length) relay = relays[0];
          a.iframeUrl = info.nip46.iframe_url || '';
        } catch (e) {
          console.log('Bad app info', e, a);
        }
      }
      const nc = nostrconnect + '&relay=' + relay;
      if (a.iframeUrl) {
        // pass plain nc url for iframe-based flow
        a.link = nc;
      } else {
        // we will open popup ourselves
        a.link = a.link.replace('<nostrconnect>', nc);
      }
    }

    return [nostrconnect, apps];
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
    this.localSigner = new PrivateKeySigner(info.sk);

    if (create) await createProfile(info, this.profileNdk, this.localSigner, this.params.optionsModal.signupRelays, this.params.optionsModal.outboxRelays);

    this.onAuth('login', info);
  }

  public prepareImportUrl(url: string) {
    // for OTP we choose interactive import
    if (this.params.userInfo?.authMethod === 'otp') return url + '&import=true';

    // for local we export our existing key
    if (!this.localSigner || this.params.userInfo?.authMethod !== 'local') throw new Error('Most be local keys');
    return url + '#import=' + nip19.nsecEncode(this.localSigner.privateKey!);
  }

  public async importAndConnect(cs: ConnectionString) {
    const { relay, domain, link, iframeUrl } = cs;
    if (!domain) throw new Error('Domain required');

    const info = await this.nostrConnect(relay, { domain, link, importConnect: true, iframeUrl });

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
    await this.startAuth();
    await this.initSigner(info);
    this.onAuth('login', info);
    await this.endAuth();
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
      // relays: info.relays,
      // iframe-session after createAccount will
      // only make sense when createAccount itself is migrated to nostrconnect
      // iframeUrl: await this.getIframeUrl(domain),
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

  public exportKeys() {
    if (!this.params.userInfo) return '';
    if (this.params.userInfo.authMethod !== 'local') return '';
    return nip19.nsecEncode(this.params.userInfo.sk!);
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

      if (type === 'logout') {
        // reset
        if (this.iframe) this.iframe.remove();
        this.iframe = undefined;
      } else {
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

  private async createIframe(iframeUrl?: string) {
    if (!iframeUrl) return undefined;

    // ensure iframe
    const url = new URL(iframeUrl);
    const domain = url.hostname;
    let iframe: HTMLIFrameElement | undefined;

    // one iframe per domain
    const did = domain.replaceAll('.', '-');
    const id = '__nostr-login-worker-iframe-' + did;
    iframe = document.querySelector(`#${id}`) as HTMLIFrameElement;
    console.log('iframe', id, iframe);
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.setAttribute('width', '0');
      iframe.setAttribute('height', '0');
      iframe.setAttribute('border', '0');
      iframe.style.display = 'none';
      // iframe.setAttribute('sandbox', 'allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts');
      iframe.id = id;
      document.body.append(iframe);
    }

    // wait until loaded
    iframe.setAttribute('src', iframeUrl);

    // we start listening right now to avoid races
    // with 'load' event below
    const ready = new ReadyListener(['workerReady', 'workerError'], url.origin);

    await new Promise(ok => {
      iframe!.addEventListener('load', ok);
    });

    // now make sure the iframe is ready,
    // timeout timer starts here
    const r = await ready.wait();

    // FIXME wait until the iframe is ready to accept requests,
    // maybe it should send us some message?

    console.log('nostr-login iframe ready', iframeUrl, r);

    return { iframe, port: r[1] as MessagePort };
  }

  // private async getIframeUrl(domain?: string) {
  //   if (!domain) return '';
  //   try {
  //     const r = await fetch(`https://${domain}/.well-known/nostr.json`);
  //     const data = await r.json();
  //     return data.nip46?.iframe_url || '';
  //   } catch (e) {
  //     console.log('failed to fetch iframe url', e, domain);
  //     return '';
  //   }
  // }

  public async startAuth() {
    if (this.readyCallback) throw new Error('Already started');

    // start the new promise
    this.readyPromise = new Promise<void>(ok => (this.readyCallback = ok));
  }

  public async endAuth() {
    console.log('endAuth', this.params.userInfo);
    if (this.params.userInfo && this.params.userInfo.iframeUrl) {
      // create iframe
      const { iframe, port } = (await this.createIframe(this.params.userInfo.iframeUrl)) || {};
      this.iframe = iframe;
      if (!this.iframe || !port) return;

      // assign iframe to RPC object
      (this.signer!.rpc as IframeNostrRpc).setWorkerIframePort(port);
    }

    this.readyCallback!();
    this.readyCallback = undefined;
  }

  public resetAuth() {
    if (this.readyCallback) this.readyCallback();
    this.readyCallback = undefined;
  }

  private async listen(info: Info, rpc: IframeNostrRpc) {
    console.log('listen', info, rpc);
    if (!info.iframeUrl) return rpc.listen(this.nostrConnectSecret);
    const r = await this.starterReady!.wait();
    if (r[0] === 'starterError') throw new Error(r[1]);
    return (this.signer!.rpc as IframeNostrRpc).parseNostrConnectReply(r[1], this.nostrConnectSecret);
  }

  public async initSigner(info: Info, { listen = false, connect = false, eventToAddAccount = false } = {}) {
    // mutex
    if (this.signerPromise) {
      try {
        await this.signerPromise;
      } catch {}
    }

    // we remove support for iframe from nip05 and bunker-url methods,
    // only nostrconnect flow will use it.
    // info.iframeUrl = info.iframeUrl || (await this.getIframeUrl(info.domain));
    console.log('initSigner info', info);

    // start listening for the ready signal
    const iframeOrigin = info.iframeUrl ? new URL(info.iframeUrl!).origin : undefined;
    if (iframeOrigin) this.starterReady = new ReadyListener(['starterDone', 'starterError'], iframeOrigin);

    // notify modals so they could show the starter iframe,
    // FIXME shouldn't this come from nostrconnect service list?
    this.emit('onIframeUrl', info.iframeUrl);

    this.signerPromise = new Promise<string | undefined>(async (ok, err) => {
      try {
        // pre-connect if we're creating the connection (listen|connect) or
        // not iframe mode
        if (info.relays && !info.iframeUrl) {
          for (const r of info.relays) {
            this.ndk.addExplicitRelay(r, undefined);
          }
        }

        // wait until we connect, otherwise
        // signer won't start properly
        await this.ndk.connect();

        // create and prepare the signer
        const localPubkey = getPublicKey(info.sk!);
        const localSigner = new PrivateKeySigner(info.sk);
        this.signer = new NDKNip46Signer(this.ndk, info.pubkey, localSigner);

        // override with our own rpc implementation
        const rpc = new IframeNostrRpc(this.ndk, localPubkey, localSigner, iframeOrigin);
        rpc.setUseNip44(true); // !!this.params.optionsModal.dev);
        this.signer.rpc = rpc;

        // we should notify the banner the same way as
        // the onAuthUrl does
        rpc.on(`iframeRestart-${info.pubkey}`, async () => {
          const iframeUrl = info.iframeUrl + (info.iframeUrl!.includes('?') ? '&' : '?') + 'pubkey=' + info.pubkey + '&rebind=' + localPubkey;
          this.emit('iframeRestart', { pubkey: info.pubkey, iframeUrl });
        });

        // OAuth flow
        if (!listen) {
          rpc.on('authUrl', (url: string) => {
            console.log('nostr login auth url', url);

            // notify our UI
            this.emit('onAuthUrl', { url, iframeUrl: info.iframeUrl, eventToAddAccount });
          });
        }

        // nostrconnect: flow
        if (listen) {
          // wait for the incoming message from signer with their pubkey
          const remotePubkey = await this.listen(info, rpc);
          this.signer!.remotePubkey = remotePubkey;
          this.signer!.remoteUser = new NDKUser({ pubkey: remotePubkey });
          info.pubkey = remotePubkey;
          ok(remotePubkey);
        } else {
          // bunker-url based flow

          // if we're doing it for the first time then
          // we should send 'connect' NIP46 request
          if (connect) await rpc.connect(info, this.params.optionsModal.perms);

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

  public async authNip46(
    type: 'login' | 'signup',
    { name, bunkerUrl, sk = '', domain = '', iframeUrl = '' }: { name: string; bunkerUrl: string; sk?: string; domain?: string; iframeUrl?: string },
  ) {
    try {
      const info = bunkerUrlToInfo(bunkerUrl, sk);
      if (isBunkerUrl(name)) info.bunkerUrl = name;
      else {
        info.nip05 = name;
        info.domain = name.split('@')[1];
      }
      if (domain) info.domain = domain;
      if (iframeUrl) info.iframeUrl = iframeUrl;

      // console.log('nostr login auth info', info);
      if (!info.pubkey || !info.sk || !info.relays?.[0]) {
        throw new Error(`Bad bunker url ${bunkerUrl}`);
      }

      const eventToAddAccount = Boolean(this.params.userInfo);
      console.log('authNip46', type, info);

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
