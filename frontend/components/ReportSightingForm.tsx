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

// 🧭 Zod Schema (keeps coordinate logic for backend)
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
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accuracyM: 20,
    },
  });

  // Sync map clicks to form inputs
  useEffect(() => {
    if (latLng) {
      setValue("lat", latLng.lat);
      setValue("lng", latLng.lng);
    }
  }, [latLng, setValue]);

  // 🌍 Submit report to backend
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const body = {
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date().toISOString(),
        accuracyM: data.accuracyM ?? 20,
        description: data.description?.trim() || "",
      };

      const url = "http://localhost:3000/api/sightings";
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
      console.log("✅ Sighting submitted:", result);
      alert("🎃 Superman sighting reported successfully!");

      reset({
        lat: undefined,
        lng: undefined,
        accuracyM: 20,
        description: "",
      });

      onSubmitted?.();
    } catch (error) {
      console.error("Error submitting sighting:", error);
      alert(
        `❌ Failed to submit sighting: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 📏 Distance comparison function
  function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
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
      throw new Error(
        `Unexpected response from /api/sightings/latest: ${text.slice(0, 200)}...`
      );
    }
  }

  const onCompareLatest = async () => {
    try {
      const vals = getValues();
      const latFromForm = vals?.lat;
      const lngFromForm = vals?.lng;

      const myLat = Number.isFinite(latFromForm) ? latFromForm : latLng?.lat;
      const myLng = Number.isFinite(lngFromForm) ? lngFromForm : latLng?.lng;

      if (typeof myLat !== "number" || typeof myLng !== "number") {
        alert("📍 Please click on the map (or enter lat/lng) first.");
        return;
      }

      const res = await fetch("http://localhost:3000/api/sightings/latest", { cache: "no-store" });
      if (!res.ok) {
        const note = await res.text().catch(() => "");
        throw new Error(`Latest endpoint error ${res.status}. ${note || "No details."}`);
      }

      const latest = await safeJson(res);
      const doc = latest?.loc?.coordinates
        ? latest
        : latest?.latest?.loc?.coordinates
        ? latest.latest
        : latest?.data?.loc?.coordinates
        ? latest.data
        : null;

      if (!doc) throw new Error("Could not find latest.loc.coordinates in response JSON.");

      const coords = doc.loc?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2)
        throw new Error("Latest sighting has invalid coordinates.");

      const [lng2, lat2] = coords as [number, number];
      const distance = haversineMeters(myLat, myLng, lat2, lng2);
      const accuracy = Number.isFinite(doc.accuracyM) ? doc.accuracyM : 20;
      const desc = (doc.description || "Latest sighting").toString();

      alert(`📏 ${desc}:\nYou are ${distance.toFixed(0)} m away (±${accuracy} m).`);
    } catch (e: any) {
      console.error("Compare failed:", e);
      alert(`⚠️ Comparison failed: ${e?.message || "Unknown error"}`);
    }
  };

  // 🕸️ Render Form (Halloween-themed UI)
  return (
    <Card className="p-5 bg-[#162314]/90 border border-[#A6FF47]/40 rounded-2xl shadow-[0_0_20px_#FF7518]/30 text-[#F5FFDC]">
      <h2 className="text-2xl font-extrabold text-center mb-2 bg-gradient-to-r from-[#A6FF47] to-[#FF7518] bg-clip-text text-transparent drop-shadow-[0_0_5px_#A6FF47]/40">
        Report a Superman Sighting
      </h2>

      <p className="text-center text-[#D9F9A6] text-sm italic mb-3">
        Be brave... and tell us where you saw him 👀
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="lat" className="text-[#A6FF47]">
            Latitude
          </Label>
          <Input
            id="lat"
            type="number"
            step="any"
            {...register("lat", { valueAsNumber: true })}
            className="bg-[#22331f] text-[#E8FFD6] border border-[#A6FF47]/30 focus:border-[#FF7518] focus:ring-[#FF7518]"
          />
          {errors.lat && <p className="text-red-500 text-sm">{errors.lat.message}</p>}
        </div>

        <div>
          <Label htmlFor="lng" className="text-[#A6FF47]">
            Longitude
          </Label>
          <Input
            id="lng"
            type="number"
            step="any"
            {...register("lng", { valueAsNumber: true })}
            className="bg-[#22331f] text-[#E8FFD6] border border-[#A6FF47]/30 focus:border-[#FF7518] focus:ring-[#FF7518]"
          />
          {errors.lng && <p className="text-red-500 text-sm">{errors.lng.message}</p>}
        </div>

        <div>
          <Label htmlFor="accuracyM" className="text-[#A6FF47]">
            Accuracy (meters)
          </Label>
          <Input
            id="accuracyM"
            type="number"
            {...register("accuracyM", { valueAsNumber: true })}
            className="bg-[#22331f] text-[#E8FFD6] border border-[#A6FF47]/30 focus:border-[#FF7518] focus:ring-[#FF7518]"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-[#A6FF47]">
            Description (optional)
          </Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Describe what you saw — glowing eyes? A shadow in the sky?"
            className="bg-[#22331f] text-[#E8FFD6] border border-[#A6FF47]/30 focus:border-[#FF7518] focus:ring-[#FF7518] h-28 placeholder-[#D9F9A6]/70"
          />
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-[#A6FF47] to-[#FF7518] text-black font-bold shadow-[0_0_12px_#A6FF47]/60 hover:scale-[1.02] transition-transform"
          >
            {isSubmitting ? "Submitting..." : "Submit Sighting 👻"}
          </Button>

          <Button
            type="button"
            onClick={onCompareLatest}
            variant="outline"
            className="border-[#FF7518]/50 text-[#FF7518] hover:bg-[#FF7518]/10 hover:text-[#FFF]"
          >
            Compare to Latest
          </Button>
        </div>
      </form>
    </Card>
  );
}
