// server/services/prayerService.js
import axios from "axios";

const DEFAULT_LOCATION = {
  label: "Masjid Kagawa",
  latitude: 34.315293,
  longitude: 133.876372,
  timezone: "Asia/Tokyo",
  method: 3, // Muslim World League
};

function normalizeTime(value) {
  if (!value || typeof value !== "string") return "-";

  // contoh format API: "05:11 (+09)"
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
  };
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
        timeout: 10000,
      }
    );

    const apiData = response?.data?.data ?? {};
    const timings = apiData?.timings ?? {};

    return {
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
  } catch (error) {
    console.error("❌ Error fetching prayer times:", error.message);

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
        subuh: "-",
        syuruq: "-",
        zuhur: "-",
        asar: "-",
        maghrib: "-",
        isya: "-",
      },
      raw: null,
    };
  }
}