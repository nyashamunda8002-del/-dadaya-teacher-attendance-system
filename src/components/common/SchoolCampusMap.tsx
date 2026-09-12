import React, { useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Maximize2,
  Minimize2,
  Navigation as NavigationIcon,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Sparkles,
  Info,
  Compass,
} from 'lucide-react';
import { SchoolSettings } from '../../types';

// Mandatory solution attribution tracking ID as per Google Maps Platform guidelines
const ATTRIBUTION_ID = 'gmp_git_agentskills_v1';

// Default public Google Maps Demo API key fallback for immediate prototyping
const DEFAULT_MAPS_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyDemoKeyForGoogleMapsPlatformPrototypes';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface SchoolCampusMapProps {
  schoolSettings: SchoolSettings;
  userCoords?: Coordinates | null;
  interactive?: boolean;
  height?: string;
  showFenceInfo?: boolean;
  onSelectCoordinates?: (coords: Coordinates) => void;
  title?: string;
  isSimulated?: boolean;
}

// Inner helper component to draw geofence circle and listen to map state
const GeofenceCircleOverlay: React.FC<{
  center: { lat: number; lng: number };
  radiusMeters: number;
  isWithinFence: boolean;
}> = ({ center, radiusMeters, isWithinFence }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;

    // Create or update the circular geofence boundary overlay
    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        strokeColor: isWithinFence ? '#047857' : '#e11d48',
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: isWithinFence ? '#10b981' : '#f43f5e',
        fillOpacity: 0.18,
        map,
        center,
        radius: radiusMeters,
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radiusMeters);
      circleRef.current.setOptions({
        strokeColor: isWithinFence ? '#047857' : '#e11d48',
        fillColor: isWithinFence ? '#10b981' : '#f43f5e',
      });
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, mapsLib, center.lat, center.lng, radiusMeters, isWithinFence]);

  return null;
};

// Map click handler for selecting coordinates in admin mode
const MapClickHandler: React.FC<{
  onSelectCoordinates?: (coords: Coordinates) => void;
}> = ({ onSelectCoordinates }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !onSelectCoordinates) return;

    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onSelectCoordinates({
          latitude: Number(e.latLng.lat().toFixed(6)),
          longitude: Number(e.latLng.lng().toFixed(6)),
        });
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onSelectCoordinates]);

  return null;
};

// Camera auto-fitter to frame both the school and the user location
const FitBoundsHandler: React.FC<{
  schoolCenter: { lat: number; lng: number };
  userCenter?: { lat: number; lng: number } | null;
  radiusMeters: number;
}> = ({ schoolCenter, userCenter, radiusMeters }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (userCenter) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(schoolCenter.lat, schoolCenter.lng));
      bounds.extend(new google.maps.LatLng(userCenter.lat, userCenter.lng));
      map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    } else {
      map.panTo(schoolCenter);
      map.setZoom(17);
    }
  }, [map, schoolCenter.lat, schoolCenter.lng, userCenter?.lat, userCenter?.lng]);

  return null;
};

// Haversine distance calculator
function computeDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const SchoolCampusMap: React.FC<SchoolCampusMapProps> = ({
  schoolSettings,
  userCoords,
  interactive = true,
  height = '320px',
  showFenceInfo = true,
  onSelectCoordinates,
  title = 'Dadaya High School Campus Map',
  isSimulated = false,
}) => {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSchoolInfo, setShowSchoolInfo] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const schoolCenter = {
    lat: schoolSettings.schoolLatitude,
    lng: schoolSettings.schoolLongitude,
  };

  const userCenter = userCoords
    ? {
        lat: userCoords.latitude,
        lng: userCoords.longitude,
      }
    : null;

  const distanceMeters = userCoords
    ? computeDistanceMeters(
        userCoords.latitude,
        userCoords.longitude,
        schoolSettings.schoolLatitude,
        schoolSettings.schoolLongitude
      )
    : 0;

  const isWithinFence = userCoords
    ? distanceMeters <= schoolSettings.allowedRadiusMeters
    : true;

  const effectiveHeight = isExpanded ? '520px' : height;

  return (
    <div
      id="dadaya-google-maps-container"
      className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs relative flex flex-col transition-all duration-200"
    >
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1.5">
              <span>{title}</span>
              {isSimulated && (
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-200 text-[9px] font-extrabold rounded-md uppercase">
                  Simulated
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-500">
              GPS Center: {schoolSettings.schoolLatitude.toFixed(5)}°, {schoolSettings.schoolLongitude.toFixed(5)}° • Radius: {schoolSettings.allowedRadiusMeters}m
            </p>
          </div>
        </div>

        {/* Map Mode & Expand Controls */}
        <div className="flex items-center gap-1.5">
          {/* Layer switcher */}
          <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setMapType('roadmap')}
              className={`px-2 py-1 rounded-md transition ${
                mapType === 'roadmap' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Default
            </button>
            <button
              type="button"
              onClick={() => setMapType('hybrid')}
              className={`px-2 py-1 rounded-md transition ${
                mapType === 'hybrid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Expand / Collapse toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
            title={isExpanded ? 'Collapse Map' : 'Expand Map'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Google Maps Container */}
      <div className="relative w-full overflow-hidden" style={{ height: effectiveHeight }}>
        <APIProvider apiKey={DEFAULT_MAPS_KEY} onError={(err: unknown) => setLoadError(err instanceof Error ? err.message : 'Google Maps API loaded in fallback mode')}>
          <Map
            defaultCenter={schoolCenter}
            defaultZoom={17}
            mapId="dadaya_school_map"
            mapTypeId={mapType}
            gestureHandling={interactive ? 'auto' : 'none'}
            disableDefaultUI={!interactive}
            zoomControl={interactive}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            className="w-full h-full"
            reuseMaps={true}
          >
            {/* Geofence Circle Overlay */}
            <GeofenceCircleOverlay
              center={schoolCenter}
              radiusMeters={schoolSettings.allowedRadiusMeters}
              isWithinFence={isWithinFence}
            />

            {/* Click listener for interactive coordinate selection */}
            {onSelectCoordinates && <MapClickHandler onSelectCoordinates={onSelectCoordinates} />}

            {/* Auto fit bounds when user location exists */}
            <FitBoundsHandler
              schoolCenter={schoolCenter}
              userCenter={userCenter}
              radiusMeters={schoolSettings.allowedRadiusMeters}
            />

            {/* Advanced Marker: Dadaya High School Administration Center */}
            <AdvancedMarker
              position={schoolCenter}
              title="Dadaya High School Campus Gate & Admin Center"
              onClick={() => setShowSchoolInfo(!showSchoolInfo)}
            >
              <Pin
                background="#047857"
                borderColor="#064e3b"
                glyphColor="#ffffff"
                scale={1.2}
              />
            </AdvancedMarker>

            {/* School Info Window */}
            {showSchoolInfo && (
              <InfoWindow
                position={schoolCenter}
                onCloseClick={() => setShowSchoolInfo(false)}
              >
                <div className="p-2 text-xs max-w-xs text-slate-800">
                  <h4 className="font-bold text-emerald-900 text-sm mb-0.5">
                    {schoolSettings.schoolName}
                  </h4>
                  <p className="text-[11px] text-slate-600 mb-1">
                    Administration Building & Faculty Attendance Station
                  </p>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1.5 text-[10px] space-y-0.5">
                    <div>
                      <strong>Allowed Radius:</strong> {schoolSettings.allowedRadiusMeters} meters
                    </div>
                    <div>
                      <strong>Center:</strong> {schoolSettings.schoolLatitude.toFixed(6)}, {schoolSettings.schoolLongitude.toFixed(6)}
                    </div>
                    <div className="text-emerald-700 font-semibold">
                      Zvishavane, Midlands Province, Zimbabwe
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}

            {/* Advanced Marker: User / Teacher Current Position */}
            {userCenter && (
              <AdvancedMarker
                position={userCenter}
                title={isWithinFence ? 'Your Location (Within Campus)' : 'Your Location (Outside Boundary)'}
                onClick={() => setShowUserInfo(!showUserInfo)}
              >
                <Pin
                  background={isWithinFence ? '#10b981' : '#e11d48'}
                  borderColor={isWithinFence ? '#047857' : '#be123c'}
                  glyphColor="#ffffff"
                  scale={1.1}
                />
              </AdvancedMarker>
            )}

            {/* User Location Info Window */}
            {showUserInfo && userCenter && (
              <InfoWindow
                position={userCenter}
                onCloseClick={() => setShowUserInfo(false)}
              >
                <div className="p-2 text-xs max-w-xs text-slate-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isWithinFence ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <h4 className="font-bold text-slate-900 text-xs">
                      {isWithinFence ? 'Current Position (On-Campus)' : 'Current Position (Off-Campus)'}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-1">
                    Distance to school center:{' '}
                    <strong className="text-slate-900">
                      {distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(2)}km` : `${distanceMeters}m`}
                    </strong>
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {userCenter.lat.toFixed(6)}, {userCenter.lng.toFixed(6)}
                  </p>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Live Distance Pill Floating on Map */}
        {userCoords && (
          <div className="absolute top-3 left-3 z-10">
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md backdrop-blur-md flex items-center gap-2 border ${
                isWithinFence
                  ? 'bg-emerald-950/85 text-emerald-100 border-emerald-600/40'
                  : 'bg-rose-950/85 text-rose-100 border-rose-600/40'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isWithinFence ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span>
                {isWithinFence
                  ? `Within Geofence (${distanceMeters}m)`
                  : `Outside Fence (${distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)}km` : `${distanceMeters}m`})`}
              </span>
            </div>
          </div>
        )}

        {/* On-click coordinate selection banner for admin */}
        {onSelectCoordinates && (
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-between gap-2 shadow-lg">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Click anywhere on the map to set school GPS center coordinates</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Summary Bar */}
      {showFenceInfo && (
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isWithinFence ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="text-[11px] text-slate-700">
              Boundary:{' '}
              <strong className="text-slate-900">
                {schoolSettings.allowedRadiusMeters}m
              </strong>{' '}
              radius around Dadaya High School Administration
            </span>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            {userCoords
              ? `Teacher GPS: ${userCoords.latitude.toFixed(5)}°, ${userCoords.longitude.toFixed(5)}°`
              : 'Waiting for GPS signal...'}
          </div>
        </div>
      )}
    </div>
  );
};
