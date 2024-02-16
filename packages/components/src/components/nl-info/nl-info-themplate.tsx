import { FunctionalComponent, h } from '@stencil/core';

interface NlInfoThemplateProps {
  handleClickToBack: () => void;
}

export const NlInfoThemplate: FunctionalComponent<NlInfoThemplateProps> = ({ handleClickToBack }) => {
  return (
    <div class="p-4">
      <button
        onClick={() => handleClickToBack()}
        type="button"
        class="nl-action-button flex justify-center items-center w-7 h-7 text-sm font-semibold rounded-full border border-transparent  dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
        data-hs-overlay="#hs-vertically-centered-modal"
      >
        <span class="sr-only">Back</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="flex-shrink-0 w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </button>
      <div class="p-4 overflow-y-auto">
        <svg class="w-12 h-12 mx-auto mb-2" width="225" height="224" viewBox="0 0 225 224" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="224.047" height="224" rx="64" fill="#6951FA" />
          <path
            d="M162.441 135.941V88.0593C170.359 85.1674 176 77.5348 176 68.6696C176 57.2919 166.708 48 155.33 48C143.953 48 134.661 57.2444 134.661 68.6696C134.661 77.5822 140.302 85.1674 148.219 88.0593V135.941C147.698 136.13 147.176 136.367 146.655 136.604L87.3956 77.3452C88.6282 74.6904 89.2919 71.7511 89.2919 68.6696C89.2919 57.2444 80.0474 48 68.6696 48C57.2919 48 48 57.2444 48 68.6696C48 77.5822 53.6415 85.1674 61.5585 88.0593V135.941C53.6415 138.833 48 146.465 48 155.33C48 166.708 57.2444 176 68.6696 176C80.0948 176 89.3393 166.708 89.3393 155.33C89.3393 146.418 83.6978 138.833 75.7807 135.941V88.0593C76.3022 87.8696 76.8237 87.6326 77.3452 87.3956L136.604 146.655C135.372 149.31 134.708 152.249 134.708 155.33C134.708 166.708 143.953 176 155.378 176C166.803 176 176.047 166.708 176.047 155.33C176.047 146.418 170.406 138.833 162.489 135.941H162.441Z"
            fill="white"
          />
        </svg>
        <h1 class="nl-title font-bold text-center text-4xl">
          Nostr <span class="font-light">Login</span>
        </h1>
        <p class="text-green-800 dark:text-green-200 font-light text-center text-lg pt-2 max-w-96 mx-auto">Version: 1.0.8</p>
        <p class="nl-description font-light text-center text-lg pt-2 max-w-96 mx-auto">
          Learn more about Nostr{' '}
          <a target="_blank" href="https://nostr.how">
            here
          </a>
          .<br />
          This is an{' '}
          <a target="_blank" href="https://github.com/nostrband/nostr-login">
            open-source
          </a>{' '}
          tool by{' '}
          <a target="_blank" href="https://nostr.band">
            Nostr.Band
          </a>
          .
        </p>
      </div>
    </div>
  );
};
