"""
Real-Time Data Integration Module
Integrates live data from CPCB, NASA, ISRO, and other sources
"""

import requests
import pandas as pd
from datetime import datetime, timedelta
import json
import os
from typing import Dict, List, Optional
import asyncio
import aiohttp
import logging
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DataSource:
    name: str
    url: str
    api_key: str
    update_frequency: int  # minutes
    last_updated: Optional[datetime] = None

class RealTimeDataIntegrator:
    """Real-time data integration from multiple sources"""
    
    def __init__(self):
        self.data_sources = {
            'cpcb': DataSource(
                name='CPCB',
                url='https://cpcb.nic.in/air-quality-data/',
                api_key=os.getenv('CPCB_API_KEY', ''),
                update_frequency=15
            ),
            'nasa_modis': DataSource(
                name='NASA MODIS',
                url='https://firms.modaps.eosdis.nasa.gov/api/',
                api_key=os.getenv('NASA_API_KEY', ''),
                update_frequency=180  # 3 hours
            ),
            'isro': DataSource(
                name='ISRO',
                url='https://bhuvan-app1.nrsc.gov.in/',
                api_key=os.getenv('ISRO_API_KEY', ''),
                update_frequency=1440  # 24 hours
            ),
            'openweather': DataSource(
                name='OpenWeatherMap',
                url='https://api.openweathermap.org/data/2.5/',
                api_key=os.getenv('OPENWEATHER_API_KEY', ''),
                update_frequency=15
            ),
            'airvisual': DataSource(
                name='AirVisual',
                url='https://api.airvisual.com/v2/',
                api_key=os.getenv('AIRVISUAL_API_KEY', ''),
                update_frequency=15
            )
        }
        
        self.cache = {}
        self.delhi_coords = {'lat': 28.6139, 'lon': 77.2090}
        
    async def fetch_cpcb_data(self) -> Dict:
        """Fetch real-time data from CPCB"""
        try:
            # CPCB API endpoint for Delhi-NCR stations
            url = "https://cpcb.nic.in/air-quality-data/"
            headers = {
                'User-Agent': 'AirWatch-AI/1.0',
                'Accept': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Process CPCB data for Delhi-NCR
                        processed_data = self.process_cpcb_data(data)
                        self.cache['cpcb'] = {
                            'data': processed_data,
                            'timestamp': datetime.now().isoformat(),
                            'source': 'CPCB'
                        }
                        return processed_data
                    else:
                        logger.warning(f"CPCB API returned status {response.status}")
                        return self.get_fallback_cpcb_data()
                        
        except Exception as e:
            logger.error(f"Error fetching CPCB data: {e}")
            return self.get_fallback_cpcb_data()
    
    def process_cpcb_data(self, raw_data: Dict) -> List[Dict]:
        """Process raw CPCB data into standardized format"""
        processed_stations = []
        
        # CPCB stations in Delhi-NCR
        delhi_stations = [
            'Anand Vihar', 'Bawana', 'Burari Crossing', 'CRRI Mathura Road',
            'DTU', 'Dwarka-Sector 8', 'IGI Airport (T3)', 'Jahangirpuri',
            'Jawaharlal Nehru Stadium', 'Lodhi Road', 'Mundka', 'Najafgarh',
            'Narela', 'NSIT Dwarka', 'Punjabi Bagh', 'RK Puram',
            'Rohini', 'Shadipur', 'Sirifort', 'Vivek Vihar'
        ]
        
        for station in delhi_stations:
            station_data = {
                'station_id': station.replace(' ', '_').lower(),
                'location': station,
                'aqi': self.calculate_aqi_from_pollutants(raw_data.get(station, {})),
                'pm25': raw_data.get(station, {}).get('PM2.5', 0),
                'pm10': raw_data.get(station, {}).get('PM10', 0),
                'so2': raw_data.get(station, {}).get('SO2', 0),
                'no2': raw_data.get(station, {}).get('NO2', 0),
                'co': raw_data.get(station, {}).get('CO', 0),
                'o3': raw_data.get(station, {}).get('O3', 0),
                'temperature': raw_data.get(station, {}).get('Temperature', 28.5),
                'humidity': raw_data.get(station, {}).get('Humidity', 45),
                'wind_speed': raw_data.get(station, {}).get('Wind Speed', 8.2),
                'wind_direction': raw_data.get(station, {}).get('Wind Direction', 'NW'),
                'pressure': raw_data.get(station, {}).get('Pressure', 1013),
                'primary_pollutant': self.get_primary_pollutant(raw_data.get(station, {})),
                'category': self.get_aqi_category(self.calculate_aqi_from_pollutants(raw_data.get(station, {}))),
                'timestamp': datetime.now().isoformat(),
                'data_quality': 'Real-time CPCB'
            }
            processed_stations.append(station_data)
        
        return processed_stations
    
    async def fetch_nasa_modis_data(self) -> Dict:
        """Fetch fire detection data from NASA MODIS"""
        try:
            # NASA FIRMS API for fire detection
            url = "https://firms.modaps.eosdis.nasa.gov/api/country/csv/IND/1/MODIS_NRT"
            params = {
                'country': 'IND',
                'satellite': 'MODIS_NRT',
                'days': 1
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        csv_data = await response.text()
                        
                        # Process NASA fire data
                        fire_data = self.process_nasa_fire_data(csv_data)
                        self.cache['nasa_modis'] = {
                            'data': fire_data,
                            'timestamp': datetime.now().isoformat(),
                            'source': 'NASA MODIS'
                        }
                        return fire_data
                    else:
                        logger.warning(f"NASA MODIS API returned status {response.status}")
                        return self.get_fallback_satellite_data()
                        
        except Exception as e:
            logger.error(f"Error fetching NASA MODIS data: {e}")
            return self.get_fallback_satellite_data()
    
    def process_nasa_fire_data(self, csv_data: str) -> List[Dict]:
        """Process NASA fire detection CSV data"""
        import io
        df = pd.read_csv(io.StringIO(csv_data))
        
        # Filter for Delhi-NCR region (approximate coordinates)
        delhi_bounds = {
            'lat_min': 28.4, 'lat_max': 28.8,
            'lon_min': 76.8, 'lon_max': 77.4
        }
        
        filtered_fires = df[
            (df['latitude'] >= delhi_bounds['lat_min']) & 
            (df['latitude'] <= delhi_bounds['lat_max']) &
            (df['longitude'] >= delhi_bounds['lon_min']) & 
            (df['longitude'] <= delhi_bounds['lon_max'])
        ]
        
        fire_detections = []
        for _, fire in filtered_fires.iterrows():
            fire_detections.append({
                'fire_id': fire['fire_id'],
                'latitude': fire['latitude'],
                'longitude': fire['longitude'],
                'brightness': fire['brightness'],
                'confidence': fire['confidence'],
                'detection_time': fire['acq_date'] + ' ' + fire['acq_time'],
                'satellite': 'MODIS',
                'source': 'NASA'
            })
        
        return fire_detections
    
    async def fetch_weather_data(self) -> Dict:
        """Fetch weather data from OpenWeatherMap"""
        try:
            url = f"{self.data_sources['openweather'].url}weather"
            params = {
                'lat': self.delhi_coords['lat'],
                'lon': self.delhi_coords['lon'],
                'appid': self.data_sources['openweather'].api_key,
                'units': 'metric'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        weather_data = {
                            'temperature': data['main']['temp'],
                            'humidity': data['main']['humidity'],
                            'pressure': data['main']['pressure'],
                            'wind_speed': data['wind']['speed'],
                            'wind_direction': data['wind'].get('deg', 0),
                            'visibility': data.get('visibility', 10000) / 1000,  # Convert to km
                            'cloudiness': data['clouds']['all'],
                            'weather_condition': data['weather'][0]['description'],
                            'timestamp': datetime.now().isoformat(),
                            'source': 'OpenWeatherMap'
                        }
                        
                        self.cache['weather'] = {
                            'data': weather_data,
                            'timestamp': datetime.now().isoformat(),
                            'source': 'OpenWeatherMap'
                        }
                        
                        return weather_data
                    else:
                        logger.warning(f"Weather API returned status {response.status}")
                        return self.get_fallback_weather_data()
                        
        except Exception as e:
            logger.error(f"Error fetching weather data: {e}")
            return self.get_fallback_weather_data()
    
    async def fetch_airvisual_data(self) -> Dict:
        """Fetch air quality data from AirVisual/IQAir"""
        try:
            url = f"{self.data_sources['airvisual'].url}nearest_city"
            params = {
                'lat': self.delhi_coords['lat'],
                'lon': self.delhi_coords['lon'],
                'key': self.data_sources['airvisual'].api_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data['status'] == 'success':
                            current = data['data']['current']
                            pollution = current['pollution']
                            
                            airvisual_data = {
                                'aqi': pollution['aqius'],
                                'pm25': pollution['pm25'],
                                'pm10': pollution['pm10'],
                                'timestamp': current['ts'],
                                'city': data['data']['city'],
                                'country': data['data']['country'],
                                'source': 'AirVisual'
                            }
                            
                            self.cache['airvisual'] = {
                                'data': airvisual_data,
                                'timestamp': datetime.now().isoformat(),
                                'source': 'AirVisual'
                            }
                            
                            return airvisual_data
                    else:
                        logger.warning(f"AirVisual API returned status {response.status}")
                        return self.get_fallback_airvisual_data()
                        
        except Exception as e:
            logger.error(f"Error fetching AirVisual data: {e}")
            return self.get_fallback_airvisual_data()
    
    async def fetch_all_data(self) -> Dict:
        """Fetch data from all sources concurrently"""
        tasks = [
            self.fetch_cpcb_data(),
            self.fetch_nasa_modis_data(),
            self.fetch_weather_data(),
            self.fetch_airvisual_data()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            'cpcb': results[0] if not isinstance(results[0], Exception) else None,
            'nasa_modis': results[1] if not isinstance(results[1], Exception) else None,
            'weather': results[2] if not isinstance(results[2], Exception) else None,
            'airvisual': results[3] if not isinstance(results[3], Exception) else None,
            'fetch_timestamp': datetime.now().isoformat()
        }
    
    def calculate_aqi_from_pollutants(self, pollutants: Dict) -> int:
        """Calculate AQI from pollutant concentrations"""
        # Simplified AQI calculation
        pm25_aqi = min(500, max(0, (pollutants.get('PM2.5', 0) * 2.5)))
        pm10_aqi = min(500, max(0, (pollutants.get('PM10', 0) * 1.2)))
        so2_aqi = min(500, max(0, (pollutants.get('SO2', 0) * 5)))
        no2_aqi = min(500, max(0, (pollutants.get('NO2', 0) * 2)))
        co_aqi = min(500, max(0, (pollutants.get('CO', 0) * 10)))
        o3_aqi = min(500, max(0, (pollutants.get('O3', 0) * 3)))
        
        return int(max(pm25_aqi, pm10_aqi, so2_aqi, no2_aqi, co_aqi, o3_aqi))
    
    def get_primary_pollutant(self, pollutants: Dict) -> str:
        """Determine primary pollutant"""
        pollutant_values = {
            'PM2.5': pollutants.get('PM2.5', 0) * 2.5,
            'PM10': pollutants.get('PM10', 0) * 1.2,
            'SO2': pollutants.get('SO2', 0) * 5,
            'NO2': pollutants.get('NO2', 0) * 2,
            'CO': pollutants.get('CO', 0) * 10,
            'O3': pollutants.get('O3', 0) * 3
        }
        
        return max(pollutant_values, key=pollutant_values.get)
    
    def get_aqi_category(self, aqi: int) -> str:
        """Get AQI category"""
        if aqi <= 50:
            return "Good"
        elif aqi <= 100:
            return "Satisfactory"
        elif aqi <= 200:
            return "Moderate"
        elif aqi <= 300:
            return "Poor"
        elif aqi <= 400:
            return "Very Poor"
        else:
            return "Severe"
    
    # Fallback data methods
    def get_fallback_cpcb_data(self) -> List[Dict]:
        """Fallback CPCB data when API is unavailable"""
        return [
            {
                'station_id': 'fallback_delhi',
                'location': 'Delhi-NCR',
                'aqi': 250,
                'pm25': 100,
                'pm10': 150,
                'so2': 15,
                'no2': 25,
                'co': 3,
                'o3': 35,
                'temperature': 28.5,
                'humidity': 45,
                'wind_speed': 8.2,
                'wind_direction': 'NW',
                'pressure': 1013,
                'primary_pollutant': 'PM2.5',
                'category': 'Poor',
                'timestamp': datetime.now().isoformat(),
                'data_quality': 'Fallback'
            }
        ]
    
    def get_fallback_satellite_data(self) -> List[Dict]:
        """Fallback satellite data"""
        return [
            {
                'fire_id': 'fallback_1',
                'latitude': 30.7333,
                'longitude': 76.7794,
                'brightness': 320,
                'confidence': 85,
                'detection_time': datetime.now().isoformat(),
                'satellite': 'MODIS',
                'source': 'NASA'
            }
        ]
    
    def get_fallback_weather_data(self) -> Dict:
        """Fallback weather data"""
        return {
            'temperature': 28.5,
            'humidity': 45,
            'pressure': 1013,
            'wind_speed': 8.2,
            'wind_direction': 315,
            'visibility': 5,
            'cloudiness': 30,
            'weather_condition': 'clear sky',
            'timestamp': datetime.now().isoformat(),
            'source': 'Fallback'
        }
    
    def get_fallback_airvisual_data(self) -> Dict:
        """Fallback AirVisual data"""
        return {
            'aqi': 250,
            'pm25': 100,
            'pm10': 150,
            'timestamp': datetime.now().isoformat(),
            'city': 'Delhi',
            'country': 'India',
            'source': 'Fallback'
        }

# Global instance
real_time_integrator = RealTimeDataIntegrator()
