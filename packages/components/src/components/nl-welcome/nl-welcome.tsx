import { Component, h, State, Method, Prop, Watch, Event, EventEmitter } from '@stencil/core';
// import {NlWelcomeThemplate} from "./nl-welcome-themplate";

@Component({
  tag: 'nl-welcome',
  styleUrl: 'nl-welcome.css',
  shadow: true,
})
export class NlWelcome {
  @Prop() isOpen: boolean;
  @State() showModal: boolean = true;

  @State() bunkerUrl: string = '';

  @Event() handleGetValue: EventEmitter<string>;

  private dialogElement: HTMLDialogElement;

  handleInputChange(event: Event) {
    this.bunkerUrl = (event.target as HTMLInputElement).value;
  }

  handleOkClick(e: MouseEvent) {
    e.preventDefault();
    this.handleGetValue.emit(this.bunkerUrl);
    // this.showModal = !this.showModal;
    this.dialogElement.close();
  }

  toggleModal = (e: MouseEvent) => {
    e.preventDefault();

    this.showModal = !this.showModal;
  };

  @Watch('isOpen')
  watchPropHandler(newValue: boolean) {
    // this.showModal = newValue;
    console.log(newValue);
    this.dialogElement.showModal();
  }

  @Method()
  async openModal() {
    this.showModal = true;
  }

  render() {
    // const classModal = `transform duration-150 ${this.showModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}  relative overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg`;
    // const classWrapper = `w-full h-full fixed top-0 start-0 z-[80] overflow-x-hidden overflow-y-auto bg-gray-500 bg-opacity-75 !dark ${this.showModal ? 'open' : ''}`;

    return <div />;
  }
}
