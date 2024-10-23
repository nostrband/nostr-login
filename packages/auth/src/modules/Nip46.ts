import NDK, { NDKEvent, NDKFilter, NDKNostrRpc, NDKRpcRequest, NDKRpcResponse, NDKSigner, NDKSubscription, NostrEvent } from '@nostr-dev-kit/ndk';
import { Info } from 'nostr-login-components/dist/types/types';
import { validateEvent, verifySignature } from 'nostr-tools';

class NostrRpc extends NDKNostrRpc {
  private pubkey: string;
  private sub?: NDKSubscription;

  public constructor(ndk: NDK, localPubkey: string, signer: NDKSigner) {
    super(ndk, signer, ndk.debug.extend('nip46:signer:rpc'));
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
}

export class ReadyListener {
  origin: string;
  message: string;
  promise: Promise<void>;

  constructor(message: string, origin: string) {
    this.origin = origin;
    this.message = message;
    this.promise = new Promise<void>(ok => {
      console.log(new Date(), "started listener for", this.message);

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
    console.log(new Date(), "waiting for", this.message);
    await new Promise<void>((ok, err) => {
      // 10 sec should be more than enough
      setTimeout(() => err(new Date() + ' timeout for '+this.message), 30000);

      // if promise already resolved or will resolve in the future
      this.promise.then(ok);
    });
    console.log(new Date(), "finished waiting for", this.message);
  }
}

export class IframeNostrRpc extends NostrRpc {
  private _ndk: NDK;
  private _signer: NDKSigner;
  private peerOrigin?: string;
  private iframe?: HTMLIFrameElement;

  public constructor(ndk: NDK, localPubkey: string, signer: NDKSigner) {
    super(ndk, localPubkey, signer);
    this._ndk = ndk;
    this._signer = signer;
  }

  public setIframe(peerOrigin: string, iframe: HTMLIFrameElement) {
    this.peerOrigin = peerOrigin;
    this.iframe = iframe;

    window.addEventListener('message', async ev => {
      // ignore other origins just in case
      if (ev.origin !== this.peerOrigin) return;
      // ignore ready events from starter iframe
      if (ev.data === 'workerReady' || ev.data === "starterDone") return;

      console.log('iframe-nip46 got response from', this.peerOrigin, ev.data);

      // a copy-paste from rpc.sendRequest
      try {
        const event = ev.data;

        if (!validateEvent(event)) throw new Error('Invalid event from iframe');
        if (!verifySignature(event)) throw new Error('Invalid event signature from iframe');
        const nevent = new NDKEvent(this._ndk, event);
        const parsedEvent = await this.parseEvent(nevent);
        if ((parsedEvent as NDKRpcRequest).method) {
          this.emit('request', parsedEvent);
        } else {
          this.emit(`response-${parsedEvent.id}`, parsedEvent);
        }
      } catch (e) {
        console.log('error parsing event', e, ev.data);
      }
    });
  }

  public async sendRequest(remotePubkey: string, method: string, params: string[] = [], kind = 24133, cb?: (res: NDKRpcResponse) => void): Promise<NDKRpcResponse> {
    // send nip46 request over relay
    const promises = [super.sendRequest(remotePubkey, method, params, kind, cb)];

    if (this.iframe) {
      // a copy of rpc.sendRequest
      const id = Math.random().toString(36).substring(7);
      const localUser = await this._signer.user();
      const remoteUser = this._ndk.getUser({ pubkey: remotePubkey });
      const request = { id, method, params };
      const promise = new Promise<NDKRpcResponse>(() => {
        const responseHandler = (response: NDKRpcResponse) => {
          if (response.result === 'auth_url') {
            this.once(`response-${id}`, responseHandler);
            this.emit('authUrl', response.error);
          } else if (cb) {
            cb(response);
          }
        };

        this.once(`response-${id}`, responseHandler);
      });

      const event = new NDKEvent(this._ndk, {
        kind,
        content: JSON.stringify(request),
        tags: [['p', remotePubkey]],
        pubkey: localUser.pubkey,
      } as NostrEvent);

      event.content = await this._signer.encrypt(remoteUser, event.content);
      await event.sign(this._signer);

      console.log('iframe-nip46 sending request to', this.peerOrigin, event.rawEvent());
      this.iframe.contentWindow?.postMessage(event.rawEvent(), {
        targetOrigin: this.peerOrigin,
      });

      promises.push(promise);
    }

    return Promise.any(promises);
  }
}
