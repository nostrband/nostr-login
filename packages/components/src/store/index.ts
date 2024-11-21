import { createStore } from '@stencil/store';
import { CURRENT_MODULE, ConnectionString } from '@/types';

const { state, onChange, reset } = createStore({
  screen: CURRENT_MODULE.WELCOME,
  prevScreen: CURRENT_MODULE.WELCOME,
  path: [CURRENT_MODULE.WELCOME],
  error: '',
  isLoading: false,
  isLoadingExtension: false,
  isOTP: false,
  authUrl: '',
  iframeUrl: '',
  localSignup: false,

  // State NlSignin
  nlSignin: {
    loginName: '',
  },

  // State NlSignup
  nlSignup: {
    signupName: '',
    domain: '',
    servers: [
      { name: '@nsec.app', value: 'nsec.app' },
      { name: '@highlighter.com', value: 'highlighter.com' },
    ],
  },

  // State NlSigninBunkerUrl
  nlSigninBunkerUrl: {
    loginName: '',
  },

  // State NlSigninReadOnly
  nlSigninReadOnly: {
    loginName: '',
  },

  // State NlSigninOTP
  nlSigninOTP: {
    loginName: '',
    code: '',
  },

  nlImport: null as (ConnectionString | null),
});

// control show screens & manage history (like as router)
// ??? edit to better solution
onChange('screen', () => {
  state.error = '';
  state.nlSignin.loginName = '';
  state.nlSignup.signupName = '';
  state.nlSignup.domain = '';

  // if (value === CURRENT_MODULE.LOGIN || value === CURRENT_MODULE.SIGNUP || value === CURRENT_MODULE.LOGIN_BUNKER_URL || value === CURRENT_MODULE.LOGIN_READ_ONLY) {
  //   state.prevScreen = CURRENT_MODULE.WELCOME;
  // }
});

// on('set', (_, value, oldValue) => {
//   if (value === CURRENT_MODULE.INFO) {
//     state.prevScreen = oldValue;
//   }
// });

export { state, reset };
