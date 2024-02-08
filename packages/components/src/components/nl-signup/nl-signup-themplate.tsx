import { FunctionalComponent, h } from '@stencil/core';

interface NlSignupThemplateProps {
  title?: string;
  description?: string;
  handleInputChange: (event: Event) => void;
  handleDomainSelect: (event: CustomEvent<string>) => void;
  handleClickToSignIn: () => void;
  handleCreateAccount: (event: MouseEvent) => void;
  isFetching: boolean;
  isAvailable: boolean;
  error?: string;
  theme: 'default' | 'ocean' | 'lemonade' | 'purple';
  darkMode: boolean;
  servers: { name: string, value: string }[]
}

export const NlSignupThemplate: FunctionalComponent<NlSignupThemplateProps> = ({
  handleInputChange,
  handleDomainSelect,
  handleClickToSignIn,
  isFetching = false,
  handleCreateAccount,
  title = 'Sign up',
  description = 'Join the Nostr network.',
  error = '',
  theme,
  darkMode,
  isAvailable,
  servers
}) => {
  // const classError = ` text-sm ${isAvailable ? 'nl-text-success' : 'nl-text-error'} mb-2`;
  // const textError = isAvailable ? 'Available' : inputStatus;

  return (
    <div>
      <div class="p-4 overflow-y-auto">
        <h1 class="nl-title font-bold text-center text-2xl">{title}</h1>
        <p class="nl-description font-light text-center text-sm pt-2 max-w-96 mx-auto">{description}</p>
      </div>

      <div class="max-w-52 mx-auto">
        <div class="relative mb-0.5">
          <input
            onInput={handleInputChange}
            type="text"
            class="nl-input peer py-3 px-4 ps-11 block w-full border-transparent rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none dark:border-transparent"
            placeholder="Name"
          />
          <div class="absolute inset-y-0 start-0 flex items-center pointer-events-none ps-4 peer-disabled:opacity-50 peer-disabled:pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke={isAvailable ? "#00cc00" : "currentColor"} class="flex-shrink-0 w-4 h-4 text-gray-500">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </div>
        </div>
        {/* {inputStatus && (
          <p class={classError}>{textError}</p>
        )} */}
        <div class="mb-0.5">
          {/*<select class="nl-select border-transparent py-3 px-4 pe-9 block w-full rounded-lg text-sm disabled:opacity-50 disabled:pointer-events-none">*/}
          {/*  <option selected value="@nsec.app">*/}
          {/*    @nsec.app*/}
          {/*  </option>*/}
          {/*</select>*/}
          <nl-select
            onSelectDomain={handleDomainSelect}
            theme={theme}
            darkMode={darkMode}
            selected={0}
            options={servers}
          ></nl-select>
        </div>
        <p class='nl-title font-light text-sm mb-2'>
          Choose a service to
          manage your Nostr keys.
        </p>
        <button
          disabled={isFetching}
          onClick={handleCreateAccount}
          type="button"
          class="nl-button py-2.5 px-3 w-full inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg  disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
        >
          {isFetching ? (
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
                d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
              />
            </svg>
          )}
          Create an account
        </button>
      </div>

      <div class="ps-4 pe-4 overflow-y-auto">
        <p class="nl-error font-light text-center text-sm max-w-96 mx-auto">{error}</p>
      </div>

      <div class="p-4 overflow-y-auto">
        <p class="nl-footer font-light text-center text-sm pt-3 max-w-96 mx-auto">
          If you already have an account please{' '}
          <span onClick={() => handleClickToSignIn()} class="cursor-pointer text-blue-400">
            log in
          </span>
          .
        </p>
      </div>
    </div>
  );
};
