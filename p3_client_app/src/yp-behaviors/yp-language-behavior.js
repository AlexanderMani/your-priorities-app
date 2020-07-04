import '@polymer/polymer/polymer-legacy.js';

/** @polymerBehavior Polymer.ypLanguageBehavior */
export const ypLanguageBehavior = {

  properties: {
    t: {
      type: Function,
      computed: '_translate(loadedLanguage)'
    },

    language: {
      type: String,
      value: null
    },

    loadedLanguage: {
      type: String,
      value: null
    }
  },

  _setupRtl: function () {
    if (YpMagicTextBox.rtlLanguages.indexOf(this.language) >-1 ) {
      this.set('rtl', true);
    } else {
      this.set('rtl', false);
    }
  },

  ready: function () {
    if (window.i18nTranslation) {
      this.set('loadedLanguage', window.locale);
      this.set('language', window.locale);

      if (this.rtl!==undefined) {
        this._setupRtl();
      }
    }
  },

  _languageEvent: function (event, detail) {
    if (detail.type == 'language-loaded') {
      //console.log("Loaded: "+detail.language+" for "+this.is+" current: "+this.language);
      this.set('loadedLanguage', detail.language);
      this.set('language', detail.language);
      window.locale = detail.language;

      if (this.rtl!==undefined) {
        this._setupRtl();
      }
    }
  },

  _translate: function (language) {
    return function() {
      var key = arguments[0];
      if (window.i18nTranslation) {
        var translation = window.i18nTranslation.t(key);
        if (translation=='')
          translation = key;
        return translation;
      } else {
        return key;
        //console.warn("Translation system i18n not initialized for "+key);
      }
    };
  },
};
