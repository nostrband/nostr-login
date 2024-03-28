import { Component, h, Prop, Watch, State, Element } from '@stencil/core';
import { NlTheme } from '@/types';
import { IButton } from '@/types/button';

@Component({
  tag: 'button-base',
  styleUrl: 'button-base.css',
  shadow: false,
})
export class ButtonBase implements IButton {
  @Element() element: HTMLElement;
  @State() darkMode: boolean = false;
  @State() themeState: NlTheme;
  @Prop() nlTheme: NlTheme = 'default';
  @Prop() titleBtn = 'Open modal';
  @Prop() disabled = false;
  @Watch('theme')
  watchPropHandler(newValue: NlTheme) {
    this.themeState = newValue;
  }
  connectedCallback() {
    this.themeState = this.nlTheme;
    const getDarkMode = JSON.parse(localStorage.getItem('nl-dark-mode'));

    if (getDarkMode) {
      this.darkMode = getDarkMode;
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.darkMode = true;
      } else {
        this.darkMode = false;
      }
    }
  }

  componentDidRender() {
    const svgElement = this.element.querySelector('svg');

    if (svgElement) {
      svgElement.classList.add('flex-shrink-0', 'w-4', 'h-4', 'block');
      svgElement.removeAttribute('style'); // hack frieze svg
    }
  }

  render() {
    return (
      <div class={`theme-${this.nlTheme}`}>
        <button
          disabled={this.disabled}
          type="button"
          class="nl-button py-2.5 px-3 w-full inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg  disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
        >
          <slot name="icon-start" />
          {this.titleBtn}
        </button>
      </div>
    );
  }
}
