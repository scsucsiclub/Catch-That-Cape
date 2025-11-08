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
    formState: { errors } 
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
        accuracyM: data.accuracyM ?? 20,
        description: data.description?.trim() || "",
      };

      const url = process.env.NEXT_PUBLIC_API_BASE
        ? `${process.env.NEXT_PUBLIC_API_BASE}/api/sightings`
        : "/api/sightings";

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

  return (
    <Card className="p-4 space-y-3">
      <h2 className="text-lg font-semibold">Report a Superman Sighting</h2>
      <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="lat">Latitude</Label>
            <Input 
              id="lat" 
              type="number" 
              step="any" 
              placeholder="45.5579"
              {...register("lat", { valueAsNumber: true })} 
            />
            {errors.lat && (
              <p className="text-sm text-red-500 mt-1">{errors.lat.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lng">Longitude</Label>
            <Input 
              id="lng" 
              type="number" 
              step="any" 
              placeholder="-94.1632"
              {...register("lng", { valueAsNumber: true })} 
            />
            {errors.lng && (
              <p className="text-sm text-red-500 mt-1">{errors.lng.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="accuracyM">Accuracy (meters)</Label>
          <Input 
            id="accuracyM" 
            type="number" 
            step="1" 
            placeholder="20" 
            defaultValue={20}
            {...register("accuracyM", { valueAsNumber: true })} 
          />
          <p className="text-xs text-gray-500 mt-1">
            How precise is this location?
          </p>
          {errors.accuracyM && (
            <p className="text-sm text-red-500 mt-1">{errors.accuracyM.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea 
            id="description" 
            placeholder="Saw Superman flying over downtown, wearing his red cape..."
            rows={3}
            maxLength={500}
            {...register("description")} 
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting || !latLng}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Sighting"}
        </Button>
        
        {!latLng && (
          <p className="text-sm text-amber-600 text-center bg-amber-50 p-2 rounded">
            👆 Click on the map to select a location first
          </p>
        )}
      </form>
    </Card>
  );
}