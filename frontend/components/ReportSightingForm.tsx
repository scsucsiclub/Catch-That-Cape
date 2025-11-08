"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const { register, handleSubmit, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  // when user clicks map, sync into the form
  useEffect(() => {
    if (latLng) {
      setValue("lat", latLng.lat);
      setValue("lng", latLng.lng);
    }
  }, [latLng, setValue]);

  const onSubmit = async (data: FormValues) => {
    const body = {
      when: new Date().toISOString(),
      loc: { type: "Point", coordinates: [data.lng, data.lat] },
      accuracyM: data.accuracyM ?? 20,
      description: data.description?.slice(0, 500) ?? "",
    };

    const url = process.env.NEXT_PUBLIC_API_BASE
      ? `${process.env.NEXT_PUBLIC_API_BASE}/api/sightings`
      : "/api/sightings";

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      alert("Failed to submit sighting");
      return;
    }

    alert("Sighting submitted!");
    reset();
    onSubmitted?.();
  };

  return (
    <Card className="p-4 space-y-3">
      <h2 className="text-lg font-semibold">Report a Superman Sighting</h2>
      <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="lat">Latitude</Label>
            <Input id="lat" type="number" step="any" {...register("lat")} />
          </div>
          <div>
            <Label htmlFor="lng">Longitude</Label>
            <Input id="lng" type="number" step="any" {...register("lng")} />
          </div>
        </div>

        <div>
          <Label htmlFor="accuracyM">Accuracy (meters)</Label>
          <Input id="accuracyM" type="number" step="1" placeholder="20" {...register("accuracyM")} />
        </div>

        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea id="description" {...register("description")} />
        </div>

        <Button type="submit">Submit Sighting</Button>
      </form>
    </Card>
  );
}
