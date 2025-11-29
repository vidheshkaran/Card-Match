"""
Free API Integration for Real-Time Air Quality Data
Uses free APIs that don't require API keys or have generous free tiers
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging
import time
import os

logger = logging.getLogger(__name__)

class FreeAPIIntegration:
    """Integrates with free air quality APIs"""
    
    def __init__(self):
        self.cache = {}
        self.cache_duration = 600  # 10 minutes cache
        self.delhi_coords = {'lat': 28.6139, 'lon': 77.2090}
        
    def get_waqi_data(self, city='Delhi') -> Dict:
        """
        World Air Quality Index API - FREE, no API key required
        https://aqicn.org/api/
        """
        try:
            # WAQI API - free tier, no key needed for basic usage
            url = f"https://api.waqi.info/feed/{city}/"
            
            # Try with token (optional but recommended)
            token = 'demo'  # Can use 'demo' for testing or get free token from aqicn.org
            url_with_token = f"{url}?token={token}"
            
            response = requests.get(url_with_token, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') == 'ok' and 'data' in data:
                    aqi_data = data['data']
                    
                    # Extract AQI and pollutants
                    aqi = aqi_data.get('aqi', 0)
                    iaqi = aqi_data.get('iaqi', {})
                    
                    # Get station info
                    station = aqi_data.get('city', {})
                    station_name = station.get('name', 'Delhi')
                    
                    # Extract individual pollutants
                    pm25 = iaqi.get('pm25', {}).get('v', 0) if 'pm25' in iaqi else 0
                    pm10 = iaqi.get('pm10', {}).get('v', 0) if 'pm10' in iaqi else 0
                    no2 = iaqi.get('no2', {}).get('v', 0) if 'no2' in iaqi else 0
                    so2 = iaqi.get('so2', {}).get('v', 0) if 'so2' in iaqi else 0
                    co = iaqi.get('co', {}).get('v', 0) if 'co' in iaqi else 0
                    o3 = iaqi.get('o3', {}).get('v', 0) if 'o3' in iaqi else 0
                    
                    # Get weather data if available
                    weather = {}
                    if 'weather' in aqi_data:
                        weather = aqi_data['weather']
                    
                    result = {
                        'aqi': int(aqi),
                        'pm25': float(pm25),
                        'pm10': float(pm10),
                        'no2': float(no2),
                        'so2': float(so2),
                        'co': float(co),
                        'o3': float(o3),
                        'station_name': station_name,
                        'timestamp': datetime.now().isoformat(),
                        'source': 'WAQI',
                        'weather': weather,
                        'coordinates': {
                            'lat': aqi_data.get('lat', self.delhi_coords['lat']),
                            'lon': aqi_data.get('lon', self.delhi_coords['lon'])
                        }
                    }
                    
                    self.cache['waqi'] = {
                        'data': result,
                        'timestamp': datetime.now()
                    }
                    
                    return result
                    
        except Exception as e:
            logger.warning(f"WAQI API error: {e}")
            
        # Return fallback data
        return self.get_fallback_data()
    
    def get_openweather_air_quality(self, lat=None, lon=None) -> Dict:
        """
        OpenWeatherMap Air Pollution API
        Free tier: 1,000 calls/day
        Requires API key but free signup
        """
        try:
            api_key = os.getenv('OPENWEATHER_API_KEY', '')
            if not api_key:
                # Return fallback if no API key
                return self.get_fallback_data()
            
            lat = lat or self.delhi_coords['lat']
            lon = lon or self.delhi_coords['lon']
            
            url = f"http://api.openweathermap.org/data/2.5/air_pollution"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': api_key
            }
            
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'list' in data and len(data['list']) > 0:
                    air_data = data['list'][0]
                    components = air_data.get('components', {})
                    main = air_data.get('main', {})
                    
                    result = {
                        'aqi': int(main.get('aqi', 0) * 50),  # Convert 1-5 scale to 0-250
                        'pm25': float(components.get('pm2_5', 0)),
                        'pm10': float(components.get('pm10', 0)),
                        'no2': float(components.get('no2', 0)),
                        'so2': float(components.get('so2', 0)),
                        'co': float(components.get('co', 0) / 1000),  # Convert to mg/m³
                        'o3': float(components.get('o3', 0)),
                        'timestamp': datetime.fromtimestamp(air_data.get('dt', time.time())).isoformat(),
                        'source': 'OpenWeatherMap',
                        'coordinates': {'lat': lat, 'lon': lon}
                    }
                    
                    self.cache['openweather'] = {
                        'data': result,
                        'timestamp': datetime.now()
                    }
                    
                    return result
                    
        except Exception as e:
            logger.warning(f"OpenWeather API error: {e}")
            
        return self.get_fallback_data()
    
    def get_multiple_stations(self) -> List[Dict]:
        """Get data from multiple Delhi stations"""
        stations = [
            {'name': 'Central Delhi', 'city': 'Delhi'},
            {'name': 'New Delhi', 'city': 'New Delhi'},
            {'name': 'Gurgaon', 'city': 'Gurgaon'},
        ]
        
        results = []
        for station in stations:
            try:
                data = self.get_waqi_data(station['city'])
                data['station_name'] = station['name']
                results.append(data)
                time.sleep(0.5)  # Rate limiting
            except Exception as e:
                logger.warning(f"Error fetching {station['name']}: {e}")
                
        return results if results else [self.get_fallback_data()]
    
    def get_fallback_data(self) -> Dict:
        """Return realistic fallback data when APIs fail"""
        return {
            'aqi': 245,
            'pm25': 112.5,
            'pm10': 195.3,
            'no2': 45.6,
            'so2': 15.2,
            'co': 1.2,
            'o3': 32.1,
            'station_name': 'Delhi-NCR',
            'timestamp': datetime.now().isoformat(),
            'source': 'Fallback',
            'coordinates': self.delhi_coords
        }
    
    def get_cached_data(self, source: str) -> Optional[Dict]:
        """Get cached data if still fresh"""
        if source in self.cache:
            cache_entry = self.cache[source]
            age = (datetime.now() - cache_entry['timestamp']).total_seconds()
            
            if age < self.cache_duration:
                return cache_entry['data']
                
        return None
    
    def get_real_time_aqi(self) -> Dict:
        """Get real-time AQI data with caching"""
        # Check cache first
        cached = self.get_cached_data('waqi')
        if cached:
            return cached
        
        # Try WAQI first (no API key needed)
        try:
            data = self.get_waqi_data()
            if data and data.get('source') != 'Fallback':
                return data
        except Exception as e:
            logger.warning(f"WAQI failed: {e}")
        
        # Try OpenWeather if available
        try:
            data = self.get_openweather_air_quality()
            if data and data.get('source') != 'Fallback':
                return data
        except Exception as e:
            logger.warning(f"OpenWeather failed: {e}")
        
        # Return fallback
        return self.get_fallback_data()

# Global instance
free_api = FreeAPIIntegration()

