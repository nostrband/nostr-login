import NDK, { NDKEvent, NDKFilter, NDKNostrRpc, NDKRpcRequest, NDKRpcResponse, NDKSigner, NDKSubscription, NostrEvent } from '@nostr-dev-kit/ndk';
import { Info } from 'nostr-login-components/dist/types/types';
import { validateEvent, verifySignature } from 'nostr-tools';
import { PrivateKeySigner } from './Signer';

class NostrRpc extends NDKNostrRpc {
  private pubkey: string;
  protected _ndk: NDK;
  protected _signer: PrivateKeySigner;
  protected requests: Set<string> = new Set();
  private sub?: NDKSubscription;
  protected _useNip44: boolean = false;

  public constructor(ndk: NDK, localPubkey: string, signer: PrivateKeySigner) {
    super(ndk, signer, ndk.debug.extend('nip46:signer:rpc'));
    this._ndk = ndk;
    this._signer = signer;
    this.pubkey = localPubkey;
  }

  public async subscribe(filter: NDKFilter): Promise<NDKSubscription> {
    this.sub = await super.subscribe(filter);
    return this.sub;
  }

  public stop() {
    if (this.sub) {
      this.sub.stop();
      this.sub = undefined;
    }
  }

  public setUseNip44(useNip44: boolean) {
    this._useNip44 = useNip44;
  }

  private isNip04(ciphertext: string) {
    const l = ciphertext.length;
    if (l < 28) return false;
    return ciphertext[l - 28] === '?' && ciphertext[l - 27] === 'i' && ciphertext[l - 26] === 'v' && ciphertext[l - 25] === '=';
  }

  // override to auto-decrypt nip04/nip44
  public async parseEvent(event: NDKEvent): Promise<NDKRpcRequest | NDKRpcResponse> {
    const remoteUser = this._ndk.getUser({ pubkey: event.pubkey });
    remoteUser.ndk = this._ndk;
    const decrypt = this.isNip04(event.content) ? this._signer.decrypt : this._signer.decryptNip44;
    console.log('client event nip04', this.isNip04(event.content));
    const decryptedContent = await decrypt.call(this._signer, remoteUser, event.content);
    const parsedContent = JSON.parse(decryptedContent);
    const { id, method, params, result, error } = parsedContent;

    if (method) {
      return { id, pubkey: event.pubkey, method, params, event };
    } else {
      return { id, result, error, event };
    }
  }

  // ndk doesn't support nostrconnect:
  // we just listed to an unsolicited reply to
  // our pubkey and if it's ack/secret - we're fine
  public async listen(nostrConnectSecret: string): Promise<string> {
    const pubkey = this.pubkey;
    console.log('nostr-login listening for conn to', pubkey);
    const sub = await this.subscribe({
      'kinds': [24133],
      '#p': [pubkey],
    });
    return new Promise((ok, err) => {
      sub.on('event', async (event: NDKEvent) => {
        try {
          const parsedEvent = await this.parseEvent(event);
          console.log('ack parsedEvent', parsedEvent);
          if (!(parsedEvent as NDKRpcRequest).method) {
            const response = parsedEvent as NDKRpcResponse;

            // ignore
            if (response.result === 'auth_url') return;

            // FIXME for now accept 'ack' replies, later on only
            // accept secrets
            if (response.result === 'ack' || response.result === nostrConnectSecret) {
              ok(event.pubkey);
            } else {
              err(response.error);
            }
          }
        } catch (e) {
          console.log('error parsing event', e, event.rawEvent());
        }
        // done
        this.stop();
      });
    });
  }

  // since ndk doesn't yet support perms param
  // we reimplement the 'connect' call here
  // instead of await signer.blockUntilReady();
  public async connect(info: Info, perms?: string) {
    return new Promise<void>((ok, err) => {
      const connectParams = [info.pubkey!, info.token || '', perms || ''];
      this.sendRequest(info.pubkey!, 'connect', connectParams, 24133, (response: NDKRpcResponse) => {
        if (response.result === 'ack') {
          ok();
        } else {
          err(response.error);
        }
      });
    });
  }

  protected getId(): string {
    return Math.random().toString(36).substring(7);
  }

  public async sendRequest(remotePubkey: string, method: string, params: string[] = [], kind = 24133, cb?: (res: NDKRpcResponse) => void): Promise<NDKRpcResponse> {
    const id = this.getId();

    // response handler will deduplicate auth urls and responses
    this.setResponseHandler(id, cb);

    // create and sign request
    const event = await this.createRequestEvent(id, remotePubkey, method, params, kind);

    // send to relays
    await event.publish();

    // NOTE: ndk returns a promise that never resolves and
    // in fact REQUIRES cb to be provided (otherwise no way
    // to consume the result), we've already stepped on the bug
    // of waiting for this unresolvable result, so now we return
    // undefined to make sure waiters fail, not hang.
    // @ts-ignore
    return undefined as NDKRpcResponse;
  }

  protected setResponseHandler(id: string, cb?: (res: NDKRpcResponse) => void) {
    let authUrlSent = false;
    return new Promise<NDKRpcResponse>(() => {
      const responseHandler = (response: NDKRpcResponse) => {
        if (response.result === 'auth_url') {
          if (!authUrlSent) {
            authUrlSent = true;
            this.once(`response-${id}`, responseHandler);
            this.emit('authUrl', response.error);
          }
        } else if (cb) {
          if (this.requests.has(id)) {
            this.requests.delete(id);
            cb(response);
          }
        }
      };

      this.once(`response-${id}`, responseHandler);
    });
  }

  protected async createRequestEvent(id: string, remotePubkey: string, method: string, params: string[] = [], kind = 24133) {
    this.requests.add(id);
    const localUser = await this._signer.user();
    const remoteUser = this._ndk.getUser({ pubkey: remotePubkey });
    const request = { id, method, params };

    const event = new NDKEvent(this._ndk, {
      kind,
      content: JSON.stringify(request),
      tags: [['p', remotePubkey]],
      pubkey: localUser.pubkey,
    } as NostrEvent);

    const useNip44 = this._useNip44 && method !== 'create_account';
    const encrypt = useNip44 ? this._signer.encryptNip44 : this._signer.encrypt;
    event.content = await encrypt.call(this._signer, remoteUser, event.content);
    await event.sign(this._signer);

    return event;
  }
}

export class IframeNostrRpc extends NostrRpc {
  private peerOrigin?: string;
  private iframe?: HTMLIFrameElement;
  private iframeRequests = new Map<string, { id: string; pubkey: string }>();

  public constructor(ndk: NDK, localPubkey: string, signer: PrivateKeySigner) {
    super(ndk, localPubkey, signer);
    this._ndk = ndk;
  }

  public setIframe(peerOrigin: string, iframe: HTMLIFrameElement) {
    this.peerOrigin = peerOrigin;
    this.iframe = iframe;

    window.addEventListener('message', async ev => {
      // ignore other origins just in case
      if (ev.origin !== this.peerOrigin) return;
      // ignore ready events from starter iframe
      if (ev.data === 'workerReady' || ev.data === 'starterDone' || ev.data === 'rebinderDone') return;

      console.log('iframe-nip46 got response from', this.peerOrigin, ev.data);
      if (typeof ev.data === 'string' && ev.data.startsWith('errorNoKey')) {
        const event_id = ev.data.split(':')[1];
        const { id = '', pubkey = '' } = this.iframeRequests.get(event_id) || {};
        if (id && pubkey && this.requests.has(id)) this.emit(`iframeRestart-${pubkey}`);
        return;
      }

      // a copy-paste from rpc.subscribe
      try {
        const event = ev.data;

        if (!validateEvent(event)) throw new Error('Invalid event from iframe');
        if (!verifySignature(event)) throw new Error('Invalid event signature from iframe');
        const nevent = new NDKEvent(this._ndk, event);
        const parsedEvent = await this.parseEvent(nevent);
        // we're only implementing client-side rpc
        if (!(parsedEvent as NDKRpcRequest).method) {
          this.emit(`response-${parsedEvent.id}`, parsedEvent);
        }
      } catch (e) {
        console.log('error parsing event', e, ev.data);
      }
    });
  }

  public async sendRequest(remotePubkey: string, method: string, params: string[] = [], kind = 24133, cb?: (res: NDKRpcResponse) => void): Promise<NDKRpcResponse> {
    const id = this.getId();

    // set response handler, it will dedup auth urls,
    // and also dedup response handlers - we're sending
    // to relays and to iframe
    this.setResponseHandler(id, cb);

    // create and sign request event
    const event = await this.createRequestEvent(id, remotePubkey, method, params, kind);

    if (this.iframe) {
      // map request event id to request id, if iframe
      // has no key it will reply with error:event_id (it can't
      // decrypt the request id without keys)
      this.iframeRequests.set(event.id, { id, pubkey: remotePubkey });

      // send to iframe
      console.log('iframe-nip46 sending request to', this.peerOrigin, event.rawEvent());
      this.iframe.contentWindow?.postMessage(event.rawEvent(), {
        targetOrigin: this.peerOrigin,
      });
    }

    // also send to relays
    await event.publish();

    // see notes in 'super'
    // @ts-ignore
    return undefined as NDKRpcResponse;
  }
}

export class ReadyListener {
  origin: string;
  message: string;
  promise: Promise<void>;

  constructor(message: string, origin: string) {
    this.origin = origin;
    this.message = message;
    this.promise = new Promise<void>(ok => {
      console.log(new Date(), 'started listener for', this.message);

      // ready message handler
      const onReady = async (e: MessageEvent) => {
        const originHostname = new URL(origin!).hostname;
        const messageHostname = new URL(e.origin).hostname;
        // same host or subdomain
        const validHost = messageHostname === originHostname || messageHostname.endsWith('.' + originHostname);
        if (!validHost || e.data !== this.message) {
          console.log(new Date(), 'got invalid ready message', e.origin, e.data);
          return;
        }

        console.log(new Date(), 'got ready message from', e.origin, this.message);
        window.removeEventListener('message', onReady);
        ok();
      };
      window.addEventListener('message', onReady);
    });
  }

  async wait() {
    console.log(new Date(), 'waiting for', this.message);
    await new Promise<void>((ok, err) => {
      // 10 sec should be more than enough
      setTimeout(() => err(new Date() + ' timeout for ' + this.message), 30000);

      // if promise already resolved or will resolve in the future
      this.promise.then(ok);
    });
    console.log(new Date(), 'finished waiting for', this.message);
  }
}
