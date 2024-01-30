import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import tailwind, { tailwindHMR, setPluginConfigurationDefaults } from 'stencil-tailwind-plugin';
import tailwindcss from 'tailwindcss';
import tailwindConf from './tailwind.config';
import autoprefixer from 'autoprefixer';

setPluginConfigurationDefaults({
  tailwindConf,
  tailwindCssPath: './src/styles/tailwind.css',
  postcss: {
    plugins: [
      tailwindcss(),
      autoprefixer()
    ]
  }
});

export const config: Config = {
  namespace: 'components',
  outputTargets: [
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
    },
    {
      type: "www",
      buildDir: 'build'
    }
  ],
  testing: {
    browserHeadless: "new",
  },
  plugins: [
    sass(),
    tailwind(),
    tailwindHMR()
  ],
};
