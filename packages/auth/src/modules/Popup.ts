import { NostrParams } from './';

class Popup {
  private params: NostrParams;

  constructor(params: NostrParams) {
    this.params = params;
  }

  public ensurePopup(url?: string) {
    // user might have closed it already
    if (!this.params.popup || this.params.popup.closed) {
      // NOTE: do not set noreferrer, bunker might use referrer to
      // simplify the naming of the connected app.
      // NOTE: do not pass noopener, otherwise null is returned
      // and we can't pre-populate the Loading... message,
      // instead we set opener=null below
      this.params.popup = window.open(url, '_blank', 'width=400,height=700');
      console.log('popup', this.params.popup);
      if (!this.params.popup) throw new Error('Popup blocked. Try again, please!');

      // emulate noopener without passing it
      this.params.popup.opener = null;
    }

    // initial state
    // popup.document.write('Loading...');
  }

  public closePopup() {
    // make sure we release the popup
    try {
      this.params.popup?.close();
      this.params.popup = null;
    } catch {}
  }
}

export default Popup;
