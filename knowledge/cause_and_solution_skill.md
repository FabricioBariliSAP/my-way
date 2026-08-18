# Skill: Cause & Solution

> Use this skill when the investigation has gathered enough evidence to identify the root cause and document the resolution.
> Each example shows an investigation context followed by the suggested cause analysis and solution steps.

---

## Purpose

Guide the final phase of an investigation: confirm the root cause, document it precisely, propose a resolution or workaround, and prepare the content for a KBA or case closure.

---

## Few-Shot Examples

---

### Example 1 — Commission calculation returns $0 after period close

**Investigation context:**
- Product: SAP Incentive Management (Hyperscalers)
- Symptom: Commission calculation returns $0 for all participants after the March period close
- Evidence gathered:
  - Internal Jira ticket IM-48921: confirmed regression in build 2025.03.1 — calculation engine skips rules when `periodLockFlag = SOFT`
  - Customer tenant is on build 2025.03.1
  - Reproduced in sandbox with same build and `periodLockFlag = SOFT`

**Suggested cause and solution steps:**

```json
[
  {
    "title": "Confirm root cause: regression in build 2025.03.1 with SOFT period lock",
    "findingType": "root",
    "rationale": "Evidence from Jira and sandbox reproduction directly links the $0 output to the identified code regression.",
    "blocks": [{"type": "text", "content": "Root Cause: Build 2025.03.1 introduced a regression in the calculation engine where the rule evaluation loop exits early when the period lock flag is set to SOFT. All downstream rule results are zeroed out. Confirmed by reproduction in sandbox (build 2025.03.1, periodLockFlag=SOFT → $0 output; build 2025.02.4, same config → correct output)."}]
  },
  {
    "title": "Apply immediate workaround: change period lock flag to HARD",
    "findingType": "highlight",
    "rationale": "Changing the flag to HARD bypasses the defective code path and allows correct calculation until the patch is deployed.",
    "blocks": [{"type": "text", "content": "Workaround: In the Period Management screen, change the lock type for the affected period from SOFT to HARD, then re-run the calculation job. Validate output against expected commission values for at least one participant before applying to all periods. Note: HARD lock prevents further transaction adjustments — confirm with the customer before applying."}]
  },
  {
    "title": "Open hotfix request with Engineering (Jira IM-48921)",
    "findingType": "info",
    "rationale": "The regression requires a code fix; document the customer impact in the existing Jira ticket to increase priority.",
    "blocks": [{"type": "text", "content": "Add a customer impact comment to Jira IM-48921. Include: tenant ID (anonymized), build version, business impact (commission not paid for N participants), and workaround applied. Request fix in next emergency patch or hotfix release."}]
  },
  {
    "title": "Document resolution for KBA",
    "findingType": "info",
    "rationale": "Other customers on the same build will encounter this issue; a KBA accelerates resolution for future cases.",
    "blocks": [{"type": "text", "content": "Draft internal KBA: Category = Known Error. Title: 'Commission calculation returns $0 after period close on build 2025.03.1'. Cause: regression in rule evaluation loop with SOFT period lock. Resolution: change to HARD lock + recalculate (workaround); permanent fix in upcoming patch. Expires: 2 weeks after patch deploy date."}]
  }
]
```

---

### Example 2 — Territory hierarchy import fails on parent node validation

**Investigation context:**
- Product: SAP Territory and Quota
- Symptom: CSV import fails — `Validation Error: Parent node ID not found`
- Evidence gathered:
  - SAP Help Portal documentation confirms parent rows must appear before child rows in the import file
  - Customer's CSV file has child rows on lines 2–50, parent rows on lines 51–100 (incorrect order)
  - No product bug — pure configuration/file issue

**Suggested cause and solution steps:**

```json
[
  {
    "title": "Confirm root cause: incorrect row ordering in import file",
    "findingType": "root",
    "rationale": "The import processor resolves parent references sequentially; child rows appearing before their parent row cause a lookup failure.",
    "blocks": [{"type": "text", "content": "Root Cause: The territory hierarchy CSV file has child nodes listed before their parent nodes. The import processor performs a single-pass parse and cannot resolve forward references. No product defect — this is a file preparation error. Reference: SAP Help Portal > Territory and Quota > Importing Territory Hierarchies (version=LATEST)."}]
  },
  {
    "title": "Resolution: reorder the CSV file so parent rows precede child rows",
    "findingType": "highlight",
    "rationale": "Correct ordering resolves the validation error without any system change.",
    "blocks": [{"type": "text", "content": "Resolution steps:\n1. Open the import CSV file.\n2. Sort rows so that each parent territory row appears before any of its child rows.\n3. The root node (no parent ID) must be in the first row of data.\n4. For multi-level hierarchies, ensure the order is: Level 1 → Level 2 → Level 3, etc.\n5. Save the file and re-run the import.\n6. Validate that all territories appear in the hierarchy viewer after import."}]
  },
  {
    "title": "Provide customer with import file template",
    "findingType": "info",
    "rationale": "Sharing a correctly ordered sample file prevents recurrence.",
    "blocks": [{"type": "text", "content": "Attach a sample CSV template with correctly ordered rows (root → region → area → territory) and column headers matching the specification in SAP Help Portal. Include a note: rows must be sorted by hierarchy level, deepest nodes last."}]
  }
]
```

---

### Example 3 — ALM onboarding task stuck in Inbox after submission

**Investigation context:**
- Product: SAP Agent Lifecycle Management
- Symptom: Personal Data Collection task remains in Inbox after agent submits it
- Evidence gathered:
  - Issue is specific to agents with `country = BR` (Brazil)
  - Internal KBA (In Process): CPF validation regex fails silently when CPF contains dots and dashes
  - Other agents without Brazilian CPF format complete the task successfully

**Suggested cause and solution steps:**

```json
[
  {
    "title": "Confirm root cause: CPF validation silently blocks task completion for Brazil",
    "findingType": "root",
    "rationale": "The pattern matches the internal KBA finding and the scope (only BR agents affected) is consistent with a locale-specific validation bug.",
    "blocks": [{"type": "text", "content": "Root Cause: The Personal Data Collection task has a server-side validation rule for the CPF field that rejects the formatted input (000.000.000-00) and expects only digits (00000000000). The validation failure is swallowed without surfacing an error message to the agent, causing the task to appear submitted but not progress. Affected: agents with country = BR only."}]
  },
  {
    "title": "Immediate workaround: instruct agent to enter CPF without formatting",
    "findingType": "highlight",
    "rationale": "Entering digits only bypasses the failing validation rule and allows task completion without a system change.",
    "blocks": [{"type": "text", "content": "Workaround: Ask the affected agent to re-open the Personal Data Collection task and re-enter the CPF number using digits only (no dots or dashes). Example: instead of 123.456.789-09, enter 12345678909. After submission with the unformatted value, the task should complete and move out of the Inbox."}]
  },
  {
    "title": "Escalate to Engineering with reference to internal KBA draft",
    "findingType": "info",
    "rationale": "A permanent fix requires the validation rule to accept both formatted and unformatted CPF inputs.",
    "blocks": [{"type": "text", "content": "Reference the internal KBA (In Process) in the Engineering escalation. Request: update the CPF validation regex to strip formatting characters before evaluating, or accept both patterns. Add customer case to the internal KBA for priority tracking. Suggest fix should also cover CNPJ (00.000.000/0000-00) for Brazilian company registrations."}]
  },
  {
    "title": "Document resolution for KBA publication",
    "findingType": "info",
    "rationale": "Other Brazilian tenants will encounter this; a customer-facing KBA avoids repeated escalations.",
    "blocks": [{"type": "text", "content": "Update the internal KBA draft: Category = Known Error. Title: 'Personal Data Collection task remains in Inbox after submission for agents with Brazilian CPF'. Cause: CPF validation rejects formatted input (dots/dashes). Resolution: enter CPF as digits only (workaround); permanent fix pending Engineering. Target: Released Internally until fix is deployed, then Released to Customer."}]
  }
]
```

---

## Root Cause Statement Standards

A well-formed root cause statement must answer three questions:

| Question | Example |
|---|---|
| **What** is broken? | `The rule evaluation loop in the calculation engine` |
| **Why** is it broken? | `exits early when periodLockFlag = SOFT (regression in build 2025.03.1)` |
| **Scope** — who is affected? | `All tenants on build 2025.03.1 with SOFT period lock enabled` |

**Bad:** `"It is a product bug."`  
**Good:** `"Build 2025.03.1 introduced a regression in the rule evaluation loop that exits early when periodLockFlag = SOFT, zeroing all commission results for affected participants."`

---

## Solution Documentation Checklist

Before closing the case or drafting a KBA, verify:

- [ ] Root cause confirmed by reproduction or direct evidence (not just hypothesis)
- [ ] Workaround tested and validated (if applicable)
- [ ] Permanent fix tracked in Jira or Engineering backlog
- [ ] Customer-facing explanation written without internal system details or PII
- [ ] KBA drafted or updated (Known Error / How-To as appropriate)
- [ ] Expiration date set if KBA category is Known Error or Investigation

---

## Tips

- Never leave the Cause field blank for Problem or Known Error KBAs.
- A workaround must be labeled **Workaround** (green text) in the KBA Resolution section so customers recognize it as temporary.
- If the root cause is a misconfiguration (not a bug), use category **How To** instead of **Known Error**.
- When Engineering has a fix in progress, use the Resolution template: `"Product Engineering is investigating a solution. Click on star to bookmark this article to receive updates."`
- Scope the impact precisely: "all tenants" vs. "tenants on build X" vs. "tenants with feature Y enabled" — vague scope increases unnecessary escalations.
