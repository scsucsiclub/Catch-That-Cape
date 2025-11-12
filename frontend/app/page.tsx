"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import ReportSightingForm from "../components/ReportSightingForm";
import { getApiUrl } from "@/lib/api";

// Lazy-load Leaflet only in the browser (avoids SSR issues)
const L: any = typeof window !== "undefined" ? require("leaflet") : null;

// Fix default marker icon paths in Next.js (put files in /public/leaflet)
if (L) {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  });
}

export default function Home() {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const latestMarkerRef = useRef<any>(null);
  const latestCircleRef = useRef<any>(null);

  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // init map once
  useEffect(() => {
    if (!L || mapRef.current) return;

    const map = L.map("map", { center: [45.5579, -94.1632], zoom: 13 });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    // click -> set coord + place a preview marker
    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      setLatLng({ lat, lng });

      if (!markerRef.current) {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }

      // small “selection” circle (15 m just for visual feedback)
      if (!circleRef.current) {
        circleRef.current = L.circle([lat, lng], { radius: 15 }).addTo(map);
      } else {
        circleRef.current.setLatLng([lat, lng]);
      }
    });

    // poll latest sighting every 7s
    const id = setInterval(loadLatest, 7000);
    loadLatest();

    return () => {
      clearInterval(id);
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLatest() {
    try {
      const r = await fetch(getApiUrl("/api/sightings/latest"));
      if (!r.ok) return;
      const d = await r.json();
      if (!d) return;

      const [lng, lat] = d.loc.coordinates as [number, number];
      const acc = d.accuracyM ?? 20;
      const map = mapRef.current as any;

      if (!latestMarkerRef.current) {
        latestMarkerRef.current = L.marker([lat, lng], { title: "Latest sighting" }).addTo(map);
      }
      latestMarkerRef.current.setLatLng([lat, lng]).bindPopup(d.description || "Latest sighting");

      if (!latestCircleRef.current) {
        latestCircleRef.current = L.circle([lat, lng], { radius: acc, color: "#2563eb" }).addTo(map);
      } else {
        latestCircleRef.current.setLatLng([lat, lng]).setRadius(acc);
      }
    } catch {
      // ignore in MVP
    }
  }
  function useMyLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatLng({ lat, lng });

        const map = mapRef.current as any;
        map?.setView([lat, lng], 16);

        if (!markerRef.current) {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        } else {
          markerRef.current.setLatLng([lat, lng]);
        }

        if (!circleRef.current) {
          circleRef.current = L.circle([lat, lng], { radius: 15 }).addTo(map);
        } else {
          circleRef.current.setLatLng([lat, lng]);
        }
      },
      () => alert("Unable to fetch your location")
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 grid gap-4">
      <h1 className="text-3xl font-bold text-center mt-2">St. Cloud Superman Tracker</h1>
      <p className="text-center text-gray-600">Report your sightings below 👇</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        <div className="relative">
          <div id="map" className="h-[70vh] w-full rounded-lg border" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Button size="sm" onClick={useMyLocation}>
              Use my location
            </Button>
          </div>
        </div>

        <div>
          <ReportSightingForm
            latLng={latLng}
            onSubmitted={() => {
              // clear selection ring/marker after submit
              if (circleRef.current) {
                circleRef.current.remove();
                circleRef.current = null;
              }
              if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
              }
              setLatLng(undefined);
              // refresh latest pin
              loadLatest();
            }}
          />
        </div>
      </div>
    </main>
  );
}
