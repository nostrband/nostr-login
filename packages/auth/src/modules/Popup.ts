class Popup {
  private popup: Window | null = null;

  constructor() {}

  public openPopup(url: string) {
    // user might have closed it already
    if (!this.popup || this.popup.closed) {
      // NOTE: do not set noreferrer, bunker might use referrer to
      // simplify the naming of the connected app.
      // NOTE: do not pass noopener, otherwise null is returned
      this.popup = window.open(url, '_blank', 'width=400,height=700');
      console.log('popup', this.popup);
      if (!this.popup) throw new Error('Popup blocked. Try again, please!');
    }
  }

  public closePopup() {
    // make sure we release the popup
    try {
      this.popup?.close();
      this.popup = null;
    } catch {}
  }
}

export default Popup;
