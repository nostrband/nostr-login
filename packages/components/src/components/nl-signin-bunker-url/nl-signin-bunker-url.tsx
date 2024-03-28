import { Component, h, State, Prop, Fragment, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'nl-signin-bunker-url',
  styleUrl: 'nl-signin-bunker-url.css',
  shadow: false,
})
export class NlSigninBunkerUrl {
  @Prop() titleLogin = 'Log in with bunker url';
  @Prop() description = 'Please enter your bunker url.';
  @State() isGood = false;
  @State() isFetchLogin = false;
  @State() loginName: string = '';

  @Event() nlLogin: EventEmitter<string>;
  @Event() nlCheckLogin: EventEmitter<string>;

  handleInputChange(event: Event) {
    this.loginName = (event.target as HTMLInputElement).value;
    this.nlCheckLogin.emit((event.target as HTMLInputElement).value); // .emit(this.loginName);
  }

  handleLogin(e: MouseEvent) {
    e.preventDefault();

    this.isFetchLogin = true;
    this.nlLogin.emit(this.loginName);
  }

  render() {
    return (
      <Fragment>
        <div class="p-4 overflow-y-auto">
          <h1 class="nl-title font-bold text-center text-2xl">{this.titleLogin}</h1>
          <p class="nl-description font-light text-center text-sm pt-2 max-w-96 mx-auto">{this.description}</p>
        </div>

        <div class="max-w-72 mx-auto">
          <div class="relative mb-2">
            <input
              onInput={e => this.handleInputChange(e)}
              type="text"
              class="nl-input peer py-3 px-4 ps-11 block w-full border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:border-transparent"
              placeholder="bunker://..."
            />
            <div class="absolute inset-y-0 start-0 flex items-center pointer-events-none ps-4 peer-disabled:opacity-50 peer-disabled:pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke={this.isGood ? '#00cc00' : 'currentColor'}
                class="flex-shrink-0 w-4 h-4 text-gray-500"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                />
              </svg>
            </div>
          </div>

          <button-base titleBtn="Log in" disabled={this.isFetchLogin} onClick={e => this.handleLogin(e)}>
            {this.isFetchLogin && (
              <span
                slot="icon-start"
                class="animate-spin-loading inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-slate-900 dark:text-gray-300 rounded-full"
                role="status"
                aria-label="loading"
              ></span>
            )}
          </button-base>
        </div>
      </Fragment>
    );
  }
}
