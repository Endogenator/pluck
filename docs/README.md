# Pluck: Development Documentation

Pluck is a spatial platform that makes entrepreneurial opportunity visible to people who have not yet thought of themselves as entrepreneurs. It is the first build under Endogenation, Inc.

`pluck.endogenation.com`

---

## Read in this order

| Document | Purpose |
|---|---|
| [`data-sources.md`](./data-sources.md) | Every data source, access status, and known constraint |
| [`domain-model.md`](./domain-model.md) | Entities, schema, ERD, and the reasoning behind the structure |
| [`architecture.md`](./architecture.md) | Stack, data flow, ingestion notes, client structure |
| [`interaction-spec.md`](./interaction-spec.md) | Question flow, map, candidate detail, lead capture |
| [`findings-log.md`](./findings-log.md) | Open hypotheses. **Nothing here is specified behavior** |
| [`decision-log.md`](./decision-log.md) | Decisions taken, alternatives rejected, and why |

Concept and Scope, and the Roadmap, live in the shared Drive folder rather than here. They are partner facing.

---

## Three things to understand before contributing

**1. Analytical methodology is deliberately unspecified.**

The framework and data infrastructure are built first. How opportunity gets computed is determined after observing the corridors, not decided in advance. Ideas generated during design live in `findings-log.md` as open questions. Do not promote them to specifications without evidence.

**2. Falsification is not optional and does not wait.**

If Pluck surfaces an opportunity and someone commits their savings to it, that person carries the risk of whatever the model got wrong. Every candidate carries its uncertainties. `unknown` is a first class result, not a null. This follows from Endogenation's third law and precedes any finding.

**3. Pluck reports, it does not recommend.**

No viability score. No ranking. Two people looking at the same corner should be able to see different possibilities. The platform's job is to show the corner clearly.

---

## Current scope

- **Jurisdiction:** City of Redlands, Title 18. Not the county code.
- **Ingestion:** citywide
- **Analysis and ground truthing:** State Street and West Colton Avenue
- **Phase:** 0, framework and infrastructure

---

## Stack

Next.js + Tailwind · Leaflet · FastAPI · PostgreSQL + PostGIS · Vercel
