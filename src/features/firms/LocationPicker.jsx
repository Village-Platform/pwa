import { useState } from "react";
import { mapUrl, parseCoordinates } from "../../lib/format";
import { S } from "../../lib/strings";
import Icon from "../../components/Icon.jsx";
import { FormField, GhostButton } from "../../components/ui.jsx";

// Web version of Android's LocationPicker: GPS, paste a Google Maps link / "lat, lng", or type the
// numbers. No embedded map in v1 (a map SDK is heavy for a village PWA); "preview" opens Google Maps.
export default function LocationPicker({ latitude, longitude, onChange, error }) {
  const [pasted, setPasted] = useState("");
  const [pasteError, setPasteError] = useState(null);
  const [gps, setGps] = useState({ busy: false, error: null });
  const has = latitude !== "" && longitude !== "" && !isNaN(Number(latitude)) && !isNaN(Number(longitude));

  const useGps = () => {
    if (!navigator.geolocation) return setGps({ busy: false, error: S.locationPermissionRequired });
    setGps({ busy: true, error: null });
    navigator.geolocation.getCurrentPosition(
      (p) => {
        onChange(p.coords.latitude.toFixed(6), p.coords.longitude.toFixed(6));
        setGps({ busy: false, error: null });
      },
      () => setGps({ busy: false, error: S.locationPermissionRequired }),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const applyPaste = (text) => {
    setPasted(text);
    if (!text.trim()) return setPasteError(null);
    const c = parseCoordinates(text);
    if (!c) return setPasteError(S.invalidLocationPasted);
    setPasteError(null);
    onChange(String(c.lat), String(c.lng));
  };

  return (
    <div className="rounded-2xl border border-line p-3 space-y-3">
      <div className="flex items-center gap-2 font-bold">
        <Icon name="place" className="text-goldInk" />
        {S.firmLocation}
      </div>
      <p className={`text-sm ${has ? "text-goldInk font-semibold" : "text-muted"}`}>
        {has ? `${S.locationSet} (${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)})` : S.locationNotSet}
      </p>
      <GhostButton
        type="button"
        className="w-full flex items-center justify-center gap-2"
        onClick={useGps}
        disabled={gps.busy}
      >
        <Icon name="gps" size={20} />
        {gps.busy ? S.fetchingLocation : S.useCurrentLocation}
      </GhostButton>
      {gps.error && <p className="text-sm text-bad">{gps.error}</p>}
      <FormField
        label={S.pasteLocationLink}
        placeholder={S.pasteLocationPlaceholder}
        dir="ltr"
        value={pasted}
        onChange={(e) => applyPaste(e.target.value)}
        error={pasteError}
      />
      <div className="grid grid-cols-2 gap-2">
        <FormField
          label={S.latitude}
          inputMode="decimal"
          dir="ltr"
          value={latitude}
          onChange={(e) => onChange(e.target.value, longitude)}
        />
        <FormField
          label={S.longitude}
          inputMode="decimal"
          dir="ltr"
          value={longitude}
          onChange={(e) => onChange(latitude, e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-bad">{error}</p>}
      {has && (
        <div className="flex gap-2">
          <a
            href={mapUrl(latitude, longitude)}
            target="_blank"
            rel="noreferrer"
            className="flex-1 h-11 rounded-xl border border-line grid place-items-center font-semibold text-sm"
          >
            {S.previewOnMap}
          </a>
          <button
            type="button"
            onClick={() => {
              onChange("", "");
              setPasted("");
            }}
            className="flex-1 h-11 rounded-xl text-bad font-semibold text-sm bg-bad/10"
          >
            {S.clearLocation}
          </button>
        </div>
      )}
    </div>
  );
}
