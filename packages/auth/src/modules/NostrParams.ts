import { Info } from 'nostr-login-components/dist/types/types';
import NDK, { NDKNip46Signer } from '@nostr-dev-kit/ndk';
import { NostrLoginOptions, TypeBanner, TypeModal } from '../types';

class NostrParams {
  public nostrExtension: undefined;
  public userInfo: Info | null;
  public signer: NDKNip46Signer | null;
  public ndk: NDK;
  public optionsModal: NostrLoginOptions;
  public profileNdk: NDK;
  public signerPromise: Promise<void> | null;
  public launcherPromise: Promise<void> | null;
  public callCount: number;
  public callTimer: number | undefined;
  public banner: TypeBanner | null;
  public popup: Window | null;
  public modal: TypeModal | null;
  public listNotifies: string[];
  constructor() {
    this.nostrExtension = undefined;
    this.userInfo = null;
    this.signer = null;
    this.popup = null;
    this.modal = null;
    this.banner = null;
    this.signerPromise = null;
    this.listNotifies = [];
    this.launcherPromise = null;
    this.callCount = 0;
    this.callTimer = undefined;
    this.ndk = new NDK({
      enableOutboxModel: false,
    });
    this.profileNdk = new NDK({
      enableOutboxModel: true,
      explicitRelayUrls: ['wss://relay.nostr.band/all', 'wss://purplepag.es'],
    });
    this.profileNdk.connect();

    this.optionsModal = {
      theme: 'default',
      startScreen: 'welcome',
      devOverrideBunkerOrigin: '',
    };
  }
}

export default NostrParams;
