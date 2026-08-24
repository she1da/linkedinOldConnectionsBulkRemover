/* Parsing LinkedIn's official Connections.csv, and filtering it.

   The export ships with a few "Notes:" preamble lines above the real header,
   so we scan for the header row instead of assuming line 0. Columns are:
   First Name, Last Name, URL, Email Address, Company, Position, Connected On. */

const LCC_CSV = (window.__LCC.csv = {});

/** Minimal RFC4180-ish parser: handles quoted fields, embedded commas, CRLF. */
LCC_CSV.parse = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
};

/** "18 Mar 2019" / "3/18/19" -> Date, or null. */
LCC_CSV.parseConnectedOn = (raw) => {
  const v = (raw || '').trim();
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

/* Date-only strings like "18 Mar 2019" parse as local midnight, not UTC. Read
   the date back through local getters (not toISOString, which converts to
   UTC first) so the calendar day can't shift for users east of UTC. */
LCC_CSV.toLocalIsoDate = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Rows -> connection objects. Throws with a readable message if unrecognised. */
LCC_CSV.toConnections = (rows) => {
  const headerIndex = rows.findIndex((r) =>
    r.some((c) => c.trim().toLowerCase() === 'first name')
  );
  if (headerIndex === -1) {
    throw new Error(
      'No "First Name" header row found. Make sure this is Connections.csv from your LinkedIn data export, not a spreadsheet you re-saved.'
    );
  }

  const header = rows[headerIndex].map((h) => h.trim().toLowerCase());
  const col = (name) => header.indexOf(name);
  const iFirst = col('first name');
  const iLast = col('last name');
  const iUrl = col('url');
  const iCompany = col('company');
  const iPosition = col('position');
  const iConnected = col('connected on');

  return rows
    .slice(headerIndex + 1)
    .map((r) => {
      const url = LCC.normalizeProfileUrl(r[iUrl] || '');
      const connectedOn = LCC_CSV.parseConnectedOn(r[iConnected]);
      return {
        name: `${(r[iFirst] || '').trim()} ${(r[iLast] || '').trim()}`.trim(),
        url,
        company: (r[iCompany] || '').trim(),
        position: (r[iPosition] || '').trim(),
        connectedOn: connectedOn ? LCC_CSV.toLocalIsoDate(connectedOn) : '',
      };
    })
    .filter((c) => c.url); // no URL means nothing we can act on
};

/**
 * Filter connections.
 * opts: { connectedBefore, companyContains, positionContains, missingCompany,
 *         missingPosition, keepTerms, limit }
 */
LCC_CSV.filter = (connections, opts) => {
  const term = (s) => (s || '').trim().toLowerCase();
  const companyNeedles = term(opts.companyContains).split(',').map(term).filter(Boolean);
  const positionNeedles = term(opts.positionContains).split(',').map(term).filter(Boolean);
  const keepNeedles = term(opts.keepTerms).split(',').map(term).filter(Boolean);

  let out = connections.filter((c) => {
    if (opts.connectedBefore) {
      if (!c.connectedOn) return false;         // unknown date is never "old"
      if (c.connectedOn >= opts.connectedBefore) return false;
    }
    if (companyNeedles.length && !companyNeedles.some((n) => term(c.company).includes(n))) return false;
    if (positionNeedles.length && !positionNeedles.some((n) => term(c.position).includes(n))) return false;
    if (opts.missingCompany && c.company) return false;
    if (opts.missingPosition && c.position) return false;

    // Safety net: anything matching a keep term is never queued.
    const hay = `${term(c.name)} ${term(c.company)} ${term(c.position)} ${term(c.url)}`;
    if (keepNeedles.some((n) => hay.includes(n))) return false;
    return true;
  });

  out.sort((a, b) => (a.connectedOn || '9999').localeCompare(b.connectedOn || '9999'));
  if (opts.limit > 0) out = out.slice(0, opts.limit);
  return out;
};

LCC_CSV.toCsv = (log) => {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['name', 'url', 'result', 'at'];
  return [
    header.join(','),
    ...log.map((e) => header.map((k) => esc(e[k])).join(',')),
  ].join('\n');
};
