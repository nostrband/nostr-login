import { EventEmitter } from 'tseep';
import { TIMEOUT } from '../const';
import { NostrParams } from './';

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

  public async wait(cb: () => void) {
    if (!this.callTimer) {
      this.callTimer = setTimeout(() => this.emit('onCallTimeout'), TIMEOUT);
    }

    if (!this.callCount) {
      await this.emit('onCallStart');
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

    await this.emit('onCallEnd');

    if (this.callTimer) {
      clearTimeout(this.callTimer);
    }

    this.callTimer = undefined;

    if (error) {
      throw error;
    }

    return result;
  }
}

export default ProcessManager;
