# Independent Evaluation Guide

## Ten-minute public review

1. Open the public synthetic demonstration linked in the README.
2. Confirm the page labels the input as synthetic and does not claim live operational telemetry.
3. Open the machine-readable JSON evidence.
4. Locate the payload, SHA-256 digest, Ed25519 signature or verification fields, and modified-payload result.
5. Review Pull Request 18 and the final merged commit to inspect the implementation history.
6. Compare the company name and founder against Florida's official entity record.
7. Open NIST's official comments compilation and locate SignalLink's submission.
8. Record questions, observed limitations, and any result that cannot be reproduced.

## Controlled pilot concept

**Input:** 25–100 fictional, non-sensitive records supplied or approved by the evaluator.  
**Method:** hash and sign originals; alter a defined subset; verify all records; export an evidence manifest.  
**Primary measures:** signature verification rate on unchanged records, rejection rate on modified records, reproducibility by an independent reviewer, processing time measured in the evaluator's environment, and accessibility defects.  
**Exclusions:** real student data, clinical use, autonomous decisions, disciplinary decisions, biometric surveillance, production credentials, and claims of legal compliance without counsel or agency review.

Latency must be measured end to end in the actual target environment. A synthetic processing-time result does not establish satellite latency savings or mission suitability. For time-sensitive systems, provenance overhead should be reported separately from network, application, queuing, and device latency.

## Decision record

At completion, the evaluator should document: scope, environment, software version or commit, test dataset description, expected and observed results, failures, accessibility findings, privacy/security findings, and the decision to stop, revise, or proceed.

