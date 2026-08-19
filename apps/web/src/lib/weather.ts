interface WeatherResult {
  tempC: number;
  condition: string;
  icon: string;
}

// WMO weather-interpretation codes (used by Open-Meteo) mapped to a short
// label + emoji. Not an exhaustive enumeration of every WMO code — grouped
// into the ranges that matter for a one-line "weather at a glance" display
// (see the brand doc's "☀️ 28°C · Clear skies" mockup). A full code-by-code
// mapping would be overkill for a single summary line.
const WMO_CODE_MAP: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear skies", icon: "☀️" },
  1: { label: "Mostly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Foggy", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "🌨️" },
  75: { label: "Heavy snow", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Rain showers", icon: "🌦️" },
  82: { label: "Heavy showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm", icon: "⛈️" },
  99: { label: "Severe thunderstorm", icon: "⛈️" },
};

function describeWeatherCode(code: number): { label: string; icon: string } {
  return WMO_CODE_MAP[code] ?? { label: "Weather unavailable", icon: "🌡️" };
}

// Returns null on any failure (network error, unexpected response shape,
// non-OK status) rather than throwing. Weather is decorative context for
// a Moment, never a required field — a failed fetch should never block
// saving a journal entry. Callers treat null as "no weather this time."
export async function fetchCurrentWeather(
  latitude: number,
  longitude: number
): Promise<WeatherResult | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("current", "temperature_2m,weather_code");
    url.searchParams.set("temperature_unit", "celsius");

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("[weather] Open-Meteo returned", res.status);
      return null;
    }

    const data = await res.json();
    const tempC = data?.current?.temperature_2m;
    const code = data?.current?.weather_code;

    if (typeof tempC !== "number" || typeof code !== "number") {
      console.error("[weather] Unexpected Open-Meteo response shape", data);
      return null;
    }

    const { label, icon } = describeWeatherCode(code);
    return { tempC, condition: label, icon };
  } catch (err) {
    console.error("[weather] Failed to fetch weather:", err);
    return null;
  }
}
