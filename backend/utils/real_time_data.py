# Real-Time Data Integration for AirWatch AI
# Free APIs for Real-Time Air Quality Data

import requests
import json
import pandas as pd
from datetime import datetime, timedelta
import time
import os
from typing import Dict, List, Optional

class RealTimeDataFetcher:
    """Fetches real-time air quality data from free APIs"""
    
    def __init__(self):
        # Free API configurations
        self.apis = {
            'openweather': {
                'base_url': 'https://api.openweathermap.org/data/2.5',
                'api_key': os.getenv('OPENWEATHER_API_KEY', ''),  # Get free key from openweathermap.org
                'free_limit': 1000,
                'calls_made': 0
            },
            'airvisual': {
                'base_url': 'https://api.airvisual.com/v2',
                'api_key': os.getenv('AIRVISUAL_API_KEY', ''),  # Get free key from iqair.com
                'free_limit': 500,
                'calls_made': 0
            },
            'waqi': {
                'base_url': 'https://api.waqi.info',
                'api_key': os.getenv('WAQI_API_KEY', ''),  # Get free key from waqi.info
                'free_limit': 1000,
                'calls_made': 0
            }
        }
        
        # Delhi-NCR coordinates and station data
        self.delhi_stations = {
            'central_delhi': {'lat': 28.6139, 'lon': 77.2090, 'name': 'Central Delhi'},
            'east_delhi': {'lat': 28.6279, 'lon': 77.2770, 'name': 'East Delhi'},
            'west_delhi': {'lat': 28.6562, 'lon': 77.2410, 'name': 'West Delhi'},
            'south_delhi': {'lat': 28.4595, 'lon': 77.0266, 'name': 'South Delhi'},
            'north_delhi': {'lat': 28.7041, 'lon': 77.1025, 'name': 'North Delhi'},
            'ito_junction': {'lat': 28.6139, 'lon': 77.2295, 'name': 'ITO Junction'},
            'cp_metro': {'lat': 28.6315, 'lon': 77.2167, 'name': 'CP Metro'},
            'india_gate': {'lat': 28.6129, 'lon': 77.2295, 'name': 'India Gate'},
            'mayapuri_industrial': {'lat': 28.6315, 'lon': 77.1167, 'name': 'Mayapuri Industrial'},
            'dwarka': {'lat': 28.5921, 'lon': 77.0467, 'name': 'Dwarka'}
        }

    def fetch_openweather_air_quality(self, lat: float, lon: float) -> Optional[Dict]:
        """Fetch air quality data from OpenWeatherMap API"""
        try:
            if not self.apis['openweather']['api_key']:
                return None
                
            url = f"{self.apis['openweather']['base_url']}/air_pollution"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.apis['openweather']['api_key']
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            self.apis['openweather']['calls_made'] += 1
            
            # Process OpenWeatherMap data
            if 'list' in data and len(data['list']) > 0:
                air_data = data['list'][0]
                return {
                    'pm25': air_data['components'].get('pm2_5', 0),
                    'pm10': air_data['components'].get('pm10', 0),
                    'so2': air_data['components'].get('so2', 0),
                    'no2': air_data['components'].get('no2', 0),
                    'co': air_data['components'].get('co', 0),
                    'o3': air_data['components'].get('o3', 0),
                    'aqi': self.calculate_aqi_from_components(air_data['components']),
                    'timestamp': datetime.fromtimestamp(air_data['dt']).isoformat(),
                    'source': 'OpenWeatherMap'
                }
        except Exception as e:
            print(f"Error fetching OpenWeatherMap data: {e}")
        return None

    def fetch_airvisual_data(self, city: str = 'Delhi', state: str = 'Delhi', country: str = 'India') -> Optional[Dict]:
        """Fetch air quality data from AirVisual API"""
        try:
            if not self.apis['airvisual']['api_key']:
                return None
                
            url = f"{self.apis['airvisual']['base_url']}/city"
            params = {
                'city': city,
                'state': state,
                'country': country,
                'key': self.apis['airvisual']['api_key']
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            self.apis['airvisual']['calls_made'] += 1
            
            # Process AirVisual data
            if 'data' in data:
                current = data['data']['current']
                pollution = current['pollution']
                weather = current['weather']
                
                return {
                    'pm25': pollution.get('aqius', 0),  # AirVisual uses AQI US standard
                    'pm10': pollution.get('aqius', 0) * 1.2,  # Estimate PM10
                    'aqi': pollution.get('aqius', 0),
                    'temperature': weather.get('tp', 0),
                    'humidity': weather.get('hu', 0),
                    'wind_speed': weather.get('ws', 0),
                    'wind_direction': weather.get('wd', 0),
                    'pressure': weather.get('pr', 0),
                    'timestamp': datetime.now().isoformat(),
                    'source': 'AirVisual'
                }
        except Exception as e:
            print(f"Error fetching AirVisual data: {e}")
        return None

    def fetch_waqi_data(self, lat: float, lon: float) -> Optional[Dict]:
        """Fetch air quality data from World Air Quality Index API"""
        try:
            if not self.apis['waqi']['api_key']:
                return None
                
            url = f"{self.apis['waqi']['base_url']}/feed/geo:{lat};{lon}/"
            params = {
                'token': self.apis['waqi']['api_key']
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            self.apis['waqi']['calls_made'] += 1
            
            # Process WAQI data
            if 'data' in data:
                iaqi = data['data'].get('iaqi', {})
                return {
                    'pm25': iaqi.get('pm25', {}).get('v', 0),
                    'pm10': iaqi.get('pm10', {}).get('v', 0),
                    'so2': iaqi.get('so2', {}).get('v', 0),
                    'no2': iaqi.get('no2', {}).get('v', 0),
                    'co': iaqi.get('co', {}).get('v', 0),
                    'o3': iaqi.get('o3', {}).get('v', 0),
                    'aqi': data['data'].get('aqi', 0),
                    'timestamp': data['data'].get('time', {}).get('iso', datetime.now().isoformat()),
                    'source': 'WAQI'
                }
        except Exception as e:
            print(f"Error fetching WAQI data: {e}")
        return None

    def fetch_all_delhi_stations(self) -> List[Dict]:
        """Fetch real-time data for all Delhi stations"""
        all_data = []
        
        for station_id, station_info in self.delhi_stations.items():
            station_data = {
                'station_id': station_id,
                'station_name': station_info['name'],
                'latitude': station_info['lat'],
                'longitude': station_info['lon'],
                'data_sources': []
            }
            
            # Try multiple data sources for redundancy
            sources = [
                self.fetch_openweather_air_quality(station_info['lat'], station_info['lon']),
                self.fetch_waqi_data(station_info['lat'], station_info['lon'])
            ]
            
            # Add AirVisual data for Delhi city (not station-specific)
            if station_id == 'central_delhi':  # Only fetch once for Delhi
                airvisual_data = self.fetch_airvisual_data()
                if airvisual_data:
                    sources.append(airvisual_data)
            
            # Process valid data sources
            valid_sources = [s for s in sources if s is not None]
            if valid_sources:
                # Use the first valid source or average multiple sources
                if len(valid_sources) == 1:
                    station_data.update(valid_sources[0])
                else:
                    # Average multiple sources for better accuracy
                    station_data.update(self.average_data_sources(valid_sources))
                
                station_data['data_sources'] = [s['source'] for s in valid_sources]
                station_data['confidence'] = min(95, 70 + len(valid_sources) * 10)
            else:
                # Fallback to mock data if no real data available
                station_data.update(self.generate_fallback_data(station_id))
                station_data['data_sources'] = ['Mock Data']
                station_data['confidence'] = 50
            
            all_data.append(station_data)
            
            # Rate limiting - wait between API calls
            time.sleep(0.5)
        
        return all_data

    def average_data_sources(self, sources: List[Dict]) -> Dict:
        """Average data from multiple sources"""
        averaged = {}
        numeric_fields = ['pm25', 'pm10', 'so2', 'no2', 'co', 'o3', 'aqi', 'temperature', 'humidity', 'wind_speed', 'pressure']
        
        for field in numeric_fields:
            values = [s.get(field, 0) for s in sources if s.get(field, 0) > 0]
            if values:
                averaged[field] = sum(values) / len(values)
            else:
                averaged[field] = 0
        
        # Use the most recent timestamp
        timestamps = [s.get('timestamp', '') for s in sources]
        averaged['timestamp'] = max(timestamps) if timestamps else datetime.now().isoformat()
        averaged['source'] = 'Multiple Sources'
        
        return averaged

    def calculate_aqi_from_components(self, components: Dict) -> int:
        """Calculate AQI from pollutant components"""
        # Simplified AQI calculation
        pm25 = components.get('pm2_5', 0)
        pm10 = components.get('pm10', 0)
        
        # Use PM2.5 as primary AQI indicator
        if pm25 <= 12:
            return int(50 * pm25 / 12)
        elif pm25 <= 35:
            return int(50 + 50 * (pm25 - 12) / 23)
        elif pm25 <= 55:
            return int(100 + 50 * (pm25 - 35) / 20)
        elif pm25 <= 150:
            return int(150 + 100 * (pm25 - 55) / 95)
        else:
            return int(250 + 150 * (pm25 - 150) / 100)

    def generate_fallback_data(self, station_id: str) -> Dict:
        """Generate fallback data when APIs are unavailable"""
        # Use realistic Delhi air quality patterns
        base_aqi = 250 + hash(station_id) % 100  # Consistent but varied
        current_hour = datetime.now().hour
        
        # Simulate daily patterns
        if 6 <= current_hour <= 10:  # Morning rush
            multiplier = 1.2
        elif 17 <= current_hour <= 21:  # Evening rush
            multiplier = 1.3
        elif 22 <= current_hour or current_hour <= 5:  # Night
            multiplier = 0.8
        else:  # Daytime
            multiplier = 1.0
        
        aqi = int(base_aqi * multiplier)
        
        return {
            'pm25': int(aqi * 0.4),
            'pm10': int(aqi * 0.6),
            'so2': int(aqi * 0.05),
            'no2': int(aqi * 0.15),
            'co': int(aqi * 0.003),
            'o3': int(aqi * 0.1),
            'aqi': aqi,
            'temperature': 28 + hash(station_id) % 5,
            'humidity': 45 + hash(station_id) % 15,
            'wind_speed': 5 + hash(station_id) % 5,
            'wind_direction': 'NW',
            'pressure': 1013 + hash(station_id) % 5,
            'timestamp': datetime.now().isoformat(),
            'source': 'Fallback Data'
        }

    def get_api_usage_stats(self) -> Dict:
        """Get API usage statistics"""
        stats = {}
        for api_name, api_config in self.apis.items():
            stats[api_name] = {
                'calls_made': api_config['calls_made'],
                'free_limit': api_config['free_limit'],
                'remaining': api_config['free_limit'] - api_config['calls_made'],
                'usage_percentage': (api_config['calls_made'] / api_config['free_limit']) * 100
            }
        return stats

# Usage example
if __name__ == "__main__":
    fetcher = RealTimeDataFetcher()
    
    print("Fetching real-time air quality data for Delhi-NCR...")
    real_time_data = fetcher.fetch_all_delhi_stations()
    
    print(f"Fetched data for {len(real_time_data)} stations")
    for station in real_time_data[:3]:  # Show first 3 stations
        print(f"Station: {station['station_name']}")
        print(f"AQI: {station['aqi']}")
        print(f"PM2.5: {station['pm25']}")
        print(f"Sources: {', '.join(station['data_sources'])}")
        print(f"Confidence: {station['confidence']}%")
        print("---")
    
    print("API Usage Stats:")
    stats = fetcher.get_api_usage_stats()
    for api, stat in stats.items():
        print(f"{api}: {stat['calls_made']}/{stat['free_limit']} calls ({stat['usage_percentage']:.1f}%)")


