import { FunctionalComponent, h } from '@stencil/core';

interface NlSigninThemplateProps {
  title?: string;
  description?: string;
  handleClickToSignUp: () => void;
  handleLogin: (e: MouseEvent) => void;
  isFetchLogin: boolean;
  error?: string;
  handleInputChange: (event: Event) => void;
  isGood: boolean;
}

export const NlSigninThemplate: FunctionalComponent<NlSigninThemplateProps> = ({
  handleInputChange,
  handleLogin,
  title = 'Log in',
  description = 'Please enter your user name.',
  handleClickToSignUp,
  isFetchLogin = false,
  isGood = false,
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
            onInput={handleInputChange}
            type="text"
            class="nl-input peer py-3 px-4 ps-11 block w-full border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:border-transparent"
            placeholder="name@domain.com"
          />
          <div class="absolute inset-y-0 start-0 flex items-center pointer-events-none ps-4 peer-disabled:opacity-50 peer-disabled:pointer-events-none">
            {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="flex-shrink-0 w-4 h-4 text-gray-500">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
              />
            </svg> */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke={isGood ? '#00cc00' : 'currentColor'}
              class="flex-shrink-0 w-4 h-4 text-gray-500"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </div>
        </div>

        <button
          disabled={isFetchLogin}
          onClick={handleLogin}
          type="button"
          class="nl-button py-2.5 px-3 w-full inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg  disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
        >
          {isFetchLogin ? (
            <span
              class="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-slate-900 dark:text-gray-300 rounded-full"
              role="status"
              aria-label="loading"
            ></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="flex-shrink-0 w-4 h-4">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
              />
            </svg>
          )}
          Log in
        </button>
      </div>

      <div class="ps-4 pe-4 overflow-y-auto">
        <p class="nl-error font-light text-center text-sm max-w-96 mx-auto">{error}</p>
      </div>

      <div class="p-4 overflow-y-auto">
        <p class="nl-footer font-light text-center text-sm pt-3 max-w-96 mx-auto">
          If you don't have an account please{' '}
          <span onClick={handleClickToSignUp} class="cursor-pointer text-blue-400">
            sign up
          </span>
          .
        </p>
      </div>
    </div>
  );
};
