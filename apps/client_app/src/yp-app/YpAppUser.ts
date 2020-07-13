/* eslint-disable @typescript-eslint/camelcase */
import { YpServerApi } from '../@yrpri/YpServerApi.js';
import { YpCodeBase } from '../@yrpri/YpCodeBase.js';
import { YpAccessHelpers } from '../@yrpri/YpAccessHelpers.js';

export class YpAppUser extends YpCodeBase {
  serverApi: YpServerApi;

  loginForAcceptInviteParams: {
    token: string;
    editDialog: HTMLElement;
  }|null = null;

  loginForEditParams: {
    editDialog: HTMLElement;
    newOrUpdate: boolean;
    params: object;
    refreshFunction: Function;
   }|null = null;

  loginForNewPointParams: {
    postPointsElement: HTMLElement;
    params: { value: string; content: string };
  }|null = null;

  loginForEndorseParams: {
    postActionElement: HTMLElement;
    params: { value: string; content: string };
  }|null = null;

  loginForRatingsParams: {
    postActionElement: HTMLElement;
  }|null = null;

  loginForPointQualityParams: {
    pointActionElement: HTMLElement;
    params: { value: string; content: string };
  }|null = null;

  loginForMembershipParams: {
    membershipActionElement: HTMLElement;
    params: { value: string; content: string };
  }|null = null;

  loginFor401refreshFunction: Function|null = null;

  loginForNotificationSettingsParams = false;

  toastLoginTextCombined: string|null = null;

  toastLogoutTextCombined: string|null = null;

  user: YpUser|null = null;
  //TODO:   observer: "_onUserChanged"

  endorsementPostsIndex: Record<number, YpEndorsement> = {};

  ratingPostsIndex: Record<number, Record<number,YpRating>> = {};

  membershipsIndex: Record<string, Record<number,boolean>> = {};

  pointQualitiesIndex: Record<number, YpPointQuality> = {};

  adminRights: YpAdminRights|null = null;

  memberships: YpMemberships|null = null;

  completeExternalLoginText: string|null = null;

  isPollingForLogin = false

  lastLoginMethod: string|null = null;

  facebookPopupWindow: Window|null = null;

  samlPopupWindow: Window|null = null;

  pollingStartedAt: number|null = null;

  hasIssuedLogout = false;

  sessionPrefix = 'session_';

  sessionStorage = window.localStorage;

  constructor(serverApi: YpServerApi) {
    super();
    this.serverApi = serverApi;
    if (!window.location.pathname.startsWith("/survey/")) {
      this.checkLogin();
    } else {
      console.log("Not checking login in survey mode");
    }
    this.addGlobalListener('yp-forgot-password', this._forgotPassword);
    this.addGlobalListener('yp-reset-password', this._resetPassword);
  }

  sessionHas(key: string) {
    const prefixed_key = this.sessionPrefix + key;
    const value = this.sessionStorage.getItem(prefixed_key);
    return value !== null;
  }

  sessionGet (key: string) {
    const prefixed_key = this.sessionPrefix + key;
    const value = this.sessionStorage.getItem(prefixed_key);
    let parsed;
    if (value) {
      try {
        parsed = JSON.parse(value);
      } catch (e) {
        parsed = null;
      }
    }
    return parsed;
  }

  sessionSet (key: string, value: string|object) {
    const prefixed_key = this.sessionPrefix + key;
    const stringfied = JSON.stringify(value);
    this.sessionStorage.setItem(prefixed_key, stringfied);
  }

  sessionUnset(key: string) {
    const prefixed_key = this.sessionPrefix + key;
    this.sessionStorage.removeItem(prefixed_key);
  }

  sessionClear () {
    this.sessionStorage.clear();
  }

  loginForAcceptInvite(editDialog: HTMLElement, token: string, email: string, collectionConfiguration: object) {
    this.loginForAcceptInviteParams = { editDialog: editDialog, token: token };
    this.openUserlogin(email, collectionConfiguration);
  }

  loginForEdit(editDialog: HTMLElement, newOrUpdate: boolean, params: object, refreshFunction: Function) {
    this.loginForEditParams = { editDialog: editDialog, newOrUpdate: newOrUpdate,
                                params: params, refreshFunction: refreshFunction };
    this.openUserlogin();
  }

  loginForNewPoint(postPointsElement: HTMLElement, params: { value: string; content: string }) {
    this.loginForNewPointParams = { postPointsElement: postPointsElement, params: params };
    this.openUserlogin();
  }

  loginForEndorse(postActionElement: HTMLElement, params: { value: string; content: string }) {
    this.loginForEndorseParams = { postActionElement: postActionElement, params: params };
    this.openUserlogin();
  }

  loginForRatings(postActionElement: HTMLElement) {
    this.loginForRatingsParams = { postActionElement: postActionElement };
    this.openUserlogin();
  }

  loginForPointQuality(pointActionElement: HTMLElement, params: { value: string; content: string }) {
    this.loginForPointQualityParams = { pointActionElement: pointActionElement, params: params };
    this.openUserlogin();
  }

  loginForMembership(membershipActionElement: HTMLElement, params: { value: string; content: string }) {
    this.loginForMembershipParams = { membershipActionElement: membershipActionElement, params: params };
    this.openUserlogin();
  }

  loginFor401(refreshFunction: Function) {
    this.loginFor401refreshFunction=refreshFunction;
    this.openUserlogin();
  }

  loginForNotificationSettings() {
    this.loginForNotificationSettingsParams=true;
    this.openUserlogin();
  }

  openUserlogin(email: string|null = null, collectionConfiguration: object|null = null) {
    window.app.getDialogAsync("userLogin", (dialog) => {
      dialog.setup(this._handleLogin, window.appGlobals.domain);
      dialog.open(null, email, collectionConfiguration);
    });
  }

  autoAnonymousLogin() {
    setTimeout(() => {
      if (this.user==null) {
        window.app.getDialogAsync("userLogin", (dialog) => {
          dialog.setup(this._handleLogin, window.appGlobals.domain);
          dialog.anonymousLogin();
        });
      } else {
        console.log("Not doing auto anon login as user already exists")
      }
    }, 1);
  }

  _closeUserLogin() {
    window.app.closeDialog("userLogin");
  }

  _setUserLoginSpinner() {
    window.app.getDialogAsync("userLogin", (dialog) => {
      dialog.userSpinner = false;
    });
  }

  _handleLogin(user: YpUser) {
    this._closeUserLogin();
    this.setLoggedInUser(user);
    if (user.profile_data && user.profile_data.isAnonymousUser) {
      console.debug("Do not fetch admin or memberships for anonymous users");
    } else {
      this.getAdminRights();
      this.getMemberShips();
      this.toastLoginTextCombined = this.t("user.loginCompleteFor")+ " " + this.user?.name;
      this.fireGlobal('yp-open-toast', { text: this.toastLoginTextCombined  })
    }
    this.fireGlobal("login");
    this._checkLoginForParameters();

    // Redirect to another local service after login, for example the analytics app
    setTimeout(() => {
      if (window.appGlobals.originalQueryParameters && window.appGlobals.originalQueryParameters['raLogin']) {
        window.location.href = window.appGlobals.originalQueryParameters['raLogin'] as string;
      }
    });
  }

  _checkLoginForParameters() {
    if (this.loginForEditParams) {
      const loginParams = this.loginForEditParams;
      window.app.getDialogAsync(loginParams.editDialog, (dialog) => {
        dialog.setup(null, true, loginParams.refreshFunction);
        dialog.open('new', loginParams.params);
        this.loginForEditParams = null;
      });
    } else if (this.loginForNewPointParams) {
      const newPointParams = this.loginForNewPointParams;
      newPointParams.postPointsElement.addPoint(newPointParams.params.content, newPointParams.params.value);
      this.loginForNewPointParams = null;
    } else if (this.loginForEndorseParams) {
      const endorseParams = this.loginForEndorseParams;
      endorseParams.postActionElement.generateEndorsementFromLogin(endorseParams.params.value);
      this.loginForEndorseParams = null;
    } else if (this.loginForRatingsParams) {
      const ratingsParams = this.loginForRatingsParams;
      ratingsParams.postActionElement.openRatingsDialog();
      this.loginForRatingsParams = null;
    } else if (this.loginForPointQualityParams) {
      const pointQualityParams = this.loginForPointQualityParams;
      pointQualityParams.pointActionElement.generatePointQualityFromLogin(pointQualityParams.params.value);
      this.loginForPointQualityParams = null;
    } else if (this.loginForMembershipParams) {
      const membershipParams = this.loginForMembershipParams;
      membershipParams.membershipActionElement.generateMembershipFromLogin(membershipParams.params.value);
      this.loginForMembershipParams = null;
    } else if (this.loginForAcceptInviteParams) {
      const acceptInviteParams = this.loginForAcceptInviteParams;
      window.app.getDialogAsync("acceptInvite", (dialog) => {
        dialog.reOpen(acceptInviteParams.token);
        dialog.afterLogin(acceptInviteParams.token);
        this.loginForAcceptInviteParams = null;
      });
    } else if (this.loginFor401refreshFunction) {
      this.loginFor401refreshFunction();
    } else if (this.loginForNotificationSettingsParams) {
      this.openNotificationSettings();
    }
  }

  openNotificationSettings() {
    window.app.getDialogAsync("userEdit", (dialog) => {
      dialog.setup(window.appUser.user, false, null, true);
      dialog.open('edit', { userId: window.appUser.user?.id });
    });
  }

  _forgotPassword(event: CustomEvent) {
    window.app.getDialogAsync("forgotPassword", (dialog) => {
      dialog.open(event.detail);
    });
  }

  _resetPassword(event: CustomEvent) {
    window.app.getDialogAsync("resetPassword", (dialog) => {
      dialog.open(event.detail);
    });
  }

  getUser() {
    return this.sessionGet('user');
  }

  setLoggedInUser(user: YpUser) {
    this.sessionSet('user', user);
    this.user = user;
    this.fireGlobal('logged-in', this.user);

    // TODO: Look at this. Fire another signal a bit later in case some components had not set up their listeners
    setTimeout(() => {
      this.fireGlobal('logged-in', this.user);
    }, 1000);

    window.appGlobals.analytics.sendLoginAndSignup(user.id, "Login Success", this.lastLoginMethod ? this.lastLoginMethod : 'Email');
    this.lastLoginMethod=null;
    if (user && user.profile_data && user.profile_data.isAnonymousUser) {
      window.appGlobals.setAnonymousUser(user);
    } else {
      window.appGlobals.setAnonymousUser(null);
    }
  }

  removeAnonymousUser() {
    console.log("Remove anon user");
    this.removeUserSession();
  }

  removeUserSession() {
    this.sessionUnset('user');
    this.user=null;
    window.appGlobals.setAnonymousUser(null);
    this.fireGlobal('logged-in', null);
  }

  loggedIn() {
    let isCorrectLoginProviderAndAgency = true;
    if (window.appGlobals.currentForceSaml && window.appGlobals.currentGroup) {
      if (!YpAccessHelpers.checkGroupAccess(window.appGlobals.currentGroup)) {
        if (this.user) {
          if (this.user.loginProvider !== "saml")
            isCorrectLoginProviderAndAgency = false;

          if (window.appGlobals.currentGroup &&
              window.appGlobals.currentGroup.configuration &&
              window.appGlobals.currentGroup.configuration.forceSecureSamlEmployeeLogin) {
            if (!this.user.isSamlEmployee) {
              isCorrectLoginProviderAndAgency = false;
            }
          }
        } else {
          isCorrectLoginProviderAndAgency = false;
        }
      }
    }
    return this.user != null && isCorrectLoginProviderAndAgency;
  }

  async setLocale(locale: string) {
    await this.serverApi.setLocale({ locale: locale });
  }

  cancelLoginPolling() {
    this.pollingStartedAt = null;
  }

  _closeAllPopups() {
    if (this.facebookPopupWindow) {
      try {
        this.facebookPopupWindow.close();
      } catch (error) {
        console.error(error);
      }
      this.facebookPopupWindow = null;
    }
    if (this.samlPopupWindow) {
      try {
        this.samlPopupWindow.close();
      } catch (error) {
        console.error(error);
      }
      this.samlPopupWindow = null;
    }
  }

  async pollForLogin() {
    if (this.pollingStartedAt) {
      const user = await this.serverApi.isloggedin() as YpUser|void;
      if (user && user.notLoggedIn===true && this.pollingStartedAt) {
        const timeSpent = (Date.now() - this.pollingStartedAt);
        if (timeSpent<5*60*1000) {
          setTimeout(() => {
            this.pollForLogin();
          }, 1200)
        } else {
          this.pollingStartedAt = null;
        }
      } else if (user && user.name) {
        this.cancelLoginPolling();
        if (this.facebookPopupWindow) {
          this.loginFromFacebook();
        } else if (this.samlPopupWindow) {
          this.loginFromSaml();
        }
        this._closeAllPopups();
      }
    } else {
      console.error("Unkown state in polling...");
      this._closeAllPopups();
      this.cancelLoginPolling();
    }
  }

  startPollingForLogin() {
    this.pollingStartedAt = Date.now();
    setTimeout(() => {
      this.pollForLogin();
    }, 1000);
  }

  loginFromFacebook() {
    this.cancelLoginPolling();
    this.lastLoginMethod='Facebook';
    this._completeExternalLogin(this.t('user.loggedInWithFacebook'));
  }

  loginFromSaml() {
    this.cancelLoginPolling();
    this.lastLoginMethod='Saml2';
    this._completeExternalLogin(this.t('user.loggedInWithSaml'));
  }

  _completeExternalLogin(fromString: string) {
    this.checkLogin();
    this._setUserLoginSpinner();
    this.completeExternalLoginText=fromString;
  }

  checkLogin() {
    this.isloggedin();
    this.getMemberShips();
    this.getAdminRights();
  }

  recheckAdminRights() {
    this.getAdminRights();
  }

  updateEndorsementForPost(postId: number, newEndorsement: YpEndorsement) {
    if (this.user) {
      if (!this.user.Endorsements) {
        this.user.Endorsements = [];
      }
      let hasChanged = false;
      for(let i=0; i<this.user.Endorsements.length; i++) {
        if (this.user.Endorsements[i].post_id===postId) {
          if (newEndorsement) {
            this.user.Endorsements[i] = newEndorsement;
          } else {
            this.user.Endorsements.splice(i, 1);
          }
          hasChanged = true;
          break;
        }
      }
      if (!hasChanged && newEndorsement)
        this.user.Endorsements.push(newEndorsement);
      this._updateEndorsementPostsIndex(this.user);
    } else {
      console.error("Can't find user for updateEndorsementForPost");
    }
  }

  _updateEndorsementPostsIndex(user: YpUser) {
    if (user && user.Endorsements && user.Endorsements.length>0) {
      this.endorsementPostsIndex = {};
      for(let i=0; i<user.Endorsements.length; i++){
        this.endorsementPostsIndex[ user.Endorsements[i].post_id ] = user.Endorsements[i];
      }
    } else {
      this.endorsementPostsIndex = {}
    }
  }

  _updateRatingPostsIndex(user: YpUser) {
    if (user && user.Ratings && user.Ratings.length>0) {
      this.ratingPostsIndex = {};
      for(let i=0; i<user.Ratings.length; i++){
        if (!this.ratingPostsIndex[ user.Ratings[i].post_id ])
          this.ratingPostsIndex[ user.Ratings[i].post_id ] = {};
        this.ratingPostsIndex[ user.Ratings[i].post_id ][user.Ratings[i].type_index] = user.Ratings[i];
      }
    } else {
      this.ratingPostsIndex = {}
    }
  }

  updateRatingForPost(postId: number, typeIndex: number, newRating: YpRating) {
    if (this.user) {
      if (!this.user.Ratings) {
        this.user.Ratings = [];
      }

      let hasChanged = false;
      for(let i=0; i<this.user.Ratings.length; i++) {
        if (this.user.Ratings[i].post_id===postId && this.user.Ratings[i].type_index===typeIndex) {
          if (newRating) {
            this.user.Ratings[i] = newRating;
          } else {
            this.user.Ratings.splice(i, 1);
          }
          hasChanged = true;
          break;
        }
      }
      if (!hasChanged && newRating)
        this.user.Ratings.push(newRating);
      this._updateRatingPostsIndex(this.user);
    } else {
      console.error("Can't find user for updateRatingForPost");
    }
  }

  updatePointQualityForPost(pointId: number, newPointQuality: YpPointQuality) {
    if (this.user) {
      if (this.user.PointQualities) {
        let hasChanged = false;
        for(let i=0; i<this.user.PointQualities.length; i++) {
          if (this.user.PointQualities[i].point_id===pointId) {
            if (newPointQuality) {
              this.user.PointQualities[i] = newPointQuality;
            } else {
              this.user.PointQualities.splice(i, 1);
            }
            hasChanged = true;
            break;
          }
        }
        if (hasChanged)
          this._updateEndorsementPostsIndex(this.user);
      }
    }  else {
      console.error("Can't find user for updatePointQualityForPost");
    }
  }

  _updatePointQualitiesIndex(user: YpUser) {
    if (user && user.PointQualities && user.PointQualities.length>0) {
      this.pointQualitiesIndex = {};
      for(let i=0; i<user.PointQualities.length; i++){
        this.pointQualitiesIndex[ user.PointQualities[i].point_id ] = user.PointQualities[i];
      }
    } else {
      this.pointQualitiesIndex = {}
    }
  }

  _onUserChanged(user: YpUser|null) {
    this.fireGlobal("yp-user-changed", user);
    if (user) {
      this._updateEndorsementPostsIndex(user);
      this._updatePointQualitiesIndex(user);
      this._updateRatingPostsIndex(user);
      this.fireGlobal('got-endorsements-and-qualities', true);
    }
  }

  async logout() {
    this.hasIssuedLogout = true;
    await this.serverApi.logout() as void;
    this.toastLogoutTextCombined = this.t("user.logoutCompleteFor")+ " " + this.user?.name;
    this.fireGlobal('yp-open-toast', { text: this.toastLogoutTextCombined });
    this.fireGlobal('yp-close-right-drawer', true);
    this.removeUserSession();
    this.recheckAdminRights();
  }

  async isloggedin() {
    const user = await this.serverApi.isloggedin() as YpUser|void;

    if (user && user.notLoggedIn===true) {
      this.removeUserSession();
    } else if (user && user.name && user.profile_data && user.profile_data.isAnonymousUser) {
      setTimeout(() => {
        if (window.appGlobals.currentAnonymousGroup) {
          this.setLoggedInUser(user);
        } else {
          window.appGlobals.setAnonymousUser(user);
        }
      }, 500);
    } else if (user && user.name) {
      this.setLoggedInUser(user);
    }

    if (user && user.missingEmail) {
      window.app.getDialogAsync("missingEmail", (dialog) => {
        dialog.open(user.loginProvider);
      });
    } else if (user && user.profile_data &&
               user.profile_data.saml_show_confirm_email_completed===false) {
      window.app.getDialogAsync("missingEmail", (dialog) => {
        dialog.open(user.loginProvider, true, user.email);
      });
    }

    if (user) {
      if (user.customSamlDeniedMessage) {
        window.appGlobals.currentSamlDeniedMessage = user.customSamlDeniedMessage;
      } else {
        window.appGlobals.currentSamlDeniedMessage = null;
      }

      if (user.customSamlLoginMessage) {
        window.appGlobals.currentSamlLoginMessage = user.customSamlLoginMessage;
      } else {
        window.appGlobals.currentSamlLoginMessage = null;
      }

      if (user.forceSecureSamlLogin) {
        window.appGlobals.currentForceSaml = true;
      } else {
        window.appGlobals.currentForceSaml = false;
      }
    }

    if (this.completeExternalLoginText) {
      window.appGlobals.notifyUserViaToast(this.completeExternalLoginText);
      this._closeUserLogin();
      this.completeExternalLoginText=null;
      this._checkLoginForParameters();
    }
  }

  async getAdminRights() {
    const response = await this.serverApi.getAdminRights() as YpAdminRights|void|boolean;

    if (response) {
      this.adminRights = response as YpAdminRights;
      this.fireGlobal('got-admin-rights', true);

      //TODO: Fire another signal a bit later in case some components had not set up their listeners TODO: Find a better way
      setTimeout(() => {
        this.fireGlobal('got-admin-rights', true);
      }, 1000);
    } else {
      this.adminRights = null;
      this.fireGlobal('got-admin-rights', false);
    }
  }

  _updateMembershipsIndex(memberships: YpMemberships) {
    if (memberships) {
      let i;
      this.membershipsIndex = { groups: {}, communities: {}, domains: {} };
      for(i=0; i<memberships.GroupUsers.length; i++){
        this.membershipsIndex.groups[ memberships.GroupUsers[i].id ] = true;
      }
      for(i=0; i<memberships.CommunityUsers.length; i++){
        this.membershipsIndex.communities[memberships.CommunityUsers[i].id] = true;
      }
      for(i=0; i<memberships.DomainUsers.length; i++){
        this.membershipsIndex.domains[ memberships.DomainUsers[i].id ] = true;
      }
    } else {
      this.membershipsIndex = { groups: {}, communities: {}, domains: {} };
    }
  }

  async getMemberShips() {
    const response = await this.serverApi.getMemberships() as YpMemberships|void|boolean;
    if (response) {
      this.memberships = response as YpMemberships;
      this._updateMembershipsIndex(this.memberships);
      this.fireGlobal('got-memberships', true);
    } else {
      this.memberships=null;
      this.fireGlobal('got-memberships', false);
    }
  }
}