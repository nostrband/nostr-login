import { Component, Event, EventEmitter, Fragment, h, Prop } from '@stencil/core';
import { AuthMethod, CURRENT_MODULE } from '@/types';
import { state } from '@/store';

@Component({
  tag: 'nl-welcome-signin',
  styleUrl: 'nl-welcome-signin.css',
  shadow: false,
})
export class NlWelcomeSignIn {
  @Prop() titleWelcome = 'Log in';
  @Prop() hasExtension: boolean = false;
  @Prop() authMethods: AuthMethod[] = [];
  @Prop() hasExtension: boolean = false;
  @Prop() hasOTP: boolean = false;
  @Event() nlLoginExtension: EventEmitter<void>;

  @Event() nlLoginExtension: EventEmitter<void>;

  handleChangeScreen(screen) {
    state.path = [...state.path, screen];
    if (screen === CURRENT_MODULE.EXTENSION) this.nlLoginExtension.emit();
  }

  allowAuthMethod(m: AuthMethod) {
    return !this.authMethods.length || this.authMethods.includes(m);
  }

  renderSignInWithExtension() {
    return (
      <div class="mt-2">
        <button-base onClick={() => this.handleChangeScreen(CURRENT_MODULE.EXTENSION)} titleBtn="Sign in with extension">
          <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 8.25V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V8.25m-18 0V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6ZM7.5 6h.008v.008H7.5V6Zm2.25 0h.008v.008H9.75V6Z"
            />
          </svg>
        </button-base>
      </div>
    );
  }

  render() {
    return (
      <Fragment>
        <div class="p-4 overflow-y-auto">
          <h1 class="nl-title font-bold text-center text-3xl">{this.titleWelcome}</h1>
        </div>

        <div class="max-w-52 mx-auto pb-5">
          <div class="flex gap-3 flex-col">
            {this.allowAuthMethod('connect') && (
              <button-base titleBtn="Connect" onClick={() => this.handleChangeScreen(CURRENT_MODULE.CONNECT)}>
                <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25"
                  />
                </svg>
              </button-base>
            )}

            {this.allowAuthMethod('readOnly') && (
              <button-base onClick={() => this.handleChangeScreen(CURRENT_MODULE.LOGIN_READ_ONLY)} titleBtn="Read only">
                <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                  />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button-base>
            )}

            {this.hasOTP && this.allowAuthMethod('otp') && (
              <button-base titleBtn="One-time code" onClick={() => this.handleChangeScreen(CURRENT_MODULE.LOGIN_OTP)}>
                <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </button-base>
            )}

            <div class="flex gap-3 flex-col">
              {this.hasExtension && this.allowAuthMethod('extension') && this.renderSignInWithExtension()}
              {!this.allowAuthMethod('connect') && !this.hasExtension && <p class="nl-description font-light text-center text-lg pt-2 max-w-96 mx-auto">No Nostr extension!</p>}
              {!this.allowAuthMethod('connect') && this.hasExtension && !this.allowAuthMethod('extension') && (
                <p class="nl-description font-light text-center text-lg pt-2 max-w-96 mx-auto">Use advanced options.</p>
              )}
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}
