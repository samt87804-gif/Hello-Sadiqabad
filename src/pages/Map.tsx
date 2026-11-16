import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link, useSearchParams } from 'react-router-dom';
import { Crosshair, List, Map as MapIcon, MapPin, Phone, Maximize2, Minimize2 } from 'lucide-react';
import { fetchAllAreas, fetchAllCategories, searchBusinesses } from '../lib/api';
import { bilingualText } from '../lib/format';
import { useI18n } from '../lib/i18n';
import { updatePageSeo } from '../lib/seo';
import { buildTelUrl, formatPkPhoneDisplay } from '../lib/phone';
import type { AreaRow, CategoryRow } from '../types/database';
import type { BusinessPublicView } from '../types/directory';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Feedback';
import { Card, Container, SectionHeading } from '../components/ui/Surface';
import { useToast } from '../components/ui/Toast';

const SADIQABAD_CENTER: [number, number] = [28.3062, 70.1308];

export function Map() {
  const { lang } = useI18n();
  const { showToast } = useToast();
  const [params] = useSearchParams();
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const businessesRef = useRef<BusinessPublicView[]>([]);
  const userCoordsRef = useRef<[number, number] | null>(null);
  const filterReqIdRef = useRef<number>(0);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedArea, setSelectedArea] = useState(() => params.get('area') ?? '');
  const [openOnly, setOpenOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [mapResultsTotal, setMapResultsTotal] = useState(0);
  const [businesses, setBusinesses] = useState<BusinessPublicView[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<BusinessPublicView | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [metaError, setMetaError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    businessesRef.current = businesses;
  }, [businesses]);

  useEffect(() => {
    userCoordsRef.current = userCoords;
  }, [userCoords]);

  useEffect(() => {
    let active = true;
    updatePageSeo({
      title: 'Sadiqabad Interactive City Map — Hello Sadiqabad',
      description: 'Explore hospitals, super marts, pharmacies, and neighborhoods across Sadiqabad.',
      canonicalPath: '/map',
    });
    setMetaError(false);
    Promise.all([fetchAllCategories(), fetchAllAreas()]).then(([cats, ar]) => {
      if (!active) return;
      setCategories(cats);
      setAreas(ar);
    }).catch(() => {
      if (active) setMetaError(true);
    });
    return () => { active = false; };
  }, [retryKey]);

  useEffect(() => {
    const areaParam = params.get('area') ?? '';
    setSelectedArea(areaParam);
  }, [params]);

  useEffect(() => {
    const reqId = ++filterReqIdRef.current;
    const controller = new AbortController();
    setLoadError(false);
    searchBusinesses(
      { category: selectedCat, area: selectedArea, open: openOnly },
      { limit: 1000, signal: controller.signal }
    ).then((res) => {
      if (controller.signal.aborted || reqId !== filterReqIdRef.current) return;
      setMapResultsTotal(res.total);
      const withCoords = res.items.filter(
        (b) => typeof b.lat === 'number' && typeof b.lng === 'number'
      );
      setBusinesses(withCoords);
      setSelectedBiz((prev) => {
        if (prev && withCoords.some((b) => b.id === prev.id)) {
          return withCoords.find((b) => b.id === prev.id) || prev;
        }
        return withCoords[0] ?? null;
      });
      if (!userCoordsRef.current && withCoords[0]?.lat && withCoords[0]?.lng && mapInstanceRef.current) {
        mapInstanceRef.current.panTo([withCoords[0].lat, withCoords[0].lng]);
      }
    }).catch((error: unknown) => {
      if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError') ||
        reqId !== filterReqIdRef.current) return;
      setBusinesses([]);
      setMapResultsTotal(0);
      setSelectedBiz(null);
      setLoadError(true);
    });
    return () => controller.abort();
  }, [selectedCat, selectedArea, openOnly, retryKey]);

  const renderMarkers = (list: BusinessPublicView[]) => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    list.forEach((biz) => {
      if (typeof biz.lat !== 'number' || typeof biz.lng !== 'number') return;
      const marker = L.circleMarker([biz.lat, biz.lng], {
        radius: 9,
        color: '#ffffff',
        weight: 2.5,
        fillColor: biz.is_verified ? '#006948' : '#904d00',
        fillOpacity: 0.95,
      });
      marker.on('click', () => {
        setSelectedBiz(biz);
        mapInstanceRef.current?.panTo([biz.lat!, biz.lng!]);
      });
      marker.bindTooltip(bilingualText(lang, biz.name_en, biz.name_ur), { direction: 'top' });
      marker.addTo(layer);
    });
  };

  const renderUserMarker = (coords: [number, number]) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    const marker = L.circleMarker(coords, {
      radius: 9,
      color: '#ffffff',
      weight: 2.5,
      fillColor: '#2563eb',
      fillOpacity: 0.95,
    }).bindTooltip(lang === 'ur' ? 'آپ کا موجودہ مقام' : 'Your Location', { direction: 'top' });
    marker.addTo(map);
    userMarkerRef.current = marker;
  };

  useEffect(() => {
    if (viewMode !== 'map' || !mapDivRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      userMarkerRef.current = null;
    }

    const currentBusinesses = businessesRef.current;
    const initialCenter: [number, number] =
      userCoordsRef.current ??
      (currentBusinesses[0]?.lat && currentBusinesses[0]?.lng
        ? [currentBusinesses[0].lat!, currentBusinesses[0].lng!]
        : SADIQABAD_CENTER);
    const initialZoom = userCoordsRef.current ? 15 : 14;

    const map = L.map(mapDivRef.current, {
      center: initialCenter,
      zoom: initialZoom,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = layer;

    // Immediately render all currently filtered business markers
    renderMarkers(currentBusinesses);
    if (!userCoordsRef.current && currentBusinesses.length > 1) {
      const points = currentBusinesses
        .filter((biz) => typeof biz.lat === 'number' && typeof biz.lng === 'number')
        .map((biz) => [biz.lat as number, biz.lng as number] as [number, number]);
      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 15, animate: false });
      }
    }

    // Apply preserved user coordinates if established
    if (userCoordsRef.current) {
      renderUserMarker(userCoordsRef.current);
      map.setView(userCoordsRef.current, 15);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      userMarkerRef.current = null;
    };
  }, [viewMode]);

  useEffect(() => {
    renderMarkers(businesses);
    const map = mapInstanceRef.current;
    if (!map || userCoordsRef.current || businesses.length === 0) return;
    const points = businesses
      .filter((biz) => typeof biz.lat === 'number' && typeof biz.lng === 'number')
      .map((biz) => [biz.lat as number, biz.lng as number] as [number, number]);
    if (points.length === 1) map.setView(points[0], 15);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 15, animate: false });
  }, [businesses, lang]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || viewMode !== 'map') return;
    const frame = window.requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    const onResize = () => map.invalidateSize({ pan: false });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [isMapExpanded, viewMode]);

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      showToast(
        lang === 'ur'
          ? 'اس ڈیوائس پر لوکیشن دستیاب نہیں ہے۔'
          : 'Geolocation is not supported on this device.',
        'error'
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(coords);
        userCoordsRef.current = coords;

        if (viewMode === 'map' && mapInstanceRef.current) {
          mapInstanceRef.current.setView(coords, 15);
          renderUserMarker(coords);
          showToast(
            lang === 'ur'
              ? 'نقشہ آپ کے مقام کے قریب کر دیا گیا ہے۔'
              : 'Centered map near your location.',
            'success'
          );
        } else {
          // List View: Preserve coordinates without false map centered notification
          showToast(
            lang === 'ur'
              ? 'آپ کا مقام محفوظ ہو گیا۔ نقشہ کھولنے پر لاگو کیا جائے گا۔'
              : 'Location saved. It will be applied when you switch to Map View.',
            'success'
          );
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          showToast(
            lang === 'ur'
              ? 'لوکیشن کی اجازت نہیں ملی۔ صادق آباد کا مرکز دکھایا جا رہا ہے۔'
              : 'Location permission declined. Using Sadiqabad city center.',
            'info'
          );
        } else if (err.code === err.TIMEOUT) {
          showToast(
            lang === 'ur'
              ? 'لوکیشن کی درخواست کا وقت ختم ہو گیا۔ دوبارہ کوشش کریں۔'
              : 'Location request timed out. Please try again.',
            'error'
          );
        } else {
          showToast(
            lang === 'ur'
              ? 'مقام کی معلومات حاصل نہیں ہو سکیں۔'
              : 'Location information is unavailable.',
            'error'
          );
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <AppShell>
      <Container className="py-4 sm:py-6 space-y-4 sm:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading
            title={lang === 'ur' ? 'صادق آباد انٹرایکٹو نقشہ' : 'Sadiqabad City Map Explorer'}
            titleUr={lang === 'en' ? 'صادق آباد کا انٹرایکٹو نقشہ' : undefined}
            subtitle={
              lang === 'ur'
                ? 'فون نمبر اور پروفائل دیکھنے کے لیے کسی بھی پن پر کلک کریں'
                : 'Tap any business pin to view contact number and profile'
            }
          />
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              aria-label={lang === 'ur' ? 'شعبے کے مطابق فلٹر کریں' : 'Filter map pins by category'}
              className="h-11 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs font-semibold"
            >
              <option value="">
                {lang === 'ur'
                  ? `تمام شعبے (${businesses.length})`
                  : `All Sectors (${businesses.length})`}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {bilingualText(lang, c.name_en, c.name_ur)}
                </option>
              ))}
            </select>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              aria-label={lang === 'ur' ? 'علاقے کے مطابق فلٹر کریں' : 'Filter map pins by neighborhood'}
              className="h-11 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs font-semibold"
            >
              <option value="">{lang === 'ur' ? 'تمام علاقے' : 'All Areas'}</option>
              {areas.map((a) => (
                <option key={a.id} value={a.slug}>
                  {bilingualText(lang, a.name_en, a.name_ur)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setOpenOnly((o) => !o)}
              className={`h-11 px-3.5 rounded-xl text-xs font-bold border cursor-pointer ${
                openOnly
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-lowest text-on-surface border-outline-variant/60'
              }`}
            >
              {lang === 'ur' ? 'ابھی کھلا ہے' : 'Open Now'}
            </button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNearMe}
              leftIcon={<Crosshair className="w-4 h-4" />}
            >
              {lang === 'ur' ? 'میرے قریب' : 'Near Me'}
            </Button>
            <button
              type="button"
              onClick={() => setViewMode((m) => (m === 'map' ? 'list' : 'map'))}
              className="h-11 px-3.5 rounded-xl bg-surface-container text-on-surface text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {viewMode === 'map' ? (
                <>
                  <List className="w-4 h-4" /> {lang === 'ur' ? 'فہرست دیکھیں' : 'List View'}
                </>
              ) : (
                <>
                  <MapIcon className="w-4 h-4" /> {lang === 'ur' ? 'نقشہ دیکھیں' : 'Map View'}
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-on-surface-variant" aria-live="polite">{lang === 'ur' ? 'نقشے پر ' + businesses.length + ' مقامات دکھائے جا رہے ہیں' : 'Showing ' + businesses.length + ' mapped locations' + (mapResultsTotal > businesses.length ? ' of ' + mapResultsTotal + ' listings' : '')}</p>

        {(metaError || loadError) && (
          <div role="alert" className="p-3 rounded-xl border border-error/30 bg-error/5 text-sm text-on-surface flex flex-wrap items-center justify-between gap-3">
            <span>
              {metaError
                ? (lang === 'ur' ? 'فلٹرز لوڈ نہیں ہو سکے۔' : 'Map filters could not be loaded.')
                : (lang === 'ur' ? 'کاروبار لوڈ نہیں ہو سکے۔' : 'Map listings could not be loaded.')}
            </span>
            <Button size="sm" variant="outline" onClick={() => setRetryKey((value) => value + 1)}>
              {lang === 'ur' ? 'دوبارہ کوشش' : 'Retry'}
            </Button>
          </div>
        )}

        {viewMode === 'list' ? (
          businesses.length === 0 ? (
            <EmptyState
              title={lang === 'ur' ? 'نقشے پر کوئی متعلقہ کاروبار نہیں ملا' : 'No mapped businesses match these filters'}
              titleUr={lang === 'en' ? 'نقشے پر کوئی متعلقہ کاروبار نہیں ملا' : undefined}
              description={
                lang === 'ur'
                  ? 'شعبہ، علاقہ یا "ابھی کھلا ہے" فلٹر تبدیل کر کے دوبارہ دیکھیں۔'
                  : 'Try changing the sector, area, or Open Now filter.'
              }
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCat('');
                    setSelectedArea('');
                    setOpenOnly(false);
                  }}
                >
                  {lang === 'ur' ? 'فلٹرز صاف کریں' : 'Reset Map Filters'}
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {businesses.map((biz) => (
                <Card key={biz.id} className="p-4 flex flex-col justify-between gap-2.5">
                  <div>
                    <h2 className="text-sm font-bold text-on-surface">
                      {bilingualText(lang, biz.name_en, biz.name_ur)}
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {biz.area ? bilingualText(lang, biz.area.name_en, biz.area.name_ur) : ''} ·{' '}
                      {lang === 'ur' ? biz.address_ur || biz.address_en : biz.address_en}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={buildTelUrl(biz.phone_primary)}
                      className="flex-1 min-h-[40px] rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span dir="ltr" className="tabular-nums">
                        {formatPkPhoneDisplay(biz.phone_primary)}
                      </span>
                    </a>
                    <Link
                      to={`/business/${biz.slug}`}
                      className="min-h-[40px] px-3 rounded-lg bg-surface-container text-xs font-bold flex items-center"
                    >
                      {lang === 'ur' ? 'پروفائل' : 'Profile'}
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className={isMapExpanded ? 'fixed inset-0 z-[100] bg-surface p-2 sm:p-3' : 'lg:col-span-8 min-w-0'}>
              <div className={isMapExpanded ? 'relative w-full h-full' : 'relative w-full'}>
                <div
                  ref={mapDivRef}
                  className={isMapExpanded
                    ? 'w-full h-[calc(100dvh-1rem)] sm:h-[calc(100dvh-1.5rem)] rounded-xl overflow-hidden border border-outline-variant/50 shadow-sm'
                    : 'w-full h-[62dvh] min-h-[420px] max-h-[680px] sm:h-[520px] lg:h-[620px] rounded-2xl overflow-hidden border border-outline-variant/50 shadow-sm z-10'}
                  style={{ touchAction: 'pan-x pan-y', overscrollBehavior: 'contain' }}
                />
                <div className="absolute top-3 left-3 right-3 z-[500] flex items-start justify-between gap-2 pointer-events-none">
                  <div className="rounded-xl bg-surface/95 backdrop-blur shadow-lg border border-outline-variant/60 px-3 py-2 text-xs font-bold text-on-surface pointer-events-auto">
                    <span>{businesses.length} {lang === 'ur' ? 'مقامات' : 'places'}</span>
                    <span className="mx-2 text-on-surface-variant">·</span>
                    <span className="text-primary">{lang === 'ur' ? 'سبز: تصدیق شدہ' : 'Green: verified'}</span>
                  </div>
                  <button type="button" onClick={() => setIsMapExpanded((value) => !value)}
                    aria-label={isMapExpanded ? (lang === 'ur' ? 'فل اسکرین بند کریں' : 'Exit full screen map') : (lang === 'ur' ? 'فل اسکرین نقشہ کھولیں' : 'Open full screen map')}
                    className="pointer-events-auto min-h-11 min-w-11 rounded-xl bg-surface/95 backdrop-blur shadow-lg border border-outline-variant/60 text-on-surface flex items-center justify-center">
                    {isMapExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                </div>
                {isMapExpanded && selectedBiz && (
                  <div className="absolute bottom-3 left-3 right-3 z-[500] max-w-xl mx-auto">
                    <div className="rounded-2xl border border-outline-variant/60 bg-surface/95 backdrop-blur shadow-xl p-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{lang === 'ur' ? 'منتخب کردہ مقام' : 'Selected place'}</p>
                          <p className="text-sm font-bold text-on-surface truncate">{bilingualText(lang, selectedBiz.name_en, selectedBiz.name_ur)}</p>
                          <p className="text-xs text-on-surface-variant line-clamp-2">{lang === 'ur' ? selectedBiz.address_ur || selectedBiz.address_en : selectedBiz.address_en}</p>
                        </div>
                        <button type="button" onClick={() => setIsMapExpanded(false)} className="shrink-0 min-h-10 px-3 rounded-lg bg-surface-container text-xs font-bold text-on-surface">{lang === 'ur' ? 'بند' : 'Close'}</button>
                      </div>
                      <div className="flex gap-2">
                        <a href={buildTelUrl(selectedBiz.phone_primary)} className="flex-1 min-h-10 rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> <span dir="ltr">{formatPkPhoneDisplay(selectedBiz.phone_primary)}</span>
                        </a>
                        <Link to={'/business/' + selectedBiz.slug} className="min-h-10 px-4 rounded-lg bg-surface-container text-xs font-bold flex items-center">{lang === 'ur' ? 'پروفائل' : 'Profile'}</Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={isMapExpanded ? 'hidden' : 'lg:col-span-4 space-y-4'}>
              {selectedBiz && (
                <Card className="p-4 border-primary/40 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {lang === 'ur' ? 'منتخب کردہ مقام' : 'Selected Pin'}
                  </span>
                  <h2 className="text-base font-bold text-on-surface">
                    {bilingualText(lang, selectedBiz.name_en, selectedBiz.name_ur)}
                  </h2>
                  {lang === 'en' && selectedBiz.name_ur && (
                    <p className="font-urdu text-xs text-primary" dir="rtl">
                      {selectedBiz.name_ur}
                    </p>
                  )}
                  <p className="text-xs text-on-surface-variant">
                    {lang === 'ur'
                      ? selectedBiz.address_ur || selectedBiz.address_en
                      : selectedBiz.address_en}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={buildTelUrl(selectedBiz.phone_primary)}
                      className="flex-1 min-h-[44px] px-3 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span dir="ltr" className="tabular-nums">
                        {formatPkPhoneDisplay(selectedBiz.phone_primary)}
                      </span>
                    </a>
                    <Link
                      to={`/business/${selectedBiz.slug}`}
                      className="min-h-[44px] px-3.5 rounded-xl bg-surface-container text-on-surface text-xs font-bold flex items-center justify-center"
                    >
                      {lang === 'ur' ? 'پروفائل' : 'Profile'}
                    </Link>
                  </div>
                </Card>
              )}

              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-secondary" />
                  {lang === 'ur' ? 'صادق آباد کے علاقے دیکھیں' : 'Browse Sadiqabad Neighborhoods'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {areas.map((a) => (
                    <Link
                      key={a.id}
                      to={`/area/${a.slug}`}
                      className="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors"
                    >
                      {bilingualText(lang, a.name_en, a.name_ur)}
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </Container>
    </AppShell>
  );
}
