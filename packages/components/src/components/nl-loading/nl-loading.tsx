import { Component, Event, EventEmitter, h } from '@stencil/core';
import { state } from '@/store';

@Component({
  tag: 'nl-loading',
  styleUrl: 'nl-loading.css',
  shadow: false,
})
export class NlLoading {
  @Event() stopFetchHandler: EventEmitter<boolean>;
  @Event() handleContinue: EventEmitter<boolean>;

  handleStop(e) {
    e.preventDefault();

    this.stopFetchHandler.emit();
  }

  handleContinueClick(e) {
    e.preventDefault();
    // reset();
    this.handleContinue.emit();
  }

  render() {
    return (
      <div class="p-4 overflow-y-auto">
        <h1 class="nl-title font-bold text-center text-4xl">{state.authUrl && !state.isLoading ? 'Signined success' : 'Signing in...'}</h1>
        {!state.authUrl && state.isLoading && (
          <div class="mt-10 mb-10 ml-auto mr-auto w-20">
            <span
              slot="icon-start"
              class="animate-spin-loading ml-auto mr-auto inline-block w-20 h-20 border-[4px] border-current border-t-transparent text-slate-900 dark:text-gray-300 rounded-full"
              role="status"
              aria-label="loading"
            ></span>
          </div>
        )}
        <div class="mt-3 ml-auto mr-auto w-72">
          <button-base
            onClick={e => {
              if (state.authUrl && !state.isLoading) {
                this.handleContinueClick(e);
              } else {
                this.handleStop(e);
              }
            }}
            titleBtn={state.authUrl && !state.isLoading ? 'Continue' : 'Cancel'}
          />
        </div>
      </div>
    );
  }
}
