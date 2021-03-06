import { FunctionComponent, h } from 'preact';
import { useContext, useEffect, useLayoutEffect, useState } from 'preact/hooks';
import { apis } from '../apis';
import { addMessageListeners, sendMessage } from '../messages';
import { Dialog, DialogProps } from '../shared/dialog';
import { supportedSearchEngines } from '../supported-search-engines';
import { SearchEngine, SearchEngineId } from '../types';
import { lines } from '../utilities';
import { Context } from './context';
import { Portal } from './portal';
import { Section, SectionItem } from './section';
import { SetBooleanItem } from './set-boolean-item';

type ImportBlacklistDialogProps = DialogProps & {
  setBlacklist(update: (blacklist: string) => string): void;
  setBlacklistDirty(blacklistDirty: boolean): void;
};

const ImportBlacklistDialog: FunctionComponent<Readonly<ImportBlacklistDialogProps>> = props => {
  const [blocklist, setBlocklist] = useState('');
  useLayoutEffect(() => {
    if (props.open) {
      setBlocklist('');
    }
  }, [props.open]);
  return (
    <Dialog open={props.open} setOpen={props.setOpen}>
      <div class="field">
        <h1 class="title">{apis.i18n.getMessage('options_importBlacklistDialog_title')}</h1>
      </div>
      <div class="field">
        <p class="has-text-grey">{apis.i18n.getMessage('options_importBlacklistDialog_helper')}</p>
        <p class="has-text-grey">
          {apis.i18n.getMessage('options_blacklistExample', 'example.com')}
        </p>
      </div>
      <div class="field">
        <div class="control">
          <textarea
            class="ub-textarea textarea has-fixed-size"
            rows={10}
            spellcheck={false}
            value={blocklist}
            onInput={e => {
              setBlocklist(e.currentTarget.value);
            }}
          />
        </div>
      </div>
      <div class="ub-row field is-grouped is-grouped-right">
        <div class="control">
          <button
            class="ub-button button has-text-primary"
            onClick={() => {
              props.setOpen(false);
            }}
          >
            {apis.i18n.getMessage('cancelButton')}
          </button>
        </div>
        <div class="control">
          <button
            class="ub-button button is-primary"
            onClick={() => {
              let newBlacklist = '';
              for (const domain of lines(blocklist)) {
                if (/^[^/*]+$/.test(domain)) {
                  newBlacklist = `${newBlacklist}${newBlacklist ? '\n' : ''}*://*.${domain}/*`;
                }
              }
              if (newBlacklist) {
                props.setBlacklist(
                  blacklist => `${blacklist}${blacklist ? '\n' : ''}${newBlacklist}`,
                );
                props.setBlacklistDirty(true);
              }
              props.setOpen(false);
            }}
          >
            {apis.i18n.getMessage('options_importBlacklistDialog_importButton')}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

const SetBlacklist: FunctionComponent = () => {
  const { blacklist: initialBlacklist } = useContext(Context).initialItems;
  const [blacklist, setBlacklist] = useState(initialBlacklist);
  const [blacklistDirty, setBlacklistDirty] = useState(false);
  const [latestBlacklist, setLatestBlacklist] = useState<string | null>(null);
  const [importBlacklistDialogOpen, setImportBlacklistDialogOpen] = useState(false);
  useEffect(() => {
    return addMessageListeners({
      'blacklist-set': (latestBlacklist, source) => {
        if (source !== 'options') {
          setLatestBlacklist(latestBlacklist);
        }
      },
    });
  }, []);
  return (
    <SectionItem>
      <div class="field">
        <p>{apis.i18n.getMessage('options_blacklistLabel')}</p>
        <p
          class="has-text-grey"
          dangerouslySetInnerHTML={{ __html: apis.i18n.getMessage('options_blacklistHelper') }}
        />
        <p class="has-text-grey">
          {apis.i18n.getMessage('options_blacklistExample', '*://*.example.com/*')}
        </p>
        <p class="has-text-grey">
          {apis.i18n.getMessage('options_blacklistExample', '/example\\.(net|org)/')}
        </p>
      </div>
      <div class="field">
        <div class="control">
          <textarea
            class="ub-textarea textarea has-fixed-size"
            rows={10}
            spellcheck={false}
            value={blacklist}
            onInput={e => {
              setBlacklist(e.currentTarget.value);
              setBlacklistDirty(true);
            }}
          />
        </div>
      </div>
      <div class="ub-row field is-grouped is-grouped-multiline is-grouped-right">
        {latestBlacklist != null && (
          <div class="control is-expanded">
            <p class="has-text-grey">
              {apis.i18n.getMessage('options_blacklistUpdated')}{' '}
              <span
                class="ub-link-button"
                tabIndex={0}
                onClick={async () => {
                  setBlacklist(latestBlacklist);
                  setBlacklistDirty(false);
                  setLatestBlacklist(null);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.currentTarget.click();
                  }
                }}
              >
                {apis.i18n.getMessage('options_reloadBlacklistButton')}
              </span>
            </p>
          </div>
        )}
        <div class="control">
          <button
            class="ub-button button has-text-primary"
            onClick={() => {
              setImportBlacklistDialogOpen(true);
            }}
          >
            {apis.i18n.getMessage('options_importBlacklistButton')}
          </button>
        </div>
        <div class="control">
          <button
            class="ub-button button is-primary"
            disabled={!blacklistDirty}
            onClick={() => {
              sendMessage('set-blacklist', blacklist, 'options');
              setBlacklistDirty(false);
              setLatestBlacklist(null);
            }}
          >
            {apis.i18n.getMessage('options_saveBlacklistButton')}
          </button>
        </div>
      </div>
      <Portal id="importBlacklistDialog">
        <ImportBlacklistDialog
          open={importBlacklistDialogOpen}
          setOpen={setImportBlacklistDialogOpen}
          setBlacklist={setBlacklist}
          setBlacklistDirty={setBlacklistDirty}
        />
      </Portal>
    </SectionItem>
  );
};

type RegisterSearchEngineProps = {
  id: SearchEngineId;
  searchEngine: SearchEngine;
};

const RegisterSearchEngine: FunctionComponent<Readonly<RegisterSearchEngineProps>> = props => {
  const [registered, setRegistered] = useState(false);
  useEffect(() => {
    (async () => {
      const registered = await apis.permissions.contains({ origins: props.searchEngine.matches });
      setRegistered(registered);
    })();
  }, [props.searchEngine]);
  return (
    <div class="ub-row field is-grouped">
      <div class="control is-expanded">
        <p>{apis.i18n.getMessage(props.searchEngine.messageNames.name)}</p>
      </div>
      <div class="control">
        {registered ? (
          <button class="ub-button button has-text-primary" disabled>
            {apis.i18n.getMessage('options_searchEngineRegistered')}
          </button>
        ) : (
          <button
            class="ub-button button is-primary"
            onClick={async () => {
              const registered = await apis.permissions.request({
                origins: props.searchEngine.matches,
              });
              if (registered) {
                sendMessage('register-search-engine', props.id);
              }
              setRegistered(registered);
            }}
          >
            {apis.i18n.getMessage('options_registerSearchEngine')}
          </button>
        )}
      </div>
    </div>
  );
};

const RegisterSearchEngines: FunctionComponent = () => {
  return (
    <SectionItem>
      <div class="field">
        <p>{apis.i18n.getMessage('options_otherSearchEngines')}</p>
        <p class="has-text-grey">{apis.i18n.getMessage('options_otherSearchEnginesDescription')}</p>
      </div>
      <div class="field">
        <ul class="ub-list">
          {(Object.keys(supportedSearchEngines) as SearchEngineId[]).map(
            id =>
              id !== 'google' && (
                <li key={id} class="ub-list-item">
                  <RegisterSearchEngine id={id} searchEngine={supportedSearchEngines[id]} />
                </li>
              ),
          )}
        </ul>
      </div>
    </SectionItem>
  );
};

export const GeneralSection: FunctionComponent = () => (
  <Section id="general" title={apis.i18n.getMessage('options_generalTitle')}>
    <SetBlacklist />
    <RegisterSearchEngines />
    <SetBooleanItem
      itemKey="skipBlockDialog"
      label={apis.i18n.getMessage('options_skipBlockDialogLabel')}
    />
    <SetBooleanItem
      itemKey="hideBlockLinks"
      label={apis.i18n.getMessage('options_hideBlockLinksLabel')}
    />
    <SetBooleanItem
      itemKey="hideControl"
      label={apis.i18n.getMessage('options_hideControlLabel')}
    />
  </Section>
);
