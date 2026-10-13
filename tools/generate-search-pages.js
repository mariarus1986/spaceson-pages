#!/usr/bin/env node
/**
 * generate-search-pages.js — pages de résultats de recherche statiques par ville.
 *
 * Pour chaque ville demandée, écrit dans le dossier de sortie :
 *   - <slug-page>.html            la page (filtres type + capacité côté navigateur)
 *   - search-data/<ville>.js      les espaces de la ville (window.SPO_SEARCH)
 *
 * Données lues en lecture seule via la Data API Bubble (Company, Room,
 * Room-images), mises en cache localement dans .cache-search/ (12 h).
 *
 * Usage :
 *   node generate-search-pages.js --out <dossier> [--city madrid] [--dir busqueda] [--suffix -beta] [--no-cache]
 *
 * Ordre d'affichage (décision produit 2026-10-13) : espaces premium et
 * espaces d'abonnés d'abord, puis le reste, chaque groupe du plus récent au
 * plus ancien.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const API = 'https://spaceson4.bubbleapps.io/api/1.1/obj/';
const SITE = 'https://www.spaces-on.com';
const PAGES = 'https://pages.spaces-on.com';
const CACHE_DIR = path.join(__dirname, '.cache-search');
const CACHE_TTL_MS = 12 * 3600 * 1000;
const RADIUS_KM = 10; // même rayon que la recherche géographique Bubble actuelle

// Villes : nom affiché (= option Bubble "Cities"), slug, centre GPS.
const CITIES = {
  madrid:    { name: 'Madrid',    lat: 40.4168, lng: -3.7038 },
  barcelona: { name: 'Barcelona', lat: 41.3874, lng: 2.1686 },
  sevilla:   { name: 'Sevilla',   lat: 37.3891, lng: -5.9845 },
  valencia:  { name: 'Valencia',  lat: 39.4699, lng: -0.3763 },
  granada:   { name: 'Granada',   lat: 37.1773, lng: -3.5986 },
  zaragoza:  { name: 'Zaragoza',  lat: 41.6488, lng: -0.8891 },
  malaga:    { name: 'Málaga',    lat: 36.7213, lng: -4.4214 },
  murcia:    { name: 'Murcia',    lat: 37.9922, lng: -1.1307 },
  salamanca: { name: 'Salamanca', lat: 40.9701, lng: -5.6635 },
  bilbao:    { name: 'Bilbao',    lat: 43.2630, lng: -2.9350 },
  leon:      { name: 'León',      lat: 42.5987, lng: -5.5671 },
  palma:     { name: 'Palma',     lat: 39.5696, lng: 2.6502 },
  alicante:  { name: 'Alicante',  lat: 38.3452, lng: -0.4810 },
  'castellon-de-la-plana': { name: 'Castellón de la Plana', lat: 39.9864, lng: -0.0513 },
};

// Même taxonomie et mêmes règles que classifyVenueCategory() dans
// worker-optimise.js (champ structuré d'abord, mots-clés ensuite).
const CATEGORY_LABELS = {
  'salas-de-reuniones': 'Salas de reuniones',
  'espacios-para-eventos': 'Espacios para eventos',
  'aulas-de-formacion': 'Aulas de formación',
  'despachos': 'Despachos',
  'estudios-fotograficos': 'Estudios fotográficos',
  'salas-de-terapias': 'Salas de terapias',
  'aulas-informaticas': 'Aulas informáticas',
  'ruedas-de-prensa': 'Ruedas de prensa',
  'auditorios': 'Auditorios',
  'salas-de-conferencias': 'Salas de conferencias',
  'estudios-de-grabacion': 'Estudios de grabación',
  'coworking': 'Coworking',
};
const CATEGORY_KEYWORD_ORDER = [
  'estudios-de-grabacion', 'estudios-fotograficos', 'ruedas-de-prensa',
  'salas-de-conferencias', 'auditorios', 'aulas-informaticas',
  'aulas-de-formacion', 'salas-de-terapias', 'despachos', 'coworking',
  'salas-de-reuniones', 'espacios-para-eventos',
];
const CATEGORY_KEYWORDS = {
  'estudios-de-grabacion': [/estudio\s+de\s+grabaci[oó]n/i, /\bpodcast\b/i, /grabaci[oó]n\s+de\s+(audio|voz|m[uú]sica)/i],
  'estudios-fotograficos': [/estudio\s+fotogr[aá]fico/i, /estudio\s+de\s+foto/i, /\bfoto\b/i],
  'ruedas-de-prensa':      [/rueda(s)?\s+de\s+prensa/i],
  'salas-de-conferencias': [/sala(s)?\s+de\s+conferencia/i],
  'auditorios':            [/auditorio/i],
  'aulas-informaticas':    [/aula(s)?\s+(de\s+)?inform[aá]tica/i],
  'aulas-de-formacion':    [/aula(s)?\s+de\s+formaci[oó]n/i, /sala\s+de\s+formaci[oó]n/i, /\baula(s)?\b/i],
  'salas-de-terapias':     [/sala(s)?\s+de\s+terapia/i, /consulta\s+(de\s+)?(psicolog|coaching|osteopat|nutrici)/i, /\bterapia/i],
  'despachos':             [/\bdespacho/i],
  'coworking':             [/coworking/i, /puesto(s)?\s+(de\s+trabajo|flexible)/i],
  'salas-de-reuniones':    [/sala(s)?\s+de\s+reuni[oó]n/i, /sala(s)?\s+de\s+junta/i, /meeting\s+room/i],
  'espacios-para-eventos': [/espacio\s+para\s+eventos?/i, /\bevento(s)?\b/i],
};

// Renvoie la liste des types d'une salle : une salle peut en avoir plusieurs
// (le champ Bubble est une liste), et le filtre doit la retrouver sous chacun.
function classify(room) {
  const structured = room.categorias_list_option_room_categories;
  const keys = [];
  for (const val of (Array.isArray(structured) ? structured : structured ? [structured] : [])) {
    const key = Object.keys(CATEGORY_LABELS).find(k => norm(CATEGORY_LABELS[k]).replace(/s\b/g, '') === norm(val).replace(/s\b/g, ''));
    if (key && !keys.includes(key)) keys.push(key);
  }
  if (keys.length) return keys;
  const text = [room.name_room_text, room.url_slug_text, room.description_text].filter(Boolean).join(' ');
  return CATEGORY_KEYWORD_ORDER.filter(key => CATEGORY_KEYWORDS[key].some(re => re.test(text)));
}

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function km(lat1, lng1, lat2, lng2) {
  const R = 6371, rad = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * rad / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lng2 - lng1) * rad / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function fetchAll(type, useCache) {
  const file = path.join(CACHE_DIR, type + '.json');
  if (useCache && fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < CACHE_TTL_MS) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  const all = [];
  for (let cursor = 0; ;) {
    let data;
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await fetch(`${API}${type}?limit=100&cursor=${cursor}`, { headers: { 'User-Agent': 'spaceson-search-generator' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        data = (await res.json()).response;
        break;
      } catch (e) {
        if (attempt >= 4) throw new Error(`${type} cursor=${cursor}: ${e.message}`);
        await sleep(2000 * attempt);
      }
    }
    all.push(...data.results);
    if (data.remaining <= 0 || data.results.length === 0) break;
    cursor += data.results.length;
    await sleep(150);
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(all));
  return all;
}

function buildCityRooms(city, companies, rooms, imagesByRoom) {
  const byId = new Map(companies.map(c => [c._id, c]));
  const cityNorm = norm(city.name);
  const inCity = c => {
    const names = [].concat(c.city_list_text || [], c.city_option_ciudades || [], c.city1_option_ciudades || []);
    if (names.some(n => norm(n) === cityNorm)) return true;
    const a = c.address_geographic_address;
    return !!(a && typeof a.lat === 'number' && km(city.lat, city.lng, a.lat, a.lng) <= RADIUS_KM);
  };
  const out = [];
  for (const r of rooms) {
    const name = (r.name_room_text || '').trim();
    const c = byId.get(r.company_custom_company);
    if (!name || !r.url_slug_text || !c || c.closed__boolean) continue;
    if (/^(test|prueba|titulo)\b/i.test(name) || /^(test|prueba)\b/i.test(c.nombre_comercial_text || '')) continue;
    if (!inCity(c)) continue;
    const premium = r.advertisment_boolean === true;
    // « Abonné » = champ Plan renseigné sur la Company (définition produit
    // 2026-10-13 : Plan vide = ne paie pas).
    const subscriber = !!c.plan_option_suscription;
    out.push({
      n: name,
      u: `/espacio-horas/${encodeURIComponent(r.url_slug_text)}-${r._id}`,
      i: imagesByRoom.get(r._id) || '',
      p: r.precios_text ? String(r.precios_text).trim() : '',
      c: Number(r.maximum_people_number) || 0,
      m: Number(r.meters_number) || 0,
      k: classify(r),
      // Nom de la Company réservé aux abonnés : les fiches des Company sans
      // Plan restent minimales (le nom n'est même pas écrit dans le fichier).
      co: subscriber ? (c.nombre_comercial_text || '').trim() : '',
      // t = ce que la page affiche : badge Premium (2) uniquement si la
      // Company a un Plan. _tier = ordre de tri, où une salle marquée premium
      // reste en tête même sans Plan (décision produit 2026-10-13).
      t: premium && subscriber ? 2 : subscriber ? 1 : 0,
      _tier: premium ? 2 : subscriber ? 1 : 0,
      _created: r['Created Date'] || '',
      _id: Number(r.id_number) || 0,
    });
  }
  // premium → abonnés → reste ; dans chaque groupe, le plus récent d'abord.
  // Created Date est identique pour toutes les fiches migrées en mai 2022 :
  // id_number (numéro de publication d'origine) départage.
  out.sort((a, b) => (b._tier - a._tier) || b._created.localeCompare(a._created) || (b._id - a._id));
  return out.map(({ _created, _id, _tier, ...keep }) => keep);
}

function tailwindHead() {
  // Même configuration Tailwind que la home (new-home-page/code.html).
  // Dans le repo spaceson-pages (GitHub Action quotidienne), l'en-tête est
  // un fichier voisin déjà extrait ; en local on le lit dans la maquette.
  const extracted = path.join(__dirname, 'search-tailwind-head.html');
  if (fs.existsSync(extracted)) return fs.readFileSync(extracted, 'utf8');
  const src = fs.readFileSync(path.join(__dirname, 'new-home-page', 'code.html'), 'utf8');
  const start = src.indexOf('<link href="https://fonts.googleapis.com');
  return src.slice(start, src.indexOf('</head>'));
}

function pageHtml(citySlug, city, count, dataFile, noindex) {
  const title = `Espacios y salas por horas en ${city.name} | SpacesON`;
  const desc = `${count} salas de reuniones, aulas de formación y espacios para eventos por horas en ${city.name}. Filtra por tipo y capacidad.`;
  const canonical = `${SITE}/espacios-horas/${encodeURIComponent(city.name)}`;
  const cityOptions = Object.values(CITIES).map(c =>
    `<option value="${esc(c.name)}"${c.name === city.name ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
  const catOptions = Object.entries(CATEGORY_LABELS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('');
  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}"/>
${noindex ? '<meta name="robots" content="noindex, nofollow"/>' : `<link rel="canonical" href="${canonical}"/>`}
${tailwindHead()}</head>
<body class="text-on-surface font-body-md antialiased min-h-screen flex flex-col bg-background">
<nav class="bg-surface-container-lowest shadow-md w-full sticky top-0 z-50">
<div class="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-7xl mx-auto">
<div class="flex items-center gap-8">
<a class="flex items-center" href="/"><img alt="SpacesON" class="h-10 w-auto" src="${PAGES}/home-assets/logo-spaceson.png"/></a>
<div class="hidden md:flex gap-6">
<a class="text-primary border-b-2 border-secondary pb-1 font-semibold" href="/espacios-horas">Buscar espacios</a>
<a class="text-on-surface-variant opacity-80 hover:opacity-100 transition-opacity" href="/busqueda-gratuita-espacios-reuniones-eventos">Te lo buscamos gratis</a>
<a class="text-on-surface-variant opacity-80 hover:opacity-100 transition-opacity" href="https://blog.spaces-on.com">Blog</a>
</div></div>
<div class="flex items-center gap-4">
<a class="flex items-center gap-2 text-primary font-label-md border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors" href="/promocionar-espacios-eventos">Publicar espacio</a>
<a class="hidden md:block text-on-surface-variant font-label-md hover:underline" href="/login_page">Entrar</a>
</div></div></nav>
<main class="flex-grow">
<section class="bg-surface-container px-margin-mobile md:px-margin-desktop py-8">
<div class="max-w-7xl mx-auto">
<h1 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">Espacios para alquilar por horas en ${esc(city.name)}</h1>
<p id="sr-count" class="font-body-md text-on-surface-variant mb-6" aria-live="polite">${count} espacios</p>
<form id="sr-filters" class="bg-surface-container-lowest rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-4 md:items-end" autocomplete="off">
<div class="flex-1 flex flex-col">
<label for="sr-city" class="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wide">Ciudad</label>
<select id="sr-city" class="w-full rounded-lg border-outline-variant font-body-md text-on-surface">${cityOptions}</select>
</div>
<div class="flex-1 flex flex-col">
<label for="sr-type" class="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wide">Tipo</label>
<select id="sr-type" class="w-full rounded-lg border-outline-variant font-body-md text-on-surface"><option value="">Todos los tipos</option>${catOptions}</select>
</div>
<div class="flex-1 flex flex-col">
<label for="sr-pax" class="font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-wide">Capacidad mínima</label>
<input id="sr-pax" type="number" min="1" inputmode="numeric" placeholder="¿Cuántas personas?" class="w-full rounded-lg border-outline-variant font-body-md text-on-surface placeholder:text-outline-variant"/>
</div>
<button id="sr-reset" type="button" class="font-label-md px-4 py-3 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors">Borrar filtros</button>
<a class="font-label-md px-4 py-3 rounded-lg bg-secondary text-on-secondary text-center hover:brightness-95 transition-all" href="/search-results-map?location=${encodeURIComponent(city.name)}">Ver mapa</a>
</form>
</div></section>
<section class="px-margin-mobile md:px-margin-desktop py-10">
<div class="max-w-7xl mx-auto">
<div id="sr-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter"></div>
<p id="sr-empty" class="hidden text-center font-body-lg text-on-surface-variant py-16">Ningún espacio coincide con estos filtros. Prueba a ampliar la búsqueda o <a class="text-primary underline" href="/busqueda-gratuita-espacios-reuniones-eventos">pídenos que te lo busquemos gratis</a>.</p>
<div class="text-center mt-10"><button id="sr-more" type="button" class="hidden bg-primary text-on-primary font-label-md px-8 py-4 rounded-lg hover:brightness-110 transition-all">Ver más espacios</button></div>
<noscript><p class="text-center py-10">Activa JavaScript para ver los espacios, o consulta <a class="text-primary underline" href="/${citySlug}">la página de ${esc(city.name)}</a>.</p></noscript>
</div></section>
</main>
<footer class="bg-surface-container-highest py-12 border-t border-outline-variant/30">
<div class="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
<div class="col-span-1 mb-8 md:mb-0"><img alt="SpacesON" class="h-8 w-auto mb-4" src="${PAGES}/home-assets/logo-spaceson.png"/><p class="text-label-sm text-on-surface-variant">© ${new Date().getFullYear()} SpacesON. Todos los derechos reservados.</p></div>
<div class="col-span-1 md:col-span-3 flex flex-wrap gap-x-8 gap-y-4 justify-start md:justify-end">
<a class="text-label-sm text-on-surface-variant hover:text-primary transition-all" href="/pagina_estatica/aviso-legal">Aviso Legal</a>
<a class="text-label-sm text-on-surface-variant hover:text-primary transition-all" href="/pagina_estatica/politica-de-privacidad">Política de privacidad</a>
<a class="text-label-sm text-on-surface-variant hover:text-primary transition-all" href="/pagina_estatica/uso-de-cookies">Uso de cookies</a>
<a class="text-label-sm text-on-surface-variant hover:text-primary transition-all" href="/pagina_estatica/quienes-somos">¿Quiénes somos?</a>
<a class="text-label-sm text-on-surface-variant hover:text-primary transition-all" href="/pagina_estatica/sitemap-spaceson">Sitemap</a>
</div></div></footer>
<script src="${PAGES}/search-data/${dataFile}"></script>
<script>
(function () {
  var DATA = (window.SPO_SEARCH && window.SPO_SEARCH.rooms) || [];
  var PAGE = 24, shown = PAGE, list = DATA;
  var grid = document.getElementById('sr-grid'), count = document.getElementById('sr-count'),
      more = document.getElementById('sr-more'), empty = document.getElementById('sr-empty'),
      type = document.getElementById('sr-type'), pax = document.getElementById('sr-pax');
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function card(r) {
    var a = el('a', 'relative block bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden group hover:shadow-md transition-shadow');
    a.href = r.u;
    var pic = el('div', 'relative h-44 w-full overflow-hidden bg-surface-container');
    if (r.i) {
      var img = el('img', 'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105');
      img.loading = 'lazy'; img.alt = r.n; img.src = r.i;
      img.onerror = function () { this.remove(); };
      pic.appendChild(img);
    }
    if (r.t === 2) pic.appendChild(el('div', 'absolute top-3 left-3 bg-secondary text-on-secondary px-2 py-1 rounded text-label-sm font-bold uppercase tracking-wide', 'Premium'));
    a.appendChild(pic);
    var body = el('div', 'p-4');
    body.appendChild(el('h2', 'font-headline-md text-[18px] leading-tight text-primary mb-1', r.n));
    if (r.co) body.appendChild(el('p', 'font-body-sm text-on-surface-variant mb-3', r.co));
    var meta = el('div', 'flex flex-wrap items-center gap-2');
    if (r.p) meta.appendChild(el('span', 'font-semibold text-secondary whitespace-nowrap mr-auto', 'Desde ' + r.p + ' €/h'));
    if (r.c) meta.appendChild(el('span', 'bg-surface-container-low px-2 py-1 rounded-full text-[11px] font-label-sm text-on-surface-variant', 'Hasta ' + r.c + ' personas'));
    if (r.m) meta.appendChild(el('span', 'bg-surface-container-low px-2 py-1 rounded-full text-[11px] font-label-sm text-on-surface-variant', r.m + ' m²'));
    body.appendChild(meta);
    a.appendChild(body);
    return a;
  }
  function render() {
    grid.textContent = '';
    var frag = document.createDocumentFragment();
    list.slice(0, shown).forEach(function (r) { frag.appendChild(card(r)); });
    grid.appendChild(frag);
    count.textContent = list.length + (list.length === 1 ? ' espacio' : ' espacios');
    more.classList.toggle('hidden', shown >= list.length);
    empty.classList.toggle('hidden', list.length > 0);
  }
  function apply(push) {
    var k = type.value, n = parseInt(pax.value, 10) || 0;
    list = DATA.filter(function (r) { return (!k || r.k.indexOf(k) !== -1) && (!n || r.c >= n); });
    shown = PAGE;
    if (push) {
      var q = new URLSearchParams(location.search);
      k ? q.set('tipo', k) : q.delete('tipo');
      n ? q.set('pax', n) : q.delete('pax');
      var s = q.toString();
      history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
    }
    render();
  }
  // N'afficher que les types réellement présents dans cette ville
  var present = {};
  DATA.forEach(function (r) { r.k.forEach(function (k) { present[k] = (present[k] || 0) + 1; }); });
  Array.prototype.slice.call(type.options).forEach(function (o) {
    if (!o.value) return;
    if (!present[o.value]) o.remove(); else o.textContent += ' (' + present[o.value] + ')';
  });
  var q0 = new URLSearchParams(location.search);
  if (q0.get('tipo') && present[q0.get('tipo')]) type.value = q0.get('tipo');
  if (parseInt(q0.get('pax'), 10) > 0) pax.value = parseInt(q0.get('pax'), 10);
  document.getElementById('sr-city').addEventListener('change', function () {
    location.href = '/espacios-horas/' + encodeURIComponent(this.value) + '?location=' + encodeURIComponent(this.value);
  });
  type.addEventListener('change', function () { apply(true); });
  pax.addEventListener('input', function () { apply(true); });
  document.getElementById('sr-filters').addEventListener('submit', function (e) { e.preventDefault(); });
  document.getElementById('sr-reset').addEventListener('click', function () { type.value = ''; pax.value = ''; apply(true); });
  more.addEventListener('click', function () { shown += PAGE; render(); });
  apply(false);
})();
</script>
</body></html>
`;
}

async function main() {
  const args = process.argv.slice(2);
  const arg = (name, def) => { const i = args.indexOf('--' + name); return i === -1 ? def : args[i + 1]; };
  const outDir = arg('out');
  if (!outDir) { console.error('Usage: node generate-search-pages.js --out <dossier> [--city madrid] [--suffix -beta] [--no-cache]'); process.exit(1); }
  const citySlugs = arg('city', Object.keys(CITIES).join(',')).split(',');
  const suffix = arg('suffix', '');
  const pageDir = arg('dir', '');
  const useCache = !args.includes('--no-cache');

  const [companies, rooms, images] = [
    await fetchAll('company', useCache),
    await fetchAll('room', useCache),
    await fetchAll('room-images', useCache),
  ];
  console.log(`Bubble : ${companies.length} empresas, ${rooms.length} salas, ${images.length} imágenes`);

  // Première image de chaque salle (la plus ancienne = celle mise en premier)
  const imagesByRoom = new Map();
  images.slice().sort((a, b) => String(a['Created Date']).localeCompare(String(b['Created Date']))).forEach(im => {
    const url = im.s3_url_image;
    if (!url || !im.room_custom_room || imagesByRoom.has(im.room_custom_room)) return;
    imagesByRoom.set(im.room_custom_room, url.startsWith('//') ? 'https:' + url : url);
  });

  fs.mkdirSync(path.join(outDir, 'search-data'), { recursive: true });
  for (const slug of citySlugs) {
    const city = CITIES[slug];
    if (!city) { console.error('Ville inconnue : ' + slug); process.exit(1); }
    const list = buildCityRooms(city, companies, rooms, imagesByRoom);
    const dataFile = `${slug}.js`;
    fs.writeFileSync(path.join(outDir, 'search-data', dataFile),
      'window.SPO_SEARCH=' + JSON.stringify({ city: city.name, generated: new Date().toISOString(), rooms: list }) + ';\n');
    // --dir busqueda → busqueda/<ville>.html : chemin à deux segments, que le
    // Worker ne sert que via /espacios-horas/<Ville> (pas de seconde URL publique).
    const pageFile = pageDir ? path.join(pageDir, `${slug}${suffix}.html`) : `espacios-${slug}${suffix}.html`;
    fs.mkdirSync(path.dirname(path.join(outDir, pageFile)), { recursive: true });
    fs.writeFileSync(path.join(outDir, pageFile), pageHtml(slug, city, list.length, dataFile, suffix !== ''));
    const tiers = [2, 1, 0].map(t => list.filter(r => r.t === t).length);
    console.log(`${city.name} : ${list.length} salas (con badge premium ${tiers[0]}, abonados ${tiers[1]}, sin plan ${tiers[2]}), ` +
      `con imagen ${list.filter(r => r.i).length}, con tipo ${list.filter(r => r.k.length).length} → ${pageFile}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
