import { Component, EventEmitter, h, Event, Fragment, State, Prop } from '@stencil/core';
import { CURRENT_MODULE } from '@/types';

@Component({
  tag: 'nl-welcome',
  styleUrl: 'nl-welcome.css',
  shadow: false,
})
export class NlWelcome {
  @Prop() titleWelcome = 'Welcome!';
  @Prop() description = 'This app is part of the Nostr network. Log in with your Nostr account or join the network.';
  @Prop() isSignInWithExtension = true;

  @State() isOpenAdvancedLogin: boolean = false;

  @Event() changeScreen: EventEmitter<void>;
  @Event() nlLoginExtension: EventEmitter<void>;

  handleChangeScreen(screen) {
    this.changeScreen.emit(screen);
    if (screen === CURRENT_MODULE.EXTENSION)
      this.nlLoginExtension.emit()
  }

  handleOpenAdvanced() {
    this.isOpenAdvancedLogin = !this.isOpenAdvancedLogin;
  }

  render() {
    const arrowClass = `${this.isOpenAdvancedLogin ? 'rotate-180' : 'rotate-0'} duration-300 flex-shrink-0 w-4 h-4 text-blue-500`;

    return (
      <Fragment>
        <div class="p-4 overflow-y-auto">
          <h1 class="nl-title font-bold text-center text-4xl">{this.titleWelcome}</h1>
          <p class="nl-description font-light text-center text-lg pt-2 max-w-96 mx-auto">{this.description}</p>
        </div>

        <div class="max-w-52 mx-auto pb-5">
          <button-base titleBtn="Log in" onClick={() => this.handleChangeScreen(CURRENT_MODULE.SIGNIN)}>
            <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
              />
            </svg>
          </button-base>

          <div class="flex justify-center">
            <div
              onClick={() => this.handleOpenAdvanced()}
              class="text-blue-500 mt-3 decoration-dashed cursor-pointer inline-flex gap-2 items-center pb-1 border-dashed border-b-[1px] border-blue-500 text-sm font-light"
            >
              Advanced login
              <svg
                class={arrowClass}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <div
            class={`${this.isOpenAdvancedLogin ? 'max-h-[500px] mt-3 duration-300' : 'max-h-0 mt-0 duration-[0.25s]'} transition-max-height ease-in flex gap-3 flex-col overflow-hidden`}
          >
            {this.isSignInWithExtension && (
              <button-base onClick={() => this.handleChangeScreen(CURRENT_MODULE.EXTENSION)} titleBtn="Sign in with extension">
                <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 8.25V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V8.25m-18 0V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6ZM7.5 6h.008v.008H7.5V6Zm2.25 0h.008v.008H9.75V6Z"
                  />
                </svg>
              </button-base>
            )}
            <button-base onClick={() => this.handleChangeScreen(CURRENT_MODULE.SIGNIN_BUNKER_URL)} titleBtn="Sign in with bunker URL">
              <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                />
              </svg>
            </button-base>
            <button-base onClick={() => this.handleChangeScreen(CURRENT_MODULE.SIGNIN_READ_ONLY)} titleBtn="Sign in to read only">
              <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button-base>
          </div>

          <div class="nl-divider py-3 flex items-center text-xs uppercase before:flex-[1_1_0%] before:border-t before:me-6 after:flex-[1_1_0%] after:border-t  after:ms-6">Or</div>
          <button-base onClick={() => this.handleChangeScreen(CURRENT_MODULE.SIGNUP)} titleBtn="Sign up">
            <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
              />
            </svg>
          </button-base>
        </div>
      </Fragment>
    );
  }
}
