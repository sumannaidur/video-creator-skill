# V3 development roadmap

Status: approved scope, execution pending except documentation. P030–P041 are V3 phase identifiers; the earlier [historical backlog](../history/problem-decomposition.md) is retained. P028.1 and P028.2 are prior cinematic experiments, E43.1 is historical feasibility only. No further OpenVINO development in V3.

| Phase | Objective | Exit evidence |
| --- | --- | --- |
| P030 | Specification and baseline | Approved requirements, baseline inventory and repository consistency check |
| P031 | Creative intelligence | Unseen-topic artwork benchmark using unchanged engines; review actual output |
| P032 | Reusable source assets | Reviewed asset customized in distinct second production, old version intact |
| P033 | World and cinematic construction | Coherent multi-shot world, alternate views, light and continuity |
| P034 | Character/action intelligence | Reviewed contact, gestures and meaningful movement |
| P035 | Dialogue, narration, sound | Supported multiple voices and synchronized performance, native review |
| P036 | Continuous learning | Later production demonstrably uses contextual correction or reviewed source |
| P037 | Resource-aware execution | Bounded low-resource production and measured usage |
| P038 | Source preservation, cleanup, recovery | Verified recovery and final-only generated media by default |
| P039 | Editing and platform adaptation | Dependency-aware localized edit and portrait/landscape recomposition |
| P040 | Full validation | Unseen topics, long form, mixed styles, cross-host, actual 8 GB and review evidence |
| P041 | Release | Owner-approved documentation, migration, security, reproducibility and packaging |

Phases are not releases; decompose into atomic objectives with one bounded validation cycle. Follow AGENTS.md. Start P031 only after P030 baseline validation. Prioritize actual visual improvements before adding infrastructure; extend existing tools only for demonstrated needs. Keep main and stable package untouched until owner-approved release.

## P030 baseline inventory

Remote dev baseline b8a618ec952699d3eec08a4f22424270966d5b66; main b2eb0e358cd1a9bdad9b0e317ce12369c003ed9c. Existing architecture and README document nine styles, seven-stage ledger, native narration routes, checks and unresolved artistic/native/rights gates. P028.1 adds cinematic metadata; P028.2 is a synthetic visual benchmark, not accepted artwork. E43.1 owner-reported local GPU feasibility does not justify a production dependency. No fresh local runtime, visual or hardware validation in P030. CI is configured for main push, PR and manual dispatch, not dev push. Run `python tools/check_repository.py` locally after syncing to validate docs; record actual result before proceeding. No production code changes in P030.
