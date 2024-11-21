import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';

@Component({
  tag: 'nl-iframe',
  styleUrl: 'nl-iframe.css',
  shadow: false,
})
export class NlConfirmLogout {
  @Prop() titleModal = 'Confirm';
  @Prop() description = 'Your profile keys are stored in this browser tab and will be deleted if you log out, and your profile will be inaccessible.';
  @Prop() iframeUrl = '';
  @Event() nlCloseModal: EventEmitter;

  handleCancel() {
    this.nlCloseModal.emit();
  }

  render() {
    return (
      <div class="p-4 overflow-y-auto">
        {/* <h1 class="nl-title font-bold text-center text-4xl">{this.titleModal}</h1>
        <p class="nl-description font-light text-center text-lg pt-2 max-w-96 mx-auto">{this.description}</p> */}

        <div class="mt-3 flex flex-col gap-2">
          {this.iframeUrl && (
            <iframe
              src={this.iframeUrl}
              style={{
                width: '100%',
                height: '600px',
                border: '1px solid #ccc',
                borderRadius: '8px',
              }}
            ></iframe>
          )}
        </div>
      </div>
    );
  }
}
