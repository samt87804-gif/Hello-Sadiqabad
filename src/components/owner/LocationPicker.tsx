import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { useToast } from '../ui/Toast';

const DEFAULT_CENTER = { lat: 28.3062, lng: 70.1308 };

export function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (coords: { lat: number; lng: number }) => void;
}) {
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const curLat = typeof lat === 'number' ? lat : DEFAULT_CENTER.lat;
  const curLng = typeof lng === 'number' ? lng : DEFAULT_CENTER.lng;

  const [latDraft, setLatDraft] = useState(typeof lat === 'number' ? String(lat) : '');
  const [lngDraft, setLngDraft] = useState(typeof lng === 'number' ? String(lng) : '');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setLatDraft(typeof lat === 'number' ? String(lat) : '');
  }, [lat]);

  useEffect(() => {
    setLngDraft(typeof lng === 'number' ? String(lng) : '');
  }, [lng]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [curLat, curLng],
      zoom: 15,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: 'hs-draggable-pin',
      html: `<div style="width:24px;height:24px;border-radius:9999px;background:#006948;border:3px solid #ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.35);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([curLat, curLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const nextLat = Math.round(pos.lat * 100000) / 100000;
      const nextLng = Math.round(pos.lng * 100000) / 100000;
      onChangeRef.current({ lat: nextLat, lng: nextLng });
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const nextLat = Math.round(e.latlng.lat * 100000) / 100000;
      const nextLng = Math.round(e.latlng.lng * 100000) / 100000;
      marker.setLatLng([nextLat, nextLng]);
      onChangeRef.current({ lat: nextLat, lng: nextLng });
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && markerRef.current && typeof lat === 'number' && typeof lng === 'number') {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('GPS geolocation is not supported by your browser.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = Math.round(pos.coords.latitude * 100000) / 100000;
        const nextLng = Math.round(pos.coords.longitude * 100000) / 100000;
        mapRef.current?.setView([nextLat, nextLng], 16);
        markerRef.current?.setLatLng([nextLat, nextLng]);
        onChange({ lat: nextLat, lng: nextLng });
        setLocating(false);
        showToast('Shop coordinates locked from GPS!', 'success');
      },
      (err) => {
        setLocating(false);
        showToast(
          err.code === 1
            ? 'Location permission denied. Drag the pin or click on the map.'
            : 'Could not lock GPS location. Click on the map instead.',
          'error'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const commitLat = (raw: string) => {
    setLatDraft(raw);
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed) && parsed >= -90 && parsed <= 90) {
      const rounded = Math.round(parsed * 100000) / 100000;
      mapRef.current?.setView([rounded, curLng], mapRef.current.getZoom());
      onChange({ lat: rounded, lng: curLng });
    }
  };

  const commitLng = (raw: string) => {
    setLngDraft(raw);
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed) && parsed >= -180 && parsed <= 180) {
      const rounded = Math.round(parsed * 100000) / 100000;
      mapRef.current?.setView([curLat, rounded], mapRef.current.getZoom());
      onChange({ lat: curLat, lng: rounded });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Click anywhere on the Sadiqabad map or drag the green pin to set your location.</span>
        </p>
        <Button
          size="sm"
          variant="outline"
          loading={locating}
          onClick={useCurrentLocation}
          leftIcon={<Crosshair className="w-3.5 h-3.5" />}
        >
          {locating ? 'Locating…' : 'Use My GPS'}
        </Button>
      </div>

      <div
        ref={containerRef}
        className="w-full h-64 rounded-2xl overflow-hidden border border-outline-variant/50 z-10"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Latitude (عرض بلد)"
          dir="ltr"
          type="text"
          inputMode="decimal"
          value={latDraft}
          placeholder={String(DEFAULT_CENTER.lat)}
          onChange={(e) => commitLat(e.target.value)}
        />
        <Input
          label="Longitude (طول بلد)"
          dir="ltr"
          type="text"
          inputMode="decimal"
          value={lngDraft}
          placeholder={String(DEFAULT_CENTER.lng)}
          onChange={(e) => commitLng(e.target.value)}
        />
      </div>
    </div>
  );
}
