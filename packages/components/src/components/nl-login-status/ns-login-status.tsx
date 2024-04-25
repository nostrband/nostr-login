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
    if (Boolean(this.info.bunkerUrl)) {
      text = 'Bunker URL';
      color = 'border-purple-300 text-purple-400 bg-purple-100';
    } else if (this.info.extension) {
      text = 'Extension';
      color = 'border-yellow-300 text-yellow-500 bg-yellow-100';
    } else if (this.info.readonly) {
      text = 'Read only';
      color = 'border-gray-300 text-gray-400 bg-gray-100';
    } else {
      text = 'Connect';
      color = 'border-teal-300 text-teal-600 bg-teal-100';
    }
  
    return (
      <div>
        <span class={`${color} rounded-xl border  w-auto text-[10px] px-1 `}>{text}</span>
      </div>
    );
  };
  
}