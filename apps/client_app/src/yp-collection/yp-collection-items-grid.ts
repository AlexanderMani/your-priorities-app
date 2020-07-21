import { property, html, css, customElement } from 'lit-element';
import { YpBaseElement } from '../@yrpri/yp-base-element.js';
import { ShadowStyles } from '../@yrpri/ShadowStyles.js';
import { YpIronListHelpers } from '../@yrpri/YpIronListHelpers.js';
import { YpCollectionHelpers } from '../@yrpri/YpCollectionHelpers.js';

@customElement('yp-collection-items-grid')
export class YpCollectionItemsGrid extends YpBaseElement {
  @property({ type: Object })
  collection: YpCollectionData | undefined;

  @property({ type: Array })
  collectionItems: Array<YpCollectionData> | undefined;

  @property({ type: String })
  collectionItemType: string | undefined;

  @property({ type: Array })
  sortedCollectionItems: Array<YpCollectionData> | undefined;

  resetListSize: Function | undefined;
  skipIronListWidth = false;

  static get styles() {
    return [
      super.styles,
      ShadowStyles,
      css`
        .card {
          padding: 0;
          padding-top: 16px;
        }

        .card[wide-padding] {
          padding: 16px !important;
        }

        iron-list {
          height: 100vh;
        }

        a {
          text-decoration: none;
          width: 100%;
        }
      `,
    ];
  }

  render() {
    return html`
      <iron-list
        id="ironList"
        selection-enabled
        .scrollOffset="${this._scrollOffset}"
        @selected-item-changed="${this._selectedItemChanged}"
        .items="${this.sortedCollectionItems}"
        as="item"
        scroll-target="document"
        ?grid="${this.wide}"
        role="list">
        <template>
          <div
            class="card layout vertical center-center"
            ?wide-padding="${this.wide}"
            tabindex="[[index]]"
            role="listitem"
            aria-level="2"
            aria-label="[[item.name]]">
            <a
              href="/${this.collectionItemType}/[[item.id]]"
              class="layout vertical center-center">
              <yp-collection-item-card
                item="[[item]]"></yp-community-card
              >
            </a>
          </div>
        </template>
      </iron-list>
    `;
  }

  firstUpdated(changedProperties: Map<string | number | symbol, unknown>) {
    super.firstUpdated(changedProperties);
    YpIronListHelpers.attachListeners(this as YpElementWithIronList);
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.collection && this.collectionItems) {
      const splitCommunities = YpCollectionHelpers.splitByStatus(
        this.collectionItems,
        this.collection.configuration
      );
      this.sortedCollectionItems = splitCommunities.featured.concat(
        splitCommunities.active.concat(splitCommunities.archived)
      );
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    YpIronListHelpers.detachListeners(this as YpElementWithIronList);
  }

  // TODO: Make sure this fires each time on keyboard, mouse & phone - make sure back key on browser works also just with the A
  _selectedItemChanged(event: CustomEvent) {
    const detail = event.detail;

    if (this.collectionItemType && detail) {
      window.appGlobals.activity(
        'open',
        this.collectionItemType,
        `/${this.collectionItemType}/${detail.item.id}`,
        { id: detail.item.id }
      );

      if (this.collectionItemType === 'community') {
        const community = detail.item as YpCommunityData;
        window.appGlobals.cache.backToDomainCommunityItems[
          community.domain_id
        ] = community;
      } else if (this.collectionItemType === 'group') {
        const group = detail.item as YpGroupData;
        window.appGlobals.cache.backToCommunityGroupItems[
          group.community_id
        ] = group;
        window.appGlobals.cache.groupItemsCache[group.id] = group;
      }
    }
  }

  get _scrollOffset() {
    const list = this.$$('#ironList');
    if (list) {
      let offset = list.offsetTop;
      offset -= 100;
      if (!this.wide) offset += 75;
      if (list.offsetTop > 0 && offset > 0) {
        console.info('Community list scroll offset: ' + offset);
        return offset;
      } else {
        if (this.wide) offset = 390;
        else offset = 610;
        console.info('Community list (manual) scroll offset: ' + offset);
        return offset;
      }
    } else {
      console.warn('No community list for scroll offset');
      return null;
    }
  }

  scrollToItem(item: YpDatabaseItem) {
    console.log('Community grid scrolling to item');
    (this.$$('#ironList') as IronListInterface).scrollToItem(item);
    this.fireGlobal('yp-refresh-activities-scroll-threshold');
  }
}
