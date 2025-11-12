"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiUrl } from "@/lib/api";

const formSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyM: z.number().min(0).max(1000).optional(),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ReportSightingForm({
  latLng,
  onSubmitted,
}: {
  latLng?: { lat: number; lng: number };
  onSubmitted?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    formState: { errors },
    getValues,            // NEW: to read current form values for compare
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accuracyM: 20,
    }
  });

  // Sync map clicks to form inputs
  useEffect(() => {
    if (latLng) {
      setValue("lat", latLng.lat);
      setValue("lng", latLng.lng);
    }
  }, [latLng, setValue]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Send data in the format your API expects
      const body = {
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date().toISOString(),
        accuracyM: data.accuracyM ?? 20,
        description: data.description?.trim() || "",
      };

      const url = getApiUrl("/api/sightings");

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit sighting");
      }

      const result = await response.json();
      console.log("Sighting submitted:", result);
      
      alert("✅ Superman sighting reported successfully!");
      
      // Reset form
      reset({
        lat: undefined,
        lng: undefined,
        accuracyM: 20,
        description: "",
      });
      
      // Call parent callback to clear map markers and refresh
      onSubmitted?.();
    } catch (error) {
      console.error("Error submitting sighting:", error);
      alert(`❌ Failed to submit sighting: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW: Haversine distance in meters
  function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000; // meters
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

 async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Unexpected response from /api/sightings/latest: ${text.slice(0, 200)}...`);
  }
}

const onCompareLatest = async () => {
  try {
    // Prefer current form values; fall back to latLng prop
    const vals = getValues();
    const latFromForm = vals?.lat;
    const lngFromForm = vals?.lng;

    const myLat = Number.isFinite(latFromForm) ? latFromForm : latLng?.lat;
    const myLng = Number.isFinite(lngFromForm) ? lngFromForm : latLng?.lng;

    if (typeof myLat !== "number" || typeof myLng !== "number") {
      alert("📍 Please click on the map (or enter lat/lng) first.");
      return;
    }

    // Fetch latest sighting
    const res = await fetch(getApiUrl("/api/sightings/latest"), { cache: "no-store" });

    if (!res.ok) {
      const note = await res.text().catch(() => "");
      throw new Error(`Latest endpoint error ${res.status}. ${note || "No details."}`);
    }

    const latest = await safeJson(res);

    // Support a few common shapes: doc, {latest: doc}, {data: doc}
    const doc = latest?.loc?.coordinates
      ? latest
      : latest?.latest?.loc?.coordinates
      ? latest.latest
      : latest?.data?.loc?.coordinates
      ? latest.data
      : null;

    if (!doc) {
      console.error("Latest payload:", latest);
      throw new Error("Could not find latest.loc.coordinates in response JSON.");
    }

    // Mongo GeoJSON is [lng, lat]
    const coords = doc.loc?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) {
      console.error("Bad coordinates field:", coords);
      throw new Error("Latest sighting has invalid coordinates.");
    }

    const [lng2, lat2] = coords as [number, number];

    if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) {
      throw new Error("Latest sighting coordinates are not numbers.");
    }

    const distance = haversineMeters(myLat, myLng, lat2, lng2);
    const accuracy = Number.isFinite(doc.accuracyM) ? doc.accuracyM : 20;
    const desc = (doc.description || "Latest sighting").toString();

    alert(`📏 ${desc}:\nYou are ${distance.toFixed(0)} m away (±${accuracy} m).`);
  } catch (e: any) {
    console.error("Compare failed:", e);
    alert(`⚠️ Comparison failed: ${e?.message || "Unknown error"}`);
  }
};

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="lat">Latitude</Label>
          <Input id="lat" type="number" step="any" {...register("lat", { valueAsNumber: true })} />
          {errors.lat && <p className="text-red-500 text-sm">{errors.lat.message}</p>}
        </div>
        <div>
          <Label htmlFor="lng">Longitude</Label>
          <Input id="lng" type="number" step="any" {...register("lng", { valueAsNumber: true })} />
          {errors.lng && <p className="text-red-500 text-sm">{errors.lng.message}</p>}
        </div>
        <div>
          <Label htmlFor="accuracyM">Accuracy (meters)</Label>
          <Input id="accuracyM" type="number" {...register("accuracyM", { valueAsNumber: true })} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Report Sighting"}
          </Button>
          <Button type="button" onClick={onCompareLatest} variant="outline">
            Compare to Latest
          </Button>
        </div>
      </form>
    </Card>
  );
}
