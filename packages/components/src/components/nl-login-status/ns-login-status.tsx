import { Info, RecentType } from '@/types';
import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'nl-login-status',
  // styleUrl: 'nl-login-status.css',
  shadow: false,
})
export class NlLoginStatus {
  @Prop() info: RecentType | Info | undefined;

  render() {
    let text = '';
    let color = '';
    if (this.info.authMethod === 'extension') {
      text = 'Extension';
      color = 'border-yellow-300 text-yellow-500 bg-yellow-100';
    } else if (this.info.authMethod === 'readOnly') {
      text = 'Read only';
      color = 'border-gray-300 text-gray-400 bg-gray-100';
    } else if (this.info.authMethod === 'connect') {
      text = 'Connect';
      color = 'border-teal-300 text-teal-600 bg-teal-100';
    } else if (this.info.authMethod === 'local') {
      text = 'Temporary';
      color = 'border-red-300 text-red-600 bg-red-100';
    } else if (this.info.authMethod === 'otp') {
      text = 'Delegated';
      color = 'border-orange-300 text-orange-600 bg-orange-100';
    } else {
      console.log('unknown auth method', this.info);
      throw new Error('Unknown auth method');
    }

    return (
      <div>
        <span class={`${color} rounded-xl border w-auto text-[10px] px-1 `}>{text}</span>
      </div>
    );
  }
}
