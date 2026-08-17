// anonymize.js — static PII scrubber. No AI at runtime. Pure regex + Unicode.
// Stochastic: tokens are random per call, consistent within one call (same PII → same marker).
//
// Unicode-aware: uses \p{Lu}/\p{L} (u-flag) covering all scripts including:
//   Latin variants (PT/ES/EN/DE/FR/PL/RO/HU), Cyrillic (Serbian/Russian),
//   Devanagari (Hindi/Marathi), and any other Unicode-letter-based script.
//
// Contextual anchoring keeps false-positive rate low — names are detected via
// labelled fields, salutations, and titles rather than free-text heuristics.

'use strict';

const crypto = require('crypto');

function hexToken(bytes = 3) {
  return crypto.randomBytes(bytes).toString('hex').toUpperCase();
}

function consistentMapper(prefix) {
  const seen = new Map();
  return function map(original) {
    const key = original.toLowerCase().trim();
    if (!seen.has(key)) seen.set(key, `[${prefix}_${hexToken()}]`);
    return seen.get(key);
  };
}

// ── Unicode building blocks (require `u` flag on every regex that uses these) ──

// One capitalized word in any script: uppercase letter + 1-25 letters/apostrophes/hyphens
// Matches: Smith · García · Kovács · Марковић · Rajesh · O'Brien · Đorđević · Ádám
const CAP_WORD = '\\p{Lu}[\\p{L}\'\\-]{1,25}';

// A personal name: 1–4 capitalized words
// Matches: "John" | "João Silva" | "Rajesh Kumar Sharma" | "Kovács Ádám István"
const NAME_1_4 = `${CAP_WORD}(?:\\s+${CAP_WORD}){0,3}`;

// ── Labels that precede names in SAP/support-system contexts ──────────────────
const NAME_LABELS = [
  // English
  'customer', 'client', 'contact', 'requester', 'reporter',
  'account', 'assigned to', 'tenant', 'user name', 'username',
  'full name', 'name', 'company name', 'company', 'organization', 'org',
  // Portuguese
  'cliente', 'contato', 'nome completo', 'nome', 'empresa',
  'usu[aá]rio', 'respons[aá]vel',
  // Spanish
  'nombre', 'contacto', 'solicitante', 'empresa', 'organización',
  // German
  'kunde', 'kontakt', 'benutzer', 'unternehmen', 'firma',
  // Hungarian
  'ügyfél', 'kapcsolat', 'felhasználó', 'vállalat',
  // Serbian (Latin)
  'kupac', 'kontakt', 'korisnik', 'kompanija',
].join('|');

// ── Salutation words in many languages ───────────────────────────────────────
const SALUTATIONS = [
  'dear', 'hi', 'hello', 'hey',                       // English
  'ol[aá]', 'prezado', 'prezada', 'caro', 'cara',     // Portuguese
  'estimado', 'estimada', 'hola',                      // Spanish
  'sehr\\s+geehrte[rs]?', 'lieber?', 'hallo',          // German
  'kedves', 'tisztelt',                                // Hungarian
  'po[sš]tovani', 'dragi', 'draga',                   // Serbian Latin
].join('|');

// ── Title prefixes across cultures ───────────────────────────────────────────
const TITLES = [
  'Mr\\.?', 'Mrs\\.?', 'Ms\\.?', 'Miss', 'Dr\\.?', 'Prof\\.?',  // English
  'Sr\\.?', 'Sra\\.?', 'Srta\\.?', 'D\\.?',                      // Portuguese/Spanish
  'Herr', 'Frau', 'Hr\\.?', 'Fr\\.?',                            // German
  'Úr', 'Úrhölgy',                                               // Hungarian
  'G-n', 'G-đa',                                                 // Serbian Latin
].join('|');

// ── Legal entity suffixes (adds company detection across many jurisdictions) ──
const LEGAL_SUFFIX = [
  // English-speaking
  'Inc\\.?', 'Ltd\\.?', 'Corp\\.?', 'LLC', 'PLC', 'Pty\\.?', 'Co\\.?',
  // German / Central Europe
  'GmbH', 'AG', 'KG', 'OHG', 'e\\.V\\.?',
  // Nordic / EU
  'SE', 'AB', 'A\\.S\\.', 'A/S', 'B\\.V\\.', 'N\\.V\\.', 'S\\.A\\.', 'S\\.A\\.S\\.',
  // Iberian / LatAm
  'Ltda\\.?', 'S\\.L\\.', 'S\\.A\\. de C\\.V\\.',
  // Hungarian
  'Zrt\\.', 'Kft\\.', 'Bt\\.', 'Nyrt\\.',
  // Serbian / Balkan
  'd\\.o\\.o\\.', 'a\\.d\\.', 'd\\.d\\.', 'j\\.p\\.',
  // Turkish
  'A\\.Ş\\.', 'Ltd\\.\\s*Şti\\.',
  // Indian
  'Pvt\\.?\\s*Ltd\\.?',
].join('|');

/**
 * Anonymize PII in text. Returns { text, stats }.
 * @param {string} input
 * @returns {{ text: string, stats: Record<string, number> }}
 */
function anonymize(input) {
  if (typeof input !== 'string' || !input) return { text: input || '', stats: {} };

  const stats = {};
  const tally = (cat) => { stats[cat] = (stats[cat] || 0) + 1; };

  const mapEmail   = consistentMapper('EMAIL');
  const mapPhone   = consistentMapper('PHONE');
  const mapIp      = consistentMapper('IP');
  const mapUser    = consistentMapper('USER');
  const mapName    = consistentMapper('NAME');
  const mapCompany = consistentMapper('COMPANY');
  const mapDoc     = consistentMapper('DOC');

  let t = input;

  // ── 1. Emails ──────────────────────────────────────────────────────────────
  t = t.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, m => {
    tally('email'); return mapEmail(m);
  });

  // ── 2. IP addresses (v4, optional port) ───────────────────────────────────
  t = t.replace(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d{1,5})?\b/g, (m, addr, port) => {
    if (addr.split('.').map(Number).every(p => p <= 255)) {
      tally('ip'); return mapIp(addr) + (port || '');
    }
    return m;
  });

  // ── 3. Brazilian CPF (000.000.000-00) — before phone to avoid mis-capture ─
  t = t.replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, m => {
    tally('cpf'); return mapDoc(m);
  });

  // ── 4. Brazilian CNPJ (00.000.000/0000-00) ────────────────────────────────
  t = t.replace(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, m => {
    tally('cnpj'); return mapDoc(m);
  });

  // ── 5. Phone numbers ───────────────────────────────────────────────────────
  t = t.replace(
    /(?<!\d)(\+\d{1,4}[\s.\-])?\(?\d{2,4}\)?[\s.\-]\d{3,5}[\s.\-]\d{3,5}(?:[\s.\-]\d{1,5})?(?!\d)/g,
    m => {
      const digits = m.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15 || !/[\s.\-()+]/.test(m.trim())) return m;
      tally('phone'); return mapPhone(m);
    }
  );

  // ── 6. SAP / cloud user identifiers (I-numbers, S/P/C-users) ─────────────
  t = t.replace(/\b([ISCPiscp][0-9]{6,9})\b/g, m => {
    tally('sap_user'); return mapUser(m);
  });

  // ── 7. Names after labelled fields (Unicode-aware) ────────────────────────
  // "Customer: João Silva" | "Ügyfél: Kovács Ádám" | "Контакт: Марковић Петар"
  const labelRe = new RegExp(
    `(?<!\\p{L})(${NAME_LABELS})\\s*[:\\-]\\s*(${NAME_1_4})`,
    'giu'
  );
  t = t.replace(labelRe, (m, label, captured) => {
    tally('name_label');
    const idx = m.lastIndexOf(captured);
    return m.slice(0, idx) + mapName(captured);
  });

  // ── 8. Salutations (Unicode-aware) ────────────────────────────────────────
  // "Dear John," | "Prezado João Silva," | "Kedves Kovács Úr,"
  const salutRe = new RegExp(
    `\\b(${SALUTATIONS})\\s+(?:${TITLES})?\\s*(${NAME_1_4})[,!]`,
    'giu'
  );
  t = t.replace(salutRe, (m, salut, captured) => {
    tally('name_salutation');
    const suffix = m.slice(-1);
    const idx = m.lastIndexOf(captured);
    return m.slice(0, idx) + mapName(captured) + suffix;
  });

  // ── 9. Title + name (Unicode-aware) ───────────────────────────────────────
  // "Dr. Ana Costa" | "Herr Müller" | "Sr. García" | "Prof. Venkataraman"
  const titleRe = new RegExp(
    `\\b(${TITLES})\\s+(${NAME_1_4})`,
    'gu'
  );
  t = t.replace(titleRe, (m, title, captured) => {
    tally('name_title'); return title + ' ' + mapName(captured);
  });

  // ── 10. Company names with legal suffixes ─────────────────────────────────
  // "Acme Corp." | "Budapest Zrt." | "Petrović d.o.o." | "Tata Pvt. Ltd."
  const companyRe = new RegExp(
    `\\b(${CAP_WORD}(?:\\s+${CAP_WORD}){0,4}?)\\s+(${LEGAL_SUFFIX})`,
    'gu'
  );
  t = t.replace(companyRe, m => {
    tally('company'); return mapCompany(m);
  });

  return { text: t, stats };
}

/**
 * Convenience wrapper — returns only the anonymized string.
 * @param {string} input
 * @returns {string}
 */
function scrub(input) {
  return anonymize(input).text;
}

module.exports = { anonymize, scrub };
