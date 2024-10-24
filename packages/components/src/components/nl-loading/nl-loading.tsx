import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import { state } from '@/store';
import { CURRENT_MODULE } from '@/types';

@Component({
  tag: 'nl-loading',
  styleUrl: 'nl-loading.css',
  shadow: false,
})
export class NlLoading {
  @Event() stopFetchHandler: EventEmitter<boolean>;
  @Event() handleContinue: EventEmitter<boolean>;
  @Prop() path: string;

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
    let title = 'Connecting...';
    let text = 'Establishing connection to your key storage.';
    if (this.path === CURRENT_MODULE.LOCAL_SIGNUP) {
      title = 'Creating...';
      text = 'Publishing your profile on Nostr.';
    } else if (state.authUrl) {
      if (state.isLoading) {
        title = 'Confirming...';
        text = 'Please confirm the connection in your key storage app.';
      } else {
        title = 'Almost ready!';
        text = 'Continue to confirm the connection to your key storage.';
      }
    }

    const showButton = this.path !== CURRENT_MODULE.LOCAL_SIGNUP;
    const showIframe = !state.isLoading && state.iframeUrl && state.authUrl;
    const iframeUrl = `${state.iframeUrl}?auth_url=${encodeURIComponent(state.authUrl)}`;

    return (
      <div class="p-4 overflow-y-auto">
        <h1 class="nl-title font-bold text-center text-4xl">{title}</h1>
        <p class="nl-description font-light text-center text-lg pt-2 max-w-96 mx-auto">{text}</p>
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
        <div class="ps-4 pe-4 overflow-y-auto">
          <p class="nl-error font-light text-center text-sm max-w-96 mx-auto">{state.error}</p>
        </div>
        {iframeUrl && (
          <div class="mt-3 ml-auto mr-auto w-72">
            <iframe src={iframeUrl} width="180px" height="80px" style={{ display: showIframe ? 'block' : 'none' }}></iframe>
          </div>
        )}
        {!showIframe && showButton && (
          <div class="mt-3 ml-auto mr-auto w-72">
            <button-base
              onClick={e => {
                if (state.authUrl && !state.isLoading) {
                  this.handleContinueClick(e);
                } else {
                  this.handleStop(e);
                }
              }}
              titleBtn={!state.isLoading ? 'Continue' : 'Cancel'}
            />
          </div>
        )}
      </div>
    );
  }
}
