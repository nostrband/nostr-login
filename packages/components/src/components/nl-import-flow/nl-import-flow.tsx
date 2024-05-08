import { Component, h, Fragment, State, Prop, Event, EventEmitter, Watch } from '@stencil/core';
import { state } from '@/store';

@Component({
  tag: 'nl-import-flow',
  styleUrl: 'nl-import-flow.css',
  shadow: false,
})
export class NlImportFlow {
  @Prop() titleInfo = 'Backup your account';
  @Prop() textInfo = 'Nostr accounts are controlled by cryptographic keys. Your keys are currently only stored in this browser tab. You should import them into a proper key storage service to avoid losing them, and to use with other Nostr apps.';
  @Prop() titleImport = 'Choose a service';
  @Prop() textImport = 'Your Nostr keys will be imported into this provider, and you will manage your keys on their website.';
  @Prop() bunkers: string = 'nsec.app';

  @State() isAvailable = false;
  @State() isContinued = false;

  @Event() nlImportAccount: EventEmitter<string>;

  formatServers(bunkers: string) {
    return bunkers.split(',').map(d => ({
      name: '@' + d,
      value: d,
    }));
  }

  handleDomainSelect(event: CustomEvent<string>) {
    state.nlSignup.domain = event.detail;
    // this.nlCheckSignup.emit(`${state.nlSignup.signupName}@${event.detail}`);
  }

  handleCreateAccount(e: MouseEvent) {
    e.preventDefault();
    this.nlImportAccount.emit(state.nlSignup.domain);
  }

  handleContinue() {
    this.isContinued = true;
  }

  @Watch('bunkers')
  watchBunkersHandler(newValue: string) {
    state.nlSignup.servers = this.formatServers(newValue);
  }

  componentWillLoad() {
    state.nlSignup.servers = this.formatServers(this.bunkers);
  }

  render() {
    if (!this.isContinued) {
      return (
        <div class="p-4 overflow-y-auto">
          <h1 class="nl-title font-bold text-center text-2xl">{this.titleInfo}</h1>
          <p class="nl-description font-light text-sm pt-2 pb-2 max-w-96 mx-auto">
            Nostr accounts are controlled by cryptographic keys.<br/><br/>
            
            Your keys are currently only stored in this browser tab.<br/><br/>
            
            You should backup your keys with a key storage service to avoid losing them, and to use them with other Nostr apps.
          </p>
          <div class="ml-auto mr-auto w-72">
            <button-base onClick={() => this.handleContinue()} titleBtn="Continue" />
          </div>
        </div>
      );
    }

    return (
      <Fragment>
        <div class="p-4 overflow-y-auto">
          <h1 class="nl-title font-bold text-center text-2xl">{this.titleImport}</h1>
          <p class="nl-description font-light text-center text-sm pt-2 max-w-96 mx-auto">
            Your Nostr keys will be imported into the service you choose. You will manage your keys on their website.
          </p>
        </div>

        <div class="max-w-72 mx-auto mb-5">
          <div class="mb-0.5">
            <nl-select onSelectDomain={e => this.handleDomainSelect(e)} selected={0} options={state.nlSignup.servers}></nl-select>
          </div>
          <p class="nl-title font-light text-sm mb-2">Default provider is a fine choice to start with.</p>

          <div class="ps-4 pe-4 overflow-y-auto">
            <p class="nl-error font-light text-center text-sm max-w-96 mx-auto">{state.error}</p>
          </div>

          <button-base disabled={state.isLoading} onClick={e => this.handleCreateAccount(e)} titleBtn="Start importing">
            {state.isLoading ? (
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
    );
  }
}
