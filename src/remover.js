/* One removal per page load.

   Clicking through a profile navigates away and kills the content script, so
   the "loop" is really: load page -> do one unit of work -> persist -> navigate.
   Every step is resumable, which also means Ctrl-W is a valid stop button. */

const LCC_R = (window.__LCC.remover = {});

/**
 * Perform the three-click removal on the profile currently open.
 * Returns { ok, reason }.
 */
LCC_R.removeCurrentProfile = async (dryRun) => {
  const L = LCC.LABELS;
  const scope = document.querySelector('main') || document;

  const more = await LCC.waitFor(() => LCC.findByLabel(L.moreActions, scope), 15000);
  if (!more) return { ok: false, reason: 'no-more-button' };
  more.click();

  const item = await LCC.waitFor(() => LCC.findByLabel(L.removeConnection), 5000);
  if (!item) {
    document.body.click(); // close the menu we opened
    return { ok: false, reason: 'not-connected' };
  }

  if (dryRun) {
    document.body.click();
    return { ok: true, reason: 'dry-run' };
  }

  item.click();

  const dialog = await LCC.waitFor(
    () => [...document.querySelectorAll('[role="dialog"]')].find(LCC.isVisible),
    5000
  );
  if (!dialog) return { ok: false, reason: 'no-confirm-dialog' };

  const confirm = await LCC.waitFor(() => LCC.findByLabel(L.confirmRemove, dialog), 5000);
  if (!confirm) return { ok: false, reason: 'no-confirm-button' };
  confirm.click();

  await LCC.waitFor(() => !LCC.isVisible(dialog), 8000);
  return { ok: true, reason: 'removed' };
};

/** Called on every page load. Decides whether to act, navigate, or stand down. */
LCC_R.resume = async (render) => {
  let state = await LCC.getState();
  if (state.status !== 'running') return;

  if (!state.queue.length) {
    await LCC.setState({ status: 'done' });
    return render();
  }

  if (LCC.remainingToday(state) <= 0) {
    await LCC.setState({ status: 'paused' });
    return render();
  }

  const target = state.queue[0];
  const here = LCC.normalizeProfileUrl(location.href);

  if (here !== target.url) {
    location.assign(target.url);
    return;
  }

  const result = await LCC_R.removeCurrentProfile(state.dryRun);

  state = await LCC.getState();
  if (state.status !== 'running') return render(); // paused mid-flight

  const entry = {
    name: target.name,
    url: target.url,
    result: result.ok ? result.reason : `failed:${result.reason}`,
    at: new Date().toISOString(),
  };

  const sameDay = state.counterDate === LCC.todayKey();
  const counted = result.ok && !state.dryRun;

  state = await LCC.setState({
    queue: state.queue.slice(1),
    log: [entry, ...state.log].slice(0, 2000),
    counterDate: LCC.todayKey(),
    counterCount: (sameDay ? state.counterCount : 0) + (counted ? 1 : 0),
  });

  render();

  if (!state.queue.length) {
    await LCC.setState({ status: 'done' });
    return render();
  }

  // Pacing. Bursts of identical timing get flagged and also just break: the
  // page needs time to settle between navigations.
  const wait =
    state.minDelayMs + Math.random() * Math.max(0, state.maxDelayMs - state.minDelayMs);
  await LCC.sleep(wait);

  const still = await LCC.getState();
  if (still.status === 'running' && still.queue.length) {
    location.assign(still.queue[0].url);
  }
};
