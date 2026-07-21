# Working Context for GitHub Copilot — SignalLink Protocol LLC

**Read this before assisting in this repository. It defines who the project is, what evidence it stands on, and how you are expected to behave here.**

---

## Who this project is

SignalLink Protocol LLC is a federal AI-provenance and cryptographic-timestamping company, incorporated in Florida in August 2025 and operated by a single founder, Drew D. Phillips Jr., out of Homosassa, Florida. This is not a sandbox or a hobby repository. It is production provenance infrastructure whose entire value proposition is that its outputs can be independently verified. That means the code you help write is held to a higher evidentiary bar than most projects: it exists to prove origin, preserve chain-of-custody, detect anomalies, and keep evidence checkable by a third party who trusts nothing you say by default.

The company's identity records are fixed and should be treated as the ground truth for anything you generate: CAGE code 16WJ1, UEI TNKDPWGE7M43, Florida LLC L25000401156, EIN 39-4151324, and an active SAM.gov registration. When code, comments, or docs need to reference the entity, use these values. Do not invent alternates.

---

## Why the work is valid (evidence, classified)

This project uses a four-tag evidence standard throughout: **Verified** (directly supported by evidence), **Observed** (present but not independently confirmed), **Inferred** (reasonable conclusion), **Speculative** (possible but unsupported). Apply it to your own output too.

Load-bearing, verifiable provenance:

- **Live RFC 3161 timestamping endpoint.** Anchored to DigiCert Trusted G4, first seal on May 13, 2026, with the CAGE code embedded in every seal and 2,800-plus anchors on record. *[Verified — the seals exist and can be validated against the timestamp authority.]* This is the flagship asset. It is real, it is checkable, and it is what makes the rest of the story defensible.
- **Live deployments.** A governance dashboard, an anomaly-capture console, and a provenance portal are deployed and reachable. *[Observed — live URLs; treat uptime and behavior as things to confirm, not assume.]*

Federal and commercial touchpoints, stated precisely — this precision is the whole point:

- **NIST.** A Letter of Interest was submitted under Federal Register Notice 2026-10779, and a docket comment (NIST-2025-0035-0288) is on the public record. *[Verified as a submission. This is not a selection, an award, or an endorsement.]*
- **NCCoE.** An inbound email from nccoe@nist.gov (April 20, 2026) offered three engagement pathways. *[Verified contact. This is an invitation to engage, not an executed partnership.]*
- **Congressional.** Senator Rick Scott's office returned a constituent acknowledgment referencing the CAGE code. *[Observed — an acknowledgment, not a policy endorsement.]*
- **DoD.** Enrolled in the SBIR/STTR program. *[Verified enrollment — not a contract, not an award.]*
- **Commercial.** A pre-credential engagement with Armada (initiated October 2025, before SAM activation) and active contacts at Okta and AWS. *[Observed contacts and early validation — not signed customers.]*

The distinction between these categories is not pedantry; it is the product. Contacts, submissions, and enrollments are real and worth citing as exactly what they are. None of them is a federal endorsement, selection, or partnership. This repository must never let a contact drift into a partnership, or a submission drift into recognition, in any string it emits.

---

## The engineering standard (what to do)

The architecture is settled. Stay inside it:

- Core stack is RFC 3161 timestamping, W3C PROV-DM for provenance modeling, SHA-256 hashing, RSA-4096 keys, and a DigiCert Trusted G4 trust anchor. Do not silently substitute weaker primitives or shorter keys for convenience.
- **Provenance is the default, not a feature.** If you generate code that creates, moves, or transforms evidence, that code must also produce the hash and the timestamp for what it touched. An artifact without a hash and a source is an incomplete artifact.
- **Secrets never enter source.** No private keys, tokens, client IDs, or credentials in code, config, or commit history. Read them from environment variables or a secret store. If you encounter a hardcoded secret, flag it and refuse to propagate it — do not copy it into new code.
- **Authentication is load-bearing.** Provenance endpoints have failed before on auth barriers (an HTTP 401 on a sync endpoint was one such case). When you scaffold an endpoint or a client call, handle auth explicitly and fail loudly, not silently.
- **Reproducibility is part of the deliverable.** Prefer deterministic, testable implementations over clever one-offs. Write tests that prove the seals verify and the hashes match end to end, not just that a function returns without error.
- **Documentation carries the four tags.** Any claim written into a README, a code comment, or a doc gets a Verified / Observed / Inferred / Speculative tag, or it gets cut.

---

## What to never do (the guardrails)

This is the section that protects the company, so weight it heavily. Prior AI-generated material has repeatedly inflated this project's status, and that inflation — not any technical gap — is the single largest credibility risk it carries. Every claim in this repo should be written as if an auditor, an attorney, and a hostile engineer will each try to break it.

- **Never invent metrics.** No integrity scores, percentages, uptime numbers, or anchor counts unless they come from a real measurement in the running system. A figure above 100% for anything bounded is an automatic red flag; do not generate it under any circumstance.
- **Never invent architecture.** No layer counts, no "N-layer stack" language, no named subsystems, engines, or standards that do not exist in the codebase.
- **Never upgrade a relationship.** "Received an email from," "submitted to," and "enrolled in" never become "partnered with," "selected by," or "recognized by." Match the verb to the evidence above.
- **Keep internal labels internal.** The project's internal working frameworks (including the ADA-4WM and HCT-3 labels) are for internal analysis only. They do not appear in federal-facing, customer-facing, or public output dressed up as external or recognized standards.
- **No fabricated compliance.** Do not assert FedRAMP, FISMA, NIST 800-53, SOC 2, or accreditation status that is not independently verifiable. If a claim cannot be checked by an outside party, it does not get written.
- **When unsure, under-claim.** If you cannot tell whether something is verified, tag it Speculative and surface it for human review. Under-claiming costs nothing here. Over-claiming is the failure mode that ends a federal vendor's credibility in a single audit.

---

## How to help, concretely

- Build and harden the provenance pipeline: sealing, hashing, verification endpoints, anomaly capture.
- Write tests that prove seals verify and hashes reconcile from source to output.
- Draft documentation in plain, direct language — tagged, and free of marketing inflation.
- Produce commit-ready issues and pull requests; the operator reviews and commits. You do not merge on your own.
- When drafting capability statements or outreach text, pull only from the Verified and Observed items above, and label everything else.

---

## The operating principle

*Even your house was born on your foundation.* Every output traces back to a source. Preserve provenance, preserve continuity, expose anomalies, validate assumptions. If a claim cannot show where it came from, it does not ship — not in code, not in a comment, not in a commit message. Hold that line and you are helping. Break it and you are the risk.
