import { Component, Event, EventEmitter, Fragment, h, Prop, State } from '@stencil/core';
import { AuthMethod, CURRENT_MODULE } from '@/types';
import { state } from '@/store';

@Component({
  tag: 'nl-connect',
  styleUrl: 'nl-connect.css',
  shadow: false,
})
export class NlConnect {
  @Prop() titleWelcome = 'Connect to key store';
  @Prop() authMethods: AuthMethod[] = [];
  @Prop() hasExtension: boolean = false;
  @Prop() hasOTP: boolean = false;

  @State() isOpenAdvancedLogin: boolean = false;
  @State() keysStore: { img: string; name: string; link: string }[] = [];
  @Event() nlLoginExtension: EventEmitter<void>;

  handleChangeScreen(screen) {
    state.path = [...state.path, screen];
    if (screen === CURRENT_MODULE.EXTENSION) this.nlLoginExtension.emit();
  }

  handleOpenAdvanced() {
    this.isOpenAdvancedLogin = !this.isOpenAdvancedLogin;
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

  componentWillLoad() {
    console.log('load connect page');
    const createConnectionString = () => {
      return [
        {
          name: 'Nsec.app',
          img: 'https://nsec.app/assets/favicon.ico',
          link: 'https://nsec.app',
        },
      ];
    };

    this.keysStore = createConnectionString();
  }

  handleOpenLink() {
    state.isLoading = true;
  }

  render() {
    const arrowClass = `${this.isOpenAdvancedLogin ? 'rotate-180' : 'rotate-0'} duration-300 flex-shrink-0 w-4 h-4 text-blue-500`;

    return (
      <Fragment>
        <div class="p-4 overflow-y-auto">
          <h1 class="nl-title font-bold text-center text-3xl">{this.titleWelcome}</h1>
        </div>

        {Boolean(this.keysStore.length) && (
          <div class="max-w-96 mx-auto pt-5">
            <p class="nl-description font-medium text-sm pb-1.5">Select key store:</p>
            <ul class="p-2 rounded-lg border border-gray-200 flex flex-col w-full gap-0.5">
              {this.keysStore.map(el => {
                return (
                  <li>
                    <a
                      href={el.link}
                      target="_blank"
                      onClick={() => this.handleOpenLink()}
                      class="flex items-center gap-x-3.5 w-full hover:bg-gray-300 flex cursor-pointer items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm justify-between"
                    >
                      <div class="w-full max-w-7 h-7 flex relative">
                        <div class="uppercase font-bold w-full h-full rounded-full border border-gray-400 flex justify-center items-center">
                          <img class="w-full rounded-full" src={el.img} alt={el.name} />
                        </div>
                      </div>
                      <div class="overflow-hidden flex flex-col w-full">
                        <div class="nl-title truncate overflow-hidden">{el.name}</div>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div class="max-w-52 mx-auto pb-5">
          <div class="flex gap-3 flex-col">
            {this.hasExtension && this.allowAuthMethod('extension') && this.renderSignInWithExtension()}
            {!this.allowAuthMethod('connect') && !this.hasExtension && <p class="nl-description font-light text-center text-lg pt-2 max-w-96 mx-auto">No Nostr extension!</p>}
            {!this.allowAuthMethod('connect') && this.hasExtension && !this.allowAuthMethod('extension') && (
              <p class="nl-description font-light text-center text-lg pt-2 max-w-96 mx-auto">Use advanced options.</p>
            )}
          </div>

          {(this.allowAuthMethod('connect') || this.allowAuthMethod('readOnly')) && (
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
          )}

          <div
            class={`${this.isOpenAdvancedLogin ? 'max-h-[500px] mt-3 duration-300' : 'max-h-0 mt-0 duration-[0.25s]'} transition-max-height ease-in flex gap-3 flex-col overflow-hidden`}
          >
            {/* {this.hasExtension && !this.allowAuthMethod('extension') && this.renderSignInWithExtension()} */}
            {this.allowAuthMethod('connect') && (
              <button-base titleBtn="User name" onClick={() => this.handleChangeScreen(CURRENT_MODULE.LOGIN)}>
                <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                  />
                </svg>
              </button-base>
            )}

            {this.allowAuthMethod('connect') && (
              <button-base titleBtn="Connection string" onClick={() => this.handleChangeScreen(CURRENT_MODULE.CONNECTION_STRING)}>
                <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"
                  />
                </svg>
              </button-base>
            )}

            {this.allowAuthMethod('connect') && (
              <button-base onClick={() => this.handleChangeScreen(CURRENT_MODULE.LOGIN_BUNKER_URL)} titleBtn="Sign in with bunker URL">
                <svg style={{ display: 'none' }} slot="icon-start" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                  />
                </svg>
              </button-base>
            )}
          </div>
        </div>
      </Fragment>
    );
  }
}
