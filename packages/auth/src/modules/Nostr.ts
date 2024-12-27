import { Info } from 'nostr-login-components/dist/types/types';

export interface Signer {
  signEvent: (event: any) => Promise<any>;
  nip04: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
  };
  nip44: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
  };
}

export interface NostrObjectParams {
  waitReady(): Promise<void>;
  getUserInfo(): Info | null;
  launch(): Promise<void>;
  getSigner(): Signer;
  wait<T>(cb: () => Promise<T>): Promise<T>;
  skipIfLoggedIn?: boolean;
}

class Nostr {
  #params: NostrObjectParams;
  private nip04: {
    encrypt: (pubkey: string, plaintext: string) => Promise<any>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<any>;
  };
  private nip44: {
    encrypt: (pubkey: string, plaintext: string) => Promise<any>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<any>;
  };

  constructor(params: NostrObjectParams) {
    this.#params = params;

    this.getPublicKey = this.getPublicKey.bind(this);
    this.signEvent = this.signEvent.bind(this);
    this.getRelays = this.getRelays.bind(this);
    this.nip04 = {
      encrypt: this.encrypt04.bind(this),
      decrypt: this.decrypt04.bind(this),
    };
    this.nip44 = {
      encrypt: this.encrypt44.bind(this),
      decrypt: this.decrypt44.bind(this),
    };
  }

  private async ensureAuth() {
    await this.#params.waitReady();

    // authed?
    const userInfo = this.#params.getUserInfo();
    if (userInfo) return;

    // launch auth flow if not configured to skip
    if (!this.#params.skipIfLoggedIn) {
      await this.#params.launch();

      // give up
      if (!this.#params.getUserInfo()) {
        throw new Error('Rejected by user');
      }
    } else {
      throw new Error('Not logged in');
    }
  }

  async getPublicKey() {
    await this.ensureAuth();
    const userInfo = this.#params.getUserInfo();
    if (userInfo) {
      return userInfo.pubkey;
    } else {
      throw new Error('No user');
    }
  }

  // @ts-ignore
  async signEvent(event) {
    await this.ensureAuth();
    return this.#params.wait(async () => await this.#params.getSigner().signEvent(event));
  }

  async getRelays() {
    // FIXME implement!
    return {};
  }

  async encrypt04(pubkey: string, plaintext: string) {
    await this.ensureAuth();
    return this.#params.wait(async () => await this.#params.getSigner().nip04.encrypt(pubkey, plaintext));
  }

  async decrypt04(pubkey: string, ciphertext: string) {
    await this.ensureAuth();
    return this.#params.wait(async () => await this.#params.getSigner().nip04.decrypt(pubkey, ciphertext));
  }

  async encrypt44(pubkey: string, plaintext: string) {
    await this.ensureAuth();
    return this.#params.wait(async () => await this.#params.getSigner().nip44.encrypt(pubkey, plaintext));
  }

  async decrypt44(pubkey: string, ciphertext: string) {
    await this.ensureAuth();
    return this.#params.wait(async () => await this.#params.getSigner().nip44.decrypt(pubkey, ciphertext));
  }
}

export default Nostr;
