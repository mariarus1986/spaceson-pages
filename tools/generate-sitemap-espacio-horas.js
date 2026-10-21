#!/usr/bin/env node
/**
 * generate-sitemap-espacio-horas.js — régénère sitemap-espacio-horas.xml.
 *
 * Le sitemap était un fichier statique jamais mis à jour : les salles créées
 * après lui n'y entraient pas, et les salles supprimées de Bubble y restaient
 * (constaté 2026-10-21 : 45 manquantes, 33 supprimées encore listées).
 *
 * Données lues en lecture seule via la Data API Bubble (Room).
 * Une salle est listée si elle a un nom, n'est pas une salle de test et n'est
 * pas dans GONE_ROOM_IDS (servies en 410 par le Worker). Les salles d'une
 * Company fermée ou supprimée restent listées : leur fiche répond en 200 et
 * propose des salles alternatives.
 *
 * URL : /espacio-horas/<slug>-<_id>. Le slug reprend url_slug_text sous la
 * forme de l'ancien sitemap (vérifié sur 3 067 URL le 2026-10-21) : minuscules,
 * espaces → tirets, seulement lettres/chiffres/- . ( ), coupé à 76 caractères.
 * Bubble résout la fiche par l'_id final, quel que soit le slug. Une salle sans
 * slug garde /espacio-horas/<_id> (le Worker la redirige si un slug apparaît).
 *
 * Usage : node generate-sitemap-espacio-horas.js --out <dossier>
 */
'use strict';
const fs = require('fs');
const path = require('path');

const API = 'https://spaceson4.bubbleapps.io/api/1.1/obj/';
const SITE = 'https://www.spaces-on.com';

// Copie de GONE_ROOM_IDS dans worker-optimise.js — à garder en phase.
const GONE_ROOM_IDS = new Set([
  '1713870016927x223021781747236860', // « Mery Lee/ Hady Lamar » (2024)
  '1786034289997x147608459459428350', // « Dex Dentro », Vigo (2026-08)
]);

const TEST_NAME = /^(test|prueba|titulo)\b/i;

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : def;
}

async function getJson(url, tries = 4) {
  for (let t = 1; ; t++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (t >= tries) throw new Error(`${url}: ${e.message}`);
      await new Promise(res => setTimeout(res, 2000 * t));
    }
  }
}

async function fetchAllRooms() {
  const rows = [];
  for (let cursor = 0; ; ) {
    const j = await getJson(`${API}room?limit=100&cursor=${cursor}&sort_field=Created%20Date`);
    const res = j.response;
    rows.push(...res.results);
    cursor += res.results.length;
    if (!res.remaining || !res.results.length) return rows;
  }
}

function cleanSlug(s) {
  return s.trim().toLowerCase().replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}.()-]/gu, '').slice(0, 76);
}

function xmlEscape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function main() {
  const out = arg('--out', '.');
  const rooms = await fetchAllRooms();
  // Garde-fou : une réponse API partielle viderait le sitemap.
  if (rooms.length < 1000) throw new Error(`Only ${rooms.length} rooms returned, aborting`);

  const urls = [];
  for (const r of rooms) {
    const name = (r.name_room_text || '').trim();
    if (!name || TEST_NAME.test(name) || GONE_ROOM_IDS.has(r._id)) continue;
    const slug = cleanSlug(r.url_slug_text || '');
    const loc = `${SITE}/espacio-horas/${slug ? `${slug}-` : ''}${r._id}`;
    const lastmod = (r['Modified Date'] || r['Created Date'] || '').slice(0, 10);
    urls.push(`<url><loc>${xmlEscape(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`);
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') + '\n</urlset>\n';
  fs.writeFileSync(path.join(out, 'sitemap-espacio-horas.xml'), xml);
  console.log(`sitemap-espacio-horas.xml: ${urls.length} URLs (${rooms.length} rooms)`);
}

main().catch(e => { console.error(e); process.exit(1); });
