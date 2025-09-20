"use client";

import Map, { Marker, Popup, NavigationControl, Source, Layer } from "react-map-gl/mapbox";
import { useMemo, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapRef } from "react-map-gl/mapbox";
import type { Feature, FeatureCollection, GeoJsonProperties, Point } from "geojson";

type Props = {
  height?: number;
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    longitude: number;
    latitude: number;
    color?: string;
    title?: string;
    description?: string;
    href?: string;
  }>;
  cluster?: boolean;
  hoverPopups?: boolean;
};

export default function MapPanel({ height = 300, center = [-73.9857, 40.7484], zoom = 10, markers = [], cluster = false, hoverPopups = true }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selected = selectedId
    ? markers.find((m) => m.id === selectedId) || null
    : hoverPopups && hoveredId
    ? markers.find((m) => m.id === hoveredId) || null
    : null;

  const mapRef = useRef<MapRef | null>(null);

  const geojson = useMemo<FeatureCollection<Point, GeoJsonProperties>>(() => {
    const features: Feature<Point, GeoJsonProperties>[] = markers.map((m) => ({
      type: "Feature",
      properties: {
        id: m.id,
        title: m.title,
        description: m.description,
        href: m.href,
        color: m.color || "#2563eb",
      },
      geometry: { type: "Point", coordinates: [m.longitude, m.latitude] as [number, number] },
    }));

    return {
      type: "FeatureCollection",
      features,
    };
  }, [markers]);

  const interactiveLayerIds = cluster ? ["clusters", "unclustered-point"] : undefined;

  return (
    <div className="rounded-lg border border-foreground/10 overflow-hidden" style={{ height }}>
      {token ? (
        <Map
          ref={mapRef}
          initialViewState={{ longitude: center[0], latitude: center[1], zoom }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={token}
          interactiveLayerIds={interactiveLayerIds}
          onClick={(e: any) => {
            if (!cluster) return;
            const feature = e.features && e.features[0];
            if (!feature) return;
            const map = mapRef.current?.getMap() as any;
            if (feature.layer.id === "clusters") {
              const clusterId = feature.properties.cluster_id;
              const source = map.getSource("markers") as any;
              if (source && source.getClusterExpansionZoom) {
                source.getClusterExpansionZoom(clusterId, (err: any, zoomLevel: number) => {
                  if (err) return;
                  map.easeTo({ center: feature.geometry.coordinates, zoom: zoomLevel });
                });
              } else {
                map.easeTo({ center: feature.geometry.coordinates, zoom: map.getZoom() + 1 });
              }
            } else if (feature.layer.id === "unclustered-point") {
              const id = feature.properties.id as string;
              setSelectedId(id);
            }
          }}
          onMouseMove={(e: any) => {
            if (!cluster || !hoverPopups) return;
            const feature = e.features && e.features[0];
            if (feature && feature.layer && feature.layer.id === "unclustered-point") {
              const id = feature.properties.id as string;
              setHoveredId(id);
            } else {
              setHoveredId(null);
            }
          }}
        >
          <NavigationControl position="top-left" />

          {!cluster && (
            <>
              {markers.map((m) => (
                <Marker key={m.id} longitude={m.longitude} latitude={m.latitude} anchor="bottom">
                  <div
                    style={{
                      backgroundColor: m.color || "#2563eb",
                      width: 10,
                      height: 10,
                      borderRadius: 9999,
                      border: "2px solid white",
                      boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
                      cursor: "pointer",
                    }}
                    title={m.title}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(m.id);
                    }}
                    onMouseEnter={() => hoverPopups && setHoveredId(m.id)}
                    onMouseLeave={() => hoverPopups && setHoveredId((curr) => (curr === m.id ? null : curr))}
                  />
                </Marker>
              ))}
            </>
          )}

          {cluster && (
            <Source id="markers" type="geojson" data={geojson} cluster={true} clusterMaxZoom={14} clusterRadius={50}>
              <Layer
                id="clusters"
                type="circle"
                filter={["has", "point_count"] as any}
                paint={{
                  "circle-color": [
                    "step",
                    ["get", "point_count"],
                    "#93c5fd",
                    10,
                    "#60a5fa",
                    25,
                    "#3b82f6",
                    50,
                    "#1d4ed8",
                  ] as any,
                  "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 25, 22, 50, 28] as any,
                  "circle-stroke-width": 1,
                  "circle-stroke-color": "#ffffff",
                } as any}
              />
              <Layer
                id="cluster-count"
                type="symbol"
                filter={["has", "point_count"] as any}
                layout={{
                  "text-field": ["get", "point_count_abbreviated"],
                  "text-size": 12,
                } as any}
                paint={{ "text-color": "#0f172a" } as any}
              />
              <Layer
                id="unclustered-point"
                type="circle"
                filter={["!", ["has", "point_count"]] as any}
                paint={{
                  "circle-color": ["get", "color"] as any,
                  "circle-radius": 5,
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                } as any}
              />
            </Source>
          )}

          {selected && (
            <Popup
              longitude={selected.longitude}
              latitude={selected.latitude}
              anchor="top"
              offset={12}
              closeOnClick={false}
              onClose={() => {
                setSelectedId(null);
                setHoveredId(null);
              }}
              focusAfterOpen={false}
            >
              <div className="space-y-1">
                <div className="text-sm font-medium leading-snug">{selected.title || selected.id}</div>
                {selected.description && <div className="text-xs text-foreground/70">{selected.description}</div>}
                {selected.href && (
                  <a href={selected.href} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    Visit website
                  </a>
                )}
              </div>
            </Popup>
          )}
        </Map>
      ) : (
        <div className="h-full grid place-items-center text-sm text-foreground/60">Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the map.</div>
      )}
    </div>
  );
}


