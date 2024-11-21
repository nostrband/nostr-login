import { Component, h } from '@stencil/core';

@Component({
  tag: 'nl-dialog',
  styleUrl: 'nl-dialog.css',
  shadow: true,
})
export class NlDialog {
  private dialogElement?: HTMLDialogElement;

  componentDidLoad() {
    const pos = window.scrollY;
    this.dialogElement?.show();
    // for some reason window is scrolled to where the dialog is,
    // this way we cancel that misbehavior
    setTimeout(() => (window.scroll(window.scrollX, pos)), 0);
  }

  disconnectedCallback() {
    this.dialogElement?.close();
  }

  render() {
    return (
      <dialog ref={el => (this.dialogElement = el as HTMLDialogElement)} class={'m-auto'}>
        <slot></slot>
      </dialog>
    );
  }
}
