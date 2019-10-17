import '@polymer/polymer/polymer-legacy.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/iron-image/iron-image.js';
import 'lite-signal/lite-signal.js';
import '@polymer/paper-input/paper-textarea.js';
import '../yp-app-globals/yp-app-icons.js';
import { ypLanguageBehavior } from '../yp-behaviors/yp-language-behavior.js';
import { ypLoggedInUserBehavior } from '../yp-behaviors/yp-logged-in-user-behavior.js';
import '../yp-user/yp-user-image.js';
import '../yp-ajax/yp-ajax.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

class YpPointCommentEditLit extends YpBaseElement {
  static get properties() {
    return {
        comment: {
          type: Object,
          notify: true
        },
          
        point: {
          type: Object,
          notify: true
        },
        
        image: {
          type: Object,
          notify: true
        }
      }
    }

  static get styles() {
    return [
      css`

      paper-textarea {
        width: 370px;
        max-height: 300px;
      }

      paper-button {
        margin-top: 16px;
        margin-bottom: 16px;
        background-color: var(--accent-color);
        color: #FFF;
      }

      .userImage {
        padding-left: 16px;
        padding-right: 16px;
      }

      @media (max-width: 840px) {
        :host {
          width: 100%;
        }

        paper-textarea {
          width: 250px;
        }

        .userImage {
          padding-top: 8px;
          padding-right: 16px;
          padding-left: 0;
        }
      }

      [hidden] {
        display: none !important;
      }
    `, YpFlexLayout]  
  } 

render() {
  return html`
    ${this.point ? html`
    <div class="layout vertical center-center" ?hidden="${!this.loggedInUser}">
      <div class="layout horizontal">
        <yp-user-image class="userImage" user="${this.loggedInUser}"></yp-user-image>
        <div class="layout vertical">
          <paper-textarea id="pointComment" required="" minlength="15" name="pointComment" value="${this.comment.content}" always-float-label="${this.comment.content}" label="${t(this.point.addComment)}" char-counter="" rows="2" max-rows="2" on-keydown="_keyDown" maxlength="200">
          </paper-textarea>
          <div class="layout horizontal">
            <paper-button id="submitButton" raised="" on-tap="_sendComment">${this.t(point.postComment)}</paper-button>
          </div>  
        </div>
      </div>

      <div class="layout horizontal center-center">
        <yp-ajax id="postCommentAjax" method="POST" on-error="_responseError" on-response="_newsCommentResponse"></yp-ajax>
      </div>

    </div>
    <lite-signal on-lite-signal-logged-in="_userLoggedIn"></lite-signal>
` : html``}
`  
}  
  
  updated(changedProps) {
    if (changedProps.has('comment')) {
      if (this.comment.value && this.comment.value.length % 7 === 2) {
        this.fire('iron-resize');
      }
    }
  }

  ready() {
    this._reset();
  }

  _commentContentChanged(change) {
   
  }

  _responseError() {
    this.$$("#submitButton").disabled = false;
  }

  _reset() {
    this.set('comment', { content: '' });
    this.$$("#submitButton").disabled = false;
  }

  _sendComment() {
    var body;
    if (this.comment.content && this.comment.content.length>0) {
      if (this.point) {
        body = { point_id: this.point.id };
        this.$.postCommentAjax.url = '/api/points/'+this.point.id+'/comment';
        this.$$("#submitButton").disabled = true;
      } else if (this.image) {
        body = { image_id: this.image.id };
        this.$.postCommentAjax.url = '/api/images/'+this.image.id+'/comment';
        this.$$("#submitButton").disabled = true;
      } else {
        console.error("Can't find send ids");
      }
      this.$.postCommentAjax.body = __.merge(body, { comment: this.comment } );
      this.$.postCommentAjax.generateRequest();
    } else {
      this.$.postCommentAjax.showErrorDialog(this.t('point.commentToShort'));
    }
  }

  _newsCommentResponse() {
    this.fire('refresh');
    this._reset();
  }

  _keyDown(event) {
    if (event.code == 'enter') {
      this._sendComment();
    }
  }
}

window.customElements.define('yp-point-comment-edit-lit', YpPointCommentEditLit)
