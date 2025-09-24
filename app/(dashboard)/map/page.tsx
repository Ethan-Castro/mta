"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Campus } from "@/lib/data/cuny";
import {
  bearingDegrees,
  bearingToCardinal,
  formatDistance,
  haversineDistanceKm,
  type LatLng,
} from "@/lib/geo/location";
import { BRAND_PRIMARY_HEX } from "@/lib/ui/colors";

type HotspotMetricRow = {
  busRouteId: string;
  stopName: string | null;
  latitude: number;
  longitude: number;
  violations: number;
  exemptCount: number;
  campus?: string | null;
};

const percent = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("en-US");

export default function MapPage() {
  const MapPanel = useMemo(
    () => dynamic(() => import("@/components/MapPanel"), { ssr: false }),
    []
  );

  const [hotspots, setHotspots] = useState<HotspotMetricRow[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useClusters, setUseClusters] = useState(false);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMapData() {
      try {
        setLoading(true);
        setError(null);
        const [hotspotRes, campusRes] = await Promise.all([
          fetch("/api/violations/hotspots?limit=400", { cache: "no-store" }),
          fetch("/api/cuny/campuses", { cache: "no-store" }),
        ]);

        const [hotspotJson, campusJson] = await Promise.all([hotspotRes.json(), campusRes.json()]);

        if (!hotspotJson.ok) {
          const message = typeof hotspotJson.error === "string" ? hotspotJson.error : "Unable to load hotspot data";
          throw new Error(message);
        }
        if (!campusJson.ok) {
          const message = typeof campusJson.error === "string" ? campusJson.error : "Unable to load campus data";
          throw new Error(message);
        }

        if (!cancelled) {
          setHotspots(Array.isArray(hotspotJson.rows) ? hotspotJson.rows : []);
          setCampuses(Array.isArray(campusJson.campuses) ? campusJson.campuses : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          const message = typeof err?.message === "string" && err.message
            ? err.message
            : "Failed to load map data. Try refreshing.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMapData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleShareLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("This browser does not support location access.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation(position);
        setLocationError(null);
        setIsLocating(false);
      },
      (err) => {
        setLocationError(err?.message || "Unable to fetch your location.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const campusMarkers = useMemo(() => {
    return campuses
      .filter((campus) => campus.latitude != null && campus.longitude != null)
      .map((campus) => ({
        id: `campus-${campus.campus.replace(/\s+/g, "-").toLowerCase()}`,
        longitude: Number(campus.longitude),
        latitude: Number(campus.latitude),
        color: "#8b5cf6",
        title: campus.campus,
        description: `${campus.type ?? "Campus"}${campus.address ? ` | ${campus.address}` : ""}`,
        href: campus.website ?? undefined,
        data: campus,
      }));
  }, [campuses]);

  const hotspotLookup = useMemo(() => {
    return new Map(
      hotspots.map((row) => [
        `${row.busRouteId}-${row.latitude}-${row.longitude}`,
        row,
      ])
    );
  }, [hotspots]);

  const hotspotMarkers = useMemo(() => {
    return hotspots
      .filter((row) => row.latitude != null && row.longitude != null)
      .map((row) => {
        const share = row.violations ? (row.exemptCount / row.violations) * 100 : 0;
        return {
          id: `${row.busRouteId}-${row.latitude}-${row.longitude}`,
          longitude: row.longitude,
          latitude: row.latitude,
          color: BRAND_PRIMARY_HEX,
          title: `${row.stopName ?? "Unknown stop"} (${row.busRouteId})`,
          description: `${integer.format(row.violations)} violations | ${percent.format(share)}% exempt${row.campus ? ` | ${row.campus}` : ""}`,
          data: row,
        };
      });
  }, [hotspots]);

  const markers = useMemo(() => [...hotspotMarkers, ...campusMarkers], [hotspotMarkers, campusMarkers]);

  const userCoordinates = useMemo<LatLng | null>(() => {
    if (!userLocation) return null;
    return {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    };
  }, [userLocation]);

  const nearestHotspot = useMemo(() => {
    if (!userCoordinates || !hotspotMarkers.length) return null;
    let closest = hotspotMarkers[0];
    let closestDistance = Number.POSITIVE_INFINITY;
    let matchedRow: HotspotMetricRow | null = null;

    for (const marker of hotspotMarkers) {
      const row = hotspotLookup.get(marker.id);
      if (!row) continue;
      const distanceKm = haversineDistanceKm(userCoordinates, {
        latitude: marker.latitude,
        longitude: marker.longitude,
      });
      if (distanceKm < closestDistance) {
        closest = marker;
        closestDistance = distanceKm;
        matchedRow = row;
      }
    }

    if (!matchedRow || !Number.isFinite(closestDistance)) return null;

    const bearing = bearingDegrees(userCoordinates, {
      latitude: closest.latitude,
      longitude: closest.longitude,
    });

    return {
      marker: closest,
      row: matchedRow,
      distanceKm: closestDistance,
      bearing,
    };
  }, [userCoordinates, hotspotMarkers, hotspotLookup]);

  const nearestCampuses = useMemo(() => {
    if (!userCoordinates || !campusMarkers.length) return [] as Array<{ marker: (typeof campusMarkers)[number]; distanceKm: number; bearing: number }>;
    const withDistance = campusMarkers.map((marker) => {
      const distanceKm = haversineDistanceKm(userCoordinates, {
        latitude: marker.latitude,
        longitude: marker.longitude,
      });
      const bearing = bearingDegrees(userCoordinates, {
        latitude: marker.latitude,
        longitude: marker.longitude,
      });
      return { marker, distanceKm, bearing };
    });
    return withDistance.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 5);
  }, [userCoordinates, campusMarkers]);

  const accuracyMeters = useMemo(() => {
    if (!userLocation) return null;
    const accuracy = Math.round(userLocation.coords.accuracy ?? 0);
    return Number.isFinite(accuracy) && accuracy > 0 ? accuracy : null;
  }, [userLocation]);

  const locationSummary = useMemo(() => {
    if (!userCoordinates) return null;
    if (nearestHotspot) {
      const distanceCopy = formatDistance(nearestHotspot.distanceKm);
      const direction = bearingToCardinal(nearestHotspot.bearing);
      const exemptShare = nearestHotspot.row.violations
        ? (nearestHotspot.row.exemptCount / nearestHotspot.row.violations) * 100
        : null;
      const shareMessage =
        exemptShare !== null ? `Exempt share is ${percent.format(exemptShare)}%.` : "";
      return [
        `You are ${distanceCopy} ${direction} of ${nearestHotspot.row.stopName ?? "an unnamed stop"} on ${nearestHotspot.row.busRouteId}.`,
        shareMessage,
      ]
        .filter(Boolean)
        .join(" ");
    }

    if (nearestCampuses.length) {
      const first = nearestCampuses[0];
      const distanceCopy = formatDistance(first.distanceKm);
      const direction = bearingToCardinal(first.bearing);
      return `You are ${distanceCopy} ${direction} of ${first.marker.title}.`;
    }

    return "Location captured. Map layers will highlight hotspots and campuses as data loads.";
  }, [userCoordinates, nearestHotspot, nearestCampuses]);

  const nearbyHotspots = useMemo(() => {
    if (!userCoordinates) return [];
    const withDistance = hotspots
      .filter((row) => row.latitude != null && row.longitude != null)
      .map((row) => {
        const distanceKm = haversineDistanceKm(userCoordinates, {
          latitude: row.latitude,
          longitude: row.longitude,
        });
        return {
          row,
          distanceKm,
        };
      })
      .filter((item) => Number.isFinite(item.distanceKm))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);
    return withDistance;
  }, [hotspots, userCoordinates]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="animate-fade-up space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Map explorer</h1>
        <p className="text-sm text-foreground/70">
          Share your location, scan ACE violations, and compare campuses on a satellite basemap.
        </p>
      </header>

      {error && (
        <div className="animate-fade-up rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-xs text-destructive shadow-sm">
          {error}
        </div>
      )}

      <section className="surface-card animate-fade-up rounded-xl border border-foreground/10 bg-card/80 p-4 shadow-soft-lg space-y-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-foreground">Live map</h2>
            <p className="text-xs text-muted-foreground">
              Satellite view with ACE hotspots (blue) and CUNY campuses (purple). Toggle clustering or share your location to orient yourself.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-xs text-foreground/70">
              <input
                type="checkbox"
                checked={useClusters}
                onChange={(e) => setUseClusters(e.target.checked)}
                className="h-4 w-4 rounded border-foreground/30 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              Cluster hotspots
            </label>
            <button
              type="button"
              onClick={handleShareLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLocating ? "Locating…" : userLocation ? "Update my location" : "Share my location"}
            </button>
            {userLocation && (
              <button
                type="button"
                onClick={() => {
                  setUserLocation(null);
                  setLocationError(null);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-all hover:-translate-y-0.5 hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {locationError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive shadow-sm">
            {locationError}
          </div>
        )}

        {userLocation && locationSummary && (
          <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary/90 shadow-sm">
            <span>{locationSummary}</span>
            {accuracyMeters !== null && (
              <span className="ml-1 text-primary/70">(±{accuracyMeters} m accuracy)</span>
            )}
          </div>
        )}

        <MapPanel
          height={520}
          center={[-73.95, 40.73]}
          zoom={10.2}
          markers={markers}
          cluster={useClusters}
          hoverPopups={!useClusters}
          userLocation={
            userLocation
              ? {
                  longitude: userLocation.coords.longitude,
                  latitude: userLocation.coords.latitude,
                  accuracy: userLocation.coords.accuracy,
                }
              : null
          }
        />

        <div className="flex flex-col gap-2 rounded-lg border border-foreground/10 bg-background/70 p-3 text-xs text-foreground/80 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-foreground/90">
            {loading ? "Loading hotspot metrics…" : `${integer.format(markers.length - campusMarkers.length)} hotspots and ${integer.format(campusMarkers.length)} campuses plotted`}
          </span>
          <span className="text-foreground/60">
            Hotspot clustering reduces map noise. Disable it to inspect individual stops and exemption details.
          </span>
        </div>
      </section>

      {userLocation && nearbyHotspots.length > 0 && (
        <section className="surface-card animate-fade-up rounded-xl border border-foreground/10 bg-card/80 p-4 shadow-soft-lg space-y-3 sm:p-5">
          <h2 className="text-sm font-medium text-foreground">Nearest hotspots to you</h2>
          <ul className="space-y-3 text-sm text-foreground/80">
            {nearbyHotspots.map(({ row, distanceKm }) => {
              const share = row.violations ? (row.exemptCount / row.violations) * 100 : 0;
              return (
                <li
                  key={`${row.busRouteId}-${row.latitude}-${row.longitude}`}
                  className="rounded-lg border border-foreground/10 bg-background/80 p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-1 text-xs text-foreground/60 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      {row.busRouteId} · {row.stopName ?? "Unknown stop"}
                    </span>
                    <span>{formatDistance(distanceKm)} away</span>
                  </div>
                  <div className="mt-1 font-medium text-foreground/90">
                    {integer.format(row.violations)} violations · {percent.format(share)}% exempt
                  </div>
                  {row.campus && <div className="text-xs text-foreground/60">Near {row.campus}</div>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
