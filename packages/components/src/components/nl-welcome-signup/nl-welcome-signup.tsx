import { Component, Fragment, h, Prop } from '@stencil/core';
import { CURRENT_MODULE } from '@/types';
import { state } from '@/store';

@Component({
  tag: 'nl-welcome-signup',
  styleUrl: 'nl-welcome-signup.css',
  shadow: false,
})
export class NlWelcomeSignUp {
  @Prop() titleWelcome = 'Sign up';
  @Prop() description = 'Nostr profiles are based on cryptographic keys. You can create keys right here, or with a key storage app.';

  handleChangeScreen(screen) {
    state.path = [...state.path, screen];
  }

  render() {
    return (
      <Fragment>
        <div class="p-4 overflow-y-auto">
          <h1 class="nl-title font-bold text-center text-3xl">{this.titleWelcome}</h1>
          <p class="nl-description font-light text-center text-lg pt-2 max-w-96 mx-auto">{this.description}</p>
        </div>

        <div class="max-w-52 mx-auto pb-5">
          <div class="flex gap-3 flex-col">
            <button-base onClick={() => this.handleChangeScreen(CURRENT_MODULE.LOCAL_SIGNUP)} titleBtn="Create keys">
              <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                />
              </svg>
            </button-base>

            <button-base onClick={() => this.handleChangeScreen(CURRENT_MODULE.SIGNUP)} titleBtn="With key store">
              <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                />
              </svg>
            </button-base>
          </div>
        </div>
      </Fragment>
    );
  }
}
