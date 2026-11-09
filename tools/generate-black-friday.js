#!/usr/bin/env node
/**
 * generate-black-friday.js — page /ofertas-black-friday (Black Friday 23–30/11/2026).
 *
 * Écrit <out>/ofertas-black-friday.html : les salles dont le champ Room
 * `descuento_black_friday_number` est > 0, dont la Company a un Plan
 * (abonnée) et n'est pas fermée, regroupées par ville.
 *
 * Données lues en lecture seule via la Data API Bubble (Company, Room,
 * Room-images). Lancé toutes les 2 h par .github/workflows/refresh-black-friday.yml
 * (à désactiver après le 01/12/2026).
 *
 * Usage : node tools/generate-black-friday.js --out .
 */
'use strict';
const fs = require('fs');
const path = require('path');

const API = 'https://spaceson4.bubbleapps.io/api/1.1/obj/';
const SITE = 'https://www.spaces-on.com';
const PAGES = 'https://pages.spaces-on.com';
const START = '2026-11-23';
const END = '2026-11-30';

// Salles avec une valeur de remise restée de la campagne 2022 (jamais remise
// à zéro). Exclues tant qu'elles n'ont pas été vidées dans Bubble live.
// Si l'espace remet volontairement une remise en 2026, retirer son id ici.
const LEGACY_2022 = new Set([
  '1653376827525x234932018782475940', // PG95 - Sala de reuniones La Pedrera (50 %)
  '1653416024454x442303072239733200', // PG95 - Sala de reuniones PG95 (50 %)
  '1653376975806x898053326089588000', // Business Plaza - Sala 31 (10 %)
  '1653416010449x465284958618777300', // Business Plaza - Sala 13 (10 %)
  '1653416010542x402963335229649800', // Business Plaza - Sala 14 (10 %)
  '1653416010693x798909403136630800', // Business Plaza - Sala 19 (10 %)
]);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchAll(type, constraints) {
  const all = [];
  const c = constraints ? '&constraints=' + encodeURIComponent(JSON.stringify(constraints)) : '';
  for (let cursor = 0; ;) {
    let data;
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await fetch(`${API}${type}?limit=100&cursor=${cursor}${c}`, { headers: { 'User-Agent': 'spaceson-black-friday-generator' } });
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
  return all;
}

function tailwindHead() {
  return fs.readFileSync(path.join(__dirname, 'search-tailwind-head.html'), 'utf8');
}

function cityOf(c) {
  const names = [].concat(c.city_list_text || [], c.city_option_ciudades || [], c.city1_option_ciudades || []).filter(Boolean);
  if (names.length) return String(names[0]).trim();
  const a = c.address_geographic_address && c.address_geographic_address.address;
  const m = a && a.match(/\d{5}\s+([^,]+)/);
  return m ? m[1].trim() : 'Otras ciudades';
}

function card(r) {
  const img = r.img
    ? `<img loading="lazy" alt="${esc(r.name)}" src="${esc(r.img)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.remove()"/>`
    : '';
  const meta = [
    r.price ? `<span class="font-semibold text-secondary whitespace-nowrap mr-auto">Desde ${esc(r.price)} €/h</span>` : '',
    r.pax ? `<span class="bg-surface-container-low px-2 py-1 rounded-full text-[11px] font-label-sm text-on-surface-variant">Hasta ${r.pax} personas</span>` : '',
  ].join('');
  return `<a href="${esc(r.url)}" class="relative block bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
<div class="relative h-44 w-full overflow-hidden bg-surface-container">${img}<div class="absolute top-3 left-3 bg-[#111827] text-[#f59e0b] px-2 py-1 rounded text-label-sm font-bold">-${r.discount}%</div></div>
<div class="p-4"><h3 class="font-headline-md text-[18px] leading-tight text-primary mb-1">${esc(r.name)}</h3>
<p class="font-body-sm text-on-surface-variant mb-3">${esc(r.company)}</p>
<div class="flex flex-wrap items-center gap-2">${meta}</div></div></a>`;
}

function pageHtml(groups, total) {
  const title = 'Black Friday en SpacesON: salas y espacios por horas con descuento';
  const desc = `Del 23 al 30 de noviembre, ${total ? total + ' ' : ''}salas de reuniones, aulas y espacios para eventos por horas con descuento en SpacesON.`;
  const sections = groups.map(([city, rooms]) => `<section class="mb-12">
<h2 class="font-headline-md text-[24px] text-primary mb-4">${esc(city)} <span class="text-on-surface-variant text-[16px] font-normal">(${rooms.length})</span></h2>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">${rooms.map(card).join('\n')}</div></section>`).join('\n');
  const empty = `<div class="text-center py-16 max-w-2xl mx-auto">
<p class="font-body-lg text-on-surface-variant mb-4">Los espacios están añadiendo sus descuentos. Vuelve a partir del 23 de noviembre para ver todas las ofertas.</p>
<p class="font-body-md text-on-surface-variant">Mientras tanto, <a class="text-primary underline" href="/espacios-horas">busca entre todos los espacios</a> o <a class="text-primary underline" href="/busqueda-gratuita-espacios-reuniones-eventos">pídenos que te lo busquemos</a>.</p></div>`;
  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}"/>
<link rel="canonical" href="${SITE}/ofertas-black-friday"/>
${tailwindHead()}</head>
<body class="text-on-surface font-body-md antialiased min-h-screen flex flex-col bg-background">
<nav class="bg-surface-container-lowest shadow-md w-full sticky top-0 z-50">
<div class="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-7xl mx-auto">
<div class="flex items-center gap-8">
<a class="flex items-center" href="/"><img alt="SpacesON" class="h-10 w-auto" src="${PAGES}/home-assets/logo-spaceson.png"/></a>
<div class="hidden md:flex gap-6">
<a class="text-on-surface-variant opacity-80 hover:opacity-100 transition-opacity" href="/espacios-horas">Buscar espacios</a>
<a class="text-on-surface-variant opacity-80 hover:opacity-100 transition-opacity" href="/busqueda-gratuita-espacios-reuniones-eventos">Te lo buscamos gratis</a>
<a class="text-on-surface-variant opacity-80 hover:opacity-100 transition-opacity" href="https://blog.spaces-on.com">Blog</a>
</div></div>
<div class="flex items-center gap-4">
<a class="flex items-center gap-2 text-primary font-label-md border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors" href="/promocionar-espacios-eventos">Publicar espacio</a>
<a class="hidden md:block text-on-surface-variant font-label-md hover:underline" href="/login_page">Entrar</a>
</div></div></nav>
<main class="flex-grow">
<section class="bg-[#111827] text-white px-margin-mobile md:px-margin-desktop py-12">
<div class="max-w-7xl mx-auto">
<p class="inline-block bg-[#f59e0b] text-[#111827] font-bold uppercase text-label-sm px-3 py-1 rounded mb-4">Black Friday · 23–30 noviembre</p>
<h1 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-3">Salas y espacios por horas con descuento</h1>
<p id="bf-status" class="font-body-lg text-white/80 max-w-3xl">Del 23 al 30 de noviembre, estos espacios ofrecen un descuento especial. Pide información desde la ficha de la sala y menciona el Black Friday en tu solicitud: el espacio te aplica el descuento directamente.</p>
</div></section>
<section class="px-margin-mobile md:px-margin-desktop py-10">
<div class="max-w-7xl mx-auto">
${total ? sections : empty}
<div class="mt-6 bg-surface-container rounded-xl p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
<p class="font-body-md text-on-surface">¿Tienes un espacio en SpacesON? Añade tu descuento en el campo «Descuento Black Friday (%)» de tu sala y aparecerás aquí.</p>
<a class="font-label-md px-5 py-3 rounded-lg bg-primary text-on-primary text-center whitespace-nowrap hover:brightness-110" href="/control_panel_gestores">Ir a mi panel</a>
</div>
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
</div></div></footer>
<script>(function(){var t=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid'}).format(new Date()),s=document.getElementById('bf-status');
if(t<'${START}')s.textContent='Las ofertas son válidas del 23 al 30 de noviembre. Ya puedes ver los espacios que participan y pedir información.';
else if(t>'${END}')s.textContent='El Black Friday de SpacesON ha terminado. Los descuentos ya no están vigentes, pero puedes seguir pidiendo información a estos espacios.';})();</script>
</body></html>
`;
}

async function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf('--out');
  const outDir = i === -1 ? null : args[i + 1];
  if (!outDir) { console.error('Usage: node tools/generate-black-friday.js --out <dossier>'); process.exit(1); }

  const rooms = await fetchAll('room', [{ key: 'descuento_black_friday_number', constraint_type: 'greater than', value: 0 }]);
  const companyIds = [...new Set(rooms.map(r => r.company_custom_company).filter(Boolean))];
  const roomIds = rooms.map(r => r._id);
  const companies = companyIds.length ? await fetchAll('company', [{ key: '_id', constraint_type: 'in', value: companyIds }]) : [];
  const images = roomIds.length ? await fetchAll('room-images', [{ key: 'room_custom_room', constraint_type: 'in', value: roomIds }]) : [];
  const byId = new Map(companies.map(c => [c._id, c]));
  const imageByRoom = new Map();
  images.slice().sort((a, b) => String(a['Created Date']).localeCompare(String(b['Created Date']))).forEach(im => {
    const url = im.s3_url_image;
    if (!url || imageByRoom.has(im.room_custom_room)) return;
    imageByRoom.set(im.room_custom_room, url.startsWith('//') ? 'https:' + url : url);
  });

  const byCity = new Map();
  let skipped = 0;
  for (const r of rooms) {
    const c = byId.get(r.company_custom_company);
    const name = (r.name_room_text || '').trim();
    const discount = Math.round(Number(r.descuento_black_friday_number));
    if (LEGACY_2022.has(r._id)) { skipped++; continue; }
    if (!c || c.closed__boolean || !c.plan_option_suscription || !name || !r.url_slug_text || !(discount > 0 && discount < 100)) { skipped++; continue; }
    const city = cityOf(c);
    if (!byCity.has(city)) byCity.set(city, []);
    byCity.get(city).push({
      name, discount,
      company: (c.nombre_comercial_text || '').trim(),
      url: `/espacio-horas/${encodeURIComponent(r.url_slug_text)}-${r._id}`,
      img: imageByRoom.get(r._id) || '',
      price: r.precios_text ? String(r.precios_text).trim() : '',
      pax: Number(r.maximum_people_number) || 0,
    });
  }
  const groups = [...byCity.entries()]
    .map(([city, list]) => [city, list.sort((a, b) => b.discount - a.discount || a.name.localeCompare(b.name))])
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const total = groups.reduce((n, [, l]) => n + l.length, 0);
  fs.writeFileSync(path.join(outDir, 'ofertas-black-friday.html'), pageHtml(groups, total));
  console.log(`Black Friday: ${rooms.length} salas con descuento en Bubble, ${total} publicadas, ${skipped} excluidas (sin plan, cerrada o datos incompletos)`);
  groups.forEach(([city, l]) => console.log(`  ${city}: ${l.length}`));
}

main().catch(e => { console.error(e); process.exit(1); });
