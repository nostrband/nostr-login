import { Component, h, Prop } from '@stencil/core';
import { NlTheme } from '@/types';
import { IButton } from '@/types/button';

@Component({
  tag: 'nl-button',
  shadow: true,
})
export class NlButton implements IButton {
  @Prop() theme: NlTheme = 'default';
  @Prop() darkMode: boolean = false;
  @Prop() titleBtn = 'Open modal';
  @Prop() disabled = false;

  render() {
    return <button-base theme={this.theme} darkMode={this.darkMode} titleBtn={this.titleBtn} disabled={this.disabled} />;
  }
}
