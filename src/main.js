/* Boot. Mounts the panel once per page load and hands control to the resumable
   remover, which is what actually drives navigation while a job is running. */

(async () => {
  if (window.__LCC_BOOTED) return;
  window.__LCC_BOOTED = true;

  let connections = [];
  let ui = null;

  const paint = async () => {
    if (!ui) return;
    LCC.panel.render(ui, await LCC.getState(), connections.length);
  };

  // The CSV is only held in memory. Nothing is written anywhere except the
  // queue and the record, both in local extension storage.
  const onFile = async (file) => {
    if (!file) return;
    const err = ui.$('fileErr');
    err.hidden = true;
    try {
      const text = await file.text();
      connections = LCC.csv.toConnections(LCC.csv.parse(text));
      if (!connections.length) throw new Error('Parsed the file but found no rows with a profile URL.');
      ui.$('previewOut').textContent = '';
    } catch (e) {
      connections = [];
      err.textContent = e.message;
      err.hidden = false;
    }
    paint();
  };

  const onPreview = (opts) => {
    if (!connections.length) {
      ui.$('previewOut').textContent = 'Load Connections.csv first.';
      return;
    }
    const matches = LCC.csv.filter(connections, opts);
    const sample = matches.slice(0, 5).map((c) => `${c.name} — ${c.company || 'no company'} (${c.connectedOn || 'date unknown'})`);
    ui.$('previewOut').textContent = matches.length
      ? `${matches.length} match. First few: ${sample.join('; ')}`
      : 'Nothing matches these filters.';
  };

  const onStart = async (opts) => {
    const matches = LCC.csv.filter(connections, opts);
    if (!matches.length) {
      ui.$('previewOut').textContent = 'Nothing matches these filters.';
      return;
    }
    if (!opts.dryRun) {
      const ok = window.confirm(
        `Remove ${matches.length} connections for real?\n\nThis cannot be undone. Any recommendations or endorsements between you and these people are withdrawn.\n\nRun a dry run first if you have not.`
      );
      if (!ok) return;
    }
    await LCC.setState({
      status: 'running',
      dryRun: opts.dryRun,
      dailyCap: opts.dailyCap,
      queue: matches.map(({ name, url, company, connectedOn }) => ({ name, url, company, connectedOn })),
    });
    paint();
    LCC.remover.resume(paint);
  };

  const onPause = async () => { await LCC.setState({ status: 'paused' }); paint(); };
  const onClear = async () => { await LCC.setState({ status: 'idle', queue: [], log: [] }); paint(); };
  const onDryRun = async (v) => { await LCC.setState({ dryRun: v }); paint(); };

  const onExport = async () => {
    const { log } = await LCC.getState();
    const blob = new Blob([LCC.csv.toCsv(log)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `connection-cleanup-${LCC.todayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  ui = LCC.panel.mount({ onFile, onPreview, onStart, onPause, onClear, onDryRun, onExport });
  await paint();

  // If a job was mid-flight when this page loaded, pick it up.
  LCC.remover.resume(paint);
})();
