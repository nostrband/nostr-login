import { Component, h, Fragment, State, Prop, Event, EventEmitter } from '@stencil/core';
import { state } from '@/store';
import { ConnectionString } from '@/types';

@Component({
  tag: 'nl-import-flow',
  styleUrl: 'nl-import-flow.css',
  shadow: false,
})
export class NlImportFlow {
  @Prop({ mutable: true }) titleInfo = 'Back up your keys';
  // @Prop() textInfo =
  //   'Nostr profiles are controlled by cryptographic keys. Your keys are currently only stored in this browser tab. You should import your keys into a proper key storage service to avoid losing them, and to use with other Nostr apps.';
  @Prop() titleImport = 'Choose a service';
  @Prop() textImport = 'Your Nostr keys will be imported into this provider, and you will manage your keys on their website.';
  @Prop() services: ConnectionString[] = [];

  @State() isAvailable = false;
  @State() isContinued = false;
  @State() isKeyBackup = false;

  @State() isCopy = false;

  @Event() nlImportAccount: EventEmitter<ConnectionString>;
  @Event() nlExportKeys: EventEmitter<void>;

  handleDomainSelect(event: CustomEvent<string>) {
    const s = this.services.find(s => s.domain === event.detail);
    state.nlImport = s;
  }

  handleCreateAccount(e: MouseEvent) {
    e.preventDefault();
    this.nlImportAccount.emit(state.nlImport);
  }

  handleContinue() {
    this.isContinued = true;
  }

  handleContinueKeyBackup() {
    this.isKeyBackup = true;
  }

  async copyToClipboard() {
    this.nlExportKeys.emit();
    this.isCopy = true;

    setTimeout(() => {
      this.isCopy = false;
    }, 1500);
  }

  render() {
    if (!this.isContinued && !this.isKeyBackup) {
      return (
        <div class="p-4 overflow-y-auto">
          <h1 class="nl-title font-bold text-center text-2xl">{this.titleInfo}</h1>
          <p class="nl-description font-light text-sm pt-2 pb-2 max-w-96 mx-auto">
            Nostr profiles are controlled by cryptographic keys.
            <br />
            <br />
            Your keys are currently only stored in this browser tab, and may be lost if you close it.
            <br />
            <br />
            You should backup your keys.
            <br />
            <br />
            We recommend to import your keys into a key store service, to protect them and to use with other apps.
            {/* <br />
            <br />
            You can also export your keys and save them in your password manager. */}
          </p>
          <div class="ml-auto mr-auto mb-2 w-72">
            <button-base onClick={() => this.handleContinue()} titleBtn="Import to key store" />
          </div>
          <div class="ml-auto mr-auto w-72">
            <button-base onClick={() => this.handleContinueKeyBackup()} titleBtn="Export keys" />
          </div>
        </div>
      );
    }

    if (this.isKeyBackup) {
      return (
        <div class="p-4 overflow-y-auto">
          <h1 class="nl-title font-bold text-center text-2xl">Key export</h1>
          <p class="nl-description font-light text-sm pt-2 pb-2 max-w-96 mx-auto">
            Copy your keys and store them in a safe place, like a password manager.
            <br />
            <br />
            You can sign into other Nostr apps by pasting your keys into them.
            <br />
            <br />
            Your keys are like your password, never share them with anyone.
          </p>

          <div class="max-w-72 mx-auto">
            {/* <div class="relative mb-2">
              <input
                type="password"
                class="nl-input peer py-3 px-4 pe-11 ps-11 block w-full border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:border-transparent"
                value={'placeholder for masked keys'}
                readOnly
              />
              <div class="absolute inset-y-0 start-0 flex items-center pointer-events-none ps-4 peer-disabled:opacity-50 peer-disabled:pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="flex-shrink-0 w-4 h-4 text-gray-500">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                  />
                </svg>
              </div>

              {this.isCopy ? (
                <div class="absolute inset-y-0 end-0 flex items-center p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#00cc00" class="flex-shrink-0 w-4 h-4 text-gray-500">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
              ) : (
                <div class="absolute inset-y-0 end-0 flex items-center cursor-pointer p-2 rounded-lg" onClick={() => this.copyToClipboard()}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="flex-shrink-0 w-4 h-4 text-gray-500">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6"
                    />
                  </svg>
                </div>
              )}
            </div> */}
            <div class="ml-auto mr-auto mb-2 w-72">
              <button-base onClick={() => this.copyToClipboard()} titleBtn={this.isCopy ? 'Copied!' : 'Copy to clipboard'} />
            </div>
          </div>
        </div>
      );
    }

    const options = this.services.map(s => ({ name: s.domain!, value: s.domain! }));

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
            <nl-select onSelectDomain={e => this.handleDomainSelect(e)} selected={0} options={options}></nl-select>
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
