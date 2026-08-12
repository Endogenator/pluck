# Findings Log

Open questions and untested hypotheses. **Nothing here is a specification.**

This document exists because analysis is deliberately unspecified until the corridors have been observed. Ideas generated during design are recorded so they can be tested rather than lost, and so they are not mistaken for decisions.

Each entry: what was proposed, why it might be wrong, and what would settle it.

Last updated: 2026-08-12

---

## H1. Proximity may indicate agglomeration rather than competition

**Proposed:** distance to the nearest similar business indicates opportunity. Farther equals more opportunity.

**Why this may be wrong:** the relationship appears to invert by business type. Gas stations facing each other across a divided road are capturing different directional flows, not competing. Restaurant districts, shopping malls, and antique rows exist because clustering raises total demand for everyone in the cluster. For those categories an isolated business is the warning sign, not the opportunity.

A single global distance rule would be most wrong on precisely the categories where someone is most likely to lose money.

**Candidate framing (untested):** four spatial behaviors rather than one. `convenience` (distance minimizing, absence suggests opportunity), `comparison` (agglomerating), `destination` (agglomerating, trip is the point), `interception` (flow capture, proximity irrelevant).

**What would settle it:** observed business spacing on State Street, where the corridor functions. If comparison goods cluster and convenience goods disperse in the actual data, the framing holds locally.

**Status:** `use_category.spatial_behavior` exists in the schema and is deliberately unpopulated.

---

## H2. The code may already encode the distinction

**Proposed:** C-2 splits its permitted uses into named groups including *convenience goods* and *shopper's goods*. That is retail geography vocabulary sitting inside a 2015 zoning ordinance. If the distinction is usable, spatial behavior could inherit from the taxonomy already built rather than needing a separate classification pass.

**Why this may be wrong:** the drafters' purpose was regulatory, not analytical. The grouping may reflect parking requirements, traffic generation, or nuisance considerations rather than consumer trip behavior. Convenient coincidence is not evidence.

**What would settle it:** check whether businesses the code groups as convenience goods actually disperse, and shopper's goods actually cluster, in observed corridor data.

---

## H3. Current supply versus current population is stale by construction

**Proposed:** gap analysis compares what exists against what the population supports.

**Why this may be wrong:** Redlands is growing. ACS five year estimates are averaged across a rolling window and systematically understate present population where growth is occurring. The calculation would therefore be least reliable in exactly the places most worth examining. A corridor correctly empty at one population level may be underserved at another, and "no demand" and "demand has not arrived yet" are indistinguishable in current state data.

**Candidate approach (untested):** cross reference approved and in progress residential units against current business supply for a forward looking gap. The city's Development Projects app carries housing element layers; building permits are public.

**Why this may also be wrong:** "Redlands is growing" is not actionable until it is spatially located. New rooftops on the east side do not help West Colton if retail gravity pulls the other direction. Pipeline housing must be joined to catchment geometry, not applied as a citywide multiplier.

**What would settle it:** whether pipeline units within a plausible catchment of each corridor are material relative to existing population.

**Status:** `housing_pipeline` exists in the schema. Captured now because it cannot be reconstructed later. Not used in any calculation.

---

## H4. The two corridors are not comparable

**Original framing:** State Street as control (functioning), West Colton as treatment (vacant). Same conditions, different occupancy.

**Why this was wrong:** they are different corridor types. State Street is a destination corridor where the trip itself is the point. West Colton is transactional and auto oriented: smaller private destination businesses plus larger frontage dependent tenants (used car dealership, rental agency, hotel). Those tenants need visibility and parking and do not benefit from neighbors.

They do not share a demand model. State Street's business mix cannot serve as the empirical comparable for what West Colton should support.

**Revised position:** two pilots exercising different parts of the model rather than a matched pair. Each corridor needs its own reference class. This is arguably more useful for demonstrating the tool generalizes.

**Open:** what the correct reference class is for each. Unresolved.

---

## H5. West Colton's vacancy may not represent unmet demand

**Hypothesis:** on a transactional corridor with low agglomeration effects, the binding constraints are likely visibility, access, and rent, not the absence of a competitor. If so, standard nearest competitor logic mostly does not apply there, and empty space may be correctly empty.

**Counter consideration:** Redlands is growing, and West Colton may have genuine latent potential. A static snapshot cannot distinguish between space that is empty because demand is absent and space that is empty because demand has not arrived.

**Why this matters beyond the corridor:** if the tool only ever says yes, it is not information. A corridor where the honest answer may be "the gap is real and you still should not" is a better test of whether the falsification layer does real work than a corridor where everything checks out.

**What would settle it:** ground truthing, plus whatever the pipeline data shows about catchment.

---

## H6. The city's vacant parcels layer may not mean storefront vacancy

**Concern:** municipal vacancy layers are typically built for planning purposes and commonly denote undeveloped land rather than an empty storefront with a sign in the window. These are very different things for Pluck's purposes.

**Consequence if true:** the storefront vacancy problem remains unsolved and multi source inference (commercial zoning + no active business license + permit inactivity + field observation) still applies.

**What would settle it:** read the layer's metadata and spot check against known parcels.

**Status:** flagged as a Phase 1 verification task. `parcel.city_vacant_flag` is stored as published, without interpretation.

---

## H7. Unlisted inventory may be the more relevant inventory

**Observation:** spaces that reach CoStar or LoopNet have a broker and a marketing budget, and a rent that must cover both. Spaces with a handwritten sign in the window are owner managed, often longer held, frequently cheaper, and more negotiable.

**Implication if true:** formal listing databases are systematically biased toward the space least accessible to a first time micro entrepreneur. The gap in the data is not incidental to Pluck's mission, it is aligned with it. The spaces nobody has catalogued are the ones the intended user could actually get.

**Approach:** commercially zoned parcel plus no active business license equals candidate unlisted vacancy. Inference from data already accessible, then ground truthed on foot.

**What would settle it:** walk the corridors and compare observed available space against what any listing service shows.

---

## H8. Human judgment as falsification

**Position:** domain experience catches things the model misses, and the mentor layer is part of the product rather than an afterthought.

**Counter consideration:** expertise is also a source of error. Someone who watched three coffee shops fail on a block may discount the fourth that would have worked. If the relationship runs one direction only, the tool cannot teach the practitioner anything, which forfeits half its value.

**Approach:** human assessments recorded as annotation with required reasoning, alongside computed values rather than overwriting them. `outcome_known` and `outcome_note` allow the record to falsify the human over time.

**Open question:** the honesty ceiling of a judgment dependent falsification layer is the practitioner's bandwidth. Acceptable for a pilot and for a lead generation funnel. Unresolved for the network model, where child organizations carry the four laws forward. Laws propagate as text; judgment does not. Addressed by work outside this project.

---

## Resolved during design

Recorded so they are not reopened. Full reasoning in `decision-log.md`.

- Jurisdiction is Redlands' Title 18, not the county Development Code
- Commercial districts are cumulative (C-1 ⊂ C-2 ⊂ C-3), not parallel
- Zoning and vacancy are city published; business density is the hard layer
- MLS is residential and does not carry commercial inventory
- Data ingestion citywide, analysis corridor bounded
- Question flow is the front door, not an optional filter
