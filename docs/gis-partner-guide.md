# Pluck — GIS Architecture & Partner Onboarding Guide
**Project:** Pluck (`pluck.endogenation.com`)  
**Repository:** `Endogenator/pluck`  
**Status:** Phase 0/1 Transition (Adding Crowd-Sourced Observation & Sub-Parcel Spatial Layers)

---

## 1. What Pluck Is (In 30 Seconds)
Pluck is a civic spatial platform for Redlands, CA that surfaces entrepreneurial possibilities in underutilized commercial spaces—specifically targeting the unlisted, "handwritten sign in the window" inventory accessible to first-time micro-entrepreneurs. 

Instead of acting as a broker or marketplace, Pluck joins fragmented municipal data (zoning, parcels, specific plans, business licenses) with ground-truth crowd observations so residents can see what is legally permitted, what physical infrastructure exists, and what remains unknown.

---

## 2. Core Architectural Rules (How GIS Fits In)
To keep the platform open, low-cost, and accessible to non-ESRI web developers, we follow **Decision D9: Consume ESRI services; do not build the runtime application inside the ESRI ecosystem.**

* **Single Source of Truth:** PostgreSQL + PostGIS is our canonical spatial database. Next.js + `react-leaflet` renders GeoJSON served by FastAPI.
* **Your Workbench:** You can work natively in **ArcGIS Pro** and **ArcGIS Field Maps**. ArcGIS Pro connects directly to our PostGIS database (`Add Database Connection` -> PostgreSQL) so you can author, clean, run spatial joins, and write layers directly back to PostGIS without manual shapefile exports.
* **Canonical Coordinate Reference Systems (CRS):**
  * **Storage & Web Delivery:** WGS 84 (`EPSG:4326`)
  * **Planar Analysis (Distances, Buffers, Walk-Sheds):** California State Plane Zone 5 (`EPSG:2229`)
  * Reproject at the edges on ingest/export.

---

## 3. Repository Structure for GIS Work
Once you have access to `Endogenator/pluck`, here is where everything lives:
* `/docs` — Architecture, Domain Model, Data Sources Register, and Decision Log.
* `/db/migrations` — PostGIS table definitions (`parcels`, `spaces`, `element_observation`, `zoning_district`).
* `/api` — Python + FastAPI backend, including the live GeoJSON endpoint (`GET /api/v1/gis/observations.geojson`).
* `/gis` *(Your workspace)* — Put ArcGIS Pro `.aprx` templates, Python spatial processing scripts (`geopandas` / `arcgis`), and layer documentation here. *(Exclude large raw `.gdb` or `.tif` files in `.gitignore`; store heavy rasters in our shared Google Drive).*

---

## 4. High-Leverage GIS Deliverables (Prioritized)

### Priority 1: Audit Redlands GeoHub Layers & Governing Documents
Redlands is an incorporated city governed by Title 18 of the Municipal Code, **except** where Specific Plans override it (labeled `"SP__"` on the city map, such as the Transit Villages Specific Plan and East Valley Corridor Specific Plan).
* **Task 1A (Verify Vacant Parcels):** Inspect the City of Redlands GeoHub `Vacant Parcels` service (`datahub-coredlands.hub.arcgis.com`) to determine whether `"vacant"` means undeveloped land or empty commercial storefronts (Open Verification Task / Hypothesis H6).
* **Task 1B (Governing Document Master Layer):** Reconcile Redlands parcels (`APN`) against Title 18 zoning districts and Specific Plan boundaries so every parcel cleanly resolves to a `governing_document_id` and flags split-zoned lots.

### Priority 2: Sub-Parcel `spaces` Layer (Storefront Units)
City parcel polygons represent tax lots (`APN`), not individual commercial suites. A single downtown parcel on State Street often contains 4–6 separate storefronts with different vacancy statuses and kitchen/plumbing fixtures.
* **Task 2:** Using aerial imagery, building footprints, and our live crowd pin-drops, digitize sub-parcel storefront points or suite polygons into the PostGIS `spaces` table (`parcel_id` foreign key, `unit_label`, `geom` in `EPSG:4326`).
* **Why this matters:** Our new mobile `/observe` flow lets residents drop pins and report storefront vacancies or fixtures (like Type 1 kitchen hoods). Your `spaces` layer allows those reports to snap to exact suites rather than piling up on parent parcels.

### Priority 3: Discrepancy & "Needs Eyes" Target Layer
Once we obtain the City Business License dataset (or using our OpenStreetMap fallback in the meantime):
* **Task 3:** Run a spatial join comparing commercially zoned spaces against active business licenses and recent crowd observations. Output a prioritized target layer highlighting commercially zoned spaces with *no active license* and *no ground verification in the last 90 days* so we can direct crowd contributors where to look first.

### Priority 4: Pedestrian Walk-Sheds & Parking Proximity (Network Analyst)
* **Task 4:** Using the city's `Downtown Public Parking` layer and street network, generate 5- and 10-minute pedestrian walk-time isochrones (`EPSG:2229`) and clip Census ACS block group demographics to corridor walk-sheds.

---

## 5. Connecting ArcGIS Pro to Pluck Right Now
1. **Live Crowd Observations Feed (Zero Setup):**  
   In ArcGIS Pro, open **Map -> Add Data -> Data From Path** and enter:  
   `https://pluck.endogenation.com/api/v1/gis/observations.geojson`  
   This streams all crowd-submitted storefront observations, pin-drop coordinates, and photo URLs (`media_ref`) directly onto your map.
2. **Database Connection (Read/Write PostGIS):**  
   Use the PostgreSQL credentials in our shared Drive vault to connect ArcGIS Pro directly to the `parcels`, `spaces`, and `zoning_district` tables.
3. **Coded Value Domains (Keep Enums Strict):**  
   When authoring layers or ArcGIS Field Maps forms for corridor walks, align dropdowns with our PostGIS enums (`occupancy_status`: `vacant`, `occupied`, `renovation`, `unknown`; `element_id`: `window_for_lease_sign`, `type_1_hood`, `grease_trap`, `three_comp_sink`, `dedicated_parking`, `ada_entrance`, `outdoor_patio`).

---

## 6. Suggested First Week Plan (Asynchronous)
1. Accept the GitHub invite to `Endogenator/pluck` and review `/docs/domain-model.md` and `/docs/data-sources.md`.
2. Pull the Redlands GeoHub `Parcels` and `Zoning` feature services into ArcGIS Pro and document what the `Vacant Parcels` attribute table actually contains.
3. Load the live `observations.geojson` feed to verify CRS alignment (`EPSG:4326`) on a test map.
