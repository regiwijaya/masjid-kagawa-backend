import axios from "axios";

const DEFAULT_LOCATION = {
  label: "Masjid Kagawa",
  latitude: 34.315293,
  longitude: 133.876372,
  timezone: "Asia/Tokyo",
  utcOffset: 9,
  method: 3,
  fajrAngle: 18,
  ishaAngle: 17,
};

function normalizeTime(value) {
  if (!value || typeof value !== "string") return "-";
  const match = value.match(/\d{1,2}:\d{2}/);
  return match ? match[0] : "-";
}

function formatDateInTimezone(date = new Date(), timeZone = DEFAULT_LOCATION.timezone) {
  const zoned = new Date(date.toLocaleString("en-US", { timeZone }));

  const year = zoned.getFullYear();
  const month = String(zoned.getMonth() + 1).padStart(2, "0");
  const day = String(zoned.getDate()).padStart(2, "0");

  return {
    iso: `${year}-${month}-${day}`,
    aladhan: `${day}-${month}-${year}`,
    year,
    month: zoned.getMonth() + 1,
    day: zoned.getDate(),
  };
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

function fixHour(hour) {
  return ((hour % 24) + 24) % 24;
}

function toTimeString(hourFloat) {
  if (!Number.isFinite(hourFloat)) return "-";

  const fixed = fixHour(hourFloat);
  const hours = Math.floor(fixed);
  const minutes = Math.floor((fixed - hours) * 60 + 0.5);

  const finalHours = minutes >= 60 ? hours + 1 : hours;
  const finalMinutes = minutes >= 60 ? minutes - 60 : minutes;

  return `${String(finalHours % 24).padStart(2, "0")}:${String(finalMinutes).padStart(2, "0")}`;
}

function julianDate(year, month, day) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);

  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    b -
    1524.5
  );
}

function sunPosition(jd) {
  const d = jd - 2451545.0;

  const g = degToRad(357.529 + 0.98560028 * d);
  const q = 280.459 + 0.98564736 * d;
  const l = degToRad(q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));

  const e = degToRad(23.439 - 0.00000036 * d);

  const ra = radToDeg(Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l))) / 15;
  const decl = radToDeg(Math.asin(Math.sin(e) * Math.sin(l)));

  const eqTime = q / 15 - fixHour(ra);

  return {
    declination: decl,
    equation: eqTime,
  };
}

function hourAngle(latitude, declination, altitude) {
  const latRad = degToRad(latitude);
  const decRad = degToRad(declination);
  const altRad = degToRad(altitude);

  const cosH =
    (Math.sin(altRad) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));

  if (cosH < -1 || cosH > 1) return NaN;

  return radToDeg(Math.acos(cosH)) / 15;
}

function calculatePrayerTimesLocally() {
  const { iso, year, month, day } = formatDateInTimezone();
  const jd = julianDate(year, month, day);
  const sun = sunPosition(jd);

  const latitude = DEFAULT_LOCATION.latitude;
  const longitude = DEFAULT_LOCATION.longitude;
  const timezone = DEFAULT_LOCATION.utcOffset;

  const dhuhr =
    12 +
    timezone -
    longitude / 15 -
    sun.equation;

  const sunriseDiff = hourAngle(latitude, sun.declination, -0.833);
  const fajrDiff = hourAngle(latitude, sun.declination, -DEFAULT_LOCATION.fajrAngle);
  const ishaDiff = hourAngle(latitude, sun.declination, -DEFAULT_LOCATION.ishaAngle);

  const latRad = degToRad(latitude);
  const decRad = degToRad(sun.declination);
  const asrAltitude = -radToDeg(
    Math.atan(1 / (1 + Math.tan(Math.abs(latRad - decRad))))
  );
  const asrDiff = hourAngle(latitude, sun.declination, asrAltitude);

  return {
    date: iso,
    location: DEFAULT_LOCATION.label,
    timezone: DEFAULT_LOCATION.timezone,
    coordinates: {
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
    },
    source: "local-calculation",
    adzan: {
      subuh: toTimeString(dhuhr - fajrDiff),
      syuruq: toTimeString(dhuhr - sunriseDiff),
      zuhur: toTimeString(dhuhr),
      asar: toTimeString(dhuhr + asrDiff),
      maghrib: toTimeString(dhuhr + sunriseDiff),
      isya: toTimeString(dhuhr + ishaDiff),
    },
    raw: null,
  };
}

function hasValidTimes(adzan = {}) {
  return ["subuh", "syuruq", "zuhur", "asar", "maghrib", "isya"].every(
    (key) => adzan[key] && adzan[key] !== "-"
  );
}

export async function fetchPrayerTimesFromAladhan() {
  const { iso, aladhan } = formatDateInTimezone();

  try {
    const response = await axios.get(
      `https://api.aladhan.com/v1/timings/${aladhan}`,
      {
        params: {
          latitude: DEFAULT_LOCATION.latitude,
          longitude: DEFAULT_LOCATION.longitude,
          method: DEFAULT_LOCATION.method,
        },
        timeout: 8000,
      }
    );

    const apiData = response?.data?.data ?? {};
    const timings = apiData?.timings ?? {};

    const result = {
      date: iso,
      location: DEFAULT_LOCATION.label,
      timezone: DEFAULT_LOCATION.timezone,
      coordinates: {
        latitude: DEFAULT_LOCATION.latitude,
        longitude: DEFAULT_LOCATION.longitude,
      },
      source: "aladhan",
      adzan: {
        subuh: normalizeTime(timings.Fajr),
        syuruq: normalizeTime(timings.Sunrise),
        zuhur: normalizeTime(timings.Dhuhr),
        asar: normalizeTime(timings.Asr),
        maghrib: normalizeTime(timings.Maghrib),
        isya: normalizeTime(timings.Isha),
      },
      raw: apiData || null,
    };

    if (hasValidTimes(result.adzan)) {
      return result;
    }

    return calculatePrayerTimesLocally();
  } catch (error) {
    console.error("❌ Error fetching prayer times. Using local calculation:", error.message);
    return calculatePrayerTimesLocally();
  }
}