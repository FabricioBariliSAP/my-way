# Skill: Internal Research

> Use this skill when you need to research a case using SAP-internal resources before going external.
> Each example shows an investigation context followed by the suggested internal research steps.

---

## Purpose

Guide the investigation through internal SAP systems — case history, internal KBAs, incident tickets, Jira issues, and internal wikis — before escalating or searching public resources.

---

## Few-Shot Examples

---

### Example 1 — Calculation engine producing wrong results

**Investigation context:**
- Product: SAP Incentive Management (Hyperscalers)
- Symptom: Commission calculation returns $0 for all participants after the March period close
- Steps so far: Period close confirmed, no errors in UI

**Suggested internal research steps:**

```json
[
  {
    "title": "Search internal KBAs for calculation engine $0 output",
    "findingType": "info",
    "rationale": "A known bug or regression may already be documented internally before being released to customers.",
    "blocks": [{"type": "text", "content": "Search SAP internal knowledge base using keywords: 'calculation $0', 'zero commission', 'period close blank results', 'Incentive Management Hyperscalers'. Filter by product version and release date."}]
  },
  {
    "title": "Check Jira for open or recently closed defects",
    "findingType": "clue",
    "rationale": "Engineering may have an open ticket for this symptom that has not yet been linked to a KBA.",
    "blocks": [{"type": "text", "content": "Search Jira project IM-CORE with JQL: project = 'IM' AND summary ~ 'calculation zero' AND (status = 'Open' OR status changed to 'Resolved' after -90d). Also check fix versions near the current tenant release."}]
  },
  {
    "title": "Review recent case history for same customer",
    "findingType": "info",
    "rationale": "The customer may have reported a similar issue before; prior resolution steps can save time.",
    "blocks": [{"type": "text", "content": "In ServiceNow, search for cases linked to this tenant with component LOD-SF-SIM. Filter last 12 months. Look for any case mentioning 'calculation', 'period close', or 'commission'."}]
  },
  {
    "title": "Check internal release notes for the tenant's current build",
    "findingType": "clue",
    "rationale": "A recent hotfix or configuration change in that build may have introduced a regression.",
    "blocks": [{"type": "text", "content": "Locate the release notes for the tenant's exact build version on the internal wiki (spaces: IM Release Notes). Search for changes to the calculation engine, period close logic, or rule evaluation."}]
  }
]
```

---

### Example 2 — UI freezes on Territory & Quota assignment screen

**Investigation context:**
- Product: SAP Territory and Quota
- Symptom: Browser tab becomes unresponsive when opening the Territory Assignment screen with more than 500 territories
- Steps so far: Reproduced in customer tenant, not reproduced in demo tenant

**Suggested internal research steps:**

```json
[
  {
    "title": "Search internal KBAs for T&Q UI performance with large territory sets",
    "findingType": "info",
    "rationale": "Performance regressions with large data sets are a recurring theme and may have prior internal documentation.",
    "blocks": [{"type": "text", "content": "Search internal KB with keywords: 'territory assignment freeze', 'T&Q slow', 'browser unresponsive large territory', 'TQ UI performance'. Limit to SAP Territory and Quota product family."}]
  },
  {
    "title": "Check Jira for UI freeze or timeout bugs in Territory Assignment",
    "findingType": "clue",
    "rationale": "A front-end pagination or data-loading defect may already be tracked in engineering.",
    "blocks": [{"type": "text", "content": "Search Jira: project = 'TQ' AND component = 'UI' AND summary ~ 'territory assignment' AND (type = Bug OR type = 'Known Error'). Sort by updated date descending."}]
  },
  {
    "title": "Compare customer tenant configuration with demo tenant",
    "findingType": "clue",
    "rationale": "Since it does not reproduce in demo, the difference likely lies in data volume, config flags, or a tenant-level feature toggle.",
    "blocks": [{"type": "text", "content": "Document the number of territories, hierarchy depth, and active user count in both tenants. Check if any feature flags differ between the two environments (consult internal feature flag registry)."}]
  }
]
```

---

### Example 3 — Agent Lifecycle Management onboarding task not completing

**Investigation context:**
- Product: SAP Agent Lifecycle Management
- Symptom: Personal Data Collection task remains in Inbox after submission; no error shown
- Steps so far: Issue confirmed for one specific new hire; other new hires complete successfully

**Suggested internal research steps:**

```json
[
  {
    "title": "Search internal KBAs for stuck onboarding tasks in ALM",
    "findingType": "info",
    "rationale": "Isolated task failures are often tied to data validation rules or workflow state machine bugs documented internally.",
    "blocks": [{"type": "text", "content": "Internal KB search: 'ALM onboarding stuck', 'Personal Data Collection not completing', 'agent lifecycle task remains inbox'. Filter by product: SAP Agent Lifecycle Management."}]
  },
  {
    "title": "Check for Jira defects related to workflow state transitions in ALM",
    "findingType": "clue",
    "rationale": "A state transition defect (task never moves from 'Submitted' to 'Complete') may be a known bug.",
    "blocks": [{"type": "text", "content": "Jira search: project = 'ALM' AND component = 'Onboarding' AND summary ~ 'task' AND (status = Open OR status = 'In Progress'). Also search closed issues resolved in the last 2 releases."}]
  },
  {
    "title": "Review internal escalation notes for this customer",
    "findingType": "info",
    "rationale": "If the customer has an open escalation or account flag, prior communication may reveal context not visible in the case.",
    "blocks": [{"type": "text", "content": "Check ServiceNow account record and escalation notes for this customer. Look for open P1/P2 incidents, known tenant restrictions, or previous workarounds applied by field support."}]
  }
]
```

---

## Quick Reference — Internal Research Sources

| Source | What to look for |
|---|---|
| **Internal KB** | Known errors, investigations, internal How-To articles |
| **Jira** | Open/closed bugs, fix versions, linked PRs |
| **ServiceNow** | Case history, escalations, account notes |
| **Internal Wiki** | Release notes, feature flags, architecture docs |
| **Slack (internal channels)** | Recent engineering discussions, hotfix announcements |
| **Internal Confluence** | Design docs, runbooks, component ownership |

---

## Tips

- Always search by exact product name and version to avoid false positives.
- If Jira returns nothing, try broader component searches or check the parent epic.
- Cross-reference the fix version in Jira with the tenant's current build before concluding it is unrelated.
- Internal KBAs with status "In Process" or "Technical Review" may already describe the issue without a public resolution yet.
