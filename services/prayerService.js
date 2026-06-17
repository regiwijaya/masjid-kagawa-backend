import axios from "axios";

const DEFAULT_LOCATION = {
  label: "Masjid Kagawa",
  latitude: 34.315293,
  longitude: 133.876372,
  timezone: "Asia/Tokyo",
  method: 3,
};

function normalizeTime(value) {
  if (!value || typeof value !== "string") return "-";
  const match = value.match(/\d{1,2}:\d{2}/);
  return match ? match[0].padStart(5, "0") : "-";
}

function todayJapan() {
  const now = new Date();
  const japan = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

  const y = japan.getFullYear();
  const m = String(japan.getMonth() + 1).padStart(2, "0");
  const d = String(japan.getDate()).padStart(2, "0");

  return {
    iso: `${y}-${m}-${d}`,
    aladhan: `${d}-${m}-${y}`,
  };
}

function fallbackPrayerTimes() {
  const { iso } = todayJapan();

  return {
    date: iso,
    location: DEFAULT_LOCATION.label,
    timezone: DEFAULT_LOCATION.timezone,
    coordinates: {
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
    },
    source: "fallback",
    adzan: {
      subuh: "03:10",
      syuruq: "04:55",
      zuhur: "12:05",
      asar: "15:58",
      maghrib: "19:15",
      isya: "20:50",
    },
    raw: null,
  };
}

export async function fetchPrayerTimesFromAladhan() {
  const { iso, aladhan } = todayJapan();

  try {
    const response = await axios.get(
      `https://api.aladhan.com/v1/timings/${aladhan}`,
      {
        params: {
          latitude: DEFAULT_LOCATION.latitude,
          longitude: DEFAULT_LOCATION.longitude,
          method: DEFAULT_LOCATION.method,
        },
        timeout: 7000,
      }
    );

    const timings = response?.data?.data?.timings || {};

    const adzan = {
      subuh: normalizeTime(timings.Fajr),
      syuruq: normalizeTime(timings.Sunrise),
      zuhur: normalizeTime(timings.Dhuhr),
      asar: normalizeTime(timings.Asr),
      maghrib: normalizeTime(timings.Maghrib),
      isya: normalizeTime(timings.Isha),
    };

    const hasEmpty = Object.values(adzan).some((v) => !v || v === "-");

    if (hasEmpty) {
      return fallbackPrayerTimes();
    }

    return {
      date: iso,
      location: DEFAULT_LOCATION.label,
      timezone: DEFAULT_LOCATION.timezone,
      coordinates: {
        latitude: DEFAULT_LOCATION.latitude,
        longitude: DEFAULT_LOCATION.longitude,
      },
      source: "aladhan",
      adzan,
      raw: response?.data?.data || null,
    };
  } catch (error) {
    console.error("❌ Aladhan gagal, pakai fallback:", error.message);
    return fallbackPrayerTimes();
  }
}