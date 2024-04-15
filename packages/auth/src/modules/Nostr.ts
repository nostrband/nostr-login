import { AuthNostrService, ModalManager, NostrExtensionService, NostrParams, ProcessManager } from './';

class Nostr {
  #params: NostrParams;
  #processManager: ProcessManager;
  #authNostrService: AuthNostrService;
  #extensionService: NostrExtensionService;
  #modalManager: ModalManager;
  private nip04: {
    encrypt: (pubkey: string, plaintext: string) => Promise<any>;
    decrypt: (pubkey: string, ciphertext: string) => Promise<any>;
  };

  constructor(params: NostrParams, processManager: ProcessManager, extensionService: NostrExtensionService, authNostrService: AuthNostrService, modalManager: ModalManager) {
    this.#params = params;
    this.#processManager = processManager;
    this.#extensionService = extensionService;
    this.#authNostrService = authNostrService;
    this.#modalManager = modalManager;

    this.getPublicKey = this.getPublicKey.bind(this);
    this.signEvent = this.signEvent.bind(this);
    this.getRelays = this.getRelays.bind(this);
    this.nip04 = {
      encrypt: this.encrypt.bind(this),
      decrypt: this.decrypt.bind(this),
    };
  }

  private async ensureAuth() {
    // wait until competing requests are finished
    await this.#authNostrService.waitReady()
    await this.#modalManager.waitReady()

    // got the sign in?
    if (this.#params.userInfo) return;

    // still no signer? request auth from user
    if (!this.#authNostrService.hasSigner()) {
      await this.#modalManager.launch({
        ...this.#params.optionsModal,
      });
    }

    // give up
    if (!this.#authNostrService.hasSigner()) {
      throw new Error('Rejected by user');
    }
  }

  async getPublicKey() {
    await this.ensureAuth();
    if (this.#params.userInfo) {
      return this.#params.userInfo.pubkey;
    } else {
      throw new Error('No user');
    }
  }

  // @ts-ignore
  async signEvent(event) {
    await this.ensureAuth();

    if (!this.#params.userInfo?.extension && !this.#authNostrService.hasSigner()) {
      throw new Error('Read only');
    }

    const module = this.#params.userInfo?.extension ? this.#extensionService.getExtension().nip04 : this.#authNostrService;

    return this.#processManager.wait(async () => await module.signEvent(event));
  }

  async getRelays() {
    // FIXME implement!
    return {};
  }

  async encrypt(pubkey: string, plaintext: string) {
    await this.ensureAuth();

    if (!this.#params.userInfo?.extension && !this.#authNostrService.hasSigner()) {
      throw new Error('Read only');
    }

    // @ts-ignore
    const module = this.#params.userInfo?.extension ? this.#extensionService.getExtension().nip04 : this.#authNostrService;

    return this.#processManager.wait(async () => await module.encrypt(pubkey, plaintext));
  }

  async decrypt(pubkey: string, ciphertext: string) {
    await this.ensureAuth();

    if (!this.#params.userInfo?.extension && !this.#authNostrService.hasSigner()) {
      throw new Error('Read only');
    }

    // @ts-ignore
    const module = this.#params.userInfo?.extension ? this.#extensionService.getExtension().nip04 : this.#authNostrService;

    return this.#processManager.wait(async () => await module.decrypt(pubkey, ciphertext));
  }
}

export default Nostr;
