import { Component, h, Listen, Prop, State, Watch, Element, Event, EventEmitter } from '@stencil/core';

export type OptionType = {
  name: string;
  value: string;
};

@Component({
  tag: 'nl-select',
  styleUrl: 'nl-select.css',
  shadow: false,
})
export class NlSelect {
  @State() isOpen: boolean = false;
  @State() value: OptionType = null;
  @Prop() options: OptionType[];
  @Prop() selected: number;

  @Element() element: HTMLElement;

  @Event() selectDomain: EventEmitter<string>;

  buttonRef: HTMLButtonElement;
  ulRef: HTMLUListElement;
  wrapperRef: HTMLDivElement;

  @Listen('click', { target: 'window' })
  handleWindowClick() {
    if (this.wrapperRef.querySelector('.listClass')) {
      this.isOpen = false;
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    this.calculateDropdownPosition();
  }

  @State() mode: boolean = false;
  @Prop() darkMode: boolean = false;
  @State() themeState: 'default' | 'ocean' | 'lemonade' | 'purple' = 'default';
  @Prop() theme: 'default' | 'ocean' | 'lemonade' | 'purple' = 'default';
  @Watch('theme')
  watchPropHandler(newValue: 'default' | 'ocean' | 'lemonade' | 'purple') {
    this.themeState = newValue;
  }

  @Watch('darkMode')
  watchModeHandler(newValue: boolean) {
    this.mode = newValue;
  }

  connectedCallback() {
    this.themeState = this.theme;
    this.mode = this.darkMode;

    this.value = this.options[this.selected];
    this.selectDomain.emit(this.value.value);
  }

  calculateDropdownPosition() {
    if (this.isOpen && this.buttonRef) {
      const buttonRect = this.buttonRef.getBoundingClientRect();
      this.ulRef.style.top = `${buttonRect.height}px`;
    }
  }

  handleChange(el: OptionType) {
    this.value = el;
    this.isOpen = false;

    this.selectDomain.emit(this.value.value);
  }

  render() {
    const listClass = `${this.isOpen ? 'listClass' : 'hidden'} min-w-[15rem] nl-select-list absolute left-0 shadow-md rounded-lg p-2 mt-1 after:h-4 after:absolute after:-bottom-4 after:start-0 after:w-full before:h-4 before:absolute before:-top-4 before:start-0 before:w-full`;
    const arrowClass = `${this.isOpen ? 'rotate-180' : 'rotate-0'} duration-300 flex-shrink-0 w-4 h-4 text-gray-500`;

    return (
      <div class={`theme-${this.themeState}`}>
        <div class="relative" ref={el => (this.wrapperRef = el)}>
          <button
            ref={el => (this.buttonRef = el)}
            onClick={() => this.toggleDropdown()}
            type="button"
            class="nl-select peer py-3 px-4 flex items-center w-full justify-between border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:border-transparent"
          >
            <span class="truncate overflow-hidden">{this.value.name}</span>
            <svg
              class={arrowClass}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <ul ref={el => (this.ulRef = el)} class={listClass}>
            {this.options.map(el => {
              return (
                <li onClick={() => this.handleChange(el)} class="nl-select-option flex cursor-pointer items-center gap-x-3.5 py-2 px-3 rounded-lg text-sm">
                  {el.name}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
}
