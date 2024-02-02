import { Component, h, Prop, State, Watch } from '@stencil/core';

@Component({
  tag: 'nl-button',
  styleUrl: 'nl-button.css',
  shadow: true,
})
export class NlButton {
  @State() darkMode: boolean = false;
  @State() themeState: 'default' | 'ocean' | 'lemonade' | 'purple' = 'default';
  @Prop() nlTheme: 'default' | 'ocean' | 'lemonade' | 'purple' = 'default';
  @Prop() titleBtn: string = 'Open modal';
  @Watch('theme')
  watchPropHandler(newValue: 'default' | 'ocean' | 'lemonade' | 'purple') {
    console.log(newValue);
    this.themeState = newValue;
  }
  connectedCallback() {
    this.themeState = this.nlTheme;
    const getDarkMode = localStorage.getItem('nl-dark-mode');

    if (getDarkMode) {
      this.darkMode = JSON.parse(getDarkMode);
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.darkMode = true;
      } else {
        this.darkMode = false;
      }
    }
  }

  render() {
    return (
      <div class={`theme-${this.themeState}`}>
        <div class={this.darkMode && 'dark'}>
          <button
            type="button"
            class="nl-button py-2.5 px-3 w-full inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg  disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
          >
            {this.titleBtn}
          </button>
        </div>
      </div>
    );
  }
}
