import { apis } from './apis';
import { Blacklist, BlacklistPatch } from './blacklist';
import { AltURL } from './utilities';
import style from '!!css-loader!sass-loader!../styles/patch-blacklist-form.scss';

export class PatchBlacklistForm {
  private root: ShadowRoot;
  private blacklist: Blacklist | null = null;
  private blacklistPatch: BlacklistPatch | null = null;
  private onUpdated: (() => void) | null = null;

  constructor(host: HTMLElement, onClose: () => void) {
    this.root = host.attachShadow({ mode: 'open' });
    this.root.innerHTML = `
<style>
  ${style.toString()}
</style>
<div id="body">
  <h1 id="title" class="title"></h1>
  <p id="origin"></p>
  <details id="details">
    <summary>
      ${apis.i18n.getMessage('popup_details')}
    </summary>
    <div class="field">
      <label class="label" for="url">
        ${apis.i18n.getMessage('popup_pageURLLabel')}
      </label>
      <div class="control">
        <input id="url" class="input" readonly>
      </div>
    </div>
    <div class="field">
      <label class="label" for="added">
        ${apis.i18n.getMessage('popup_addedRulesLabel')}
      </label>
      <div class="control">
        <textarea id="added" class="textarea has-fixed-size" rows="2" spellcheck="false"></textarea>
      </div>
      <p id="addedHelper" class="help has-text-grey">
        ${apis.i18n.getMessage('options_blacklistHelper')}
      </p>
    </div>
    <div class="field">
      <label class="label" for="removed">
        ${apis.i18n.getMessage('popup_removedRulesLabel')}
      </label>
      <div class="control">
        <textarea id="removed" class="textarea has-fixed-size" readonly rows="2" spellcheck="false"></textarea>
      </div>
    </div>
  </details>
  <div class="field is-grouped is-grouped-right">
    <div class="control">
      <button id="cancel" class="button has-text-primary">
        ${apis.i18n.getMessage('cancelButton')}
      </button>
    </div>
    <div class="control">
      <button id="update" class="button is-primary"></button>
    </div>
  </div>
</div>`;
    this.$('details').addEventListener('toggle', () => {
      if (this.$('details').open && this.blacklistPatch) {
        this.$('added').focus();
      }
    });
    this.$('added').addEventListener('input', () => {
      const modifiedPatch = this.blacklist!.modifyPatch({ rulesToAdd: this.$('added').value });
      if (modifiedPatch) {
        this.blacklistPatch = modifiedPatch;
      }
      this.$('update').disabled = !modifiedPatch;
    });
    this.$('cancel').addEventListener('click', () => {
      onClose();
    });
    this.$('update').addEventListener('click', () => {
      this.blacklist!.applyPatch();
      if (this.onUpdated) {
        this.onUpdated();
      }
      onClose();
    });
  }

  initialize(blacklist: Blacklist, url: AltURL, onUpdated: () => void): void {
    this.$('origin').textContent = `${url.scheme}://${url.host}`;
    this.$('details').open = false;
    this.$('url').value = url.toString();

    if (/^(https?|ftp)$/.test(url.scheme)) {
      this.blacklist = blacklist;
      this.blacklistPatch = blacklist.createPatch(url);
      this.onUpdated = onUpdated;

      this.$('title').textContent = apis.i18n.getMessage(
        this.blacklistPatch.unblock ? 'popup_unblockSiteTitle' : 'popup_blockSiteTitle',
      );
      this.$('added').readOnly = false;
      this.$('added').value = this.blacklistPatch.rulesToAdd;
      this.$('removed').value = this.blacklistPatch.rulesToRemove;
      this.$('update').disabled = false;
      this.$('update').textContent = apis.i18n.getMessage(
        this.blacklistPatch.unblock ? 'popup_unblockSiteButton' : 'popup_blockSiteButton',
      );
    } else {
      this.blacklist = null;
      this.blacklistPatch = null;
      this.onUpdated = null;

      this.$('title').textContent = apis.i18n.getMessage('popup_blockSiteTitle');
      this.$('added').readOnly = true;
      this.$('added').value = '';
      this.$('removed').value = '';
      this.$('update').disabled = true;
      this.$('update').textContent = apis.i18n.getMessage('popup_blockSiteButton');
    }
  }

  private $(id: 'title'): HTMLHeadingElement;
  private $(id: 'origin'): HTMLParagraphElement;
  private $(id: 'details'): HTMLDetailsElement;
  private $(id: 'url'): HTMLInputElement;
  private $(id: 'added'): HTMLTextAreaElement;
  private $(id: 'addedHelper'): HTMLParagraphElement;
  private $(id: 'removed'): HTMLTextAreaElement;
  private $(id: 'cancel'): HTMLButtonElement;
  private $(id: 'update'): HTMLButtonElement;
  private $(id: string): HTMLElement {
    return this.root.getElementById(id) as HTMLElement;
  }
}