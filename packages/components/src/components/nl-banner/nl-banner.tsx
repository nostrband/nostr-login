import { Component, Event, EventEmitter, h, Prop, State, Watch } from '@stencil/core';
import { Info, METHOD_MODULE } from '../../types';

@Component({
  tag: 'nl-banner',
  styleUrl: 'nl-banner.css',
  shadow: true,
})
export class NlBanner {
  @State() darkMode: boolean = false;
  @State() isFetchLogin: boolean = false;
  @State() isLogin: boolean = false;
  @State() themeState: 'default' | 'ocean' | 'lemonade' | 'purple' = 'default';
  @Prop() nlTheme: 'default' | 'ocean' | 'lemonade' | 'purple' = 'default';
  @Prop() titleBanner: string = 'Please login to manage your profile';
  @State() imgUrl: string = '';
  @State() isOpen: boolean = false;

  @Prop() isLoading: boolean = false;
  @Prop() notify: { test: string } | null = null;
  @State() isOpenConfirm: boolean = false;
  @Prop() userInfo: Info | null = null;

  @Event() handleLoginBanner: EventEmitter<string>;
  @Event() handleLogoutBanner: EventEmitter<string>;

  @Watch('notify')
  watchNotifyHandler() {
    this.isOpenConfirm = true;
    this.isOpen = true;
  }

  @Watch('theme')
  watchPropHandler(newValue: 'default' | 'ocean' | 'lemonade' | 'purple') {
    console.log(newValue);
    this.themeState = newValue;
  }
  connectedCallback() {
    this.themeState = this.nlTheme;
    const getDarkMode = localStorage.getItem('nl-dark-mode');

    if (getDarkMode) {
      this.darkMode = JSON.parse(getDarkMode);
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.darkMode = true;
      } else {
        this.darkMode = false;
      }
    }
  }

  handleOpen() {
    this.isOpen = true;
  }

  handleClose() {
    this.isOpen = false;
    this.isOpenConfirm = false;
  }

  handleLogin() {
    this.handleLoginBanner.emit(METHOD_MODULE.SIGNIN);
    this.handleClose();
  }

  handleLogout() {
    this.handleLogoutBanner.emit(METHOD_MODULE.LOGOUT);
    this.handleClose();
  }

  handleOpenConfirm() {
    this.isOpen = true;
    this.isOpenConfirm = true;
  }

  handleConfirm() {
    this.isFetchLogin = true;

    setTimeout(() => {
      this.isFetchLogin = false;
      this.isOpen = false;
      this.isOpenConfirm = false;
    }, 1000);
  }

  render() {
    const isShowImg = Boolean(this.imgUrl);

    const userName = this.userInfo ? this.userInfo.nip05 || this.userInfo.pubkey : '';
    const isShowUserName = Boolean(userName);

    return (
      <div>
        <div class={`theme-${this.themeState}`}>
          <div class={this.darkMode && 'dark'}>
            <div
              class={`nl-banner ${this.isOpen ? 'w-52 h-auto right-2 rounded-r-lg isOpen' : 'rounded-r-none hover:rounded-r-lg cursor-pointer'} w-12 h-12 fixed top-52 right-0 inline-block overflow-hidden gap-x-2 text-sm font-medium  rounded-lg hover:right-2  transition-all duration-300 ease-in-out`}
            >
              <div class="flex w-full justify-between items-center p-3">
                <div onClick={() => this.handleOpen()} class="inline-flex items-center">
                  <span
                    class={`${this.isLoading ? 'w-5 h-5 border-[2px] mr-3.5 opacity-1' : 'w-0 h-0 border-[0px] mr-0 opacity-0'} animate-spin transition-all duration-300 ease-in-out inline-block border-current border-t-transparent text-slate-900 dark:text-gray-300 rounded-full`}
                    role="status"
                    aria-label="loading"
                  ></span>

                  {this.userInfo ? (
                    <div class="uppercase font-bold w-6 h-6 mr-2 rounded-full border border-gray-200 flex justify-center items-center">
                      {isShowImg ? (
                        <img class="w-full rounded-full" src={this.imgUrl} alt="Logo" />
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
                    <svg class="w-6 h-6" width="225" height="224" viewBox="0 0 225 224" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="224.047" height="224" rx="64" fill="#6951FA" />
                      <path
                        d="M162.441 135.941V88.0593C170.359 85.1674 176 77.5348 176 68.6696C176 57.2919 166.708 48 155.33 48C143.953 48 134.661 57.2444 134.661 68.6696C134.661 77.5822 140.302 85.1674 148.219 88.0593V135.941C147.698 136.13 147.176 136.367 146.655 136.604L87.3956 77.3452C88.6282 74.6904 89.2919 71.7511 89.2919 68.6696C89.2919 57.2444 80.0474 48 68.6696 48C57.2919 48 48 57.2444 48 68.6696C48 77.5822 53.6415 85.1674 61.5585 88.0593V135.941C53.6415 138.833 48 146.465 48 155.33C48 166.708 57.2444 176 68.6696 176C80.0948 176 89.3393 166.708 89.3393 155.33C89.3393 146.418 83.6978 138.833 75.7807 135.941V88.0593C76.3022 87.8696 76.8237 87.6326 77.3452 87.3956L136.604 146.655C135.372 149.31 134.708 152.249 134.708 155.33C134.708 166.708 143.953 176 155.378 176C166.803 176 176.047 166.708 176.047 155.33C176.047 146.418 170.406 138.833 162.489 135.941H162.441Z"
                        fill="white"
                      />
                    </svg>
                  )}

                  {isShowUserName && <div class="show-slow truncate w-16 text-xs">{userName}</div>}
                </div>

                <button
                  onClick={() => this.handleClose()}
                  type="button"
                  class="nl-action-button show-slow flex justify-center items-center w-7 h-7 text-sm font-semibold rounded-full border border-transparent"
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
              </div>

              {this.isOpenConfirm ? (
                <div class="p-3">
                  <div class="w-8 h-8 p-1/2 rounded-full show-slow border border-gray-200 bg-white mb-2 mt-2 show-slow m-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#5a68ff" class="w-full">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                      />
                    </svg>
                  </div>
                  <p class="mb-2 text-center show-slow max-w-40 min-w-40 mx-auto">Please confirm this action in your key storage app</p>
                  <button
                    disabled={this.isFetchLogin}
                    onClick={() => this.handleConfirm()}
                    type="button"
                    class="nl-button show-slow text-nowrap py-2.5 px-3 w-full inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
                  >
                    {this.isFetchLogin && (
                      <span
                        class="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-slate-900 dark:text-gray-300 rounded-full"
                        role="status"
                        aria-label="loading"
                      ></span>
                    )}
                    Confirm
                  </button>
                </div>
              ) : (
                <div class="p-3">
                  {!this.userInfo && <p class="mb-2 text-center show-slow max-w-40 min-w-40 mx-auto">{this.titleBanner}</p>}

                  {!this.userInfo ? (
                    <button
                      disabled={this.isFetchLogin}
                      onClick={() => this.handleLogin()}
                      type="button"
                      class="nl-button show-slow text-nowrap py-2.5 px-3 w-full inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg  disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
                    >
                      {this.isFetchLogin && (
                        <span
                          class="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-slate-900 dark:text-gray-300 rounded-full"
                          role="status"
                          aria-label="loading"
                        ></span>
                      )}
                      Sign in
                    </button>
                  ) : (
                    <button
                      disabled={this.isFetchLogin}
                      onClick={() => this.handleLogout()}
                      type="button"
                      class="nl-button text-nowrap show-slow py-2.5 px-3 w-full inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg  disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
                    >
                      {this.isFetchLogin && (
                        <span
                          class="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-slate-900 dark:text-gray-300 rounded-full"
                          role="status"
                          aria-label="loading"
                        ></span>
                      )}
                      Log out
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
