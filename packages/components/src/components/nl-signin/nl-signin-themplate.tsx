import { FunctionalComponent, h } from '@stencil/core';

interface NlSigninThemplateProps {
  title?: string;
  description?: string;
  onClickToSignUp: () => void;
  onLogin: (e: MouseEvent) => void;
  isFetchLogin: boolean;
  error?: string;
  handleInputChange: (event: Event) => void;
}

export const NlSigninThemplate: FunctionalComponent<NlSigninThemplateProps> = ({
  handleInputChange,
  onLogin,
  title = 'Log in',
  description = 'Please enter your user name.',
  onClickToSignUp,
  isFetchLogin = false,
  error = '',
}) => {
  return (
    <div>
      <div class="p-4 overflow-y-auto">
        <h1 class="nl-title font-bold text-center text-2xl">{title}</h1>
        <p class="nl-description font-light text-center text-sm pt-2 max-w-96 mx-auto">{description}</p>
      </div>

      <div class="max-w-72 mx-auto">
        <div class="relative mb-2">
          <input
            onChange={e => handleInputChange(e)}
            type="text"
            class="nl-input peer py-3 px-4 ps-11 block w-full border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:border-transparent"
            placeholder="name@domain.com"
          />
          <div class="absolute inset-y-0 start-0 flex items-center pointer-events-none ps-4 peer-disabled:opacity-50 peer-disabled:pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="flex-shrink-0 w-4 h-4 text-gray-500">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
              />
            </svg>
          </div>
        </div>

        <button
          disabled={isFetchLogin}
          onClick={e => onLogin(e)}
          type="button"
          class="nl-button py-2.5 px-3 w-full inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg  disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
        >
          {isFetchLogin && (
            <span
              class="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-slate-900 dark:text-gray-300 rounded-full"
              role="status"
              aria-label="loading"
            ></span>
          )}
          Sign in
        </button>
      </div>

      <div class="ps-4 pe-4 overflow-y-auto">
        <p class="nl-error font-light text-center text-sm max-w-96 mx-auto">{error}</p>
      </div>

      <div class="p-4 overflow-y-auto">
        <p class="nl-footer font-light text-center text-sm pt-3 max-w-96 mx-auto">
          If you don't have an account please{' '}
          <span onClick={() => onClickToSignUp()} class="cursor-pointer text-blue-400">
            sign up
          </span>
          .
        </p>
      </div>
    </div>
  );
};
