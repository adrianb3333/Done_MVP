const API_KEY = 'ac48bcd050d84bb9816175607260401';
const BASE_URL = 'https://api.weatherapi.com/v1/current.json';

export interface GolfWeatherData {
  location: string;
  temp: number;
  windMs: number;
  gustMs: number;
  windDeg: number;
  windDir: string;
  seaLevel: number;
  headTail: number;
  cross: number;
  lastUpdated: string;
}

export const fetchGolfWeather = async (
  lat: number,
  lon: number,
  targetHeading: number = 0
): Promise<GolfWeatherData | null> => {
  try {
    const query = `${lat},${lon}`;
    const response = await fetch(`${BASE_URL}?key=${API_KEY}&q=${query}&aqi=no`);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    // Basic Measures
    const windMs = parseFloat((data.current.wind_kph / 3.6).toFixed(1));
    const gustMs = parseFloat((data.current.gust_kph / 3.6).toFixed(1));
    const windDeg = data.current.wind_degree;
    
    // Sea Level Calculation (Estimate based on pressure in meters)
    // Standard pressure is 1013.25 mb. 1mb drop is roughly 9 meters.
    const seaLevelEstimate = Math.round((1013.25 - data.current.pressure_mb) * 9);

    // Wind Vectors (Head/Tail/Cross)
    // Formula: θ = Wind Direction - Target Heading
    const relativeAngleRad = ((windDeg - targetHeading) * Math.PI) / 180;
    
    // Head/Tail (Negative is Headwind, Positive is Tailwind)
    const headTail = parseFloat((windMs * Math.cos(relativeAngleRad)).toFixed(1));
    // Crosswind (Magnitude of lateral force)
    const cross = parseFloat((windMs * Math.sin(relativeAngleRad)).toFixed(1));

    return {
      location: data.location.name,
      temp: Math.round(data.current.temp_c),
      windMs,
      gustMs,
      windDeg,
      windDir: data.current.wind_dir, // e.g., "East"
      seaLevel: seaLevelEstimate,
      headTail: -headTail, // Inverting so negative shows as a "Head" force
      cross: Math.abs(cross),
      lastUpdated: data.current.last_updated.split(' ')[1], // Returns "11:05"
    };
  } catch (error) {
    console.error("weatherAPI error:", error);
    return null;
  }
};
