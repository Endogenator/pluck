# GIS Workspace (`/gis`)

This directory holds ArcGIS Pro project files (`.aprx`), Python spatial processing scripts (`geopandas` / `arcgis`), and layer metadata for Pluck.

## Guidelines
* **Canonical Storage CRS:** `EPSG:4326` (WGS 84)
* **Planar Analysis CRS:** `EPSG:2229` (NAD83 / California zone 5 ftUS)
* **Large Binary Files:** Do not commit `.gdb`, `.tif`, `.mxd`, or large shapefiles to Git. Store raw/heavy rasters in the shared Google Drive folder and push clean GeoJSONs or write directly to PostGIS.

See `/docs/gis-partner-guide.md` for onboarding and connection instructions.
