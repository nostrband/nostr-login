import { Component, Event, EventEmitter, h } from '@stencil/core';

@Component({
  tag: 'nl-loading',
  styleUrl: 'nl-loading.css',
  shadow: false,
})
export class NlLoading {
  @Event() stopFetchHandler: EventEmitter<boolean>;

  handleStop(e) {
    e.preventDefault();

    this.stopFetchHandler.emit();
  }
  render() {
    return (
      <div class="p-4 overflow-y-auto">
        <h1 class="nl-title font-bold text-center text-4xl">Signing in...</h1>
        <div class="mt-10 mb-10 ml-auto mr-auto w-20">
          <span
            slot="icon-start"
            class="animate-spin-loading ml-auto mr-auto inline-block w-20 h-20 border-[4px] border-current border-t-transparent text-slate-900 dark:text-gray-300 rounded-full"
            role="status"
            aria-label="loading"
          ></span>
        </div>
        <div class="mt-3 ml-auto mr-auto w-72">
          <button-base onClick={e => this.handleStop(e)} titleBtn="Cancel"></button-base>
        </div>
      </div>
    );
  }
}
