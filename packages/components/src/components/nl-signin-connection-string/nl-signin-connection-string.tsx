import { Component, h, Prop, Fragment, State } from '@stencil/core';
import QRCode from 'qrcode';

@Component({
  tag: 'nl-signin-connection-string',
  styleUrl: 'nl-signin-connection-string.css',
  shadow: false,
})
export class NlSigninConnectionString {
  @Prop() titleLogin = 'Connection string';
  @Prop() description = 'Scan or copy the connection string with key store app';
  @Prop() connectionString = '';
  @State() isCopy = false;

  private canvasElement: HTMLCanvasElement;

  componentDidLoad() {
    this.generateQRCode();
  }

  async generateQRCode() {
    if (this.connectionString && this.canvasElement) {
      try {
        await QRCode.toCanvas(this.canvasElement, this.connectionString);
      } catch (error) {
        console.error('Error generating QR Code:', error);
      }
    }
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.connectionString);

      this.isCopy = true;

      setTimeout(() => {
        this.isCopy = false;
      }, 1500);
    } catch (err) {
      console.error('Failed to copy connectionString: ', err);
    }
  }

  render() {
    return (
      <Fragment>
        <div class="p-4 overflow-y-auto">
          <h1 class="nl-title font-bold text-center text-2xl">{this.titleLogin}</h1>
          <p class="nl-description font-light text-center text-sm pt-2 max-w-96 mx-auto">{this.description}</p>
        </div>

        <canvas class="mx-auto mb-2" ref={el => (this.canvasElement = el as HTMLCanvasElement)}></canvas>

        <div class="px-4">
        <div class="max-w-72 mx-auto">
          <div class="relative mb-2">
            <input
              type="text"
              class="nl-input peer py-3 px-4 pe-11 ps-11 block w-full border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:border-transparent"
              placeholder="npub or name@domain"
              value={this.connectionString}
              disabled
            />
            <div class="absolute inset-y-0 start-0 flex items-center pointer-events-none ps-4 peer-disabled:opacity-50 peer-disabled:pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="flex-shrink-0 w-4 h-4 text-gray-500">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
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
          </div>

          <div class="mt-10 justify-center items-center flex gap-2">
            <span
              slot="icon-start"
              class="animate-spin-loading inline-block w-[20px] h-[20px] border-[2px] border-current border-t-transparent text-slate-900 dark:text-gray-300 rounded-full"
              role="status"
              aria-label="loading"
            ></span>
            <span class="nl-footer">Waiting for connection</span>
          </div>
        </div>
        </div>
      </Fragment>
    );
  }
}
