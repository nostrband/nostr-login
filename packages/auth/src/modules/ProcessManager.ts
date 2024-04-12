import { TIMEOUT } from '../const';
import { NostrLoginInitializer } from '../index';
import { NostrParams } from './';

class ProcessManager {
  private params: NostrParams;
  constructor(props: NostrLoginInitializer) {
    this.params = props.params;
  }

  // @ts-ignore
  public async wait(cb) {
    if (!this.params.callTimer) {
      // @ts-ignore
      this.params.callTimer = setTimeout(() => this.onCallTimeout(), TIMEOUT);
    }

    if (!this.params.callCount) {
      await this.onCallStart();
    }

    this.params.callCount++;

    let error;
    let result;

    try {
      result = await cb();
    } catch (e) {
      error = e;
    }

    this.params.callCount--;

    await this.onCallEnd();

    if (this.params.callTimer) {
      clearTimeout(this.params.callTimer);
    }

    this.params.callTimer = undefined;

    if (error) {
      throw error;
    }

    return result;
  }

  public async onCallTimeout() {
    if (this.params.banner) {
      this.params.banner.notify = {
        confirm: Date.now(),
        timeOut: { domain: this.params.userInfo?.nip05?.split('@')[1] },
      };
    }
  }

  public async onCallEnd() {
    if (this.params.banner) {
      this.params.banner.isLoading = false;
    }
  }

  public async onCallStart() {
    if (this.params.banner) {
      this.params.banner.isLoading = true;
    }
  }
}

export default ProcessManager;
