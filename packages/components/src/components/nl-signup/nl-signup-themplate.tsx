import { FunctionalComponent, h } from '@stencil/core';

interface NlSignupThemplateProps {
  title?: string;
  theme: string;
  description?: string;
  onClickToSignIn: () => void;
  onCreateAccount: () => void;
  isFetching: boolean;
}

export const NlSignupThemplate: FunctionalComponent<NlSignupThemplateProps> = ({
  onClickToSignIn,
  isFetching = false,
  onCreateAccount,
  title = 'Sign up',
  description = 'Create an account in one click',
  theme,
}) => {
  return (
    <div>
      <div class="p-4 overflow-y-auto">
        <h1 class={`nl-title-${theme} font-bold text-center text-2xl`}>{title}</h1>
        <p class={`nl-description-${theme} font-light text-center text-sm pt-2 max-w-96 mx-auto`}>{description}</p>
      </div>

      <div class="max-w-52 mx-auto pb-5">
        <button
          disabled={isFetching}
          onClick={() => onCreateAccount()}
          type="button"
          class={`nl-button-${theme} py-2.5 px-3 w-full inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg  disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600`}
        >
          {isFetching ? (
            <span
              class="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-slate-900 dark:text-gray-300  rounded-full"
              role="status"
              aria-label="loading"
            ></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="flex-shrink-0 w-4 h-4">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
              />
            </svg>
          )}
          Create an account
        </button>
      </div>

      <div class="p-4 overflow-y-auto">
        <p class={`nl-footer-${theme} font-light text-center text-sm pt-2 max-w-96 mx-auto`}>
          If you have an account you can{' '}
          <span onClick={() => onClickToSignIn()} class="cursor-pointer text-blue-400">
            login
          </span>
        </p>
      </div>
    </div>
  );
};
