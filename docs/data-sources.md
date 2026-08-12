# Data Sources Register

Status of every data source identified for Pluck, with access method and known constraints.

Last updated: 2026-08-12

---

## Jurisdiction note

Redlands is an **incorporated city**. Its zoning is governed by Title 18 of the Redlands Municipal Code. The San Bernardino County Development Code applies only to unincorporated county land and is **not** the governing source for this pilot.

Every parcel record must resolve to a jurisdiction before its zoning classification means anything. A zone code is only interpretable against the correct municipal table.

---

## City of Redlands GeoHub

ESRI-backed open data platform maintained by the city's GIS team.

`datahub-coredlands.hub.arcgis.com`

### Public applications and layers

| Layer | Contents | Status |
|---|---|---|
| General Plan and Zoning | Zoning districts, general plan, transit villages | Available |
| Vacant Parcels | Vacant parcels with zoning classification | Available, **definition unverified** |
| Parcel Search | Lookup by APN or address | Available |
| Development Projects | Current projects, housing element layers | Available |
| Economic Development | City business attraction framing | Available |
| Downtown Public Parking | Parking inventory | Available, peripheral |

Known item IDs (verify before relying on):

- Zoning item: `b0895d7175a64c34bfbee081648c3044`
- Parcels Public item: `482b3139f33d480aab3a2076dcbe569d`
- Zoning map: `hub.arcgis.com/maps/CoRedlands::zoning-4`
- All parcel dataset: `d4700ba28353473cabd751ceeb532ab9_0`

### Internal applications (NOT publicly accessible)

| Layer | Contents | Relevance |
|---|---|---|
| Business Licenses | All business licenses in the city | **Load bearing.** See below. |
| Accessory Dwelling Units | ADU locations and attributes citywide | Deferred informal space phase |
| Easements, Trees, Sewer | Infrastructure | Possible future |
| Warehouse Development | Industrial development tracking | Low |
| Solar Panels and EV Chargers | Installation records | Low |

---

## The business establishment problem

Of the three core layers (zoning, vacancy, business density), zoning and vacancy are published and partially pre-joined by the city. **Business density is the one that is not public.**

This layer is load bearing twice over: it is the density signal itself, and it is a primary input to vacancy inference (commercially zoned parcel + no active license = candidate unlisted vacancy).

### Acquisition options, ranked

**1. City records request.** Preferred. Business license data is public record in substance; the internal application is a format barrier, not a confidentiality one. Solves density and vacancy inference simultaneously and captures non consumer facing businesses that review platforms systematically miss.

**2. City GIS relationship.** Slower, more durable, opens a path to the ADU layer later.

**3. OpenStreetMap** via Overpass API or `osmnx`. Architecturally cleanest: free, no retention restrictions, no key management. Coverage incomplete but often reasonable in developed California corridors.

**4. Google Places API.** Best coverage. **Verify current retention terms before depending on it.** Historically, place IDs may be stored indefinitely but most other returned fields could not be cached beyond a short window. If that restriction holds, Places cannot populate a persistent density layer and becomes a runtime query cost that scales with area rather than a one time ingest.

**5. Yelp Fusion API.** Workable free tier, good category taxonomy, consumer facing bias.

**6. Census County Business Patterns.** Establishment counts by industry by geography. Cannot place points, but is the correct source for a benchmark denominator.

**7. Data Axle (formerly ReferenceUSA).** NAICS codes and employee counts. Carried free by many public library systems. Check San Bernardino County library and University of Redlands before paying for anything.

---

## Zoning source

Redlands Municipal Code, Title 18. Commercial districts are **cumulative, not parallel**:

- **C-1** (Ch. 18.84). Neighborhood / corner store scale. Business and professional offices are **conditional** here, not by right.
- **C-2** (Ch. 18.88). Neighborhood Convenience Center. Groups uses explicitly into *convenience goods*, *services*, and *shopper's goods*. Adds auto parts and minor repair, branch banking.
- **C-3** (Ch. 18.92). General Commercial. Inherits C-1 and C-2 in full, then adds auto sales, schools and studios, entertainment, full financial institutions, hotels, and unrestricted professional offices.
- **C-4**. Highway Commercial. **Not yet pulled.** Appears oriented to highway frontage and larger format uses.

C-1 ⊂ C-2 ⊂ C-3. A parcel's zone is a permission tier, not a flat label.

Both C-2 and C-3 contain a *similar uses by commission determination* provision, meaning the code itself acknowledges the list cannot be exhaustive.

**Currency:** Code was current through Ordinance 3001 (April 2026). C-3's use list was amended by Ord. 2985 (2025); C-2's dates to Ord. 2791 (2015). The two tiers were not amended in sync. Re-check periodically; this is a live source.

### Chapter references

- Title 18 index: `codelibrary.amlegal.com/codes/redlandsca/latest/redlands_ca/0-0-0-15192`
- C-1 permitted uses: § 18.84.040
- C-2 permitted uses: § 18.88.100
- C-3 permitted uses: § 18.92.040

---

## Federal and regional

| Source | Contents | Access |
|---|---|---|
| Census ACS 5-year | Demographics at block group level | Public API, free, well documented |
| Census TIGER/Line | Parcel boundaries, roads, tracts, block groups | Direct download |
| Census County Business Patterns | Establishment counts by industry | Public API |
| SCAG regional parcel data | Parcel level zoning across ~197 jurisdictions, ~5M parcels | `maps.scag.ca.gov` |
| SBA | Loan data by geography | Public |
| BLS | Employment by industry by area | Public API |

**On SCAG:** significant for eventual multi jurisdiction expansion, but its zoning codes are a regional planning abstraction. It likely gives a parcel's zone, not what is permitted in that zone. Treat as a spatial index across jurisdictions, **not** a replacement for municipal code parsing. 2024 codes updated October 2025.

**On ACS:** five year estimates are averaged across a rolling window and systematically understate present population wherever growth is occurring. In a growing city this biases any current supply versus current population calculation, and biases it most in exactly the places worth examining.

---

## Explicitly rejected

**MLS.** Residential. Commercial inventory is not there. Also requires broker membership and an IDX agreement.

**CoStar / LoopNet.** Licensed, expensive, aggressive about scraping. More importantly, systematically biased toward space with a broker and a marketing budget, which is the space least accessible to a first time micro entrepreneur. The inventory Pluck cares about is the handwritten sign in the window, which is inferred from public records rather than licensed.

---

## Open verification tasks

- [ ] Confirm what the city's vacant parcels layer actually defines as vacant
- [ ] Pull C-4 Highway Commercial chapter
- [ ] Confirm zoning tier for State Street and West Colton Avenue
- [ ] Verify current Google Places retention terms
- [ ] Submit business license records request
- [ ] Check library access to Data Axle
- [ ] Confirm C-2 and C-3 use lists have not drifted out of alignment since separate amendments
