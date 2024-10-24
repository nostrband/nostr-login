import { EventEmitter } from 'tseep';
import { CALL_TIMEOUT } from '../const';

class ProcessManager extends EventEmitter {
  private callCount: number = 0;
  private callTimer: NodeJS.Timeout | undefined;

  constructor() {
    super();
  }

  public onAuthUrl() {
    if (Boolean(this.callTimer)) {
      clearTimeout(this.callTimer);
    }
  }

  public onIframeUrl() {
    if (Boolean(this.callTimer)) {
      clearTimeout(this.callTimer);
    }
  }

  public async wait<T>(cb: () => Promise<T>): Promise<T> {
    // FIXME only allow 1 parallel req

    if (!this.callTimer) {
      this.callTimer = setTimeout(() => this.emit('onCallTimeout'), CALL_TIMEOUT);
    }

    if (!this.callCount) {
      this.emit('onCallStart');
    }

    this.callCount++;

    let error;
    let result;

    try {
      result = await cb();
    } catch (e) {
      error = e;
    }

    this.callCount--;

    this.emit('onCallEnd');

    if (this.callTimer) {
      clearTimeout(this.callTimer);
    }

    this.callTimer = undefined;

    if (error) {
      throw error;
    }

    // we can't return undefined bcs an exception is
    // thrown above on error
    // @ts-ignore
    return result;
  }
}

export default ProcessManager;
