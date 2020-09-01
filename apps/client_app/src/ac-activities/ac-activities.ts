import { property, html, css, customElement } from 'lit-element';
import { nothing } from 'lit-html';

import 'lit-virtualizer';

import { YpBaseElementWithLogin } from '../@yrpri/yp-base-element-with-login.js';
import { LitVirtualizer, RangeChangeEvent } from 'lit-virtualizer';
import { ShadowStyles } from '../@yrpri/ShadowStyles.js';

@customElement('ac-activities')
export class AcActivities extends YpBaseElementWithLogin {
  @property({ type: Boolean })
  disableNewPosts = false;

  @property({ type: Boolean })
  noRecommendedPosts = true;

  @property({ type: Boolean })
  gotInitialData = false;

  @property({ type: Array })
  activities: Array<AcActivityData> | undefined;

  @property({ type: Number })
  domainId: number | undefined;

  @property({ type: Number })
  communityId: number | undefined;

  @property({ type: Number })
  groupId: number | undefined;

  @property({ type: Number })
  postId: number | undefined;

  @property({ type: Number })
  postGroupId: number | undefined;

  @property({ type: Number })
  userId: number | undefined;

  @property({ type: String })
  mode: 'activities' | 'news_feeds' = 'activities';

  @property({ type: String })
  url: string | undefined;

  @property({ type: Object })
  latestProcessedActivityAt: Date | undefined;

  @property({ type: Object })
  oldestProcessedActivityAt: Date | undefined;

  @property({ type: Number })
  activityIdToDelete: number | undefined;

  @property({ type: Array })
  recommendedPosts: Array<YpPostData> | undefined;

  _moreToLoad = false;

  static get prsoperties() {
    return {
      ironListPaddingTop: {
        type: Number,
        computed:
          '_ironListPaddingTop(wide, groupId, hasLoggedInUser, selectedTab)',
      },

      domainId: {
        type: Number,
        observer: '_domainIdChanged',
      },

      communityId: {
        type: Number,
        observer: '_communityIdChanged',
      },

      groupId: {
        type: Number,
        observer: '_groupIdChanged',
      },

      postId: {
        type: Number,
        observer: '_postIdChanged',
      },
    };
  }

  static get styles() {
    return [
      super.styles,
      ShadowStyles,
      css`
        :host {
          height: 100%;
        }

        iron-list {
          height: 100vh;
        }

        .addNewsBox {
          background-color: #fff;
          width: 550px;
          height: 100%;
          padding-left: 16px;
          padding-right: 16px;
          margin-top: 16px;
          margin-left: 16px;
          margin-right: 16px;
        }

        @media (max-width: 600px) {
          .addNewsBox {
            width: 100%;
            height: 100%;
            margin-bottom: 8px;
            margin-top: 8px;
            margin-left: 0;
            margin-right: 0;
            width: -webkit-calc(100% - 16px);
            width: -moz-calc(100% - 16px);
            width: calc(100% - 16px);
          }
        }

        @media (max-width: 340px) {
          .addNewsBox {
            width: 100%;
            height: 100%;
            margin-bottom: 8px;
            margin-top: 8px;
            margin-left: 0;
            margin-right: 0;
            width: -webkit-calc(100% - 36px);
            width: -moz-calc(100% - 36px);
            width: calc(100% - 36px);
          }
        }

        .activityContainer {
          width: 550px;
          margin: 0;
          padding: 0;
        }

        @media (max-width: 600px) {
          .activityContainer {
            width: 100%;
          }
        }

        .recommendedPosts[not-active] {
          display: none;
        }

        .recommendedPosts[small] {
          display: none;
        }

        .mainActivityContent {
          height: 100% !important;
        }

        .headerUserImage {
          padding-top: 16px;
        }

        h1 {
          font-size: 24px;
        }

        mwc-button {
          color: var(--accent-color);
        }

        iron-icon {
          width: 48px;
          height: 48px;
          padding-top: 14px;
        }

        .createdAt {
          color: #777;
          margin-top: 16px;
          font-size: 14px;
        }

        yp-ajax {
          background-color: var(--primary-background-color);
        }

        .deleteIcon {
          position: absolute;
          right: 8px;
          bottom: 8px;
          color: #ddd;
        }

        .withCursor {
          cursor: pointer;
        }

        .activityContainer {
          width: 100%;
        }

        @media (max-width: 960px) {
          .recommendedPosts {
            display: none !important;
          }
        }

        .topLevelActivitiesContainer[wide] {
        }

        [hidden] {
          display: none !important;
        }

        .spinnerContainer {
          margin-top: 32px;
        }

        .topSpinnerContainer {
          margin-top: 16px;
        }

        :focus {
          outline: none;
        }

        .notLoggedInButton {
          margin-top: 8px;
          width: 250px;
          background-color: #fff;
          margin-bottom: 8px;
          text-align: center;
        }

        .topLevelActivitiesContainer[rtl] {
          direction: rtl;
        }
      `,
    ];
  }

  renderItem(activity: AcActivityData) {
    return html`
      <div tabindex="${this.tabIndex}" class="layout vertical center-center">
        <ac-activity
          .hasLoggedInUser="${this.isLoggedIn}"
          class="activityContainer"
          .activity="${activity}"
          .postId="${this.postId}"
          .groupId="${this.groupId}"
          .communityId="${this.communityId}"
          .domainId="${this.domainId}"
          @ak-delete-activity="${this._deleteActivity}"></ac-activity>
      </div>
    `;
  }

  render() {
    return html`
      <div
        class="layout horizontal topLevelActivitiesContainer layout-center-center"
        wide="${this.wide}"
        rtl?="${this.rtl}">
        <div class="layout vertical self-start">
          ${this.loggedInUser
            ? html`
                <div
                  .loggedInUser="${this.isLoggedIn}"
                  elevation="1"
                  class="layout horizontal addNewsBox shadow-elevation-2dp shadow-transition">
                  <yp-point-news-story-edit
                    .domainId="${this.domainId}"
                    .communityId="${this.communityId}"
                    .groupId="${this.groupId}"
                    .postGroupId="${this.postGroupId}"
                    .postId="${this.postId}"
                    @refresh="${this.loadNewData}">
                  </yp-point-news-story-edit>
                </div>
              `
            : html`
                <div class="layout vertical center-center">
                  <mwc-button
                    raised
                    class="layout horizontal notLoggedInButton"
                    .label="${this.t('loginToShareALink')}"
                    @click="${this._openLogin}">
                  </mwc-button>
                </div>
              `}
          ${this.activities
            ? html`
                <lit-virtualizer
                  .items=${this.activities}
                  .scrollTarget="${window}"
                  id="activitiesList"
                  .scrollOffset="${this.ironListPaddingTop}"
                  .renderItem=${this.renderItem}
                  @rangechange=${this.scrollEvent}></lit-virtualizer>
              `
            : nothing}
        </div>

        <div
          class="layout vertical self-start recommendedPosts"
          ?notActive="${this.noRecommendedPosts}"
          small="${!this.wide}"
          ?hidden="${!this.recommendedPosts}">
          <ac-activity-recommended-posts
            id="recommendedPosts"
            .recommendedPosts="${this.recommendedPosts}"
            class="layout vertical"></ac-activity-recommended-posts>
        </div>
      </div>
    `;
  }

  scrollEvent(event: RangeChangeEvent) {
    //TODO: Check this logic
    if (
      this.activities &&
      !this._moreToLoad &&
      event.lastVisible != -1 &&
      event.lastVisible < this.activities.length &&
      event.lastVisible + 3 >= this.activities.length
    ) {
      this._moreToLoad = true;
      this._loadMoreData();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.addListener('yp-point-deleted', this._pointDeleted);
    this.addListener(
      'yp-refresh-activities-scroll-threshold',
      this._clearScrollThreshold
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeListener('yp-point-deleted', this._pointDeleted);
    this.removeListener(
      'yp-refresh-activities-scroll-threshold',
      this._clearScrollThreshold
    );
  }

  _openLogin() {
    this.fire('yp-open-login');
  }

  _pointDeleted(event: CustomEvent) {
    if (this.activities) {
      for (let i = 0; i < this.activities.length; i++) {
        if (this.activities[i].Point) {
          if (this.activities[i].Point!.id == event.detail.pointId) {
            this._removeActivityId(this.activities[i].id);
          }
        }
      }
    }
  }

  get wideListOffset() {
    if (this.groupId) {
      return '800';
    } else {
      return '415';
    }
  }

  get ironListResizeScrollThreshold() {
    if (this.wide) {
      return 800;
    } else {
      return 300;
    }
  }

  //TODO: Look into if this is needed
  get ironListPaddingTop() {
    let offset = (this.$$('#activitiesList') as HTMLElement).offsetTop;
    offset -= 75;

    if (!this.isLoggedIn && !this.groupId) offset -= 75;

    if (offset > 0) {
      console.info('News scroll offset: ' + offset);
      return offset;
    } else {
      if (this.groupId) {
        if (this.wide) {
          offset = this.isLoggedIn ? 700 : 580;
        } else {
          offset = this.isLoggedIn ? 950 : 690;
        }
      } else {
        if (this.wide) {
          offset = this.isLoggedIn ? 600 : 400;
        } else {
          offset = this.isLoggedIn ? 700 : 610;
        }
      }
      console.info('News (manual) scroll offset: ' + offset);
      return offset;
    }
  }

  //TODO: See what this is and if its needed
  /*get skipIronListWidth() {
    if (this.wide) {
      const list = this.$$("#activitiesList");
      list.style.width = '600px';
      list.updateViewportBoundaries();
      setTimeout( () => {
        list.notifyResize();
      }, 50);
    }
    return this.wide;
  }*/

  _activityDeletedResponse(event: CustomEvent) {
    this._removeActivityId(event.detail.response.activityId);
  }

  _removeActivityId(activityId: number) {
    if (this.activities) {
      for (let i = 0; i < this.activities.length; i++) {
        if (this.activities[i].id == activityId) {
          this.activities.splice(i, 1);
        }
      }
    }
    //TODO: See if this needed
    //this.$$("#activitiesList").fire("iron-resize");
  }

  _deleteActivity(event: CustomEvent) {
    this.activityIdToDelete = event.detail.id;
    //TODO: Make work
    /*window.appDialogs.getDialogAsync("confirmationDialog", (dialog) => {
      dialog.open(this.t('activity.confirmDelete'), this._reallyDelete.bind(this));
    });*/
  }

  async _reallyDelete() {
    let type, collectionId;
    if (this.domainId) {
      type = 'domains';
      collectionId = this.domainId;
    } else if (this.communityId) {
      type = 'communities';
      collectionId = this.communityId;
    } else if (this.groupId) {
      type = 'groups';
      collectionId = this.groupId;
    } else if (this.postId) {
      type = 'posts';
      collectionId = this.postId;
    } else if (this.userId) {
      type = 'users';
      collectionId = this.postId;
    }

    if (type && collectionId && this.activityIdToDelete) {
      await window.serverApi.deleteActivity(
        type,
        collectionId,
        this.activityIdToDelete
      );
      this.activityIdToDelete = undefined;
    } else {
      console.error('No activity found to delete');
    }
  }

  _generateRequest(typeId: number, typeName: string) {
    if (typeId) {
      this.activities = [];
      this.oldestProcessedActivityAt = undefined;
      this.noRecommendedPosts = true;
      this._moreToLoad = true;
      //TODO: Add a minimum threshold of filtering before enabling dynamic news_feeds again
      if (window.appUser && window.appUser.user && !this.postId) {
        this.mode = 'news_feeds';
      } else {
        this.mode = 'activities';
      }

      this.url = '/api/' + this.mode + '/' + typeName + '/' + typeId;

      this._loadMoreData();

      if (typeName != 'posts') {
        this._getRecommendations(typeName, typeId);
      }
    }
  }

  async _loadMoreData() {
    if (this.url && this._moreToLoad && this.oldestProcessedActivityAt) {
      console.log('_loadMoreData for scroll 3');
      this._moreToLoad = false;
      console.info(
        '_loadMoreData for scroll for domainId: ' +
          this.domainId +
          ' communityId: ' +
          this.communityId +
          ' groupId: ' +
          this.groupId +
          ' postId: ' +
          this.postId
      );
      let url = this.url;
      if (this.oldestProcessedActivityAt)
        url += '?beforeDate=' + this.oldestProcessedActivityAt;
      this._activitiesResponse(
        (await window.serverApi.getAcActivities(url)) as AcActivitiesResponse
      );
    } else {
      console.warn('Trying to load more activities without conditions');
    }
  }

  async loadNewData() {
    if (this.url && this.latestProcessedActivityAt) {
      let url = this.url;
      if (this.oldestProcessedActivityAt)
        url = url + '?afterDate=' + this.latestProcessedActivityAt;
      this._activitiesResponse(
        (await window.serverApi.getAcActivities(url)) as AcActivitiesResponse
      );
    } else if (this.url && !this.latestProcessedActivityAt) {
      this._activitiesResponse(
        (await window.serverApi.getAcActivities(
          this.url
        )) as AcActivitiesResponse
      );
    }
  }

  _domainIdChanged() {
    if (this.domainId) {
      this.activities = undefined;
      this.recommendedPosts = undefined;
      this._generateRequest(this.domainId, 'domains');
    }
  }

  _communityIdChanged() {
    if (this.communityId) {
      this.activities = undefined;
      this.recommendedPosts = undefined;
      this._generateRequest(this.communityId, 'communities');
    }
  }

  _groupIdChanged() {
    if (this.groupId) {
      this.activities = undefined;
      this.recommendedPosts = undefined;
      this._generateRequest(this.groupId, 'groups');
    }
  }

  _postIdChanged() {
    if (this.postId) {
      this.activities = undefined;
      this.recommendedPosts = undefined;
      this._generateRequest(this.postId, 'posts');
    }
  }

  _userIdChanged() {
    if (this.userId) {
      this.activities = undefined;
      this.recommendedPosts = undefined;
      this._generateRequest(this.userId, 'users');
    }
  }

  _clearScrollThreshold() {
    //TODO: Do we need this?
    //this.$$("#scrollTheshold").clearTriggers();
  }

  async _getRecommendations(typeName: string, typeId: number) {
    let allowRecommendations = true;
    if (this.activities && this.activities.length > 0) {
      if (
        this.activities[0].Group &&
        this.activities[0].Group.configuration &&
        this.activities[0].Group.configuration.hideRecommendationOnNewsFeed
      ) {
        allowRecommendations = false;
      }
      if (
        this.activities[0].Community &&
        this.activities[0].Community.configuration &&
        this.activities[0].Community.configuration.hideRecommendationOnNewsFeed
      ) {
        allowRecommendations = false;
      }
    }
    if (allowRecommendations) {
      this.recommendedPosts = await window.serverApi.getRecommendations(
        typeName,
        typeId
      );
      this.noRecommendedPosts = false;
    } else {
      this.noRecommendedPosts = true;
    }
  }

  _preProcessActivities(activities: Array<AcActivityData>) {
    for (let i = 0; i < activities.length; i++) {
      if (activities[i].Point) {
        activities[i].Point!.latestContent = activities[
          i
        ].Point!.PointRevisions![
          activities[i].Point!.PointRevisions!.length - 1
        ].content;
      }
    }
    return activities;
  }

  _activitiesResponse(activitiesResponse: AcActivitiesResponse) {
    const activities = this._preProcessActivities(
      activitiesResponse.activities
    );

    this.gotInitialData = true;

    if (activitiesResponse.oldestProcessedActivityAt) {
      this.oldestProcessedActivityAt =
        activitiesResponse.oldestProcessedActivityAt;
    } else {
      console.warn('Have not set oldestProcessedActivityAt');
    }

    for (let i = 0; i < activities.length; i++) {
      if (this.url!.indexOf('afterDate') > -1) {
        this.activities?.unshift(activities[i]);
      } else {
        this.activities?.push(activities[i]);
      }
    }

    console.info('Activities length: ' + activities.length);
    if (this.activities && this.activities.length > 0) {
      if (
        !this.latestProcessedActivityAt ||
        this.latestProcessedActivityAt < activities[0].created_at
      ) {
        this.latestProcessedActivityAt = activities[0].created_at;
      }
      if (!this.latestProcessedActivityAt) {
        console.error('Have not set latest processed activity at');
      } else {
        console.log(
          'latestProcessedActivityAt: ' + this.latestProcessedActivityAt
        );
      }
      this._moreToLoad = true;
      if (
        this.activities.length < 15 ||
        (activities.length < 3 && this.activities.length < 100)
      ) {
        this._loadMoreData();
      }
    }

    this.fireGlobal('yp-refresh-activities-scroll-threshold', {});

    setTimeout(() => {
      //TODO: Check out
      //this.$$("#activitiesList").fire('iron-resize');
    });
  }

  scrollToItem(item: AcActivityData) {
    console.log('Activity scrolling to item');
    //TODO: Get workgin
    //(this.$$('#activitiesList') as LitVirtualizer).scrollToItem(item);
  }

  fireResize() {
    console.log('fireResize');
    //TODO: Is this needed
    //this.$$("#activitiesList").fire('iron-resize');
  }
}
