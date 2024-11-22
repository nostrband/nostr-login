import { Component, h } from '@stencil/core';

@Component({
  tag: 'nl-dialog',
  styleUrl: 'nl-dialog.css',
  shadow: true,
})
export class NlDialog {
  private dialogElement?: HTMLDialogElement;

  componentDidLoad() {
    this.dialogElement?.showModal();
  }

  disconnectedCallback() {
    this.dialogElement?.close();
  }

  render() {
    return (
      <dialog ref={el => (this.dialogElement = el as HTMLDialogElement)} class={'m-auto nl-banner-dialog'}>
        <slot></slot>
      </dialog>
    );
  }
}
