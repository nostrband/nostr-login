import { Component, h, Fragment, State, Prop, Event, EventEmitter, Watch } from '@stencil/core';

@Component({
  tag: 'nl-signup',
  styleUrl: 'nl-signup.css',
  shadow: false,
})
export class NlSignup {
  @Prop() titleSignup = 'Sign up';
  @Prop() description = 'Join the Nostr network.';
  @Prop() bunkers: string = 'nsec.app,highlighter.com';

  @State() signupName = '';
  @State() isAvailable = false;
  @State() isFetching = false;
  @State() domain: string = '';
  @State() servers = [
    { name: '@nsec.app', value: 'nsec.app' },
    { name: '@highlighter.com', value: 'highlighter.com' },
  ];

  @Event() nlSignup: EventEmitter<string>;
  @Event() nlCheckSignup: EventEmitter<string>;
  @Event() fetchHandler: EventEmitter<boolean>;

  formatServers(bunkers: string) {
    return bunkers.split(',').map(d => ({
      name: '@' + d,
      value: d,
    }));
  }

  handleInputChange(event: Event) {
    this.signupName = (event.target as HTMLInputElement).value;
    this.nlCheckSignup.emit(`${(event.target as HTMLInputElement).value}@${this.domain}`);
  }

  handleDomainSelect(event: CustomEvent<string>) {
    this.domain = event.detail;
    this.nlCheckSignup.emit(`${this.signupName}@${event.detail}`);
  }

  handleCreateAccount(e: MouseEvent) {
    e.preventDefault();

    this.isFetching = true;
    this.fetchHandler.emit(true);

    setTimeout(() => {
      this.isFetching = false;
      this.fetchHandler.emit(false);
    }, 3000);

    this.nlSignup.emit(`${this.signupName}@${this.domain}`);
  }

  @Watch('bunkers')
  watchBunkersHandler(newValue: string) {
    this.servers = this.formatServers(newValue);
  }

  componentWillLoad() {
    this.servers = this.formatServers(this.bunkers);
  }

  handleStop() {
    this.isFetching = false;
    this.fetchHandler.emit(false);
  }

  render() {
    return (
        <Fragment>
          {this.isFetching ? (
              <nl-loading onStopFetchHandler={() => this.handleStop()} />
          ) : (
      <Fragment>
        <div class="p-4 overflow-y-auto">
          <h1 class="nl-title font-bold text-center text-2xl">{this.titleSignup}</h1>
          <p class="nl-description font-light text-center text-sm pt-2 max-w-96 mx-auto">{this.description}</p>
        </div>

        <div class="max-w-72 mx-auto">
          <div class="relative mb-2">
            <input
              onInput={e => this.handleInputChange(e)}
              type="text"
              class="nl-input peer py-3 px-4 ps-11 block w-full border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:border-transparent"
              placeholder="Name"
            />
            <div class="absolute inset-y-0 start-0 flex items-center pointer-events-none ps-4 peer-disabled:opacity-50 peer-disabled:pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke={this.isAvailable ? '#00cc00' : 'currentColor'}
                class="flex-shrink-0 w-4 h-4 text-gray-500"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
          </div>
          {/* {inputStatus && (
          <p class={classError}>{textError}</p>
        )} */}
          <div class="mb-0.5">
            {/*<select class="nl-select border-transparent py-3 px-4 pe-9 block w-full rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none">*/}
            {/*  <option selected value="@nsec.app">*/}
            {/*    @nsec.app*/}
            {/*  </option>*/}
            {/*</select>*/}
            <nl-select onSelectDomain={e => this.handleDomainSelect(e)} selected={0} options={this.servers}></nl-select>
          </div>
          <p class="nl-title font-light text-sm mb-2">Choose a service to manage your Nostr keys.</p>
          <button-base disabled={this.isFetching} onClick={e => this.handleCreateAccount(e)} titleBtn="Create an account">
            {this.isFetching ? (
              <span
                slot="icon-start"
                class="animate-spin-loading inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-slate-900 dark:text-gray-300 rounded-full"
                role="status"
                aria-label="loading"
              ></span>
            ) : (
              <svg slot="icon-start" style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                />
              </svg>
            )}
          </button-base>
        </div>
      </Fragment>
          )}
        </Fragment>
    );
  }
}
