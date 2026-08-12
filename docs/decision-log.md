# Decision Log

Decisions taken, with what was rejected and why. Exists so settled ground is not relitigated.

Last updated: 2026-08-12

---

### D1. Jurisdiction is the City of Redlands, not San Bernardino County

Redlands is incorporated. Its zoning is Title 18 of its own municipal code. The County Development Code governs unincorporated land only.

**Rejected:** building the use taxonomy against the county code. Would have produced a taxonomy that failed on the first real Redlands parcel.

**Consequence:** every spatial record resolves to a jurisdiction before its zone code is interpretable.

---

### D2. Redlands only for v1, not countywide

Countywide is not one taxonomy. It is the county code plus roughly two dozen incorporated cities, each with an independent ordinance. Widening does not consolidate the problem, it multiplies it.

**Rejected:** ingesting multiple jurisdictions in v1.

**Reasoning:** the data model must be built once, correctly, in a way that generalizes to N jurisdictions. That is learned by implementing one fully against ground truth. Swallowing the county at once risks a schema that quietly assumes something only true of Redlands.

---

### D3. Commercial districts are modeled as cumulative, not flattened

C-3 permits everything in C-1 and C-2 plus its own additions. A parcel's zone is a permission tier, not a flat label.

**Rejected:** flattening inherited permissions into each district's list.

**Reasoning:** the source of a permission stays traceable, and the platform can surface useful distinctions like "an office here needs a conditional use permit; three blocks into C-3 it does not."

---

### D4. Data ingestion citywide, analysis corridor bounded

**Rejected:** clipping ingestion to downtown.

**Reasoning:** the city publishes citywide feature services. Clipping is extra work for less coverage. But ground truthing does not scale past a few hundred storefronts, gap semantics are not uniform across corridor types, and a bounded area that can be vouched for is more persuasive to a skeptic than a citywide map with an unstated error rate. The first thing a skeptical viewer does is look up a place they know.

---

### D5. MLS rejected

**Rejected:** MLS as a vacancy source.

**Reasoning:** MLS is residential. Commercial inventory is not in it. It also requires broker membership and an IDX agreement.

---

### D6. CoStar and LoopNet rejected

**Rejected:** licensed commercial listing data.

**Reasoning:** licensed, expensive, and aggressive about scraping. More importantly, systematically biased toward space with a broker and a marketing budget, which is the space least accessible to a first time micro entrepreneur. The relevant inventory is the handwritten sign in the window, inferred from public records.

---

### D7. Business license data is the preferred establishment source

**Rejected as primary:** Google Places, Yelp, OSM.

**Reasoning:** city license data solves density and vacancy inference simultaneously and captures non consumer facing businesses that review platforms systematically miss. It is public record in substance; the internal GIS app is a format barrier, not a confidentiality one. Third party APIs are prototype fallbacks, not the destination. Effort should not go into perfecting inference when a records request may produce the real thing.

---

### D8. Google Places treated as retention constrained until verified

**Not yet decided.** Places terms have historically permitted indefinite storage of place IDs but restricted caching of most other returned fields.

**Consequence if confirmed:** Places cannot populate a persistent density layer. It becomes a runtime query cost that scales with area, which materially changes the citywide analysis economics.

**Action:** verify before any architecture depends on it. `business_record.retention_restricted` exists to isolate such sources.

---

### D9. Not built inside the ESRI ecosystem

Redlands publishes through ESRI and consuming those services is straightforward.

**Rejected:** ArcGIS Online or ESRI hosted apps as the platform.

**Reasoning:** would create a dependency the project should not carry and would make the tool harder for a non-ESRI collaborator to work on. Consume the services, do not live inside them.

---

### D10. Question flow is the front door, not an optional filter

**Rejected:** map first with questions as a filter.

**Reasoning:** the city already published the map. Their vacant parcels app shows vacant parcels with zoning, which is most of what a map first Pluck would show on load. Landing on a map makes Pluck a better looking municipal app, and the comparison is unflattering because the city holds the authoritative data. The differentiator is the question, not the map. Raw layers are exactly the thing that has been sitting unused.

**Cost accepted:** some users bounce at question one who would have engaged with a map. Likely the more sophisticated user who has other tools.

**Mitigation:** a quiet skip link, and answers persisted locally so returning visitors are not re-interrogated.

---

### D11. Default view when the flow is skipped

Corridor with vacant zoned parcels shown, no gap inference, visible prompt back into the questions.

**Rejected:** all commercially zoned parcels (noise), and vacancy with full inference (rewards skipping and duplicates the city's app).

**Reasoning:** honest about what the tool is. The useful version requires the person to say something.

---

### D12. Lead capture is a form on Pluck, not a handoff

**Rejected:** linking out to endogenation.com.

**Reasoning:** an outbound link means different branding and a context switch at the moment of maximum motivation. A form on Pluck keeps the person in the moment and is cheaper to build.

---

### D13. No transactions, no listings, no marketplace

**Rejected:** hosting listings, brokering introductions, taking any commission.

**Reasoning:** Law Two. Becoming a transaction layer creates the dependency and extraction dynamic the platform exists to counter. This is structural, not a stage to outgrow.

---

### D14. Informal space market deferred

Peer to peer inventory of garages, in-law units, rooms with separate entrances.

**Reasoning:** requires a submission pipeline and creates two sided marketplace exposure. Also runs into ADU regulations and home occupation rules, which the platform would need to surface rather than paper over.

**Boundary held:** unlisted *commercial* vacancy stays in scope, because it is inference from public data. Peer to peer listing of non commercial space stays out.

---

### D15. No scoring or ranking field on opportunity candidates

**Rejected:** a single ordered viability score.

**Reasoning:** a score implies a recommendation. The platform reports what is permitted, present, absent, and uncertain. Two people looking at the same corner should be able to see different possibilities.

---

### D16. Falsification is required and precedes the data

Every surfaced candidate carries its uncertainties. `unknown` is a first class result, not a null. Cost as constraint is not reliably detectable from public data and surfaces as unknown rather than being silently omitted.

**Reasoning:** Law Three. If Pluck surfaces a gap and someone commits their savings, that person carries the risk of whatever the model got wrong. This is a design commitment, not an analytical finding, and therefore does not wait for Phase 3.

---

### D17. Analytical methodology deliberately unspecified

**Rejected:** specifying the gap formula during framework design.

**Reasoning:** committing to an analysis before observing the corridors puts conclusions ahead of evidence. Several assumptions generated during design have already been identified as questionable. The schema is built wide enough to hold those questions without presuming answers. Hypotheses are recorded in `findings-log.md` as open questions rather than encoded as behavior.

**Structural consequence:** analysis is a replaceable stage with a stable interface. `method_version` on every candidate keeps results attributable across methodology changes.

---

### D18. Human annotation coexists with computed values

**Rejected:** human judgment overwriting computed output.

**Reasoning:** keeping both makes the judgment layer testable over time, makes it training material for other practitioners, and makes the mentor layer replicable rather than personal. `outcome_known` and `outcome_note` allow the data to falsify the human, not only the reverse.
