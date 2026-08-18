# MY WAY — User Manual
### SAP Investigation Tool with AI Assistance

---

## Table of Contents

1. [What is MY WAY](#1-what-is-my-way)
2. [Requirements and Installation](#2-requirements-and-installation)
3. [Starting the Tool](#3-starting-the-tool)
4. [Main Interface](#4-main-interface)
5. [Managing Cases](#5-managing-cases)
6. [Filling in Case Metadata](#6-filling-in-case-metadata)
7. [Investigation Steps](#7-investigation-steps)
8. [Content Block Types](#8-content-block-types)
9. [AI Assistant — Step Suggestions](#9-ai-assistant--step-suggestions)
10. [Referenced KBAs](#10-referenced-kbas)
11. [Export and Import](#11-export-and-import)
12. [AI Assist Tab — Full Analysis](#12-ai-assist-tab--full-analysis)
13. [KBA Tab — KBA Draft](#13-kba-tab--kba-draft)
14. [Knowledge Base (RAG)](#14-knowledge-base-rag)
15. [Prompt Configuration](#15-prompt-configuration)
16. [State Encryption](#16-state-encryption)
17. [.env File — Configuration](#17-env-file--configuration)
18. [Frequently Asked Questions](#18-frequently-asked-questions)

---

## 1. What is MY WAY

MY WAY is a local SAP support investigation tool that:

- Organizes investigations into structured **steps** with finding types
- Uses **local AI** (via Hyperspace) to suggest next steps based on context
- Maintains a **knowledge base** (RAG) with past cases and KBA guides
- Allows **attaching KBAs** from SAP for Me as analysis context
- Generates **KBA drafts**, reports, and resolution documentation
- Saves states **encrypted** on the local server

---

## 2. Requirements and Installation

| Requirement | Minimum Version |
|---|---|
| Node.js | 18+ |
| Hyperspace (local AI proxy) | Running on `localhost:6655` |
| Browser | Modern Chrome, Edge, or Firefox |

### Installation

```bash
# 1. Clone or download the repository
cd my-way

# 2. Install dependencies
npm install

# 3. Configure .env (copy the example)
cp .env.example .env
# Edit .env with your Hyperspace HAI_KEY

# 4. Start the server
node server.js
# or
npm start
```

Open `http://localhost:3000` in your browser.

---

## 3. Starting the Tool

When opening `CASE_HANDLING.html` via `http://localhost:3000`:

1. **New case**: click **＋ Start Investigation** in the central area
2. **Existing case**: click the **Cases** button in the top bar to list and open a saved case
3. **Import**: click **Import** to load a previously exported `.zip` or `.xml` file

---

## 4. Main Interface

```
┌─────────────────────────────────────────────────────────────┐
│  [Prompts] [View] [Import] [Cases] [Save] [Resolved] [Export]│  ← Top bar
├──────────────┬──────────────────────────────────────────────┤
│ SIDEBAR      │  MAIN AREA                                   │
│              │                                              │
│ ▼ Case       │  Selected step                              │
│   Metadata   │  (content block editor)                     │
│              │                                              │
│ 📎 KBAs      │                                              │
│              │                                              │
│ Steps        │                                              │
│ ─────────    │                                              │
│ ▶ Step 1     │                                              │
│ ▶ Step 2     │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

**Top bar — buttons:**

| Button | Function |
|---|---|
| **Prompts** | Opens the AI prompt configuration and context panel |
| **View** | Opens the report-format visualization |
| **Import** | Imports case from a ZIP or XML file |
| **Cases** | Lists and manages all saved cases |
| **Save** | Saves the current case (localStorage or server) |
| **Case Resolved** | Marks the case as resolved and prepares final documentation |
| **Export / Generate** | Opens the export modal with tabs: AI, KBA, Message, Package, etc. |

---

## 5. Managing Cases

### Create a new case
1. Click **＋ Step** in the sidebar to start a blank case, or
2. Click **＋ Start Investigation** in the central area

### Save
- Click **Save** in the top bar, or press **Ctrl+S**
- The case is saved in browser `localStorage` with key `sap_case_<caseId>`
- If local storage is full, the data is sent to the server via `/api/save-state`

### Open an existing case
1. Click **Cases** → lists all saved cases
2. Click the desired case to load it
3. Cases can also be opened directly via URL: `?case=CS1234567`

### Delete a case
In the **Cases** panel, each item has a delete button (trash icon).

---

## 6. Filling in Case Metadata

In the sidebar, fill in the fields:

| Field | Description |
|---|---|
| **Case ID** | SAP case number (e.g., `CS20260012663452`) |
| **Customer** | Customer name (anonymized before sending to AI) |
| **Environment** | Environment type (PRD, TST, DEV, SBOX) |
| **DB Type** | Database (HANA, Oracle, etc.) |
| **Architecture** | Architecture type (Hyperscalers, Legacy, etc.) |
| **Affects Version** | Affected product version (e.g., `2311`) |
| **Symptom** | Description of the symptom reported by the customer |
| **Steps to Reproduce** | Numbered steps to reproduce the problem |

> **Tip:** Press Enter in the Symptom field to auto-add bullets. Use numbers in Steps to Reproduce to auto-number.

---

## 7. Investigation Steps

### Adding a step
- Click **＋ Step** in the sidebar
- Or click **🤖** to get automatic AI suggestions

### Finding types

| Type | Icon | Use |
|---|---|---|
| **Info** | ℹ️ | Neutral observation, data collection |
| **Clue** | 🔎 | Relevant indicator, investigation lead |
| **Highlight** | ⚡ | Point of attention, important finding |
| **Root Cause** | 🎯 | Identified root cause |

### Editing a step
1. Click the step in the sidebar → opens the editor in the main area
2. Edit the title in the top field
3. Change the finding type in the type selector
4. Add content blocks using the buttons below the editor

### Reordering and grouping
- **Groups**: click **＋ Group** to create a thematic group and drag steps into it
- **Step links**: use `@S1`, `@S2`... in text to create cross-references

---

## 8. Content Block Types

Inside each step, you can add different types of blocks:

| Block | Description |
|---|---|
| **Text** | Free-form notes, observations, markdown |
| **SQL Query** | Executed SQL query (code formatting) |
| **SQL Result** | Query result (table or raw text) |
| **Log** | System log excerpt |
| **Image** | Screenshot or image (PNG/JPG, max 2 MB) |
| **Video** | Link to evidence video |
| **Table** | Tabular data |
| **Attachment** | File attached as evidence |

### Step mentions
In text, type `@` followed by the step's shortId (e.g., `@S3`) to create a clickable reference to that step.

---

## 9. AI Assistant — Step Suggestions

Click the **🤖** button in the sidebar steps bar to open the suggestions panel.

### How it works
1. The current case (anonymized) is sent to the server
2. The server queries the RAG knowledge base to find similar cases and relevant guides
3. The AI (Hyperspace) generates 3–5 next step suggestions
4. Each suggestion has: title, finding type, rationale, and execution guidance

### Accepting / rejecting suggestions
- Click **✓ Add** to accept a suggested step
- Click **✕** to reject (rejected steps do not reappear in future suggestions)
- Click **Regenerate** to request new suggestions

### RAG sources displayed
Below the suggestions, the knowledge base sources that influenced the response are shown (with similarity percentage).

---

## 10. Referenced KBAs

In the sidebar, below **Steps to Reproduce**, is the **📎 Referenced KBAs** panel.

### Adding a KBA
1. Type the KBA number in the field (e.g., `3516395`)
2. Press **Enter** or click **＋ Add**
3. The server attempts to fetch the content from `https://me.sap.com/notes/{number}/E`

### Fetch behavior
- **If content is public**: title and text are loaded automatically
- **If authentication is required** (most common): a textarea appears for manual content pasting
  1. Click the link to open the KBA in SAP for Me
  2. Copy the relevant text (symptom, cause, resolution)
  3. Paste it into the textarea that appears

### AI impact
The content of all attached KBAs is included in the context sent to the AI when you click 🤖. The AI reads and considers the KBA content when formulating step suggestions.

### Removing a KBA
Click the **✕** button next to the desired KBA.

---

## 11. Export and Import

### Exporting a case

Click **Export / Generate** → modal with tabs:

| Tab | Content |
|---|---|
| **AI Assist** | Full AI-generated analysis (Research, Cause, Solution) |
| **Internal** | Formatted text for internal use (Pulse/ServiceNow) |
| **External** | Formatted communication for customer delivery |
| **KBA** | AI-filled KBA draft |
| **Message** | Customer-facing message based on the investigation |
| **Incident** | Incident record / handover |
| **Package** | ZIP export with case XML + images |
| **Guide** | Full investigation report in Markdown |

### Exporting as ZIP
In the **Package** tab, click **Export ZIP** to download a file containing:
- `case.xml` — complete case data
- `attachments/` — images and attached files

### Importing
Click **Import** in the top bar:
- Select an exported `.zip` or SAP case `.xml` file
- The case is loaded automatically with all steps and images

---

## 12. AI Assist Tab — Full Analysis

In the **AI Assist** tab of the export modal, click **Generate Analysis** to receive:

- **Internal Research**: Where to search internally (KB, Jira, ServiceNow)
- **External Research**: Relevant KBAs and SAP for Me documentation
- **Cause**: Root cause analysis based on the steps
- **Solution / Workaround**: Resolution steps or workaround

The result can be copied directly to Pulse/ServiceNow.

---

## 13. KBA Tab — KBA Draft

In the **KBA** tab of the export modal:

1. Click **AI Auto-Fill KBA** to have the AI automatically fill in:
   - Symptom
   - Steps to Reproduce
   - Cause
   - Resolution/Solution

2. Review and adjust the generated content
3. Click **Save KBA** to save to the case state

> The KBA draft follows the rules in the `kba_creation_skill.md` guide in the `knowledge/` folder.

---

## 14. Knowledge Base (RAG)

The local knowledge base uses embeddings to find similar cases and guides.

### The `knowledge/` folder
Place any `.md`, `.txt`, `.xml` or `.zip` files you want to index here:

```
knowledge/
├── kba_creation_skill.md         ← KBA creation guide
├── internal_research_skill.md    ← Internal research guide
├── external_research_skill.md    ← External research guide
├── cause_and_solution_skill.md   ← Cause and solution guide
└── (your knowledge files)
```

### Indexing the knowledge base
1. Add files to the `knowledge/` folder
2. In the Export modal → **Package** tab → click **Re-index**
3. Or make a `POST /api/rag-index` call

### Contributing a case
When a case is resolved, click **Contribute to KB** to have the case automatically indexed.

### Checking status
The prompt configuration panel shows which documents are available and which are indexed.

---

## 15. Prompt Configuration

Click **Prompts** in the top bar to customize the prompts sent to the AI.

### Available prompts

| Prompt | Use |
|---|---|
| **AI Assist — Full Analysis** | Export modal → AI Assist tab |
| **AI Assist — Internal Research** | Internal research specific section |
| **AI Assist — External Research** | External research specific section |
| **AI Assist — Cause** | Root cause analysis |
| **AI Assist — Solution** | Resolution formulation |
| **RAG Suggest** | Step suggestions (🤖 button in sidebar) |
| **KBA Fill** | KBA draft auto-fill |

### Context for each prompt
Each prompt has a **⚙ Context & Sources** panel where you configure:
- **Case information included**: metadata, symptom, steps, SQL/logs
- **Knowledge base documents**: which files from the `knowledge/` folder to include as context

### Reset a prompt
Click **↺ Reset** to restore the default text for any prompt.

---

## 16. State Encryption

When local storage is full, the case state is saved to the server **encrypted** with AES-256-GCM.

- The encryption key is defined in `ENCRYPTION_KEY` in the `.env` file
- Without this key, encrypted data cannot be read
- **Important**: configure a strong key and keep it secure

```env
ENCRYPTION_KEY=my-strong-key-here
```

Saved states are stored in `data/case_<id>.enc`.

---

## 17. .env File — Configuration

```env
# Hyperspace local proxy address
AI_HOST=http://localhost:6655

# Hyperspace API key
HAI_KEY=your-key-here

# MY WAY server port
PORT=3000

# Encryption key for server-side saved states
ENCRYPTION_KEY=your-strong-key-here
```

> **Security**: never commit the `.env` file to the repository. It is in `.gitignore`.

---

## 18. Frequently Asked Questions

**AI is not responding / 401 error**
- Check that Hyperspace is running on `localhost:6655`
- Confirm that `HAI_KEY` in `.env` is correct
- Restart the server `node server.js` after changing `.env`

**"No indexed documents"**
- The source list is read directly from the `knowledge/` and `skills/` folders
- To use documents in the AI, click **Re-index** to generate embeddings

**KBA does not load automatically**
- SAP for Me (`me.sap.com`) requires authentication
- Open the KBA in your browser, copy the text, and paste it into the textarea that appears

**The case does not save**
- If a quota error appears, the state will be sent to the server automatically
- Make sure the server is running

**How do I see the full case report?**
- Click **View** in the top bar to open the report visualization
- Or access the **Guide** tab in the export modal

---

*MY WAY — SAP Investigation Tool | Built for internal SAP support use*
