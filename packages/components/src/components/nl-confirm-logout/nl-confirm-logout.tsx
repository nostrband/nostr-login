import { Component, Event, EventEmitter, h } from '@stencil/core';
import { CURRENT_MODULE, METHOD_MODULE } from '@/types';
import { state } from '@/store';

@Component({
  tag: 'nl-confirm-logout',
  styleUrl: 'nl-confirm-logout.css',
  shadow: false,
})
export class NlConfirmLogout {
  @Event() stopFetchHandler: EventEmitter<boolean>;
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
    state.screen = CURRENT_MODULE.BACKUP_FLOW;
  }

  render() {
    return (
      <div class="p-4 overflow-y-auto">
        <h1 class="nl-title font-bold text-center text-4xl">Warning!</h1>
        <p class="nl-description font-light text-center text-lg pt-2 max-w-96 mx-auto">You will lose your account</p>

        <div class="mt-3 ml-auto mr-auto w-60 flex flex-col gap-2">
          <button-base onClick={() => this.handleCancel()} titleBtn="Cancel" />
          <button-base onClick={() => this.handleBackUp()} titleBtn="Backup account" theme="lemonade" />
          <button-base onClick={() => this.handleLogout()} theme="crab" titleBtn="Logout" />
        </div>
      </div>
    );
  }
}
