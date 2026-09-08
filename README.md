# CI, CodeQL and OpenSSF badges

[![CI](https://github.com/Drewbiee123/Signallink-AI/actions/workflows/ci-tests.yml/badge.svg)](https://github.com/Drewbiee123/Signallink-AI/actions/workflows/ci-tests.yml)
[![CodeQL](https://github.com/Drewbiee123/Signallink-AI/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/Drewbiee123/Signallink-AI/actions/workflows/codeql-analysis.yml)
[![OpenSSF Scorecard](https://github.com/Drewbiee123/Signallink-AI/actions/workflows/ossf-scorecard.yml/badge.svg)](https://github.com/Drewbiee123/Signallink-AI/actions/workflows/ossf-scorecard.yml)


# SignalLink AI — Genesis Verification Gateway

SignalLink Protocol LLC's verifiable evidence gateway for canonical SHA-256 anchoring, timestamp/signature binding, durable anchor storage, and independent tamper verification.

## Public reproducibility challenge

**Challenge #1 is open:** reproduce a published federal source-state SHA-256 result without trusting SignalLink's server.

- Challenge page: `/challenge`
- Test vector: `/challenges/federal-repro-v1.json`
- Open review thread: https://github.com/Drewbiee123/Signallink-AI/issues/9
- One-command reference verifier: `node scripts/reproduce-federal-challenge.mjs`
- Expected SHA-256: `b325608828a14df655f1b81d3a452cbd490292e6f3b5af6cae87bb4e1f0e8c77`

Independent participants are encouraged to reproduce the result using their own implementation and post PASS/FAIL plus their canonical string and digest in the public issue. A successful reproduct[...]