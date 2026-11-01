/*
 * Spotify Liked Songs -> YouTube Music likes
 * Paste this in the DevTools console of https://music.youtube.com (signed in), then pick your Exportify CSV.
 * Unofficial: it uses the same internal requests the YouTube Music web app makes. Use at your own risk.
 * License: MIT
 */
(() => {
  // ---- Settings -----------------------------------------------------------
  const DELAY_MIN = 1200; // ms to wait between songs (minimum)
  const DELAY_MAX = 2700; // ms to wait between songs (maximum). Lower values = faster, but more risk of rate limits.
  // -------------------------------------------------------------------------

  const ES = (navigator.language || 'en').toLowerCase().startsWith('es');
  const T = ES ? {
    wrongSite: 'Abre primero music.youtube.com (con tu sesión iniciada) y vuelve a pegar el script.',
    title: 'Canciones que te gustan → YouTube Music',
    pick: 'Elegir Liked_Songs.csv',
    badFile: 'Archivo no válido',
    badFileMsg: 'No parece un CSV de Exportify (faltan las columnas Track Name y Artist Name(s)).',
    stopped: 'Detenido',
    stoppedMsg: (i, n) => 'Se quedó en la canción ' + (i + 1) + ' de ' + n + '. Vuelve a pegar el script y elige el mismo CSV para continuar desde ahí.',
    working: 'Pasando canciones a "Me gusta"',
    stats: (l, m) => 'Agregadas: ' + l + ' · Sin coincidencia: ' + m,
    stopHint: 'Para detener escribe en la consola: __ytlkStop = true',
    done: mins => 'Listo (' + mins + ' min)',
    added: l => 'Agregadas: ' + l,
    notFound: m => 'Sin coincidencia: ' + m,
    errs: e => 'Con error: ' + e,
    saved: 'Se descargó no_encontradas.txt',
    fileName: 'no_encontradas.txt',
    hdrMissing: 'NO ENCONTRADAS', hdrErrors: 'CON ERROR'
  } : {
    wrongSite: 'Open music.youtube.com first (signed in) and paste the script again.',
    title: 'Liked songs → YouTube Music',
    pick: 'Choose Liked_Songs.csv',
    badFile: 'Invalid file',
    badFileMsg: 'This does not look like an Exportify CSV (missing the Track Name and Artist Name(s) columns).',
    stopped: 'Stopped',
    stoppedMsg: (i, n) => 'Stopped at song ' + (i + 1) + ' of ' + n + '. Paste the script again and choose the same CSV to continue from there.',
    working: 'Liking your songs on YouTube Music',
    stats: (l, m) => 'Liked: ' + l + ' · Not found: ' + m,
    stopHint: 'To stop, type in the console: __ytlkStop = true',
    done: mins => 'Done (' + mins + ' min)',
    added: l => 'Liked: ' + l,
    notFound: m => 'Not found: ' + m,
    errs: e => 'Errors: ' + e,
    saved: 'not_found.txt was downloaded',
    fileName: 'not_found.txt',
    hdrMissing: 'NOT FOUND', hdrErrors: 'ERRORS'
  };

  if (location.hostname !== 'music.youtube.com') { alert(T.wrongSite); return; }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const sha1 = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s)))].map(x => x.toString(16).padStart(2, '0')).join('');

  const call = async (path, body) => {
    const sap = document.cookie.match(/(?:^|; )SAPISID=([^;]+)/)[1];
    const ts = Math.floor(Date.now() / 1000);
    const h = await sha1(ts + ' ' + sap + ' ' + location.origin);
    const r = await fetch('/youtubei/v1/' + path + '?prettyPrint=false&key=' + ytcfg.get('INNERTUBE_API_KEY'), {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'SAPISIDHASH ' + ts + '_' + h, 'X-Goog-AuthUser': '0', 'X-Origin': location.origin },
      body: JSON.stringify(Object.assign({ context: ytcfg.get('INNERTUBE_CONTEXT') }, body))
    });
    return { status: r.status, json: await r.json().catch(() => null) };
  };
  const withRetry = async (path, body) => {
    for (let k = 0; k < 4; k++) {
      try {
        const r = await call(path, body);
        if (r.status === 200) return r;
        if (r.status === 429 || r.status >= 500) { await sleep(60000 * (k + 1)); continue; }
        return r;
      } catch (e) { await sleep(5000); }
    }
    return { status: 0, json: null };
  };

  const parseCSV = t => {
    t = t.replace(/^\uFEFF/, '');
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); f = ''; rows.push(row); row = []; }
      else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows.filter(r => r.length > 1);
  };

  const parseSearch = j => {
    const out = [];
    const shelves = (((j || {}).contents || {}).tabbedSearchResultsRenderer || {}).tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    for (const s of shelves) for (const it of ((s.musicShelfRenderer || {}).contents || [])) {
      const r = it.musicResponsiveListItemRenderer; if (!r) continue;
      const cols = r.flexColumns.map(c => (c.musicResponsiveListItemFlexColumnRenderer.text.runs || []).map(x => x.text).join(''));
      const vid = (r.playlistItemData || {}).videoId || ((((r.overlay || {}).musicItemThumbnailOverlayRenderer || {}).content || {}).musicPlayButtonRenderer || {}).playNavigationEndpoint?.watchEndpoint?.videoId;
      if (vid) out.push({ title: cols[0] || '', sub: cols[1] || '', vid });
    }
    return out;
  };

  const old = document.getElementById('__ytlkBox'); if (old) old.remove();
  const box = document.createElement('div');
  box.id = '__ytlkBox';
  box.style.cssText = 'position:fixed;z-index:999999;right:16px;bottom:90px;background:#212121;color:#fff;font:14px sans-serif;padding:12px 14px;border-radius:10px;box-shadow:0 2px 12px #000;max-width:340px;line-height:1.5';
  document.body.appendChild(box);
  // YouTube Music enforces Trusted Types, so build the panel with textContent (no innerHTML).
  const say = (...lines) => {
    box.textContent = '';
    lines.forEach((l, n) => { const d = document.createElement('div'); d.textContent = l; if (n === 0) d.style.fontWeight = '600'; box.appendChild(d); });
  };
  window.__ytlkStop = false;

  const run = async text => {
    const rows = parseCSV(text);
    const head = rows[0].map(x => x.trim());
    const iT = head.indexOf('Track Name'), iA = head.indexOf('Artist Name(s)');
    if (iT < 0 || iA < 0) { say(T.badFile, T.badFileMsg); return; }
    const seen = new Set(), songs = [];
    for (const r of rows.slice(1)) {
      const title = (r[iT] || '').trim(); const artists = (r[iA] || '').split(';').map(x => x.trim()).filter(Boolean);
      if (!title) continue;
      const k = norm(title) + '|' + norm(artists[0] || '');
      if (seen.has(k)) continue; seen.add(k); songs.push({ title, artists });
    }
    const key = '__ytlk_next_' + songs.length; // progress is saved here, so you can resume
    let i = parseInt(localStorage.getItem(key) || '0', 10) || 0;
    const missing = [], errors = []; let liked = 0;
    const t0 = Date.now();
    for (; i < songs.length; i++) {
      if (window.__ytlkStop) { say(T.stopped, T.stoppedMsg(i, songs.length)); return; }
      const { title, artists } = songs[i];
      say(T.working, (i + 1) + ' / ' + songs.length, T.stats(liked, missing.length), title.slice(0, 45), T.stopHint);
      const res = await withRetry('search', { query: title + ' ' + (artists[0] || ''), params: 'EgWKAQIIAWoKEAkQBRAKEAMQBA%3D%3D' }); // songs filter
      if (res.status !== 200) { errors.push(title + ' - ' + artists.join(', ') + ' [search ' + res.status + ']'); localStorage.setItem(key, String(i + 1)); continue; }
      const nt = norm(title), items = parseSearch(res.json);
      // Only like a result when the title matches AND at least one artist appears in the result.
      const hit = items.find(it => { const ti = norm(it.title); return (ti === nt || ti.includes(nt) || nt.includes(ti)) && (!artists.length || artists.some(a => norm(it.sub).includes(norm(a)))); });
      if (!hit) missing.push(title + ' - ' + artists.join(', '));
      else {
        const lk = await withRetry('like/like', { target: { videoId: hit.vid } });
        if (lk.status === 200) liked++; else errors.push(title + ' - ' + artists.join(', ') + ' [like ' + lk.status + ']');
      }
      localStorage.setItem(key, String(i + 1));
      await sleep(DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN));
    }
    localStorage.removeItem(key);
    const mins = Math.round((Date.now() - t0) / 60000);
    const txt = T.hdrMissing + ' (' + missing.length + '):\n' + missing.join('\n') + '\n\n' + T.hdrErrors + ' (' + errors.length + '):\n' + errors.join('\n') + '\n';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' })); a.download = T.fileName; a.click();
    say(T.done(mins), T.added(liked), T.notFound(missing.length), T.errs(errors.length), T.saved);
    console.log(txt);
  };
  window.__ytlkRun = run;

  const file = document.createElement('input'); file.type = 'file'; file.accept = '.csv,text/csv'; file.style.display = 'none';
  file.onchange = async () => { if (file.files[0]) run(await file.files[0].text()); };
  document.body.appendChild(file);
  say(T.title);
  const btn = document.createElement('button');
  btn.textContent = T.pick;
  btn.style.cssText = 'margin-top:8px;padding:8px 12px;border:0;border-radius:18px;background:#fff;color:#000;font-weight:600;cursor:pointer';
  btn.onclick = () => file.click();
  box.appendChild(btn);
})();
