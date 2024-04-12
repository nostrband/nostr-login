import { bunkerUrlToInfo, getBunkerUrl } from '../utils';
import { AuthNostrService, NostrParams } from './index';
import Modal from './Modal';

class AccountService {
  private authNostrService: AuthNostrService;
  private params: NostrParams;
  constructor(params: NostrParams, authNostrService: AuthNostrService) {
    this.authNostrService = authNostrService;
    this.params = params;
  }

  public async createAccount(nip05: string) {
    const [name, domain] = nip05.split('@');
    // we're gonna need it
    // ensurePopup();

    // bunker's own url
    const bunkerUrl = await getBunkerUrl(`_@${domain}`, this.params.optionsModal);
    console.log("create account bunker's url", bunkerUrl);

    // parse bunker url and generate local nsec
    const info = bunkerUrlToInfo(bunkerUrl);

    // init signer to talk to the bunker (not the user!)
    await this.authNostrService.initSigner(info, { preparePopup: true, leavePopup: true });

    const params = [
      name,
      domain,
      '', // email
      this.params.optionsModal.perms || '',
    ];

    // due to a buggy sendRequest implementation it never resolves
    // the promise that it returns, so we have to provide a
    // callback and wait on it
    console.log('signer', this.params.signer);
    const r = await new Promise(ok => {
      this.params.signer!.rpc.sendRequest(info.pubkey, 'create_account', params, undefined, ok);
    });

    console.log('create_account pubkey', r);
    // @ts-ignore
    if (r.result === 'error') {
      // @ts-ignore
      throw new Error(r.error);
    }

    return {
      // @ts-ignore
      bunkerUrl: `bunker://${r.result}?relay=${info.relays?.[0]}`,
      sk: info.sk, // reuse the same local key
    };
  }
}

export default AccountService;
