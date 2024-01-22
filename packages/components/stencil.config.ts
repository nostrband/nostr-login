import { Config } from '@stencil/core';
import tailwind, { tailwindHMR } from 'stencil-tailwind-plugin';

export const config: Config = {
  namespace: 'components',
  outputTargets: [
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
    },
  ],
  testing: {
    browserHeadless: "new",
  },
  plugins: [
    tailwind(),
    tailwindHMR(),
  ],
};
