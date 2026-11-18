"use client";

import React, { useState, useEffect } from "react";

type OccupancyStatus = "vacant" | "occupied" | "renovation" | "unknown";
type ElementState = "present" | "absent" | "unknown";

interface ObserveFormProps {
  targetType: "parcel" | "building" | "space";
  targetId: string;
  displayAddress: string;
  coordinates?: [number, number];
  onSuccess?: () => void;
}

const VACANT_CLUES = [
  { id: "window_for_lease_sign", label: '"For Lease" or phone number in window' },
  { id: "type_1_hood", label: "Commercial kitchen hood / vent visible" },
  { id: "three_comp_sink", label: "Restaurant / cafe sinks or counters inside" },
  { id: "dedicated_parking", label: "Dedicated off-street parking lot" },
  { id: "ada_entrance", label: "Step-free / ramp entrance" },
] as const;

function getOrCreateSessionId(): string {
  const key = "pluck_observer_session_v1";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(key, id);
  }
  return id;
}

export default function ObserveDrawer({
  targetType,
  targetId,
  displayAddress,
  coordinates,
  onSuccess,
}: ObserveFormProps) {
  const [sessionId, setSessionId] = useState("");
  const [occupancy, setOccupancy] = useState<OccupancyStatus | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [elements, setElements] = useState<Record<string, ElementState>>({});
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const toggleElement = (elementId: string, state: ElementState) => {
    setElements((prev) => ({ ...prev, [elementId]: state }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!occupancy) return;
    setSubmitting(true);
    setError(null);

    try {
      let mediaRef: string | undefined;

      if (photoFile) {
        const presignRes = await fetch("/api/v1/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_type: photoFile.type,
            observer_session_id: sessionId,
          }),
        });
        if (!presignRes.ok) throw new Error("Could not prepare photo upload.");
        const { upload_url, media_ref } = await presignRes.json();

        const uploadRes = await fetch(upload_url, {
          method: "PUT",
          headers: { "Content-Type": photoFile.type },
          body: photoFile,
        });
        if (!uploadRes.ok) throw new Error("Photo upload failed.");
        mediaRef = media_ref;
      }

      const formattedElements = Object.entries(elements).map(([element_id, state]) => ({
        element_id,
        state,
      }));

      const res = await fetch("/api/v1/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          longitude: coordinates?.[0],
          latitude: coordinates?.[1],
          occupancy_status: occupancy,
          business_name: occupancy === "occupied" ? businessName : undefined,
          elements: formattedElements,
          notes: notes.trim() || undefined,
          media_ref: mediaRef,
          observer_session_id: sessionId,
          website_url: honeypot,
        }),
      });

      if (!res.ok) throw new Error("Could not save your note. Please try again.");
      setSubmitted(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 text-stone-800">
        <h3 className="text-lg font-semibold">Noted—thank you.</h3>
        <p className="mt-1 text-sm text-stone-600">
          Your observation for <span className="font-medium">{displayAddress}</span> has been
          added alongside city records so others can see what is actually on the ground.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <div>
        <p className="text-xs uppercase tracking-wider text-stone-500">Ground Check</p>
        <h2 className="text-lg font-semibold text-stone-900">{displayAddress}</h2>
        <p className="mt-1 text-sm text-stone-600">
          Public records lag behind reality. Share what you can see from the sidewalk.
        </p>
      </div>

      <input
        type="text"
        name="website_url"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-800">
          1. What’s happening in this spot right now?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "vacant", label: "Looks empty / For lease" },
            { value: "occupied", label: "Open & operating" },
            { value: "renovation", label: "Under construction" },
            { value: "unknown", label: "Hard to tell" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setOccupancy(opt.value as OccupancyStatus)}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                occupancy === opt.value
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {occupancy === "occupied" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-800">
            What business is operating here? <span className="text-stone-400">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Stell Coffee & Tea"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-none"
          />
        </div>
      )}

      {(occupancy === "vacant" || occupancy === "renovation") && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-stone-800">
            2. Any visible clues inside or out? <span className="text-stone-400">(optional)</span>
          </label>
          <div className="space-y-2">
            {VACANT_CLUES.map((clue) => {
              const current = elements[clue.id];
              return (
                <div
                  key={clue.id}
                  className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-3 py-2"
                >
                  <span className="pr-2 text-xs text-stone-700">{clue.label}</span>
                  <div className="flex shrink-0 gap-1">
                    {(["present", "absent", "unknown"] as ElementState[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => toggleElement(clue.id, st)}
                        className={`rounded px-2 py-1 text-xs capitalize ${
                          current === st
                            ? "bg-stone-800 text-white"
                            : "bg-white text-stone-600 ring-1 ring-stone-200"
                        }`}
                      >
                        {st === "present" ? "Yes" : st === "absent" ? "No" : "?"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {occupancy && (
        <div className="space-y-3 border-t border-stone-100 pt-4">
          <div>
            <label className="block text-sm font-medium text-stone-800">
              3. Snap a window sign or storefront photo{" "}
              <span className="text-stone-400">(optional)</span>
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-xs text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-stone-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-800">
              Anything else someone considering this spot should know?
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Handwritten sign says call 909-555-0199, back patio looks spacious..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-none"
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!occupancy || submitting}
        className="w-full rounded-lg bg-stone-900 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {submitting ? "Saving note..." : "Add ground observation"}
      </button>
    </form>
  );
}
