import { Component, h, State, Method, Prop, Watch, Event, EventEmitter } from '@stencil/core';

@Component({
  tag: 'modal-auth',
  styleUrl: 'modal-auth.css',
  shadow: true,
})
export class ModalAuth {
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
    const classModal = `transform duration-150 ${this.showModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}  relative overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg`;
    const classWrapper = `relative z-10 ${this.showModal ? '' : 'hidden'}`;

    return (
      <div class={classWrapper} aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition duration-150 ease-in-out"></div>

        <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div class={classModal}>
              <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                  <div class="sm:mx-auto sm:w-full sm:max-w-sm">
                    <img class="mx-auto h-10 w-auto" src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company" />
                    <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">Please enter nip46 bunker url</h2>
                  </div>

                  <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form class="space-y-6">
                      <div>
                        <label htmlFor="bunker-url" class="block text-sm font-medium leading-6 text-gray-900">
                          Bunker url
                        </label>
                        <div class="mt-2">
                          <input
                            id="bunker-url"
                            name="bunker-url"
                            value={this.bunkerUrl}
                            onInput={e => this.handleInputChange(e)}
                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={e => this.handleOkClick(e)}
                          type="submit"
                          class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          Sign in
                        </button>
                      </div>
                    </form>

                    <p class="mt-10 text-center text-sm text-gray-500">
                      You don't have an account?{' '}
                      <a href="#" class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
                        You can create it
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
