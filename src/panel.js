/* The panel is injected into a shadow root so LinkedIn's stylesheet and ours
   can't reach each other. Visually it's a job runner, not a web page: quiet
   surfaces, one amber accent for "armed", and a monospace tape that records
   every action taken. The tape is the point — this tool does something you
   can't undo, so the receipt matters more than the buttons. */

const LCC_P = (window.__LCC.panel = {});

LCC_P.css = `
:host { all: initial; }
* { box-sizing: border-box; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; }

.wrap {
  position: fixed; top: 72px; right: 16px; width: 360px; z-index: 2147483000;
  background: #10151C; color: #DCE3EC; border: 1px solid #2C3949;
  border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,.45);
  font-size: 13px; line-height: 1.45; overflow: hidden;
}
.wrap[data-collapsed="true"] .body { display: none; }

header {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; background: #161E29; border-bottom: 1px solid #2C3949;
}
header h1 { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; flex: 1; }
.mode { font: 600 10px/1 ui-monospace, monospace; letter-spacing: .08em; padding: 4px 6px; border-radius: 4px; }
.mode[data-live="false"] { background: #23303F; color: #8FA3BA; }
.mode[data-live="true"]  { background: #4A211C; color: #F0897B; }

.body { padding: 12px; max-height: 70vh; overflow-y: auto; }
.field { margin-bottom: 10px; }
label { display: block; font-size: 11px; color: #7C8CA0; margin-bottom: 4px; }
input[type="text"], input[type="date"], input[type="number"], input[type="file"] {
  width: 100%; padding: 6px 8px; background: #1B2430; color: #DCE3EC;
  border: 1px solid #2C3949; border-radius: 5px; font-size: 12px;
}
input:focus-visible, button:focus-visible { outline: 2px solid #E8A33D; outline-offset: 1px; }
.row { display: flex; gap: 8px; }
.row > * { flex: 1; }
.check { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #B4C0CE; margin-bottom: 6px; }
.check input { accent-color: #E8A33D; }

button {
  padding: 7px 10px; border-radius: 5px; border: 1px solid #2C3949;
  background: #1B2430; color: #DCE3EC; font-size: 12px; cursor: pointer;
}
button:hover { background: #22303F; }
button.primary { background: #E8A33D; border-color: #E8A33D; color: #1A1206; font-weight: 600; }
button.primary:hover { background: #F2B457; }
button:disabled { opacity: .45; cursor: not-allowed; }

.count { font: 600 22px/1 ui-monospace, monospace; color: #E8A33D; }
.count span { font-size: 11px; color: #7C8CA0; font-weight: 400; margin-left: 6px; }

hr { border: 0; border-top: 1px solid #2C3949; margin: 12px 0; }

.tape {
  font: 11px/1.6 ui-monospace, SFMono-Regular, monospace;
  background: #0A0E14; border: 1px solid #22303F; border-radius: 5px;
  padding: 8px; max-height: 180px; overflow-y: auto; white-space: pre-wrap;
}
.tape .ok { color: #8FBF7A; }
.tape .dry { color: #7C8CA0; }
.tape .bad { color: #E08672; }
.empty { color: #5E6C7E; font-style: italic; }
.note { font-size: 11px; color: #7C8CA0; margin-top: 6px; }
.err { font-size: 11px; color: #E08672; margin-top: 6px; }
`;

LCC_P.mount = (handlers) => {
  const host = document.createElement('div');
  host.id = 'lcc-host';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>${LCC_P.css}</style>
    <div class="wrap" data-collapsed="false">
      <header>
        <h1>Connection cleanup</h1>
        <span class="mode" data-live="false">DRY RUN</span>
        <button id="toggle" title="Collapse">–</button>
      </header>
      <div class="body">
        <div class="field">
          <label for="file">1. Connections.csv from your LinkedIn export</label>
          <input type="file" id="file" accept=".csv,text/csv">
          <div class="note" id="loaded">No file loaded.</div>
          <div class="err" id="fileErr" hidden></div>
        </div>

        <hr>

        <div class="field">
          <label for="before">2. Connected before</label>
          <input type="date" id="before">
        </div>
        <div class="row field">
          <div>
            <label for="company">Company contains</label>
            <input type="text" id="company" placeholder="comma separated">
          </div>
          <div>
            <label for="position">Position contains</label>
            <input type="text" id="position" placeholder="comma separated">
          </div>
        </div>
        <label class="check"><input type="checkbox" id="noCompany"> Only rows with no company listed</label>
        <label class="check"><input type="checkbox" id="noPosition"> Only rows with no position listed</label>
        <div class="field">
          <label for="keep">Never remove (names, companies, profile slugs)</label>
          <input type="text" id="keep" placeholder="acme, jane doe, in/someone">
        </div>
        <div class="row field">
          <div>
            <label for="limit">Max this run</label>
            <input type="number" id="limit" value="25" min="1">
          </div>
          <div>
            <label for="cap">Daily cap</label>
            <input type="number" id="cap" value="100" min="1">
          </div>
        </div>
        <button id="preview">Preview matches</button>
        <div class="note" id="previewOut"></div>

        <hr>

        <div class="field">
          <label>3. Queue</label>
          <div class="count"><span id="queued">0</span> <span>queued</span></div>
        </div>
        <label class="check"><input type="checkbox" id="dry" checked> Dry run — walk the list, never click Remove</label>
        <div class="row">
          <button class="primary" id="start">Start</button>
          <button id="pause">Pause</button>
          <button id="clear">Clear</button>
        </div>

        <hr>

        <div class="field">
          <label>Record</label>
          <div class="tape" id="tape"><span class="empty">Nothing yet.</span></div>
          <button id="export" style="margin-top:8px">Download record as CSV</button>
        </div>
      </div>
    </div>`;

  document.documentElement.appendChild(host);
  const $ = (id) => root.getElementById(id);

  $('toggle').addEventListener('click', () => {
    const w = root.querySelector('.wrap');
    const c = w.dataset.collapsed === 'true';
    w.dataset.collapsed = String(!c);
    $('toggle').textContent = c ? '–' : '+';
  });

  $('file').addEventListener('change', (e) => handlers.onFile(e.target.files[0]));
  $('preview').addEventListener('click', () => handlers.onPreview(LCC_P.readOptions($)));
  $('start').addEventListener('click', () => handlers.onStart(LCC_P.readOptions($)));
  $('pause').addEventListener('click', handlers.onPause);
  $('clear').addEventListener('click', handlers.onClear);
  $('export').addEventListener('click', handlers.onExport);
  $('dry').addEventListener('change', (e) => handlers.onDryRun(e.target.checked));

  return { root, $ };
};

LCC_P.readOptions = ($) => ({
  connectedBefore: $('before').value,
  companyContains: $('company').value,
  positionContains: $('position').value,
  missingCompany: $('noCompany').checked,
  missingPosition: $('noPosition').checked,
  keepTerms: $('keep').value,
  limit: parseInt($('limit').value, 10) || 0,
  dailyCap: parseInt($('cap').value, 10) || 100,
  dryRun: $('dry').checked,
});

LCC_P.render = ({ root, $ }, state, loadedCount) => {
  $('queued').textContent = state.queue.length;
  $('dry').checked = state.dryRun;
  const mode = root.querySelector('.mode');
  mode.dataset.live = String(!state.dryRun);
  mode.textContent = state.dryRun ? 'DRY RUN' : 'LIVE';

  $('loaded').textContent = loadedCount
    ? `${loadedCount} connections loaded.`
    : 'No file loaded.';

  $('start').disabled = state.status === 'running' || !loadedCount;
  $('pause').disabled = state.status !== 'running';

  const tape = $('tape');
  if (!state.log.length) {
    tape.innerHTML = '<span class="empty">Nothing yet.</span>';
  } else {
    tape.innerHTML = state.log
      .slice(0, 200)
      .map((e) => {
        const cls = e.result.startsWith('failed') ? 'bad' : e.result === 'dry-run' ? 'dry' : 'ok';
        const t = e.at.slice(11, 19);
        const safe = e.name.replace(/[<>&]/g, '');
        return `<span class="${cls}">${t}  ${e.result.padEnd(12)} ${safe}</span>`;
      })
      .join('\n');
  }
};
