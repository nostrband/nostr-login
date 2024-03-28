import { Component, h } from '@stencil/core';

@Component({
  tag: 'nl-info-extension',
  styleUrl: 'nl-info-extension.css',
  shadow: false,
})
export class NlInfoExtension {
  render() {
    return (
      <div class="p-4 overflow-y-auto">
        <h1 class="nl-title font-bold text-center text-4xl">
          Extension <span class="font-light">window</span>
        </h1>
      </div>
    );
  }
}
