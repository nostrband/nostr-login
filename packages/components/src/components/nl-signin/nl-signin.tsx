import { Component, h, State, Method, Prop, Watch, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'nl-signin',
  styleUrl: 'nl-signin.css',
  shadow: true,
})
export class NlSignin {
  @Prop() isOpen: boolean;
  @State() showModal: boolean = false;

  @State() bunkerUrl: string = '';

  @Event() handleGetValue: EventEmitter<string>;

  handleInputChange(event: Event) {
    this.bunkerUrl = (event.target as HTMLInputElement).value;
  }

  handleOkClick(e: MouseEvent) {
    e.preventDefault();
    this.handleGetValue.emit(this.bunkerUrl);
    this.showModal = !this.showModal;
  }

  toggleModal = (e: MouseEvent) => {
    e.preventDefault();

    this.showModal = !this.showModal;
  };

  @Watch('isOpen')
  watchPropHandler(newValue: boolean) {
    this.showModal = newValue;
  }

  @Method()
  async openModal() {
    this.showModal = true;
  }

  render() {
    // const classModal = `transform duration-150 ${this.showModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}  relative overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg`;
    // const classWrapper = `relative z-10 ${this.showModal ? '' : 'hidden'}`;

    return <div></div>;
  }
}
