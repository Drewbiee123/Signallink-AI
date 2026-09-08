# Add OpenSSF and GitHub security evaluation gates

## Purpose

Connect SignalLink AI to recognized, independently operated repository-evaluation systems.

## Added

- OpenSSF Scorecard with public result publication
- GitHub CodeQL security and quality analysis
- Dependency Review for pull requests
- Dependabot for npm and GitHub Actions
- Immutable commit pinning for third-party GitHub Actions
- Public CI, CodeQL, and OpenSSF status badges

## Verification

- 12/12 deterministic protocol tests passed
- Next.js production build passed
- 19 static pages generated
- npm production audit reported zero known vulnerabilities
- All nine GitHub YAML workflow/configuration files parsed successfully
- Every GitHub Action reference is pinned to a full commit SHA

## Evidence boundary

These automated evaluations provide reproducible software-security and code-quality evidence. They do not constitute government certification, regulatory approval, or endorsement.
