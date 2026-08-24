/* Shared helpers. Content scripts listed in the manifest share one isolated
   global scope, so everything hangs off a single namespace object. */
const LCC = (window.__LCC = window.__LCC || {});

/* ---------------------------------------------------------------------------
   Label dictionary.

   We deliberately do NOT match on CSS classes. LinkedIn ships hashed, churning
   class names; every script that hardcodes them dies within months. Accessible
   names change far less often, and making them a list means non-English UIs
   work by adding a string instead of rewriting the matcher.
   --------------------------------------------------------------------------- */
LCC.LABELS = {
  moreActions: ['more actions', 'mehr aktionen', 'plus d’actions', 'más acciones'],
  removeConnection: ['remove connection', 'kontakt entfernen', 'retirer la relation', 'eliminar contacto'],
  confirmRemove: ['remove', 'entfernen', 'retirer', 'eliminar'],
};

LCC.CLICKABLE = 'button, [role="button"], [role="menuitem"], a[role="menuitem"]';

LCC.isVisible = (el) => {
  if (!el || !el.isConnected) return false;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const s = getComputedStyle(el);
  return s.visibility !== 'hidden' && s.display !== 'none';
};

LCC.accessibleName = (el) =>
  `${el.getAttribute('aria-label') || ''} ${el.innerText || ''}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Find the first visible clickable whose accessible name contains any label. */
LCC.findByLabel = (labels, root = document) =>
  [...root.querySelectorAll(LCC.CLICKABLE)].find(
    (el) => LCC.isVisible(el) && labels.some((l) => LCC.accessibleName(el).includes(l))
  ) || null;

/** Poll a predicate until it returns something truthy, or time out. */
LCC.waitFor = (fn, timeoutMs = 8000, everyMs = 200) =>
  new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      let v = null;
      try { v = fn(); } catch (_) { v = null; }
      if (v) return resolve(v);
      if (Date.now() - started > timeoutMs) return resolve(null);
      setTimeout(tick, everyMs);
    };
    tick();
  });

LCC.sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Normalise a profile URL so we can compare the queue against location.href. */
LCC.normalizeProfileUrl = (url) => {
  if (!url) return null; // new URL('', base) resolves to the base itself instead of throwing
  try {
    const u = new URL(url, 'https://www.linkedin.com');
    return `https://www.linkedin.com${u.pathname.replace(/\/+$/, '')}/`;
  } catch (_) {
    return null;
  }
};

/* ---------------------------------------------------------------------------
   Run state. Lives in chrome.storage.local because each removal navigates the
   page, which destroys the content script. The job is a resumable state
   machine, not a loop.
   --------------------------------------------------------------------------- */
LCC.DEFAULT_STATE = {
  status: 'idle',        // idle | running | paused | done
  dryRun: true,
  queue: [],             // [{name, url, company, connectedOn}]
  log: [],               // [{name, url, result, at}]
  dailyCap: 100,
  minDelayMs: 4000,
  maxDelayMs: 9000,
  counterDate: '',
  counterCount: 0,
};

LCC.getState = async () => {
  const { state } = await chrome.storage.local.get('state');
  return { ...LCC.DEFAULT_STATE, ...(state || {}) };
};

LCC.setState = async (patch) => {
  const next = { ...(await LCC.getState()), ...patch };
  await chrome.storage.local.set({ state: next });
  return next;
};

LCC.todayKey = () => new Date().toISOString().slice(0, 10);

/** Returns how many removals are still allowed today under the cap. */
LCC.remainingToday = (state) => {
  if (state.counterDate !== LCC.todayKey()) return state.dailyCap;
  return Math.max(0, state.dailyCap - state.counterCount);
};
