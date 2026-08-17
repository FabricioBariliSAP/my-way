const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');
const AdmZip = require('adm-zip');
const { scrub } = require('./anonymize');

// Load env vars from .env if present (dev convenience)
// Uses indexOf('=') so values that contain '=' (base64 keys, URLs with query strings) are preserved.
try {
  require('fs').readFileSync('.env', 'utf8').split(/\r?\n/).forEach(l => {
    const trimmed = l.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq < 1) return;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    if (k && !(k in process.env)) process.env[k] = v; // don't override real env vars
  });
} catch (_) {}

const PORT = process.env.PORT || 3000;
const AI_HOST = process.env.AI_HOST || 'http://localhost:6655';
const HAI_KEY = process.env.HAI_KEY || '';
const EMBED_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-4.1';
const KNOWLEDGE_DIR = path.join(__dirname, 'knowledge');
const INDEX_FILE = path.join(__dirname, 'knowledge_index.json');
const DATA_DIR = path.join(__dirname, 'data');
const ENC_KEY_PASSPHRASE = process.env.ENCRYPTION_KEY || 'my-way-default-key-CHANGE-ME';

if (!process.env.ENCRYPTION_KEY) {
  console.warn('  [WARN] ENCRYPTION_KEY not set — using default passphrase. Set it in .env for real security.\n');
}

// ============================================================
// ENCRYPTION HELPERS (AES-256-GCM + scrypt key derivation)
// ============================================================
function encryptState(data) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENC_KEY_PASSPHRASE, salt, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return JSON.stringify({
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
    data: encrypted.toString('hex'),
  });
}

function decryptState(raw) {
  const { salt, iv, authTag, data } = JSON.parse(raw);
  const key = crypto.scryptSync(ENC_KEY_PASSPHRASE, Buffer.from(salt, 'hex'), 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

// ============================================================
// HYPERSPACE / RAG HELPERS
// ============================================================
function haiRequest(method, pathname, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathname, AI_HOST);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + (url.search || ''),
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HAI_KEY}`,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(opts, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function cosineSim(a, b) {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; ma += a[i] * a[i]; mb += b[i] * b[i]; }
  return ma && mb ? dot / (Math.sqrt(ma) * Math.sqrt(mb)) : 0;
}

async function getEmbedding(text) {
  const r = await haiRequest('POST', '/openai/v1/embeddings', { model: EMBED_MODEL, input: text.slice(0, 8000) });
  if (r.status !== 200 || !r.body.data) throw new Error('Embedding error: ' + JSON.stringify(r.body));
  return r.body.data[0].embedding;
}

function findSimilar(vec, index, n = 3) {
  return index
    .map(entry => ({ ...entry, score: cosineSim(vec, entry.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

function loadIndex() {
  try { return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8')); }
  catch { return []; }
}

function saveIndex(entries) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(entries), 'utf8');
}

function extractTextFromXML(xmlStr) {
  // Pull text out of CDATA sections and tag content — no DOMParser on Node
  let text = xmlStr
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, ' $1 ')  // unwrap CDATA
    .replace(/<[^>]+>/g, ' ')                          // strip tags
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 4000);
}

function buildQueryText(state) {
  let q = `${state.caseId || ''} ${state.customerName || ''} ${state.envType || ''} ${state.dbType || ''} ${state.affectsVersion || ''}\n`;
  if (state.symptom) q += `Symptom: ${state.symptom}\n`;
  if (state.stepsToReproduce) q += `Steps to Reproduce: ${state.stepsToReproduce}\n`;
  if (state.groups && state.groups.length) q += `Groups: ${state.groups.map(g => g.title).join(', ')}\n`;
  (state.steps || []).forEach(step => {
    q += `Step: ${step.title || ''}\n`;
    (step.blocks || []).forEach(b => {
      if (b.type === 'text' || b.type === 'highlight') q += (b.content || '').replace(/<[^>]+>/g, ' ').slice(0, 300) + '\n';
      else if (b.type === 'sql' || b.type === 'log') q += (b.content || '').slice(0, 200) + '\n';
    });
  });
  return q.slice(0, 2000);
}

// ============================================================
// XML HELPERS
// ============================================================
function cdata(str) {
  if (!str) return '';
  return '<![CDATA[' + String(str).replace(/\]\]>/g, ']]]]><![CDATA[>') + ']]>';
}

function xmlTag(tag, content, attrs) {
  const attrStr = attrs ? ' ' + Object.entries(attrs).map(([k, v]) => `${k}="${xmlAttr(v)}"`).join(' ') : '';
  return `<${tag}${attrStr}>${content}</${tag}>`;
}

function xmlAttr(val) {
  if (!val) return '';
  return String(val).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateXML(state) {
  const now = new Date().toISOString();

  const metaXml = `<meta>
    <caseId>${cdata(state.caseId)}</caseId>
    <customerName>${cdata(state.customerName)}</customerName>
    <envType>${cdata(state.envType)}</envType>
    <dbType>${cdata(state.dbType)}</dbType>
    <archType>${cdata(state.archType)}</archType>
    <affectsVersion>${cdata(state.affectsVersion)}</affectsVersion>
    <symptom>${cdata(state.symptom)}</symptom>
    <stepsToReproduce>${cdata(state.stepsToReproduce)}</stepsToReproduce>
  </meta>`;

  const stepsXml = (state.steps || []).map(step => {
    const linksXml = (step.links || []).map(l => `<link>${xmlAttr(l)}</link>`).join('');
    const blocksXml = (step.blocks || []).map(block => {
      let inner = '';
      if (block.type === 'image') {
        const fname = block.fileName || '';
        inner = `<fileName>${xmlAttr(fname)}</fileName><imageFile>${xmlAttr(fname ? 'attachments/' + fname : '')}</imageFile>${block.caption ? `<caption>${cdata(block.caption)}</caption>` : ''}`;
      } else if (block.type === 'table') {
        inner = `<rawTable>${cdata(block.rawTable || '')}</rawTable>`;
      } else if (block.type === 'video') {
        inner = `<src>${xmlAttr(block.src || '')}</src>`;
      } else {
        inner = `<content>${cdata(block.content || '')}</content>`;
      }
      return xmlTag('block', inner, { id: block.id, type: block.type });
    }).join('\n        ');

    const aiAttrs = step.aiGenerated
      ? ` aiGenerated="true" aiStatus="${xmlAttr(step.aiStatus || 'accepted')}"`
      : '';
    const groupAttr = step.groupId ? ` groupId="${xmlAttr(step.groupId)}"` : '';
    const shortIdAttr = step.shortId ? ` shortId="${xmlAttr(step.shortId)}"` : '';
    const aiRationaleXml = step.aiGenerated && step.aiRationale
      ? `\n      <aiRationale>${cdata(step.aiRationale)}</aiRationale>` : '';

    return `<step id="${xmlAttr(step.id)}" shortId="${xmlAttr(step.shortId||'')}" findingType="${xmlAttr(step.findingType)}" created="${xmlAttr(step.created)}"${aiAttrs}${groupAttr}>
      <title>${cdata(step.title)}</title>${aiRationaleXml}
      <links>${linksXml}</links>
      <blocks>
        ${blocksXml}
      </blocks>
    </step>`;
  }).join('\n    ');

  let kbaXml = '';
  if (state.kba) {
    kbaXml = `<kba>
    <symptom>${cdata(state.kba.symptom)}</symptom>
    <repro>${cdata(state.kba.repro)}</repro>
    <cause>${cdata(state.kba.cause)}</cause>
    <solution>${cdata(state.kba.solution)}</solution>
  </kba>`;
  }

  let incidentXml = '';
  if (state.incident) {
    const i = state.incident;
    incidentXml = `<incident>
    <desc>${cdata(i.desc)}</desc>
    <label>${cdata(i.label)}</label>
    <customer>${cdata(i.customer)}</customer>
    <tenantId>${cdata(i.tenantId)}</tenantId>
    <env>${cdata(i.env)}</env>
    <version>${cdata(i.version)}</version>
    <db>${cdata(i.db)}</db>
    <arch>${cdata(i.arch)}</arch>
    <repro>${cdata(i.repro)}</repro>
    <findings>${cdata(i.findings)}</findings>
    <needed>${cdata(i.needed)}</needed>
    <logs>${cdata(i.logs)}</logs>
    <reploTest>${cdata(i.reploTest)}</reploTest>
  </incident>`;
  }

  // AI effectiveness summary
  const aiSteps = (state.steps || []).filter(s => s.aiGenerated);
  const aiAccepted = aiSteps.filter(s => s.aiStatus === 'accepted').length;
  const aiEdited = aiSteps.filter(s => s.aiStatus === 'edited').length;
  const aiRejected = (state.aiRejected || []).length;
  const aiTotal = aiAccepted + aiEdited + aiRejected;
  const rejectedStepsXml = (state.aiRejected || []).map(r =>
    `<rejectedStep title="${xmlAttr(r.title)}" findingType="${xmlAttr(r.findingType)}" rejectedAt="${xmlAttr(r.rejectedAt)}"><aiRationale>${cdata(r.aiRationale)}</aiRationale></rejectedStep>`
  ).join('\n      ');
  const aiSummaryXml = aiTotal > 0 ? `<aiSummary>
    <suggested>${aiTotal}</suggested><accepted>${aiAccepted}</accepted><edited>${aiEdited}</edited><rejected>${aiRejected}</rejected>
    <rejectedSteps>${rejectedStepsXml}</rejectedSteps>
  </aiSummary>` : '';

  const groupsXml = (state.groups && state.groups.length)
    ? `<groups>\n    ${state.groups.map(g => `<group id="${xmlAttr(g.id)}" title="${xmlAttr(g.title)}"/>`).join('\n    ')}\n  </groups>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<investigation version="1.0" exportedAt="${xmlAttr(now)}">
  ${metaXml}
  ${groupsXml}
  <steps>
    ${stepsXml}
  </steps>
  ${kbaXml}
  ${incidentXml}
  ${aiSummaryXml}
</investigation>`;
}

// ============================================================
// READ FULL BODY
// ============================================================
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// ============================================================
// SERVER
// ============================================================
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const sendJSON = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  // ---- GET /api/rag-status ----
  if (req.method === 'GET' && req.url === '/api/rag-status') {
    const index = loadIndex();
    sendJSON(200, { indexed: index.length, sources: index.map(e => e.source) });
    return;
  }

  // ---- POST /api/rag-index ----
  if (req.method === 'POST' && req.url === '/api/rag-index') {
    try {
      fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
      const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => /\.(zip|xml|txt|md)$/i.test(f));
      const entries = [];
      for (const file of files) {
        const fullPath = path.join(KNOWLEDGE_DIR, file);
        let text = '';
        try {
          const ext = path.extname(file).toLowerCase();
          if (ext === '.zip') {
            const zip = new AdmZip(fullPath);
            const xmlEntry = zip.getEntry('case.xml');
            if (xmlEntry) text = extractTextFromXML(xmlEntry.getData().toString('utf8'));
          } else if (ext === '.xml') {
            text = extractTextFromXML(fs.readFileSync(fullPath, 'utf8'));
          } else {
            text = fs.readFileSync(fullPath, 'utf8').slice(0, 4000);
          }
          if (!text.trim()) continue;
          const embedding = await getEmbedding(text);
          entries.push({ id: file, source: file, text: text.slice(0, 2000), embedding });
        } catch (e) {
          console.error(`Skipping ${file}:`, e.message);
        }
      }
      saveIndex(entries);
      sendJSON(200, { indexed: entries.length, sources: entries.map(e => e.source) });
    } catch (e) {
      sendJSON(500, { error: e.message });
    }
    return;
  }

  // ---- POST /api/rag-suggest ----
  if (req.method === 'POST' && req.url === '/api/rag-suggest') {
    try {
      const body = await readBody(req);
      const { state, systemPrompt: customSystemPrompt } = JSON.parse(body);

      const queryText = buildQueryText(state);
      const index = loadIndex();
      let ragSources = [];
      let ragContext = '';

      if (index.length > 0) {
        const queryVec = await getEmbedding(queryText);
        ragSources = findSimilar(queryVec, index, 3);
        ragContext = ragSources.map(s =>
          `[Source: ${s.source}, similarity: ${Math.round(s.score * 100)}%]\n${s.text}`
        ).join('\n\n---\n\n');
      }

      // Build current investigation summary
      let invContext = `Case ID: ${state.caseId || 'N/A'}\nCustomer: ${state.customerName || 'N/A'}\n`;
      invContext += `Environment: ${state.envType || 'N/A'} | DB: ${state.dbType || 'N/A'} | Version: ${state.affectsVersion || 'N/A'}\n`;
      if (state.symptom) invContext += `Symptom: ${state.symptom}\n`;
      if (state.stepsToReproduce) invContext += `Steps to Reproduce:\n${state.stepsToReproduce}\n`;
      invContext += `\nCurrent steps (${(state.steps || []).length}):\n`;
      (state.steps || []).forEach((s, i) => {
        invContext += `  ${i + 1}. [${s.findingType || 'info'}] ${s.title}\n`;
      });

      const systemPrompt = customSystemPrompt || `You are an expert SAP support investigation assistant.
Based on the current investigation context and similar past cases, suggest 3-5 concrete next investigation steps.
Each step should have a clear title, finding type, one-sentence rationale, and optional guidance text.

Return ONLY a valid JSON array (no markdown, no extra text):
[
  {
    "title": "Step title (short, actionable)",
    "findingType": "info|clue|highlight|root",
    "rationale": "One sentence explaining why this step is relevant",
    "blocks": [{"type": "text", "content": "Optional guidance or checklist for this step"}]
  }
]`;

      const userPrompt = ragContext
        ? `## Current Investigation\n${scrub(invContext)}\n\n## Similar Past Cases / Reference Documents\n${ragContext}`
        : `## Current Investigation\n${scrub(invContext)}`;

      const r = await haiRequest('POST', '/openai/v1/chat/completions', {
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 2000
      });

      if (r.status !== 200) throw new Error('AI error: ' + JSON.stringify(r.body));

      let raw = r.body.choices[0].message.content;
      // Strip markdown fences
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      const suggestions = JSON.parse(raw);

      sendJSON(200, {
        suggestions,
        ragSources: ragSources.map(s => ({ source: s.source, score: s.score }))
      });
    } catch (e) {
      sendJSON(500, { error: e.message });
    }
    return;
  }

  // ---- POST /api/rag-contribute ----
  if (req.method === 'POST' && req.url === '/api/rag-contribute') {
    try {
      const body = await readBody(req);
      const { state } = JSON.parse(body);
      if (!state.caseId) throw new Error('Case ID is required to contribute');

      let text = `Case: ${state.caseId} | Customer: ${state.customerName || ''} | ${state.envType || ''} ${state.dbType || ''} ${state.affectsVersion || ''}\n`;
      (state.steps || []).forEach((s, i) => {
        text += `Step ${i + 1} [${s.findingType || 'info'}]: ${s.title}\n`;
        (s.blocks || []).forEach(b => {
          if (b.type === 'text' || b.type === 'highlight') text += (b.content || '').replace(/<[^>]+>/g, ' ').slice(0, 400) + '\n';
          else if (b.type === 'sql' || b.type === 'log') text += (b.content || '').slice(0, 200) + '\n';
        });
      });
      if (state.kba) {
        text += `\nCause: ${(state.kba.cause || '').slice(0, 300)}\nSolution: ${(state.kba.solution || '').slice(0, 300)}\n`;
      }

      fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
      const embedding = await getEmbedding(text);
      const index = loadIndex().filter(e => e.id !== state.caseId);
      index.push({ id: state.caseId, source: `case_${state.caseId}`, text: text.slice(0, 2000), embedding });
      saveIndex(index);

      sendJSON(200, { ok: true, caseId: state.caseId });
    } catch (e) {
      sendJSON(500, { error: e.message });
    }
    return;
  }

  // ---- POST /api/save-skill ----
  if (req.method === 'POST' && req.url === '/api/save-skill') {
    try {
      const body = await readBody(req);
      const { state } = JSON.parse(body);
      if (!state.caseId) throw new Error('Case ID is required');

      const SKILLS_DIR = path.join(__dirname, 'skills');
      fs.mkdirSync(SKILLS_DIR, { recursive: true });

      const allSteps = state.steps || [];
      const groups = state.groups || [];

      const typeLabel  = { clue: '🔎 Clue', highlight: '⚡ Highlight', root: '🎯 Root Cause', info: 'ℹ️ Info' };
      const typeEmoji  = { clue: '🔎', highlight: '⚡', root: '🎯', info: 'ℹ️' };

      // Build shortId → display-number map for cross-references
      const stepNumMap = {};
      allSteps.forEach((s, i) => {
        stepNumMap[s.id] = i + 1;
        if (s.shortId) stepNumMap[s.shortId] = i + 1;
      });

      function stripHtml(html) {
        return (html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      }

      // Resolve linked step IDs/shortIds to human-readable anchors
      function resolveLinks(ids) {
        return (ids || []).map(lid => {
          const target = allSteps.find(s => s.id === lid || s.shortId === lid);
          if (!target) return null;
          const num = stepNumMap[target.id];
          const emoji = typeEmoji[target.findingType] || 'ℹ️';
          return `[${emoji} Step ${num}: ${target.title}](#step-${num})`;
        }).filter(Boolean);
      }

      let md = `# Skill: Case ${state.caseId}\n\n`;
      md += `**Customer:** ${state.customerName || '—'}  \n`;
      md += `**Environment:** ${[state.envType, state.dbType, state.archType, state.affectsVersion].filter(Boolean).join(' | ') || '—'}  \n`;
      md += `**Exported:** ${new Date().toISOString()}\n\n---\n\n`;

      // ── Key Findings summary (highlights + root causes) ──────────────────────
      const findingSteps = allSteps.filter(s => s.findingType === 'highlight' || s.findingType === 'root');
      if (findingSteps.length > 0) {
        md += `## 🔑 Key Findings\n\n`;
        md += `> Points of attention identified during the investigation.\n\n`;
        findingSteps.forEach(step => {
          const num = stepNumMap[step.id];
          const emoji = typeEmoji[step.findingType] || '⚡';
          md += `- **${emoji} [Step ${num}: ${step.title}](#step-${num})**`;
          // Pull the first text/highlight block as a one-liner summary
          const firstText = (step.blocks || []).find(b => b.type === 'text' || b.type === 'highlight');
          if (firstText) {
            const plain = stripHtml(firstText.content);
            const oneliner = plain.split('\n')[0].slice(0, 200);
            if (oneliner) md += `  \n  _${oneliner}_`;
          }
          md += '\n';
        });
        md += '\n---\n\n';
      }

      // ── Investigation Steps (all steps, full detail) ──────────────────────────
      md += `## 🔍 Investigation Steps\n\n`;

      function renderStep(step) {
        const num = stepNumMap[step.id];
        const label = typeLabel[step.findingType] || step.findingType;
        const isSignificant = step.findingType === 'highlight' || step.findingType === 'root';

        md += `### Step ${num}: ${step.title} {#step-${num}}\n\n`;
        md += `**Type:** ${label}`;
        if (step.aiGenerated) md += ' · 🤖 _AI-suggested_';
        md += '\n\n';

        if (isSignificant) {
          md += `> ⚠️ **Point of attention** — this step contains a key finding.\n\n`;
        }

        // AI rationale (shown as context note)
        if (step.aiGenerated && step.aiRationale) {
          md += `> 💡 _Rationale: ${step.aiRationale}_\n\n`;
        }

        let hasContent = false;
        (step.blocks || []).forEach(block => {
          if (block.type === 'text' || block.type === 'highlight') {
            const plain = stripHtml(block.content);
            if (plain) { md += plain + '\n\n'; hasContent = true; }
          } else if (block.type === 'sqlquery' || block.type === 'sql') {
            const code = (block.content || '').trim();
            if (code) {
              md += `**Query executed:**\n\n\`\`\`sql\n${code}\n\`\`\`\n\n`;
              hasContent = true;
            }
          } else if (block.type === 'sqlresult') {
            const code = (block.content || '').trim();
            if (code) {
              md += `**Query result:**\n\n\`\`\`\n${code}\n\`\`\`\n\n`;
              hasContent = true;
            }
          } else if (block.type === 'log') {
            const code = (block.content || '').trim();
            if (code) {
              md += `**Log excerpt:**\n\n\`\`\`\n${code}\n\`\`\`\n\n`;
              hasContent = true;
            }
          } else if (block.type === 'video' && block.src) {
            md += `🎬 [Video](${block.src})\n\n`;
            hasContent = true;
          } else if (block.type === 'table' && block.cols) {
            md += `**Table:** ${block.cols.join(' | ')}\n\n`;
            hasContent = true;
          }
        });

        if (!hasContent) md += '_No content recorded for this step._\n\n';

        // Cross-references to linked steps
        const linkedRefs = resolveLinks(step.links);
        if (linkedRefs.length) {
          md += `**🔗 Referenced by / relates to:** ${linkedRefs.join(' · ')}\n\n`;
        }

        // Cross-references: find other steps that link TO this step
        const backRefs = allSteps.filter(s =>
          s.id !== step.id && (s.links || []).some(lid => lid === step.id || lid === step.shortId)
        );
        if (backRefs.length) {
          const backLinks = backRefs.map(s => {
            const bNum = stepNumMap[s.id];
            const bEmoji = typeEmoji[s.findingType] || 'ℹ️';
            return `[${bEmoji} Step ${bNum}: ${s.title}](#step-${bNum})`;
          });
          md += `**↩️ Cited in:** ${backLinks.join(' · ')}\n\n`;
        }

        md += '---\n\n';
      }

      if (allSteps.length === 0) {
        md += '_No investigation steps recorded for this case._\n\n';
      } else if (groups.length === 0) {
        allSteps.forEach(renderStep);
      } else {
        const ungrouped = allSteps.filter(s => !s.groupId || !groups.find(g => g.id === s.groupId));
        if (ungrouped.length) {
          md += `### Ungrouped\n\n`;
          ungrouped.forEach(renderStep);
        }
        groups.forEach(g => {
          const gSteps = allSteps.filter(s => s.groupId === g.id);
          if (!gSteps.length) return;
          md += `## 📁 ${g.title}\n\n`;
          gSteps.forEach(renderStep);
        });
      }

      if (state.kba && (state.kba.cause || state.kba.solution)) {
        md += `## Root Cause\n\n${state.kba.cause || '—'}\n\n## Solution\n\n${state.kba.solution || '—'}\n`;
      }

      const fileName = `case_${String(state.caseId).replace(/[^a-zA-Z0-9_-]/g, '_')}_skill.md`;
      const filePath = path.join(SKILLS_DIR, fileName);
      fs.writeFileSync(filePath, md, 'utf8');

      // Also auto-contribute to RAG knowledge base
      try {
        const ragText = md.replace(/[#*`_]/g, '').replace(/\n+/g, ' ').slice(0, 4000);
        const embedding = await getEmbedding(ragText);
        const ragId = 'skill_' + state.caseId;
        const index = loadIndex().filter(e => e.id !== ragId);
        index.push({ id: ragId, source: fileName, text: ragText.slice(0, 2000), embedding });
        saveIndex(index);
      } catch (ragErr) {
        console.error('RAG auto-index warning:', ragErr.message);
      }

      sendJSON(200, { ok: true, file: 'skills/' + fileName, steps: allSteps.length });
    } catch (e) {
      sendJSON(500, { error: e.message });
    }
    return;
  }

  // ---- POST /export-zip ----
  if (req.method === 'POST' && req.url === '/export-zip') {
    try {
      const body = await readBody(req);
      const { state } = JSON.parse(body);
      const xmlString = generateXML(state);

      const zip = new AdmZip();
      zip.addFile('case.xml', Buffer.from(xmlString, 'utf8'));

      (state.steps || []).forEach(step => {
        (step.blocks || []).forEach(block => {
          if (block.type === 'image' && block.content && block.content.startsWith('data:')) {
            const match = block.content.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              const fname = block.fileName || `image_${block.id}.png`;
              zip.addFile('attachments/' + fname, Buffer.from(match[2], 'base64'));
            }
          }
        });
      });

      const zipBuffer = zip.toBuffer();
      const filename = `case_${(state.caseId || 'export').replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`;
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length
      });
      res.end(zipBuffer);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ---- POST /import-zip ----
  if (req.method === 'POST' && req.url === '/import-zip') {
    try {
      const body = await readBody(req);
      const { zipBase64 } = JSON.parse(body);
      const zip = new AdmZip(Buffer.from(zipBase64, 'base64'));

      const xmlEntry = zip.getEntry('case.xml');
      if (!xmlEntry) throw new Error('case.xml not found in ZIP');
      const xmlString = xmlEntry.getData().toString('utf8');

      const images = {};
      zip.getEntries().forEach(entry => {
        if (entry.entryName.startsWith('attachments/') && !entry.isDirectory) {
          const fname = path.basename(entry.entryName);
          const ext = path.extname(fname).toLowerCase().slice(1) || 'png';
          const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }[ext] || 'image/png';
          images[fname] = `data:${mime};base64,` + entry.getData().toString('base64');
        }
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ xml: xmlString, images }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ---- GET /api/rag-docs — return indexed doc texts, optionally filtered by sources ----
  if (req.method === 'GET' && req.url.startsWith('/api/rag-docs')) {
    const urlObj = new URL(req.url, 'http://localhost');
    const sourcesParam = urlObj.searchParams.get('sources');
    const allowedSources = sourcesParam
      ? sourcesParam.split(',').map(s => decodeURIComponent(s.trim())).filter(Boolean)
      : null;
    const index = loadIndex();
    const docs = index
      .filter(e => !allowedSources || allowedSources.includes(e.source))
      .map(e => ({ source: e.source, text: e.text }));
    sendJSON(200, { docs });
    return;
  }

  // ---- POST /api/save-state ----
  if (req.method === 'POST' && req.url === '/api/save-state') {
    try {
      const body = await readBody(req);
      const { state } = JSON.parse(body);
      if (!state.caseId) throw new Error('caseId is required');
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const safeId = String(state.caseId).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = path.join(DATA_DIR, `case_${safeId}.enc`);
      fs.writeFileSync(filePath, encryptState(state), 'utf8');
      sendJSON(200, { ok: true, file: `data/case_${safeId}.enc` });
    } catch (e) {
      sendJSON(500, { error: e.message });
    }
    return;
  }

  // ---- GET /api/list-states ----
  if (req.method === 'GET' && req.url === '/api/list-states') {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.enc'));
      const states = files.map(f => ({
        file: f,
        caseId: f.replace(/^case_/, '').replace(/\.enc$/, ''),
        savedAt: fs.statSync(path.join(DATA_DIR, f)).mtime.toISOString(),
      }));
      sendJSON(200, { states });
    } catch (e) {
      sendJSON(500, { error: e.message });
    }
    return;
  }

  // ---- GET /api/load-state/:caseId ----
  if (req.method === 'GET' && req.url.startsWith('/api/load-state/')) {
    try {
      const caseId = decodeURIComponent(req.url.slice('/api/load-state/'.length));
      const safeId = caseId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = path.join(DATA_DIR, `case_${safeId}.enc`);
      if (!fs.existsSync(filePath)) { sendJSON(404, { error: 'State not found' }); return; }
      const state = decryptState(fs.readFileSync(filePath, 'utf8'));
      sendJSON(200, { state });
    } catch (e) {
      sendJSON(500, { error: e.message });
    }
    return;
  }

  // ---- DELETE /api/delete-state/:caseId ----
  if (req.method === 'DELETE' && req.url.startsWith('/api/delete-state/')) {
    try {
      const caseId = decodeURIComponent(req.url.slice('/api/delete-state/'.length));
      const safeId = caseId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = path.join(DATA_DIR, `case_${safeId}.enc`);
      if (!fs.existsSync(filePath)) { sendJSON(404, { error: 'State not found' }); return; }
      fs.unlinkSync(filePath);
      sendJSON(200, { ok: true });
    } catch (e) {
      sendJSON(500, { error: e.message });
    }
    return;
  }

  // ---- Proxy: forward /v1/* to Hyperspaces AI (maps /v1/ → /openai/v1/) ----
  if (req.url.startsWith('/v1/')) {
    const target = new URL('/openai' + req.url, AI_HOST);
    const options = {
      hostname: target.hostname,
      port: target.port || 80,
      path: target.pathname + (target.search || ''),
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers['authorization'] || '',
      }
    };

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const proxyReq = http.request(options, proxyRes => {
        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
        proxyRes.pipe(res);
      });
      proxyReq.on('error', err => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error: ' + err.message + '. Is Hyperspaces running on port 6655?' }));
      });
      if (body) proxyReq.write(body);
      proxyReq.end();
    });
    return;
  }

  // ---- Serve static files ----
  let filePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  SAP Investigation Tool running at:\n`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(`  Proxying AI calls to: ${AI_HOST}\n`);
  console.log(`  Knowledge base: ${KNOWLEDGE_DIR}\n`);
  fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
});
