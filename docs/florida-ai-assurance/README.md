# SignalLink Florida AI Assurance Brief

**Prepared for public-interest review by Florida officials, educators, technical evaluators, and prospective collaborators**  
**Publisher:** SignalLink Protocol LLC, Florida  
**Founder:** Drew D. Phillips Jr.  
**Federal identifiers:** CAGE 16WJ1 | UEI TNKDPWGE7M43  
**Status:** Evaluation material; no government endorsement, contract, certification, or operational deployment is claimed.

## The request

SignalLink asks Florida officials to review a narrow, testable proposition: can cryptographic provenance help schools and public agencies identify the source of AI-assisted material, detect later alteration, and preserve a reviewable evidence trail?

We are not requesting endorsement. We are offering a technical briefing and a small, controlled Florida evaluation whose scope, safeguards, success criteria, and ownership would be set by the responsible agency or school partner.

## Why this matters to Florida

The Safeguard Kids Act would permit existing Student Support and Academic Enrichment grant funds to support AI literacy and specialized counseling programs. Senator Rick Scott's public explanation emphasizes that AI is a tool—not a substitute for human judgment, parents, educators, clinicians, or counselors. Provenance does not decide whether content is true or safe. It can, however, help an authorized reviewer answer four basic questions:

1. What system or process produced this record?
2. When was it produced?
3. Has the recorded payload changed?
4. Can an independent reviewer repeat the verification?

That is useful for classroom AI literacy, administrative audit trails, incident review, and controlled research. It should complement—not replace—privacy review, accessibility, cybersecurity, procurement, and human oversight.

## What can be reviewed now

- [Public synthetic demonstration](https://signallink-i67fy7dnl-signallink-protocol-ai.vercel.app/ebony-demo)
- [Machine-readable synthetic evidence](https://signallink-i67fy7dnl-signallink-protocol-ai.vercel.app/evidence/ebony-signallink-synthetic.json)
- [Implementation review history (Pull Request 18)](https://github.com/Drewbiee123/Signallink-AI/pull/18)
- [Merged implementation commit](https://github.com/Drewbiee123/Signallink-AI/commit/08e25c92ddf141fbded371)
- [Independent Florida entity record](https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResultDetail?aggregateId=flal-l25000401156-69397964-aeb6-4a40-93b5-92b37afb7669&directionType=CurrentList&inquirytype=EntityName&listNameOrder=SIGNALLIGHTINGSYSTEMS+H001700&searchNameOrder=SIGNALLINKPROTOCOL+L250004011560&searchTerm=SIGNAL+OBJECTIVE+LLC)
- [NIST compilation containing SignalLink's public SP 800-230 comment](https://csrc.nist.gov/files/pubs/sp/800/230/ipd/docs/sp800-230_ipd_comments_received.pdf) (see comment 18, page 55 of the compilation)

The demonstration uses synthetic, Project-Ebony-shaped optical and dielectric-permittivity telemetry. It performs SHA-256 hashing, Ed25519 signing and verification, and rejection of a modified payload. It is evidence of a reproducible software behavior—not proof of field performance, satellite integration, school deployment, NIST approval, or fitness for a safety-critical use.

## Proposed Florida evaluation

A responsible partner could supply a small set of non-sensitive, fictional classroom records. SignalLink would create provenance envelopes, intentionally modify copies, and show whether the verifier distinguishes matching from changed records. No student records, health information, biometric information, operational telemetry, or production credentials are required.

Suggested acceptance criteria:

- every original test record produces a deterministic SHA-256 digest;
- every signed record verifies with the corresponding public key;
- every intentionally modified payload is rejected;
- an independent reviewer can reproduce the result from documented steps;
- accessibility review includes keyboard navigation, plain-language instructions, readable contrast, and non-color-only status cues;
- the partner retains authority over policy, curriculum, data, and deployment decisions.

Potential deliverables are a test plan, threat and limitation statement, source code or inspectable build, evidence manifest, verification results, accessibility notes, and an after-action report mapped to selected NIST AI RMF functions.

## Standards alignment, not certification

The evaluation can be organized around the NIST AI RMF functions **GOVERN, MAP, MEASURE, and MANAGE**, with emphasis on documentation, traceability, testing, and human accountability. CISA's Zero Trust Maturity Model may inform identity, device, application, data, and visibility considerations. References to these publications describe design alignment only; NIST and CISA have not certified or endorsed SignalLink.

SignalLink has also submitted an NCCoE Letter of Interest. An LOI submission or acknowledgment is not selection as a collaborator. NCCoE states that submitted LOIs are evaluated for technical fit and that selected collaborators execute a CRADA. SignalLink will describe itself as an NCCoE collaborator only if that process is completed and publicly supportable.

## Corporate and federal traceability

Florida's Division of Corporations lists SignalLink Protocol LLC as an active Florida limited liability company, filed August 29, 2025, document number L25000401156. The federal identifiers above are provided so an authorized official can independently check the entity in SAM.gov and the DLA CAGE search. Registration establishes vendor identity and eligibility prerequisites; it is not an award, clearance, endorsement, or past performance.

## Boundaries

This repository intentionally excludes private correspondence, personal addresses, signatures, credentials, student data, military operational information, partner-confidential material, and claims that cannot be independently reproduced. Private invitations or business communications involving individuals or organizations—including OpenAI Forum, Ryan Brady, Rob Ruiz, reseller channels, or prospective partners—are not presented as endorsements. Documentation may be shown to authorized reviewers when lawful, relevant, and permitted by the sender.

## Requested next step

We respectfully ask an appropriate Florida staff member or technical reviewer to choose one of three paths: (1) decline with no further action; (2) request a 20-minute technical briefing; or (3) identify a proper agency, district, university, laboratory, or procurement channel for a controlled evaluation. SignalLink will follow the receiving organization's rules and will not represent exploratory contact as government sponsorship.

See [EVALUATION_GUIDE.md](EVALUATION_GUIDE.md) for repeatable review steps and [EVIDENCE_REGISTER.md](EVIDENCE_REGISTER.md) for claim status and source links.

