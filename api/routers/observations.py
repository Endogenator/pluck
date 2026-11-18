import os
import uuid
from datetime import date
from typing import List, Literal, Optional

import boto3
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db

router = APIRouter(prefix="/api/v1", tags=["observations"])

ElementIdEnum = Literal[
    "window_for_lease_sign",
    "type_1_hood",
    "grease_trap",
    "three_comp_sink",
    "dedicated_parking",
    "ada_entrance",
    "outdoor_patio",
]


class ElementCheck(BaseModel):
    element_id: ElementIdEnum
    state: Literal["present", "absent", "unknown"]


class ObservationCreate(BaseModel):
    target_type: Literal["parcel", "building", "space"]
    target_id: uuid.UUID
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    occupancy_status: Literal["vacant", "occupied", "renovation", "unknown"]
    business_name: Optional[str] = Field(None, max_length=150)
    elements: List[ElementCheck] = []
    notes: Optional[str] = Field(None, max_length=1000)
    media_ref: Optional[str] = Field(None, max_length=500)
    observer_session_id: str = Field(..., min_length=16, max_length=64)
    website_url: Optional[str] = ""


class PresignRequest(BaseModel):
    content_type: Literal["image/jpeg", "image/png", "image/webp"]
    observer_session_id: str = Field(..., min_length=16, max_length=64)


@router.post("/uploads/presign")
async def create_presigned_upload(payload: PresignRequest):
    s3 = boto3.client(
        "s3",
        endpoint_url=os.getenv("S3_ENDPOINT_URL"),
        aws_access_key_id=os.getenv("S3_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("S3_SECRET_ACCESS_KEY"),
    )
    ext = payload.content_type.split("/")[-1]
    object_key = f"observations/{date.today().isoformat()}/{uuid.uuid4()}.{ext}"
    bucket = os.getenv("S3_BUCKET_NAME", "pluck-media")

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": object_key, "ContentType": payload.content_type},
        ExpiresIn=300,
    )
    public_url = f"{os.getenv('MEDIA_PUBLIC_BASE_URL')}/{object_key}"
    return {"upload_url": upload_url, "media_ref": public_url}


@router.post("/observations", status_code=201)
async def submit_observation(
    payload: ObservationCreate,
    db: AsyncSession = Depends(get_db),
):
    if payload.website_url:
        return {"status": "accepted"}

    pin_wkt = (
        f"SRID=4326;POINT({payload.longitude} {payload.latitude})"
        if payload.longitude is not None and payload.latitude is not None
        else None
    )

    parcel_id = payload.target_id
    if payload.target_type == "space":
        res = await db.execute(
            text("SELECT parcel_id FROM spaces WHERE id = :sid"),
            {"sid": str(payload.target_id)},
        )
        row = res.first()
        if not row:
            raise HTTPException(status_code=404, detail="Space not found")
        parcel_id = row[0]

    if payload.occupancy_status in ("vacant", "occupied", "renovation"):
        signal_map = {
            "vacant": ("field_observed_vacant", "moderate"),
            "occupied": ("field_observed_occupied", "moderate"),
            "renovation": ("field_observed_renovation", "moderate"),
        }
        sig_type, conf = signal_map[payload.occupancy_status]
        await db.execute(
            text("""
                INSERT INTO vacancy_signal (parcel_id, signal_type, observed_at, confidence, notes)
                VALUES (:pid, :sig_type, :obs_at, :conf, :notes)
            """),
            {
                "pid": str(parcel_id),
                "sig_type": sig_type,
                "obs_at": date.today(),
                "conf": conf,
                "notes": payload.notes,
            },
        )

    elements_to_write = payload.elements or [
        ElementCheck(element_id="window_for_lease_sign", state="unknown")
    ]
    for item in elements_to_write:
        await db.execute(
            text("""
                INSERT INTO element_observation (
                    target_type, target_id, element_id, state, source,
                    observed_at, observer, observer_session_id, notes, media_ref, pin_geom
                )
                VALUES (
                    :t_type, :t_id, :el_id, :state, 'crowd_report',
                    :obs_at, :obs_id, :obs_id, :notes, :media,
                    ST_GeomFromEWKT(:pin_wkt)
                )
            """),
            {
                "t_type": payload.target_type,
                "t_id": str(payload.target_id),
                "el_id": item.element_id,
                "state": item.state,
                "obs_at": date.today(),
                "obs_id": payload.observer_session_id,
                "notes": payload.notes,
                "media": payload.media_ref,
                "pin_wkt": pin_wkt,
            },
        )

    if payload.occupancy_status == "occupied" and payload.business_name:
        await db.execute(
            text("""
                INSERT INTO business_record (
                    parcel_id, name, source, active, first_seen, last_seen, retention_restricted
                )
                VALUES (:pid, :name, 'crowd_report', TRUE, :today, :today, FALSE)
            """),
            {
                "pid": str(parcel_id),
                "name": payload.business_name.strip(),
                "today": date.today(),
            },
        )

    await db.commit()
    return {"status": "recorded", "target_id": str(payload.target_id)}


@router.get("/gis/observations.geojson")
async def export_observations_geojson(db: AsyncSession = Depends(get_db)):
    query = text("""
        SELECT
            eo.id,
            eo.target_type,
            eo.target_id,
            eo.element_id,
            eo.state,
            eo.source,
            eo.observed_at,
            eo.status,
            eo.notes,
            eo.media_ref,
            ST_AsGeoJSON(
                COALESCE(
                    eo.pin_geom,
                    s.geom,
                    ST_PointOnSurface(p.geom)
                )
            )::json AS geometry
        FROM element_observation eo
        LEFT JOIN spaces s ON eo.target_type = 'space' AND eo.target_id = s.id
        LEFT JOIN parcels p ON (eo.target_type = 'parcel' AND eo.target_id = p.id)
                            OR (eo.target_type = 'space' AND s.parcel_id = p.id)
        WHERE eo.observed_at >= CURRENT_DATE - INTERVAL '180 days'
    """)
    result = await db.execute(query)
    features = []
    for row in result.mappings():
        if not row["geometry"]:
            continue
        features.append({
            "type": "Feature",
            "id": str(row["id"]),
            "geometry": row["geometry"],
            "properties": {
                "observation_id": str(row["id"]),
                "target_type": row["target_type"],
                "target_id": str(row["target_id"]),
                "element_id": row["element_id"],
                "state": row["state"],
                "source": row["source"],
                "observed_at": row["observed_at"].isoformat(),
                "status": row["status"],
                "notes": row["notes"],
                "media_ref": row["media_ref"],
            },
        })

    return {"type": "FeatureCollection", "features": features}
