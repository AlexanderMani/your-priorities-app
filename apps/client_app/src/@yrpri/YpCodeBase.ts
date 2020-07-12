import { LitElement } from 'lit-element';

export class YpCodeBase {

  language: string|null = null

  constructor() {
    this.addGlobalListener('language-loaded', this._languageEvent);
  }

  _languageEvent(event: CustomEvent) {
    const detail = event.detail;
    this.language = detail.language;
    window.appGlobals.locale = detail.language;
  }

  fire(eventName: string, data: object|string = {}, target: LitElement|Document) {
    const event = new CustomEvent(eventName, { detail: data, bubbles: true, composed: true });
    target.dispatchEvent(event);
  }

  fireGlobal(eventName: string, data: object|string = {}) {
    this.fire(eventName, data, document);
  }

  addListener(name: string, callback: Function, target: LitElement|Document) {
    target.addEventListener(name, callback as EventListener, false);
  }

  addGlobalListener(name: string, callback: Function) {
    this.addListener(name, callback, document);
  }

  removeListener(name: string, callback: Function, target: LitElement|Document) {
    target.removeEventListener(name, callback as EventListener);
  }

  removeGlobalListener(name: string, callback: Function) {
    this.removeListener(name, callback, document);
  }

  t(...args: Array<string>) {
    return function() {
      const key = args[0];
      if (window.appGlobals.i18nTranslation) {
        let translation = window.appGlobals.i18nTranslation.t(key);
        if (translation=='')
          translation = key;
        return translation;
      } else {
        return key;
        //console.warn("Translation system i18n not initialized for "+key);
      }
    };
  }
}