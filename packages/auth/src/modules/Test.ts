import { NostrParams } from './index';
import Modal from './Modal';

class Test {
  private params: NostrParams;
  private modalManager: Modal;
  constructor(params: NostrParams, modalManager: Modal) {
    this.params = params;
    this.modalManager = modalManager;
  }

  public async ensureAuth() {
    // wait until competing requests are finished
    if (this.params.signerPromise) {
      await this.params.signerPromise;
    }

    if (this.params.launcherPromise) {
      await this.params.launcherPromise;
    }

    // got the sign in?
    if (this.params.userInfo) return;

    // still no signer? request auth from user
    if (!this.params.signer) {
      await this.modalManager.launch({
        ...this.params.optionsModal,
      });
    }

    // give up
    if (!this.params.signer) {
      throw new Error('Rejected by user');
    }
  }
}

export default Test;
