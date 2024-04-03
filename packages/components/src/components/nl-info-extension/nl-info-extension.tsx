import { Component, h } from '@stencil/core';
import { state } from '@/store';

@Component({
  tag: 'nl-info-extension',
  styleUrl: 'nl-info-extension.css',
  shadow: false,
})
export class NlInfoExtension {
  render() {
    return (
      <div class="p-4 overflow-y-auto">
        {state.isLoadingExtension ? (
          <div>
            <h1 class="nl-title font-bold text-center text-4xl">Signing in...</h1>
            <div class="mt-10 mb-10 ml-auto mr-auto w-20">
              <span
                slot="icon-start"
                class="animate-spin-loading ml-auto mr-auto inline-block w-20 h-20 border-[4px] border-current border-t-transparent text-slate-900 dark:text-gray-300 rounded-full"
                role="status"
                aria-label="loading"
              ></span>
            </div>
            <div class="ps-4 pe-4 overflow-y-auto">
              <p class="nl-error font-light text-center text-sm max-w-96 mx-auto">{state.error}</p>
            </div>
          </div>
        ) : (
          <div>
            <h1 class="nl-title font-bold text-center text-4xl">Install browser extension!</h1>
            <p class="nl-description font-light text-center text-lg pt-2 max-w-96 mx-auto">
              Try{' '}
              <a href="" target="_blank">
                Alby
              </a>
              ,{' '}
              <a href="https://chromewebstore.google.com/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp" target="_blank">
                nos2x
              </a>{' '}
              or{' '}
              <a href="https://apps.apple.com/us/app/nostore/id1666553677" target="_blank">
                Nostore
              </a>
            </p>
          </div>
        )}
      </div>
    );
  }
}
