import '@polymer/polymer/polymer-legacy.js';
import '@polymer/iron-image/iron-image.js';
import 'lite-signal/lite-signal.js';
import '@polymer/paper-fab/paper-fab.js';
import '@material/mwc-button';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
import '../yp-ajax/yp-ajax.js';
import '../yp-post/yp-post-header.js';
import '../yp-point/yp-point.js';
import { ypNumberFormatBehavior } from '../yp-behaviors/yp-number-format-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom.js';
import { YpBaseElement } from '../yp-base-element.js';
import { YpFlexLayout } from '../yp-flex-layout.js';

class YpContentModerationLit extends YpBaseElement {
  static get properties() {
    return {
      multiSortEnabled: {
        type: Boolean,
        value: false
      },

      items: {
        type: Array,
        notify: true,
        value: null
      },

      headerText: {
        type: String
      },

      groupId: {
        type: Number,
        observer: '_groupIdChanged'
      },

      domainId: {
        type: Number,
        observer: '_domainIdChanged'
      },

      communityId: {
        type: Number,
        observer: '_communityIdChanged'
      },

      userId: {
        type: Number,
        observer: '_userIdChanged'
      },

      selected: {
        type: Object
      },

      modelType: {
        type: String
      },

      opened: {
        type: Boolean,
        value: false
      },

      selectedItems: {
        type: Array,
        notify: true
      },

      selectedItemsCount: {
        type: Number,
        value: 0
      },

      selectedItemsEmpty: {
        type: Boolean,
        value: true
      },

      selectedItemIdsAndType: {
        type: Array
      },

      selectedItemId: {
        type: String
      },

      selectedModelClass: {
        type: String
      },

      totalItemsCount: {
        type: String,
        computed: '_totalItemsCount(items)'
      },

      collectionName: String,

      itemsCountText: String,

      resizeTimeout: {
        type: Object,
        value: null
      },

      activeItem: {
        type: Object,
        observer: '_activeItemChanged'
      },

      typeOfModeration: {
        type: String,
        value: "/flagged_content"
      },

      onlyFlaggedItems: {
        type: Boolean,
        computed: '_onlyFlaggedItems(typeOfModeration)'
      },

      showReload: {
        type: Boolean,
        value: false
      },

      forceSpinner: {
        type: Boolean,
        value: false
      },

      spinnerActive: {
        type: Boolean,
        computed: '_spinnerActive(totalItemsCount, forceSpinner)'
      }
    }
  }

  static get styles() {
    return [
      css`

      #dialog {
        width: 100%;
        height: 100%;
        margin: 0;
        top: unset !important;
        left: unset !important;
        background-color: #FFF;
      }

      .itemItem {
        padding-right: 16px;
      }

      .id {
        width: 40px;
      }

      .name {
        width: 200px;
      }

      .email {
        width: 190px;
        overflow-wrap: break-word;
      }

      .addDeletedButtons {
        width: 150px;
      }

      [hidden] {
        display: none !important;
      }

      paper-listbox {
        margin-right: 8px !important;
      }

      .headerBox {
        background-color: var(--accent-color);
        color: #FFF;
        margin: 0;
        padding: 0 0;
        padding-top: 12px;
        padding-bottom: 10px;
      }

      mwc-button {
        margin-left: 8px;
      }

      #grid {
        margin-top: 0;
      }

      .headerText {
        padding: 0 0 !important;
      }

      .collectionName {
        font-size: 22px;
        margin-bottom: 1px;
        margin-top: 4px;
      }

      .innerHeader {
        font-size: 17px;
        color: #F5F5F5;
      }

      .closeButton {
        width: 50px;
        height: 50px;
        margin-left: 4px;
        margin-right: 4px;
      }

      paper-checkbox {
        color: #FFF !important;
        margin-top: 16px;
        margin-right: 24px;
        --primary-color: #FFF;
        --primary-text-color: #FFF;
        --paper-checkbox-checked-ink-color: #FFF;
        --paper-checkbox-unchecked-ink-color: #FFF;
      }

      @media (max-width: 600px) {
        .closeButton {
          width: 45px;
          height: 45px;
        }

        paper-listbox {
          margin-right: 8px;
        }

        #dialog {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }

        .headerText {
          font-size: 20px;
          line-height: 1.2em;
          text-align: center;
        }
      }

      .details {
        display: flex;
        margin: 8px;
      }

      yp-point {
        min-height: 100px;
        max-width: 500px;
        margin-bottom: 8px;
      }

      yp-post-header {
        margin-bottom: 8px;
      }

      mwc-button {
        font-size: 18px;
        margin-top: 16px;
      }

      .analysis {
        margin-top: 12px;
        color: #656565;
      }

      .leftColumn {
        padding-right: 16px;
      }

      .mainScore {
        color: #000;
      }

      paper-spinner {
        margin-left: 20px;
        margin-top: 8px;
        --paper-spinner-layer-1-color: #FFF;
        --paper-spinner-layer-2-color: #FFF;
        --paper-spinner-layer-3-color: #FFF;
        --paper-spinner-layer-4-color: #FFF;
      }

      .linkIcon {
        color: #000;
      }
      `, YpFlexLayout]
  }

  render() {
    return html`
    <paper-dialog id="dialog" modal>
      <div class="layout horizontal headerBox wrap">
        <div>
          <paper-icon-button .ariaLabel="${this.t('close')}" id="dismissBtn" .icon="close" class="closeButton" .dialogDismiss></paper-icon-button>
        </div>

        <div class="headerText layout vertical">
          <div class="layout horizontal">
            <div class="collectionName">${this.collectionName}</div>
          </div>
          <div class="innerHeader">${this.headerText}
            <span ?hidden="${!this.totalItemsCount}">(${this.totalItemsCount} ${this.itemsCountText})</span>
          </div>
        </div>
        <div ?hidden="${!this.spinnerActive}"><paper-spinner active></paper-spinner></div>
        <div class="flex"></div>
        <div class="checkBox" ?hidden="${this.narrow}"><paper-checkbox ?checked="${this.multiSortEnabled}">${this.t('multiSortEnabled')}</paper-checkbox></div>
        <div ?hidden="${!this.showReload}">
          <paper-icon-button .ariaLabel="${this.t('reload')}" .icon="autorenew" class="closeButton" @click="${this._reload}"></paper-icon-button>
        </div>
      </div>

      <vaadin-grid id="grid" .multiSort="${this.multiSortEnabled}" .activeItem="${this.activeItem}" .ariaLabel="${this.headerText}" .items="${this.items}" .selectedItems="${this.selectedItems}">
        <vaadin-grid-selection-column>
        </vaadin-grid-selection-column>

        <template class="row-details">
          <div class="details layout vertical center-center detailArea">
            <div class="layout horizontal">

              ${this.item.is_post ? html`
                <div class="layout vertical center-center">
                  <yp-post-header .hideActions="" .post="${this.item}" .postName="${this.item.name}" .headerMode=""></yp-post-header>
                  <a href="/post/${this.item.id}" target="_blank"><paper-icon-button .ariaLabel="${this.t('linkToContentItem')}" class="linkIcon" .icon="link"></paper-icon-button></a>
                </div>
              ` : html``}

              ${this.item.is_point ? html`
                <div class="layout vertical center-center">
                  <yp-point .hideActions .point="${this.item}"></yp-point>
                  <a ?hidden="${!this.item.post_id}" href="/post/[[item.post_id]]/${this.item.id}" target="_blank"><paper-icon-button .ariaLabel="${this.t('linkToContentItem')}" class="linkIcon" .icon="link"></paper-icon-button></a>
                </div>
              ` : html``}

            </div>
            <div ?hidden="${!this.item.toxicityScore}" class="layout horizontal analysis">
              <div class="layout vertical leftColumn" ?hidden="${this.userId}">
                <div class="mainScore" ?hidden="${!this.item.moderation_data.moderation.toxicityScore}">Toxicity Score: ${this._toPercent(item.moderation_data.moderation.toxicityScore)}</div>
                <div ?hidden="${!this.item.moderation_data.moderation.identityAttackScore}">Identity Attack Score: ${this._toPercent(item.moderation_data.moderation.identityAttackScore)}</div>
                <div ?hidden="${!this.item.moderation_data.moderation.identityAttachScore}">Identity Attack Score: ${this._toPercent(item.moderation_data.moderation.identityAttachScore)}</div>
                <div ?hidden="${!this.item.moderation_data.moderation.threatScore}">Threat Score: ${this._toPercent(item.moderation_data.moderation.threatScore)}</div>
                <div ?hidden="${!this.item.moderation_data.moderation.insultScore}">Insult Score: ${this._toPercent(item.moderation_data.moderation.insultScore)}</div>
              </div>
              <div class="layout vertical" ?hidden="${this.userId}">
                <div class="mainScore" ?hidden="${!this.item.moderation_data.moderation.severeToxicityScore}">Severe Toxicity Score: ${this._toPercent(item.moderation_data.moderation.severeToxicityScore)}</div>
                <div ?hidden="${!this.item.moderation_data.moderation.profanityScore}">Profanity Score: ${this._toPercent(item.moderation_data.moderation.profanityScore)}</div>
                <div ?hidden="${!this.item.moderation_data.moderation.sexuallyExplicitScore}">Sexually Excplicit Score: ${this._toPercent(item.moderation_data.moderation.sexuallyExplicitScore)}</div>
                <div ?hidden="${!this.item.moderation_data.moderation.flirtationScore}">Flirtation Score: ${this._toPercent(item.moderation_data.moderation.flirtationScore)}</div>
              </div>
            </div>
          </div>
        </template>

        <vaadin-grid-sort-column width="130px" .flexGrow="0" .path="firstReportedDate" .header="${this.t('firstReported')}" ?hidden="${this.onlyFlaggedItems}">
          <template>${this.item.firstReportedDateFormatted}</template>
        </vaadin-grid-sort-column>

        <vaadin-grid-sort-column width="130px" .flexGrow="0" .path="lastReportedAtDate" .header="${this.t('lastReported')}" ?hidden="${this.userId}">
          <template>${this.item.lastReportedAtDateFormatted}</template>
        </vaadin-grid-sort-column>

        <vaadin-grid-sort-column width="100px" .textAlign="start" .flexGrow="0" .path="type" .header="${this.t('type')}">
          <template>${this._getType(item.type)}</template>
        </vaadin-grid-sort-column>

        <vaadin-grid-sort-column width="120px" .textAlign="start" .flexGrow="0" .path="status" .header="${this.t('publishStatus')}">
          <template>${this.item.status}</template>
        </vaadin-grid-sort-column>

        <vaadin-grid-sort-column width="80px" .textAlign="center" .flexGrow="0" .path="counter_flags" .header="${this.t('flags')}" ?hidden="${this.userId}">
          <template>${this.item.counter_flags}</template>
        </vaadin-grid-sort-column>

        <vaadin-grid-sort-column width="130px" .textAlign="start" .flexGrow="0" .path="source" .header="${this.t('source')}" ?hidden="${!this.onlyFlaggedItems}">
          <template>${this.item.source}</template>
        </vaadin-grid-sort-column>

        <vaadin-grid-sort-column width="100px" .textAlign="center" .flexGrow="0" .path="toxicityScoreRaw" .header="${this.t('toxicityScore')}?" ?hidden="${this.userId}">
          <template>${this.item.toxicityScore}</template>
        </vaadin-grid-sort-column>

        <vaadin-grid-sort-column width="150px" .textAlign="start" .flexGrow="1" .path="groupName" .header="${this.t('groupName')}" ?hidden="${!this.userId}">
          <template>${this.item.groupName}</template>
        </vaadin-grid-sort-column>

        <vaadin-grid-filter-column width="200px" .flexGrow="4" .path="content" .header="${this.t('content')}" ?hidden="${this.narrow}">
          <template>
            <div class="layout horizontal">
              <yp-magic-text .contentId="${this.item.id}" .content="${this.item.pointTextContent}" .textType="pointContent"></yp-magic-text>
              <yp-magic-text .contentId="${this.item.id}" .content="${this.item.postNameContent}" .textType="postName"></yp-magic-text> &nbsp;
              <yp-magic-text .contentId="${this.item.id}" .content="${this.item.postTextContent}" .textType="postContent"></yp-magic-text> &nbsp;
              <yp-magic-text .contentId="${this.item.id}" .content="${this.item.postTranscriptContent}" .textType="postTranscriptContent"></yp-magic-text>
            </div>
          </template>
        </vaadin-grid-filter-column>

        <vaadin-grid-filter-column .flexGrow="1" .path="user_email" width="150px" .header="${this.t('creator')}" ?hidden="${this.userId}">
          <template>${this.item.user_email}</template>
        </vaadin-grid-filter-column>

        <vaadin-grid-filter-column .flexGrow="0" .path="lastReportedByEmail" width="150px" .header="${this.t('flaggedBy')}" ?hidden="${!this.onlyFlaggedItems}">
        </vaadin-grid-filter-column>

        <vaadin-grid-column width="70px" .flexGrow="0">
          <template class="header">
            <paper-menu-button .horizontalAlign="right" class="helpButton" ?disabled="${this.selectedItemsEmpty}">
              <paper-icon-button .ariaLabel="${this.t('openSelectedItemsMenu')}" .icon="more-vert" .slot="dropdown-trigger"></paper-icon-button>
              <paper-listbox slot="dropdown-content" @iron-select="${this._menuSelection}">

                ${!this.selectedItemsEmpty ? html`
                  <paper-item data-args="${this.item.id}" ?hidden="${this.userId}" @tap="${this._approveSelected}">
                    ${this.t('approveSelectedContent')} ${this.selectedItemsCount}
                  </paper-item>
                  <paper-item data-args="${this.item.id}" ?hidden="${!this.onlyFlaggedItems}" @tap="${this._clearSelectedFlags}">
                    ${this.t('clearSelectedFlags')} ${this.selectedItemsCount}
                  </paper-item>
                  <paper-item data-args="${this.item.id}" ?hidden="${this.userId}" @tap="${this._blockSelected}">
                    ${this.t('blockSelectedContent')} ${this.selectedItemsCount}
                  </paper-item>
                  <paper-item data-args="${this.item.id}" ?hidden="${!this.userId}" @tap="${this._anonymizeSelected}">
                    ${this.t('anonymizeSelectedContent')} ${this.selectedItemsCount}
                  </paper-item>
                  <paper-item data-args="${this.item.id}" @tap="${this._deleteSelected}">
                    ${this.t('deleteSelectedContent')} ${this.selectedItemsCount}
                  </paper-item>
                ` : html``}

              </paper-listbox>
            </paper-menu-button>
          </template>
          <template>
            <paper-menu-button horizontal-align="right" class="helpButton">
              <paper-icon-button .ariaLabel="${this.t('openOneItemMenu')}" .icon="more-vert" data-args="${this.item.id}" @tap="${this._setSelected}" slot="dropdown-trigger"></paper-icon-button>
              <paper-listbox slot="dropdown-content" @iron-select="${this._menuSelection}">
                <paper-item data-args="${this.item.id}" data-model-class="${this.item.type}" ?hidden="${this.userId}" @tap="${this._approve}">
                  ${this.t('approveContent')}
                </paper-item>
                <paper-item data-args="${this.item.id}" data-model-class="${this.item.type}" ?hidden="${!this.onlyFlaggedItems}" @tap="${this._clearFlags}">
                  ${this.t('clearFlags')}
                </paper-item>
                <paper-item data-args="${this.item.id}" data-model-class="${this.item.type}" ?hidden="${this.userId}" @tap="${this._block}">
                  ${this.t('blockContent')}
                </paper-item>
                <paper-item data-args="${this.item.id}" data-model-class="${this.item.type}" ?hidden="${!this.userId}" @tap="${this._anonymize}">
                  ${this.t('anonymizeContent')}
                </paper-item>
                <paper-item data-args="${this.item.id}" data-model-class="${this.item.type}" @tap="${this._delete}">
                  ${this.t('deleteContent')}
                </paper-item>
              </paper-listbox>
            </paper-menu-button>
          </template>
        </vaadin-grid-column>
      </vaadin-grid>
    </paper-dialog>

    <div class="layout horizontal center-center">
      <yp-ajax id="ajax" @response="${this._itemsResponse}" @error="${this._ajaxError}"></yp-ajax>
      <yp-ajax .method="DELETE" id="singleItemAjax" @error="${this._ajaxError}" @response="${this._singleItemResponse}"></yp-ajax>
      <yp-ajax .method="DELETE" id="manyItemsAjax" @error="${this._ajaxError}" @response="${this._manyItemsResponse}"></yp-ajax>
    </div>
    <iron-media-query query="(max-width: 600px)" query-matches="${this.narrow}"></iron-media-query>
`
  }


  /*
    behaviors: [
      ypNumberFormatBehavior
    ],

    observers: [
      '_selectedItemsChanged(selectedItems.splices)'
    ],

  */

  _spinnerActive(count, force) {
    return !count || force
  }


  _ajaxError() {
    this.set('forceSpinner', false);
  }

  _reload() {
    this.$$("#ajax").generateRequest();
    this.set('forceSpinner', true);
  }

  _onlyFlaggedItems(typeOfModeration) {
    return typeOfModeration==="/flagged_content";
  }

  _manyItemsResponse() {
    this.set('forceSpinner', false);
    this.set('showReload', true);
    window.appGlobals.notifyUserViaToast(this.t('operationInProgressTryReloading'));
  }

  _singleItemResponse() {
    this._reload();
  }

  _getType(type) {
    if (type==='post')
      return this.t('posts.post');
    else if (type==='point')
      return this.t('point.point');
  }

  _activeItemChanged(item, oldItem) {
    if (item) {
      this.$$("#grid").openItemDetails(item);
    }

    if (oldItem) {
      this.$$("#grid").closeItemDetails(oldItem);
    }
  }

  _menuSelection(event, detail) {
    const allMenus = this.$$("#grid").querySelectorAll("paper-listbox");
    allMenus.forEach(function (item) {
      item.select(null);
    });
  }

  connectedCallback() {
    super.connectedCallback()
      this._setGridSize();
      window.addEventListener("resize", this._resizeThrottler.bind(this), false);
  }

  _toPercent(number) {
    if (number) {
      return Math.round(number*100)+'%';
    } else {
      return null;
    }
  }

  _resizeThrottler() {
    if ( !this.resizeTimeout ) {
      this.resizeTimeout = setTimeout(function() {
        this.resizeTimeout = null;
        this._setGridSize();
      }.bind(this), 66);
    }
  }

  _setGridSize() {
    if (window.innerWidth<=600) {
      this.$$("#grid").style.width = (window.innerWidth).toFixed()+'px';
      this.$$("#grid").style.height = (window.innerHeight).toFixed()+'px';
    } else {
      this.$$("#grid").style.width = (window.innerWidth-16).toFixed()+'px';
      this.$$("#grid").style.height = (window.innerHeight).toFixed()+'px';
    }
  }

  _totalItemsCount(items) {
    if (items) {
      return this.formatNumber(items.length);
    } else {
      return null;
    }
  }

  _selectedItemsChanged() {
    if (this.selectedItems && this.selectedItems.length>0) {
      this.set('selectedItemsEmpty', false);
      this.set('selectedItemsCount', this.selectedItems.length);
    } else {
      this.set('selectedItemsEmpty', true);
      this.set('selectedItemsCount', 0);
    }
    this.selectedItemIdsAndType = this.selectedItems.map(function (item) { return { id: item.id, modelType: item.type }});
  }

  _setupItemIdFromEvent(event) {
    const itemId = event.target.parentElement.getAttribute('data-args');
    if (!itemId)
      itemId = event.target.getAttribute('data-args');
    this.set('selectedItemId', itemId);
    const modelClass = event.target.parentElement.getAttribute('data-model-class');
    if (!modelClass)
      modelClass = event.target.getAttribute('data-model-class');
    this.set('selectedModelClass', modelClass);
  }

  _deleteSelected(event) {
    this._setupItemIdFromEvent(event);
    dom(document).querySelector('yp-app').getDialogAsync("confirmationDialog", function (dialog) {
      dialog.open(this.t('areYouSureDeleteSelectedContent'), this._reallyDeleteSelected.bind(this), true, true);
    }.bind(this));
  }

  _reallyDeleteSelected() {
    this._ajaxMaster(this.$$("#manyItemsAjax"), 'delete', this.selectedItemIdsAndType);
  }

  _delete(event) {
    this._setupItemIdFromEvent(event);
    dom(document).querySelector('yp-app').getDialogAsync("confirmationDialog", function (dialog) {
      dialog.open(this.t('areYouSureDeleteContent'), this._reallyDelete.bind(this), true, false);
    }.bind(this));
  }

  _reallyDelete() {
    this._ajaxMaster(this.$$("#singleItemAjax"), 'delete');
  }

  _anonymizeSelected(event) {
    this._setupItemIdFromEvent(event);
    dom(document).querySelector('yp-app').getDialogAsync("confirmationDialog", function (dialog) {
      dialog.open(this.t('areYouSureAnonymizeSelectedContent'), this._reallyAnonymizeSelected.bind(this), true, true);
    }.bind(this));
  }

  _reallyAnonymizeSelected() {
    this._ajaxMaster(this.$$("#manyItemsAjax"), 'anonymize', this.selectedItemIdsAndType);
  }

  _anonymize(event) {
    this._setupItemIdFromEvent(event);
    dom(document).querySelector('yp-app').getDialogAsync("confirmationDialog", function (dialog) {
      dialog.open(this.t('areYouSureAnonymizeContent'), this._reallyAnonymize.bind(this), true, false);
    }.bind(this));
  }

  _reallyAnonymize() {
    this._ajaxMaster(this.$$("#singleItemAjax"), 'anonymize');
  }

  _approve(event) {
    this._setupItemIdFromEvent(event);
    this._ajaxMaster(this.$$("#singleItemAjax"), 'approve');
  }

  _approveSelected(event) {
    this._setupItemIdFromEvent(event);
    this._ajaxMaster(this.$$("#manyItemsAjax"), 'approve', this.selectedItemIdsAndType);
  }

  _block(event) {
    this._setupItemIdFromEvent(event);
    this._ajaxMaster(this.$$("#singleItemAjax"), 'block');
  }

  _blockSelected(event) {
    this._setupItemIdFromEvent(event);
    this._ajaxMaster(this.$$("#manyItemsAjax"), 'block', this.selectedItemIdsAndType);
  }

  _clearFlags(event) {
    this._setupItemIdFromEvent(event);
    this._ajaxMaster(this.$$("#singleItemAjax"), 'clearFlags');
  }

  _clearSelectedFlags(event) {
    this._setupItemIdFromEvent(event);
    this._ajaxMaster(this.$$("#manyItemsAjax"), 'clearFlags', this.selectedItemIdsAndType);
  }

  _ajaxMaster(ajax, action, itemIdsAndType) {
    let url, collectionId;
    if (this.modelType==="groups" && this.groupId) {
      collectionId = this.groupId;
    } else if (this.modelType==="communities" && this.communityId) {
      collectionId = this.communityId;
    } else if (this.modelType==="domains" && this.domainId) {
      collectionId = this.domainId;
    } else if (this.modelType==="users" && this.userId) {
      collectionId = this.userId;
    } else {
      console.error("Can't find model type or ids");
      return;
    }
    if (itemIdsAndType && itemIdsAndType.length>0) {
      url = "/api/" + this.modelType + "/" + collectionId + "/" +action+ "/process_many_moderation_item";
      ajax.body = { items: itemIdsAndType };
    } else if (this.selectedItemId) {
      url = "/api/" + this.modelType + "/" + collectionId + "/" + this.selectedItemId+ '/'+this.selectedModelClass+'/'+action+"/process_one_moderation_item" ;
      ajax.body = {};
    } else {
      console.error("No item ids to process");
      return;
    }
    ajax.url = url;
    ajax.generateRequest();
    this.set('forceSpinner', true);

    if (this.selectedItemId) {
      const item = this._findItemFromId(this.selectedItemId);
      if (item)
        this.$$("#grid").deselectItem(item);
      this.selectedItemId = null;
      this.selectedModelClass = null;
    }
  }

  _setSelected(event) {
    const item = this._findItemFromId(event.target.getAttribute('data-args'));
    if (item) {
      this.$$("#grid").selectItem(item);
    }
  }

  _findItemFromId(id) {
    let foundItem;
    this.items.forEach(function (item) {
      if (item.id==id) {
        foundItem = item;
      }
    }.bind(this));
    return foundItem;
  }

  _domainIdChanged(newDomainId) {
    if (newDomainId) {
      this._reset();
      this.set('modelType', 'domains');
      this._generateRequest(newDomainId);
    }
  }

  _groupIdChanged(newGroupId) {
    if (newGroupId) {
      this._reset();
      this.set('modelType', 'groups');
      this._generateRequest(newGroupId);
    }
  }

  _communityIdChanged(newCommunityId) {
    if (newCommunityId) {
      this._reset();
      this.set('modelType', 'communities');
      this._generateRequest(newCommunityId);
    }
  }

  _userIdChanged(userId) {
    if (userId) {
      this._reset();
      this.set('modelType', 'users');
      this._generateRequest(userId);
    }
  }

  _generateRequest(id) {
    this.$$("#ajax").url = "/api/"+this.modelType+"/"+id+this.typeOfModeration;
    this.$$("#ajax").generateRequest();
  }

  _itemsResponse(event, detail) {
    this.set('forceSpinner', false);
    this.set('items', detail.response);
    this._resetSelectedAndClearCache();
  }

  setup(groupId, communityId, domainId, typeOfModeration, userId) {
    if (typeOfModeration) {
      this.set('typeOfModeration', typeOfModeration);
    } else {
      this.set('typeOfModeration', "/flagged_content");
    }

    this.set('groupId', null);
    this.set('communityId', null);
    this.set('domainId', null);
    this.set('userId', null);
    this.set('items', null);

    if (groupId)
      this.set('groupId', groupId);

    if (communityId)
      this.set('communityId', communityId);

    if (domainId)
      this.set('domainId', domainId);

    if (userId)
      this.set('userId', userId);

    this._setupHeaderText();
  }

  open(name) {
    this.set('collectionName', name);
    this.set('opened', true);
    this.$$("#dialog").open();
  }

  _reset() {
    this.set('items', null);
    this._resetSelectedAndClearCache();
  }

  _resetSelectedAndClearCache() {
    this.set('selectedItemsCount', 0);
    this.set('selectedItemsEmpty', true);
    this.set('selectedItemIdsAndType', []);
    this.set('selectedItems', []);
    this.$$("#grid").clearCache();
  }

  _setupHeaderText() {
    if (this.onlyFlaggedItems) {
      this.set('itemsCountText', this.t('contentItemsFlagged'));
    } else {
      this.set('itemsCountText', this.t('items'));
    }
    if (this.groupId) {
      this.set('headerText', this.t('groupContentModeration'));
    } else if (this.communityId) {
      this.set('headerText', this.t('communityContentModeration'));
    } else if (this.domainId) {
      this.set('headerText', this.t('domainContentModeration'));
    } else if (this.userId) {
      this.set('headerText', this.t('userContentModeration'));
    }
  }
}

window.customElements.define('yp-content-moderation-lit', YpContentModerationLit)
