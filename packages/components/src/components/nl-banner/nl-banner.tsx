import { Component, Event, EventEmitter, Fragment, h, Prop, State, Watch } from '@stencil/core';
import { Info, METHOD_MODULE, NlTheme } from '@/types';

@Component({
  tag: 'nl-banner',
  styleUrl: 'nl-banner.css',
  shadow: true,
})
export class NlBanner {
  @State() isLogin: boolean = false;
  @Prop({ mutable: true }) theme: NlTheme = 'default';
  @Prop({ mutable: true }) darkMode: boolean = false;
  @Prop() titleBanner: string = '';
  @State() domain: string = '';
  @State() urlNotify: string = '';
  @Prop() listNotifies: string[] = [];
  @State() isOpenNotifyTimeOut: boolean = false;
  // @State() imgUrl: string = '';
  @Prop({ mutable: true }) isOpen: boolean = false;
  @State() isConfirm: boolean = true;
  @State() isOpenConfirm: boolean = false;

  @Prop() isLoading: boolean = false;
  @Prop() notify: { confirm: number; url?: string; timeOut?: { link: string } } | null = null;
  @State() isNotConfirmToSend: boolean = false;
  @Prop() userInfo: Info | null = null;
  @Prop({ mutable: true }) accounts: Info[] = [];

  @Event() handleRetryConfirmBanner: EventEmitter<string>;
  @Event() handleNotifyConfirmBanner: EventEmitter<string>;
  @Event() handleSetConfirmBanner: EventEmitter<string>;
  @Event() handleLoginBanner: EventEmitter<string>;
  @Event() handleLogoutBanner: EventEmitter<string>;
  @Event() handleOpenWelcomeModal: EventEmitter<string>;
  @Event() handleConfirmLogout: EventEmitter<string>;
  @Event() handleBackUpModal: EventEmitter<string>;

  @Watch('notify')
  watchNotifyHandler(notify: { confirm: number; url?: string; timeOut?: boolean }) {
    this.isNotConfirmToSend = true;
    this.isOpen = true;
    this.isOpenConfirm = true;
    this.domain = this.userInfo?.nip05?.split('@')?.[1] || '';

    if (notify.url) {
      this.urlNotify = notify.url;
      this.isOpenNotifyTimeOut = false;
    }

    if (!this.urlNotify && notify.timeOut) {
      this.isOpenNotifyTimeOut = true;
    }
  }

  handleOpen() {
    if (this.userInfo) {
      this.isOpen = true;
    } else {
      this.handleOpenWelcomeModal.emit();
    }
  }

  handleClose() {
    this.isOpen = false;
    this.isOpenNotifyTimeOut = false;
    this.isOpenConfirm = false;

    if (this.isNotConfirmToSend) {
      this.handleSetConfirmBanner.emit(this.urlNotify);
      this.isNotConfirmToSend = false;
    }

    this.urlNotify = '';
  }

  handleLogin() {
    this.handleLoginBanner.emit(METHOD_MODULE.LOGIN);
    this.handleClose();
  }

  handleSignup() {
    this.handleLoginBanner.emit(METHOD_MODULE.SIGNUP);
    this.handleClose();
  }

  handleBackUp() {
    this.handleBackUpModal.emit();
    this.handleClose();
  }

  handleLogout() {
    if (this.userInfo.authMethod === 'local') {
      this.handleConfirmLogout.emit();
    } else {
      this.handleLogoutBanner.emit(METHOD_MODULE.LOGOUT);
    }
    this.handleClose();
  }

  handleConfirm() {
    this.handleNotifyConfirmBanner.emit(this.urlNotify);
    this.isNotConfirmToSend = false;
    this.handleClose();
  }

  handleRetryConfirm() {
    this.handleRetryConfirmBanner.emit();
    this.isNotConfirmToSend = false;
    this.handleClose();
  }

  render() {
    const isShowImg = Boolean(this.userInfo?.picture);
    const userName = this.userInfo?.name || this.userInfo?.nip05?.split('@')?.[0] || this.userInfo?.pubkey || '';
    const isShowUserName = Boolean(userName);
    const isTemporary = this.userInfo && this.userInfo.authMethod === 'local';

    return (
      <div class={`theme-${this.theme}`}>
        <div class={this.darkMode && 'dark'}>
          <div
            class={`nl-banner ${this.isOpen ? 'w-52 h-auto right-2 rounded-r-lg isOpen' : 'rounded-r-none hover:rounded-r-lg cursor-pointer'} z-50 w-12 h-12 fixed top-52 right-0 inline-block gap-x-2 text-sm font-medium  rounded-lg hover:right-2  transition-all duration-300 ease-in-out`}
          >
            <div class="block w-[48px] h-[46px] relative z-10">
              <div onClick={() => this.handleOpen()} class="flex w-52 h-[46px] items-center pl-[11px]">
                <span
                  class={`${this.isLoading ? 'w-5 h-5 border-[2px] mr-3.5 ml-[2px] opacity-1' : 'w-0 h-0 border-[0px] mr-0 opacity-0 ml-0'} animate-spin transition-all duration-300 ease-in-out inline-block border-current border-t-transparent text-slate-900 dark:text-gray-300 rounded-full`}
                  role="status"
                  aria-label="loading"
                ></span>

                {this.userInfo ? (
                  <div class="uppercase font-bold w-6 h-6 mr-2 rounded-full border border-gray-200 flex justify-center items-center">
                    {isShowImg ? (
                      <img class="w-full rounded-full" src={this.userInfo.picture} alt="Logo" />
                    ) : isShowUserName ? (
                      userName[0]
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-full">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    )}
                  </div>
                ) : (
                  <div class="flex justify-center items-center">
                    <svg class="w-6 h-6" width="225" height="224" viewBox="0 0 225 224" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="224.047" height="224" rx="64" fill="#6951FA" />
                      <path
                        d="M162.441 135.941V88.0593C170.359 85.1674 176 77.5348 176 68.6696C176 57.2919 166.708 48 155.33 48C143.953 48 134.661 57.2444 134.661 68.6696C134.661 77.5822 140.302 85.1674 148.219 88.0593V135.941C147.698 136.13 147.176 136.367 146.655 136.604L87.3956 77.3452C88.6282 74.6904 89.2919 71.7511 89.2919 68.6696C89.2919 57.2444 80.0474 48 68.6696 48C57.2919 48 48 57.2444 48 68.6696C48 77.5822 53.6415 85.1674 61.5585 88.0593V135.941C53.6415 138.833 48 146.465 48 155.33C48 166.708 57.2444 176 68.6696 176C80.0948 176 89.3393 166.708 89.3393 155.33C89.3393 146.418 83.6978 138.833 75.7807 135.941V88.0593C76.3022 87.8696 76.8237 87.6326 77.3452 87.3956L136.604 146.655C135.372 149.31 134.708 152.249 134.708 155.33C134.708 166.708 143.953 176 155.378 176C166.803 176 176.047 166.708 176.047 155.33C176.047 146.418 170.406 138.833 162.489 135.941H162.441Z"
                        fill="white"
                      />
                    </svg>
                    {this.isOpen && (
                      <span class="px-2">
                        <b>Nostr</b> Login
                      </span>
                    )}
                  </div>
                )}

                {isShowUserName && <div class="show-slow truncate w-16 text-xs">{userName}</div>}
                {isShowUserName && <nl-login-status info={this.userInfo} />}
              </div>
            </div>

            <button
              onClick={() => this.handleClose()}
              type="button"
              class={`${this.isOpen ? 'z-20' : 'z-0'} nl-action-button absolute right-2 top-2 z-0 show-slow flex justify-center items-center w-7 h-7 text-sm font-semibold rounded-full border border-transparent`}
            >
              <span class="sr-only">Close</span>
              <svg
                class="flex-shrink-0 w-5 h-5"
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>

            <div class="p-3 show-slow">
              {this.isOpenConfirm ? (
                <div>
                  <div class="w-8 h-8 p-1/2 rounded-full border border-gray-200 bg-white mb-2 mt-2 show-slow m-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#5a68ff" class="w-full">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                      />
                    </svg>
                  </div>
                  <p class="mb-2 text-center max-w-40 min-w-40 mx-auto">
                    {this.isOpenNotifyTimeOut ? 'Keys not responding, check your key storage app' : `Confirmation required at ${this.domain}`}
                  </p>

                  {this.isOpenNotifyTimeOut ? (
                    <a
                      onClick={() => this.handleClose()}
                      href={`https://${this.domain}`}
                      target="_blank"
                      class="nl-button text-nowrap py-2.5 px-3 w-full inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
                    >
                      Go to {this.domain}
                    </a>
                  ) : (
                    <button-base onClick={() => this.handleConfirm()} titleBtn="Confirm" />
                  )}
                </div>
              ) : (
                <div>
                  <div>
                    {this.titleBanner && <p class="mb-2 text-center show-slow max-w-40 min-w-40 mx-auto">{this.titleBanner}</p>}
                    {isTemporary && (
                      <Fragment>
                        <p class="mb-2 text-center show-slow text-red-400 max-w-40 min-w-40 mx-auto">Your account is temporary and needs a backup</p>
                        <div class="mb-2">
                          <button-base onClick={() => this.handleBackUp()} theme="lemonade" titleBtn="Backup account" />
                        </div>
                      </Fragment>
                    )}
                    <div class="mb-2">
                      <nl-change-account currentAccount={this.userInfo} accounts={this.accounts} />
                    </div>
                    {Boolean(this.listNotifies.length) && (
                      <div
                        onClick={() => this.handleRetryConfirm()}
                        class="show-slow border border-yellow-600 text-yellow-600 bg-yellow-100 p-2 rounded-lg mb-2 cursor-pointer w-44 text-xs m-auto text-center"
                      >
                        Requests: {this.listNotifies.length}
                      </div>
                    )}
                    {!this.userInfo ? (
                      <div>
                        <button-base onClick={() => this.handleLogin()} titleBtn="Log in">
                          <svg
                            style={{ display: 'none' }}
                            slot="icon-start"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="flex-shrink-0 w-4 h-4"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                            />
                          </svg>
                        </button-base>
                        <button-base onClick={() => this.handleSignup()} titleBtn="Sign up">
                          <svg
                            style={{ display: 'none' }}
                            slot="icon-start"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="flex-shrink-0 w-4 h-4"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                            />
                          </svg>
                        </button-base>
                      </div>
                    ) : (
                      <button-base onClick={() => this.handleLogout()} titleBtn="Log out" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
