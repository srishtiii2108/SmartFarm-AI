import logging
from typing import Any, Dict, List
import httpx
from fastapi import status
from app.core.exceptions import AppException

logger = logging.getLogger("smartfarm.clients.open_meteo")

WMO_WEATHER_CODES: Dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def decode_wmo_code(code: int | None) -> str:
    if code is None:
        return "Unknown"
    return WMO_WEATHER_CODES.get(code, f"Weather code {code}")


class OpenMeteoClient:
    FORECAST_BASE_URL = "https://api.open-meteo.com/v1/forecast"
    GEOCODING_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search"

    @classmethod
    async def fetch_weather(cls, latitude: float, longitude: float) -> Dict[str, Any]:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
            "past_days": 3,
            "forecast_days": 7,
            "timezone": "auto",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(cls.FORECAST_BASE_URL, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException as exc:
            logger.error(f"Open-Meteo timeout for ({latitude}, {longitude}): {exc}")
            raise AppException(
                message="Weather service timed out. Please try again shortly.",
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                code="WEATHER_SERVICE_TIMEOUT",
            )
        except httpx.HTTPError as exc:
            logger.error(f"Open-Meteo HTTP error for ({latitude}, {longitude}): {exc}")
            raise AppException(
                message="Unable to retrieve weather telemetry from Open-Meteo.",
                status_code=status.HTTP_502_BAD_GATEWAY,
                code="WEATHER_SERVICE_UNAVAILABLE",
            )

    @classmethod
    async def search_locations(cls, query: str, count: int = 5) -> List[Dict[str, Any]]:
        params = {"name": query.strip(), "count": count, "language": "en", "format": "json"}
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(cls.GEOCODING_BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()
                results = data.get("results", [])
                return [
                    {
                        "name": item.get("name"),
                        "admin1": item.get("admin1"),
                        "country": item.get("country"),
                        "latitude": item.get("latitude"),
                        "longitude": item.get("longitude"),
                    }
                    for item in results
                ]
        except httpx.HTTPError as exc:
            logger.error(f"Open-Meteo geocoding failed for '{query}': {exc}")
            raise AppException(
                message="Location search service is temporarily unavailable.",
                status_code=status.HTTP_502_BAD_GATEWAY,
                code="GEOCODING_UNAVAILABLE",
            )