-- Migration: 002_crowd_observations_and_spaces.sql
-- Purpose: Adds sub-parcel spaces geometry table for ArcGIS authoring and upgrades
--          element_observation for anonymous crowd pin-drops and source tracking.

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Sub-parcel storefront units (Authored in ArcGIS Pro or inferred from observations)
CREATE TABLE IF NOT EXISTS spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
    unit_label VARCHAR(50),
    geom GEOMETRY(Geometry, 4326) NOT NULL,
    created_by VARCHAR(50) DEFAULT 'arcgis_digitized',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spaces_geom ON spaces USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_spaces_parcel_id ON spaces (parcel_id);

-- 2. Extend observation_source enum for crowd submissions
ALTER TYPE observation_source ADD VALUE IF NOT EXISTS 'crowd_report';

-- 3. Upgrade element_observation for spatial pin-drops & ArcGIS interoperability
ALTER TABLE element_observation
    ADD COLUMN IF NOT EXISTS pin_geom GEOMETRY(Point, 4326),
    ADD COLUMN IF NOT EXISTS observer_session_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'unverified'
        CHECK (status IN ('unverified', 'corroborated', 'flagged'));

CREATE INDEX IF NOT EXISTS idx_element_obs_pin_geom ON element_observation USING GIST (pin_geom);
CREATE INDEX IF NOT EXISTS idx_element_obs_target ON element_observation (target_type, target_id);

-- 4. Seed initial physical element catalog (Mapped to Coded Value Domains for ArcGIS)
INSERT INTO elements (id, label, category, plain_description) VALUES
    ('window_for_lease_sign', 'For Lease / Contact Sign', 'vacancy', 'Handwritten or broker sign visible in window'),
    ('type_1_hood', 'Type 1 Commercial Hood', 'kitchen', 'Grease-rated exhaust hood for cooking equipment'),
    ('grease_trap', 'Grease Interceptor / Trap', 'plumbing', 'In-ground or under-sink grease separation'),
    ('three_comp_sink', '3-Compartment Sink', 'plumbing', 'Commercial dishwashing/sanitizing sink setup'),
    ('dedicated_parking', 'Dedicated Off-Street Parking', 'site', 'On-site parking lot or striped spaces'),
    ('ada_entrance', 'Step-Free / ADA Entrance', 'accessibility', 'Level entry or ramp visible at main door'),
    ('outdoor_patio', 'Usable Patio / Frontage', 'site', 'Sidewalk or private patio space suitable for seating')
ON CONFLICT (id) DO NOTHING;
