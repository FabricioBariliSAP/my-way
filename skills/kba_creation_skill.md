# KBA Creation Skill — SAP SuccessFactors / SPM

> Rules extracted from: KCS Content Standards (SF HCM), QRG Knowledge Centered Services, SPM KBA Best Practices.
> Apply all sections below when drafting or reviewing a KBA.

---

## 1. Before You Start

- Search SAP Knowledge Base **before creating** to avoid duplicates.
- One issue per KBA (same as a support case). Multiple symptoms for the same issue are allowed.
- Use formal, professional English throughout.

---

## 2. Header Fields

| Field | Rule |
|---|---|
| **Product** | Mandatory. Select all applicable products. Use official names — no abbreviations. |
| **Product Version** | Specific release (e.g., `SAP SuccessFactors Employee Central b2505`) or leave empty for "all versions". |
| **Category** | `How To` / `Problem` / `Investigation` / `Known Error` / `Product Enhancement` |
| **Component** | Primary component required. Additional in "Other Components". |
| **Expires on** | Investigation: next release date (31-May-YY or 30-Nov-YY). Known Error: two weeks after fix deploy date. |
| **Target** | `Released Internally` or `Released to Customer`. |
| **Requires Action** | `Yes` if manual steps are required; `No` otherwise. |

### SPM Product Names (use exactly)
- `SAP Incentive Management`
- `SAP Territory and Quota`
- `SAP Agent Lifecycle Management`
- `SAP Agent Performance Management`

### SPM Product Versions (2026)
- `SAP Incentive Management 2026`
- `SAP Territory and Quota 2026`
- `SAP Agent Lifecycle Management 2026`
- `SAP Agent Performance Management 2026`

---

## 3. Title

- Write from the **reader's point of view** — mirror customer search language.
- **Sentence case only**: capitalize first word + proper nouns. Example: `Unable to save changes in Manage Permission Roles`.
- Under **60 characters** for external search engines (KBA number + dash count toward this limit).
- Maximum 200 characters overall.
- No descriptive prefixes like `[INTERNAL:]`, `[KBA]`, `[INVOICE:]`.
- No acronyms at the start (wastes the 60-char limit).
- Error/warning format: `Error: "<exact message as shown in UI>"`.
- Append media keywords at the end: `(WEBINAR)`, `(VIDEO)`.
- Include product/version in the title when disambiguation is needed.
- Example good title: `Unable to save changes in Manage Permission Roles`
- Example bad title: `Permission Role Save Issue`

---

## 4. Keywords

- One line, comma- or semicolon-separated.
- Include: feature names, error codes, report names, version numbers, synonyms, Jira/Incident numbers.
- Versions not listed in the body can be added here (e.g., `version 2311, version 2405`).
- Synonyms example: `objective plan, goal plan, manager, leader, employee, collaborator`.
- Do **not** repeat full section text.

---

## 5. Symptom

- Most critical symptom **first**. First 268 characters must be unique per KBA.
- Do **not** duplicate the title — expand or add detail.
- Use **bullet points**, not paragraphs.
- Include phrases and terms customers might use.
- Do **not** include Cause, Steps to Reproduce, or Resolution here.
- Use actual error messages or log entries (no PII).
- For internal KBAs: add `***INTERNAL USE ONLY***` in bold red at the top.
- If awaiting validation: add `WAITING FOR VALIDATION` in bold green at the top.
- `"You"` is acceptable to build a personal connection with the customer.
- GDPR disclaimer (place at the bottom of Symptom if mock data is used):
  > *"Image/data in this KBA is from SAP internal systems, sample data, or demo systems. Any resemblance to real data is purely coincidental."*

---

## 6. Environment

- Use bullet points for multiple environments.
- Write **complete, official SAP product names** — no abbreviations.
- Add details: module, service pack, fix pack, OS, browser, third-party system when relevant.

### SPM Environment Templates

**Incentive Management:**
```
SAP Sales Performance Management
Incentive Management
Incentive Management on Hyperscalers        ← add if applicable
Incentive Management on Legacy Oracle       ← add if applicable
Incentive Management on Legacy HANA         ← add if applicable
```

**Territory & Quota:**
```
SAP Sales Performance Management
Territory & Quota
```
> Note: T&Q does not distinguish between Legacy and Hyperscalers — do not differentiate.

**Agent Lifecycle Management:**
```
SAP Sales Performance Management
Agent Lifecycle Management
```

**Agent Performance Management:**
```
SAP Sales Performance Management
Agent Performance Management
```

**Advanced Workflow (IM-related):**
```
SAP Sales Performance Management
Advanced Workflow
```

**Onboarding (ALM/APM-related):**
```
SAP Sales Performance Management
Onboarding
```

> When creating a KBA from a case summary, **remove** auto-populated environment fields — they may contain customer information.

---

## 7. Steps to Reproduce

- Numbered list. Exact sequence only.
- Active first-person voice (customer context). "You"/"customer" is acceptable here.
- Only when the reproduction path is known.

**Example:**
```
1. Log in to SAP SuccessFactors and navigate to Onboarding.
2. Open the Inbox and select the Personal Data Collection task for a new hire.
3. Enter the required information and click Submit.
4. Notice that the task does not complete and remains in the Inbox.
```

---

## 8. Cause

- State the root cause clearly and concisely.
- Leave blank only for How-To KBAs. For Problem KBAs, never leave blank.
- Use bullet points for multiple causes.
- Do **not** write "It's a problem" — be specific, e.g.: `"This is a regression introduced in release 2411"`.

---

## 9. Resolution

- **Never leave empty.**
- Must directly address the symptom.
- Formal, imperative, or passive language. **Avoid pronouns** (no "I", "you", "they" here).
- Specify required permissions or roles at the beginning of instructions.
- Use numbered list for sequential steps.

### Special Scenarios
| Scenario | What to write |
|---|---|
| Fix in upcoming release | `"The fix for this issue is planned to be deployed on 2H2027 release."` |
| Workaround available | Add in **green** text, label it `Workaround`. |
| Under investigation | `"Product Engineering is investigating a solution. Click on star to bookmark this article to receive updates about this issue."` |
| Support needed | `"If the issue persists, create a support case in SAP For Me as per KBA 1296527 - How to create a support case for SAP Support - SAP for Me and select the component <LOD-XX-YYY>."` |

---

## 10. See Also

- Bullet points for multiple links.
- KBA/SAP Note format: `KBA 1234567 - Title of the article` (hyperlink only the number).
  URL: `https://me.sap.com/notes/<number>`
- SAP Help Portal format: `SAP Help Portal - Title of the document` (hyperlink the title).
  Always use "Share > Share a link that always goes to the latest version" — URL must contain `version=LATEST`.
- No links from public search engines (Google top hits are often outdated).
- No SAP Standard Notes, SAP Security Notes, SAP Community Q&A, or Wikipedia.
- External third-party links allowed only from verified sources (e.g., Microsoft, Apple).

---

## 11. Data Protection & Privacy (GDPR)

- **No screenshots from customer systems** — use SAP Test Systems only.
- No PII anywhere in the KBA: names, phone numbers, emails, order data, invoice data, IP addresses, system IDs, credentials.
- No company-specific information (company name, customer system ID, intellectual property).
- Blur or blackout any SAP system information in screenshots.
- These rules apply regardless of KBA status (In Process, Released, etc.).

**PII includes:** name, phone, email, mobile device IDs, IP address, ethnic origin, biometric/genetic data, health data, anonymized/pseudonymized data.

**Other confidential data includes:** customer intellectual property, server data, credentials, System IDs.

---

## 12. Document Refers To / Attachments / Internal Memo

| Section | Rule |
|---|---|
| **Document refers to** | Add all KBAs, SAP Notes, and documents referenced. Only available after KBA is saved. |
| **Attachments** | Use for supporting details. Only available after save. No customer data or SAP server info. Max 2 MB per image, 700px, PNG format. |
| **Internal Memo** | Internal notes only, not visible in SAP For Me. Resets on each KBA update. |

---

## 13. KBA Lifecycle Statuses

| Status | Meaning |
|---|---|
| In Process | Work in progress or sent back for revision. Never leave Processor field blank. |
| Technical Review | Author considers it complete; submitting to KM Coach for review. |
| Released Internally | Approved for internal use only. |
| Released to Customer | Approved for customer access. |
| To Be Archived | No longer relevant; previously published. |

> For external search engines: **Target Status and Release Status must both be set to "Released to Customer".**

---

## 14. Formatting & Writing Standards

- `Courier New` (default size) for: code, parameters, IDs, error messages, permissions, queries, commands.
- **Bold** for UI elements.
- *Italics* sparingly, never entire sentences.
- No dates in KBA body (makes content appear outdated).
- No placeholder `XXX` — use descriptive names (`#FieldID`, `TransactionCode`) or fake values (`"1234"`).
- One space after a period.
- Use `"KBA"` or `"SAP Knowledge Base Article"` — never `SAP KBA`, `SAP KBAs`, or `SKBA`.
- Avoid `"master/slave"` and `"whitelist/blacklist"` — follow SAP Inclusive Language Guidelines.
- Run Acrolinx or AI spellcheck before publishing.

---

## 15. Quick Checklist Before Publishing

- [ ] Title under 60 characters, sentence case, no prefix tags
- [ ] Symptom unique in first 268 characters; no title duplication
- [ ] No PII or customer-specific data anywhere
- [ ] Environment uses official product names; auto-populated fields removed if from case
- [ ] Cause present for Problem KBAs
- [ ] Resolution is not empty; addresses the symptom
- [ ] See Also links work and target the correct audience
- [ ] Target Status and Release Status aligned
- [ ] Expiration date set (Investigation → next release; Known Error → fix date + 2 weeks)
- [ ] Acrolinx / spellcheck run
