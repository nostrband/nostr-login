import { getEventHash } from 'nostr-tools';
import { NostrParams, ProcessManager, Test } from './';

class Nostr {
  #test: Test;
  #params: NostrParams;
  #processManager: ProcessManager;
  private nip04: {
    encrypt: (pubkey: string, plaintext: string) => Promise<any>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<any>;
  };

  constructor(params: NostrParams, test: Test, processManager: ProcessManager) {
    this.#params = params;
    this.#test = test;
    this.#processManager = processManager;

    this.getPublicKey = this.getPublicKey.bind(this);
    this.signEvent = this.signEvent.bind(this);
    this.getRelays = this.getRelays.bind(this);
    this.nip04 = {
      encrypt: this.encrypt.bind(this),
      decrypt: this.decrypt.bind(this),
    };
  }

  async getPublicKey() {
    await this.#test.ensureAuth();
    if (this.#params.userInfo) {
      return this.#params.userInfo.pubkey;
    } else {
      throw new Error('No user');
    }
  }

  // @ts-ignore
  async signEvent(event) {
    await this.#test.ensureAuth();

    if (!this.#params.userInfo?.extension && !this.#params.signer) {
      throw new Error('Read only');
    }

    return this.#processManager.wait(async () => {
      if (this.#params.userInfo?.extension) {
        // @ts-ignore
        return await this.#params.nostrExtension.signEvent(event);
      } else {
        event.pubkey = this.#params.signer?.remotePubkey;
        event.id = getEventHash(event);
        event.sig = await this.#params.signer?.sign(event);
        console.log('signed', { event });
        return event;
      }
    });
  }

  async getRelays() {
    // FIXME implement!
    return {};
  }

  async encrypt(pubkey: string, plaintext: string) {
    await this.#test.ensureAuth();

    if (!this.#params.userInfo?.extension && !this.#params.signer) {
      throw new Error('Read only');
    }

    // @ts-ignore
    const module = this.#params.userInfo?.extension ? this.#params.nostrExtension.nip04 : this.#params.signer;

    return this.#processManager.wait(async () => await module.encrypt(pubkey, plaintext));
  }

  async decrypt(pubkey: string, ciphertext: string) {
    await this.#test.ensureAuth();

    if (!this.#params.userInfo?.extension && !this.#params.signer) {
      throw new Error('Read only');
    }

    // @ts-ignore
    const module = this.#params.userInfo?.extension ? this.#params.nostrExtension.nip04 : this.#params.signer;

    return this.#processManager.wait(async () => await module.decrypt(pubkey, ciphertext));
  }
}

export default Nostr;
