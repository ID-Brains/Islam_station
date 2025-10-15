"""
Prayer Service - Business logic for prayer times calculations
"""

import math
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from typing import Dict, Any, Optional, List
from datetime import datetime, date

from ..logging_config import get_logger

logger = get_logger(__name__)


class PrayerService:
    """Service class for prayer times calculation and management"""

    # Calculation method configurations
    CALCULATION_METHODS = {
        "MuslimWorldLeague": {
            "name": "Muslim World League",
            "fajr_angle": 18.0,
            "isha_angle": 17.0,
        },
        "Egyptian": {
            "name": "Egyptian General Authority of Survey",
            "fajr_angle": 19.5,
            "isha_angle": 17.5,
        },
        "UmmAlQura": {
            "name": "Umm al-Qura University, Makkah",
            "fajr_angle": 18.5,
            "isha_interval": 90,  # minutes after maghrib
        },
        "Karachi": {
            "name": "University of Islamic Sciences, Karachi",
            "fajr_angle": 18.0,
            "isha_angle": 18.0,
        },
        "Jafari": {
            "name": "Shia Ithna-Ashari, Leva Institute, Qum",
            "fajr_angle": 16.0,
            "isha_angle": 14.0,
            "maghrib_angle": 4.0,
        },
        "ISNA": {
            "name": "Islamic Society of North America",
            "fajr_angle": 15.0,
            "isha_angle": 15.0,
        },
        "Turkey": {
            "name": "Diyanet İşleri Başkanlığı, Turkey",
            "fajr_angle": 18.0,
            "isha_angle": 17.0,
        },
        "Kuwait": {
            "name": "Kuwait",
            "fajr_angle": 18.0,
            "isha_angle": 17.5,
        },
        "Qatar": {
            "name": "Qatar",
            "fajr_angle": 18.0,
            "isha_interval": 90,
        },
        "Singapore": {
            "name": "Singapore",
            "fajr_angle": 20.0,
            "isha_angle": 18.0,
        },
    }

    # Prayer adjustments (in minutes)
    PRAYER_NAMES = ["imsak", "fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]

    @staticmethod
    def calculate_prayer_times(
        latitude: float,
        longitude: float,
        date_obj: date,
        method: str = "Egyptian",
        timezone_offset: float = 0,
        adjustments: Optional[Dict[str, int]] = None,
    ) -> Dict[str, Any]:
        """
        Calculate prayer times for a specific location and date

        Args:
            latitude: Location latitude
            longitude: Location longitude
            date_obj: Date for calculation
            method: Calculation method name
            timezone_offset: Timezone offset in hours
            adjustments: Manual adjustments in minutes per prayer

        Returns:
            Dictionary with prayer times
        """
        if adjustments is None:
            adjustments = {}

        # Get method parameters
        method_params = PrayerService.CALCULATION_METHODS.get(
            method, PrayerService.CALCULATION_METHODS["Egyptian"]
        )

        # Calculate Julian date
        julian_date = PrayerService._calculate_julian_date(date_obj)

        # Calculate sun position
        sun_declination = PrayerService._sun_declination(julian_date)
        equation_of_time = PrayerService._equation_of_time(julian_date)

        # Calculate prayer times
        times = {}

        # Fajr
        fajr_angle = method_params.get("fajr_angle", 18.0)
        times["fajr"] = PrayerService._calculate_time(
            latitude,
            sun_declination,
            90 + fajr_angle,
            equation_of_time,
            longitude,
            timezone_offset,
        )

        # Sunrise
        times["sunrise"] = PrayerService._calculate_time(
            latitude,
            sun_declination,
            90.833,
            equation_of_time,
            longitude,
            timezone_offset,
        )

        # Dhuhr (solar noon)
        times["dhuhr"] = (
            12 + timezone_offset - (longitude / 15.0) - (equation_of_time / 60.0)
        )

        # Asr (Shafi'i method: shadow = object length + noon shadow)
        times["asr"] = PrayerService._calculate_asr(
            latitude,
            sun_declination,
            equation_of_time,
            longitude,
            timezone_offset,
            factor=1,
        )

        # Maghrib
        if "maghrib_angle" in method_params:
            maghrib_angle = method_params["maghrib_angle"]
            times["maghrib"] = PrayerService._calculate_time(
                latitude,
                sun_declination,
                90 + maghrib_angle,
                equation_of_time,
                longitude,
                timezone_offset,
            )
        else:
            times["maghrib"] = PrayerService._calculate_time(
                latitude,
                sun_declination,
                90.833,
                equation_of_time,
                longitude,
                timezone_offset,
                reverse=True,
            )

        # Isha
        if "isha_interval" in method_params:
            # Fixed interval after maghrib
            interval = method_params["isha_interval"]
            times["isha"] = times["maghrib"] + (interval / 60.0)
        else:
            isha_angle = method_params.get("isha_angle", 17.0)
            times["isha"] = PrayerService._calculate_time(
                latitude,
                sun_declination,
                90 + isha_angle,
                equation_of_time,
                longitude,
                timezone_offset,
                reverse=True,
            )

        # Imsak (10 minutes before Fajr by default)
        times["imsak"] = times["fajr"] - (10 / 60.0)

        # Apply manual adjustments
        for prayer, adjustment in adjustments.items():
            if prayer in times:
                times[prayer] += adjustment / 60.0

        # Format times as HH:MM
        formatted_times = {}
        for prayer, time_value in times.items():
            formatted_times[prayer] = PrayerService._format_time(time_value)

        return {
            "date": date_obj.isoformat(),
            "method": method,
            "location": {"latitude": latitude, "longitude": longitude},
            "times": formatted_times,
        }

    @staticmethod
    def _calculate_julian_date(date_obj: date) -> float:
        """Calculate Julian date from Gregorian date"""
        year = date_obj.year
        month = date_obj.month
        day = date_obj.day

        if month <= 2:
            year -= 1
            month += 12

        a = math.floor(year / 100.0)
        b = 2 - a + math.floor(a / 4.0)

        jd = (
            math.floor(365.25 * (year + 4716))
            + math.floor(30.6001 * (month + 1))
            + day
            + b
            - 1524.5
        )

        return jd

    @staticmethod
    def _sun_declination(julian_date: float) -> float:
        """Calculate sun declination angle"""
        d = julian_date - 2451545.0
        g = 357.529 + 0.98560028 * d
        q = 280.459 + 0.98564736 * d
        L = (
            q
            + 1.915 * math.sin(math.radians(g))
            + 0.020 * math.sin(math.radians(2 * g))
        )

        e = 23.439 - 0.00000036 * d
        declination = math.degrees(
            math.asin(math.sin(math.radians(e)) * math.sin(math.radians(L)))
        )

        return declination

    @staticmethod
    def _equation_of_time(julian_date: float) -> float:
        """Calculate equation of time (in minutes)"""
        d = julian_date - 2451545.0
        g = 357.529 + 0.98560028 * d
        q = 280.459 + 0.98564736 * d
        L = (
            q
            + 1.915 * math.sin(math.radians(g))
            + 0.020 * math.sin(math.radians(2 * g))
        )

        (
            1.00014
            - 0.01671 * math.cos(math.radians(g))
            - 0.00014 * math.cos(math.radians(2 * g))
        )
        RA = math.degrees(
            math.atan2(
                math.cos(math.radians(23.439)) * math.sin(math.radians(L)),
                math.cos(math.radians(L)),
            )
        )

        EqT = q - RA
        EqT = EqT - 360 * math.floor(EqT / 360)
        if EqT > 180:
            EqT -= 360

        return EqT * 4  # Convert to minutes

    @staticmethod
    def _calculate_time(
        latitude: float,
        declination: float,
        angle: float,
        equation_of_time: float,
        longitude: float,
        timezone_offset: float,
        reverse: bool = False,
    ) -> float:
        """Calculate prayer time for a given sun angle"""
        lat_rad = math.radians(latitude)
        dec_rad = math.radians(declination)
        angle_rad = math.radians(angle)

        try:
            cos_h = (math.cos(angle_rad) - math.sin(lat_rad) * math.sin(dec_rad)) / (
                math.cos(lat_rad) * math.cos(dec_rad)
            )

            # Handle edge cases
            if cos_h > 1:
                cos_h = 1
            elif cos_h < -1:
                cos_h = -1

            hour_angle = math.degrees(math.acos(cos_h)) / 15.0

            if reverse:
                noon = (
                    12
                    + timezone_offset
                    - (longitude / 15.0)
                    - (equation_of_time / 60.0)
                )
                return noon + hour_angle
            else:
                noon = (
                    12
                    + timezone_offset
                    - (longitude / 15.0)
                    - (equation_of_time / 60.0)
                )
                return noon - hour_angle

        except (ValueError, ZeroDivisionError):
            # Return a default value for extreme latitudes
            return 12.0

    @staticmethod
    def _calculate_asr(
        latitude: float,
        declination: float,
        equation_of_time: float,
        longitude: float,
        timezone_offset: float,
        factor: int = 1,
    ) -> float:
        """Calculate Asr prayer time"""
        lat_rad = math.radians(latitude)
        dec_rad = math.radians(declination)

        # Calculate shadow ratio
        shadow_ratio = factor + math.tan(abs(lat_rad - dec_rad))

        try:
            angle = math.degrees(math.atan(1.0 / shadow_ratio))
            return PrayerService._calculate_time(
                latitude,
                declination,
                90 - angle,
                equation_of_time,
                longitude,
                timezone_offset,
                reverse=True,
            )
        except (ValueError, ZeroDivisionError):
            return 15.0  # Default afternoon time

    @staticmethod
    def _format_time(time_value: float) -> str:
        """Format decimal time to HH:MM string"""
        # Normalize to 24-hour format
        time_value = time_value % 24

        hours = int(time_value)
        minutes = int((time_value - hours) * 60)

        return f"{hours:02d}:{minutes:02d}"

    @staticmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def get_prayer_times_from_api(
        latitude: float,
        longitude: float,
        date_obj: Optional[date] = None,
        method: str = "Egyptian",
    ) -> Dict[str, Any]:
        """
        Fetch prayer times from external Al Adhan API

        Args:
            latitude: Location latitude
            longitude: Location longitude
            date_obj: Date for calculation (defaults to today)
            method: Calculation method

        Returns:
            Prayer times from API
        """
        if date_obj is None:
            date_obj = date.today()

        # Map method names to Al Adhan API method codes
        method_map = {
            "MuslimWorldLeague": 3,
            "Egyptian": 5,
            "UmmAlQura": 4,
            "Karachi": 1,
            "ISNA": 2,
            "Jafari": 0,
        }

        method_code = method_map.get(method, 5)

        url = f"http://api.aladhan.com/v1/timings/{date_obj.strftime('%d-%m-%Y')}"
        params = {"latitude": latitude, "longitude": longitude, "method": method_code}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                if data.get("code") == 200:
                    timings = data["data"]["timings"]
                    return {
                        "date": date_obj.isoformat(),
                        "method": method,
                        "location": {"latitude": latitude, "longitude": longitude},
                        "times": {
                            "imsak": timings.get("Imsak", ""),
                            "fajr": timings.get("Fajr", ""),
                            "sunrise": timings.get("Sunrise", ""),
                            "dhuhr": timings.get("Dhuhr", ""),
                            "asr": timings.get("Asr", ""),
                            "maghrib": timings.get("Maghrib", ""),
                            "isha": timings.get("Isha", ""),
                        },
                        "source": "aladhan_api",
                    }
                else:
                    raise Exception("API returned non-200 code")

        except (httpx.HTTPError, httpx.TimeoutException) as e:
            logger.exception(
                "Failed to fetch prayer times from Aladhan API",
                latitude=latitude,
                longitude=longitude,
                date=date_obj.isoformat(),
                method=method,
                error_type=type(e).__name__,
            )
            # Fallback to local calculation
            return PrayerService.calculate_prayer_times(
                latitude, longitude, date_obj, method
            )
        except Exception:
            logger.exception(
                "Failed to parse prayer times response",
                latitude=latitude,
                longitude=longitude,
                date=date_obj.isoformat(),
                method=method,
            )
            # Fallback to local calculation
            return PrayerService.calculate_prayer_times(
                latitude, longitude, date_obj, method
            )

    @staticmethod
    def get_next_prayer(prayer_times: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """
        Determine the next prayer based on current time

        Args:
            prayer_times: Dictionary of prayer times (HH:MM format)

        Returns:
            Next prayer information
        """
        now = datetime.now()
        current_minutes = now.hour * 60 + now.minute

        prayers = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
        prayer_minutes = []

        for prayer in prayers:
            time_str = prayer_times.get(prayer, "00:00")
            try:
                hours, minutes = map(int, time_str.split(":"))
                total_minutes = hours * 60 + minutes
                prayer_minutes.append((prayer, total_minutes))
            except (ValueError, AttributeError):
                continue

        # Find next prayer
        for prayer, minutes in prayer_minutes:
            if minutes > current_minutes:
                time_until = minutes - current_minutes
                return {
                    "prayer": prayer,
                    "time": prayer_times[prayer],
                    "minutes_until": time_until,
                    "hours_until": time_until // 60,
                    "remaining_minutes": time_until % 60,
                }

        # If no prayer found today, next is Fajr tomorrow
        if prayer_minutes:
            fajr_time = prayer_minutes[0][1]
            time_until = (24 * 60 - current_minutes) + fajr_time
            return {
                "prayer": "fajr",
                "time": prayer_times["fajr"],
                "minutes_until": time_until,
                "hours_until": time_until // 60,
                "remaining_minutes": time_until % 60,
                "tomorrow": True,
            }

        return None

    @staticmethod
    def get_monthly_prayer_times(
        latitude: float,
        longitude: float,
        year: int,
        month: int,
        method: str = "Egyptian",
    ) -> List[Dict[str, Any]]:
        """
        Calculate prayer times for an entire month

        Args:
            latitude: Location latitude
            longitude: Location longitude
            year: Year
            month: Month (1-12)
            method: Calculation method

        Returns:
            List of daily prayer times
        """
        from calendar import monthrange

        _, days_in_month = monthrange(year, month)
        monthly_times = []

        for day in range(1, days_in_month + 1):
            date_obj = date(year, month, day)
            daily_times = PrayerService.calculate_prayer_times(
                latitude, longitude, date_obj, method
            )
            monthly_times.append(daily_times)

        return monthly_times

    @staticmethod
    def get_qibla_direction(latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Calculate Qibla direction (towards Kaaba in Makkah)

        Args:
            latitude: Current location latitude
            longitude: Current location longitude

        Returns:
            Qibla direction in degrees from North
        """
        # Kaaba coordinates
        kaaba_lat = 21.4225
        kaaba_lon = 39.8262

        lat1 = math.radians(latitude)
        lon1 = math.radians(longitude)
        lat2 = math.radians(kaaba_lat)
        lon2 = math.radians(kaaba_lon)

        delta_lon = lon2 - lon1

        y = math.sin(delta_lon) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(
            lat2
        ) * math.cos(delta_lon)

        bearing = math.atan2(y, x)
        bearing = math.degrees(bearing)
        bearing = (bearing + 360) % 360

        # Calculate distance
        earth_radius = 6371  # km

        a = (
            math.sin((lat2 - lat1) / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = earth_radius * c

        return {
            "qibla_direction": round(bearing, 2),
            "distance_km": round(distance, 2),
            "kaaba_location": {"latitude": kaaba_lat, "longitude": kaaba_lon},
        }
