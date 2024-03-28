import { Component, h, Prop } from '@stencil/core';
import { NlTheme } from '@/types';
import { IButton } from '@/types/button';

@Component({
  tag: 'nl-button',
  shadow: true,
})
export class NlButton implements IButton {
  @Prop() nlTheme: NlTheme = 'default';
  @Prop() titleBtn = 'Open modal';
  @Prop() disabled = false;

  render() {
    return <button-base nlTheme={this.nlTheme} titleBtn={this.titleBtn} disabled={this.disabled} />;
  }
}
