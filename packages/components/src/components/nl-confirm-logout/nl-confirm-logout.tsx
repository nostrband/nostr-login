import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import { CURRENT_MODULE, METHOD_MODULE } from '@/types';
import { state } from '@/store';

@Component({
  tag: 'nl-confirm-logout',
  styleUrl: 'nl-confirm-logout.css',
  shadow: false,
})
export class NlConfirmLogout {
  @Prop() titleModal = "Delete keys?";
  @Prop() description = "Your profile keys are stored in this browser tab and will be deleted if you log out, and your profile will be inaccessible.";
  @Event() handleLogoutBanner: EventEmitter<string>;
  @Event() handleBackUpModal: EventEmitter<string>;
  @Event() nlCloseModal: EventEmitter;

  handleLogout() {
    this.handleLogoutBanner.emit(METHOD_MODULE.LOGOUT);
    this.nlCloseModal.emit();
  }

  handleCancel() {
    this.nlCloseModal.emit();
  }

  handleBackUp() {
    state.path = [CURRENT_MODULE.IMPORT_FLOW];
  }

  render() {
    return (
      <div class="p-4 overflow-y-auto">
        <h1 class="nl-title font-bold text-center text-4xl">{this.titleModal}</h1>
        <p class="nl-description font-light text-center text-lg pt-2 max-w-96 mx-auto">{this.description}</p>

        <div class="mt-3 ml-auto mr-auto w-60 flex flex-col gap-2">
          {/* <button-base onClick={() => this.handleCancel()} titleBtn="Cancel" /> */}
          <button-base onClick={() => this.handleBackUp()} titleBtn="Backup keys" theme="lemonade" />
          <button-base onClick={() => this.handleLogout()} theme="crab" titleBtn="Logout and delete keys" />
        </div>
      </div>
    );
  }
}
