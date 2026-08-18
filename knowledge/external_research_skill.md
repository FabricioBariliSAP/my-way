# Skill: External Research

> Use this skill when internal research is exhausted or when the issue may be documented in public SAP resources.
> Each example shows an investigation context followed by the suggested external research steps.

---

## Purpose

Guide the investigation through publicly available SAP resources — SAP Notes, KBAs on SAP for Me, SAP Help Portal, and product documentation — to find known resolutions or configuration guidance.

---

## Few-Shot Examples

---

### Example 1 — Payroll posting fails with error HRPAY_CALC 012

**Investigation context:**
- Product: SAP Incentive Management
- Symptom: Payroll posting returns error `HRPAY_CALC 012: Object type mismatch during posting`
- Steps so far: Error confirmed in production; no prior occurrence in customer history

**Suggested external research steps:**

```json
[
  {
    "title": "Search SAP for Me for KBAs matching error HRPAY_CALC 012",
    "findingType": "info",
    "rationale": "Error codes are indexed in SAP Notes and KBAs; searching the exact code is the fastest path to a documented resolution.",
    "blocks": [{"type": "text", "content": "Go to https://me.sap.com/notes. Search: 'HRPAY_CALC 012'. Filter by product: SAP Incentive Management. Sort by relevance. Review the top 5 results for resolution steps or workarounds."}]
  },
  {
    "title": "Search SAP Help Portal for payroll posting configuration requirements",
    "findingType": "info",
    "rationale": "The error may be caused by a misconfiguration that the official documentation describes explicitly.",
    "blocks": [{"type": "text", "content": "Navigate to SAP Help Portal > SAP Sales Performance Management > Incentive Management > Payroll Integration. Search for 'posting object type'. Use 'Share > Share a link that always goes to the latest version' (URL must contain version=LATEST)."}]
  },
  {
    "title": "Check SAP for Me for open incidents or advisory notes for this error",
    "findingType": "clue",
    "rationale": "Advisory notes may list prerequisite configurations or patches that prevent this error.",
    "blocks": [{"type": "text", "content": "In SAP for Me, search Notes with type = 'SAP Note' and keyword 'HRPAY_CALC'. Check for correction instructions, legal change notes, or prerequisite notes that apply to the customer's release."}]
  }
]
```

---

### Example 2 — Territory hierarchy import returns validation error on parent node

**Investigation context:**
- Product: SAP Territory and Quota
- Symptom: CSV import of territory hierarchy fails — `Validation Error: Parent node ID not found in current hierarchy`
- Steps so far: File format confirmed correct; error only occurs on the second level of the hierarchy

**Suggested external research steps:**

```json
[
  {
    "title": "Search SAP for Me KBAs for T&Q hierarchy import validation errors",
    "findingType": "info",
    "rationale": "Import validation errors are frequently documented with exact root causes and file format requirements.",
    "blocks": [{"type": "text", "content": "Search https://me.sap.com/notes with keywords: 'Territory Quota hierarchy import validation', 'parent node not found import'. Filter by product: SAP Territory and Quota. Note any required import order (parent rows must precede child rows in the file)."}]
  },
  {
    "title": "Review SAP Help Portal import file specification for territory hierarchy",
    "findingType": "clue",
    "rationale": "The official documentation defines the required column order and row sequencing — a common source of this error.",
    "blocks": [{"type": "text", "content": "SAP Help Portal > SAP Sales Performance Management > Territory and Quota > Data Management > Importing Territory Hierarchies. Verify: (1) column headers match exactly, (2) parent rows appear before child rows, (3) root node has no parent ID value."}]
  },
  {
    "title": "Check for known bugs in the import processor for the customer's release",
    "findingType": "clue",
    "rationale": "Certain releases had a bug where the import processor did not resolve parent references in multi-pass mode.",
    "blocks": [{"type": "text", "content": "Search SAP Notes for 'Territory Quota import bug' filtered to the customer's product version. Look for correction notes with status 'Released' that apply to the relevant release train."}]
  }
]
```

---

### Example 3 — ALM agent onboarding form missing custom fields

**Investigation context:**
- Product: SAP Agent Lifecycle Management
- Symptom: Custom fields added to the onboarding form template are not displayed to the agent during the onboarding process
- Steps so far: Fields are visible in the form template configuration; issue is only in the agent-facing view

**Suggested external research steps:**

```json
[
  {
    "title": "Search SAP for Me KBAs for ALM custom field visibility in onboarding",
    "findingType": "info",
    "rationale": "Custom field display rules are a common support topic; a KBA likely documents the required configuration flags.",
    "blocks": [{"type": "text", "content": "Search https://me.sap.com/notes: 'Agent Lifecycle Management custom fields onboarding', 'ALM form fields not visible agent'. Filter: product = SAP Agent Lifecycle Management. Review How-To category articles first."}]
  },
  {
    "title": "Check SAP Help Portal for onboarding form field visibility requirements",
    "findingType": "clue",
    "rationale": "Field visibility may depend on role assignments, permission sets, or form activation steps described in the official guide.",
    "blocks": [{"type": "text", "content": "SAP Help Portal > SAP Sales Performance Management > Agent Lifecycle Management > Onboarding > Configuring Onboarding Forms. Look for sections on: field permissions, form publishing/activation, and role-based field visibility. Use the version=LATEST URL."}]
  },
  {
    "title": "Search for recent release notes mentioning onboarding form changes",
    "findingType": "clue",
    "rationale": "A recent release may have changed how custom fields are published or rendered in the agent view.",
    "blocks": [{"type": "text", "content": "SAP Help Portal > What's New > SAP Agent Lifecycle Management (current year). Search for 'onboarding form', 'custom field', or 'form template'. Compare against the customer's release date to identify relevant changes."}]
  }
]
```

---

## Quick Reference — External Research Sources

| Source | URL pattern | What to look for |
|---|---|---|
| **SAP Notes / KBAs** | `https://me.sap.com/notes/<number>` | Known errors, How-To guides, workarounds |
| **SAP Help Portal** | Must contain `version=LATEST` in URL | Official configuration and admin documentation |
| **What's New (release notes)** | SAP Help Portal > What's New section | Feature changes, deprecated behavior |
| **SAP for Me (Support Cases)** | `https://me.sap.com` | Similar cases, advisory notes |

---

## Tips

- Always use the exact SAP product name when searching (e.g., `SAP Incentive Management`, not `ICM` or `SPM`).
- Prefer KBAs with status **Released to Customer** — avoid In Process articles as their resolution may be incomplete.
- For SAP Help Portal links, always use the **Share a link that always goes to the latest version** option so the URL stays valid.
- Do **not** cite Google search results, SAP Community Q&A threads, or Wikipedia — these are not authoritative sources for support resolutions.
- Error codes (e.g., `HRPAY_CALC 012`) are the most reliable search terms — always try the exact code first.
