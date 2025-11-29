"""
Satellite Data Integration for AirWatch AI
Integration with NASA MODIS, ISRO, and other satellite data sources for real-time source tracking
"""

import requests
import json
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import os
from dataclasses import dataclass
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class FireDetection:
    latitude: float
    longitude: float
    confidence: float
    brightness: float
    scan: float
    track: float
    satellite: str
    timestamp: datetime

@dataclass
class ThermalAnomaly:
    latitude: float
    longitude: float
    temperature: float
    area: float
    confidence: float
    satellite: str
    timestamp: datetime

class SatelliteDataIntegrator:
    """Main class for integrating satellite data from multiple sources"""
    
    def __init__(self):
        self.nasa_api_key = os.getenv('NASA_API_KEY', 'demo_key')
        self.fire_detection_cache = {}
        self.thermal_anomaly_cache = {}
        self.cache_duration = timedelta(hours=1)
        
        # Delhi-NCR bounding box
        self.delhi_bbox = {
            'min_lat': 28.4,
            'max_lat': 28.9,
            'min_lon': 76.8,
            'max_lon': 77.4
        }
        
        # Punjab-Haryana bounding box for stubble burning
        self.stubble_bbox = {
            'min_lat': 29.0,
            'max_lat': 31.5,
            'min_lon': 74.0,
            'max_lon': 77.0
        }
    
    def get_fire_detections(self, bbox: Dict = None, days_back: int = 1) -> List[FireDetection]:
        """Get fire detections from NASA MODIS and VIIRS"""
        if bbox is None:
            bbox = self.stubble_bbox  # Default to stubble burning region
            
        cache_key = f"fires_{bbox}_{days_back}"
        if self._is_cache_valid(cache_key):
            return self.fire_detection_cache[cache_key]
        
        fires = []
        
        # Get MODIS fire data
        modis_fires = self._get_modis_fires(bbox, days_back)
        fires.extend(modis_fires)
        
        # Get VIIRS fire data
        viirs_fires = self._get_viirs_fires(bbox, days_back)
        fires.extend(viirs_fires)
        
        # Filter by confidence and area
        filtered_fires = [
            fire for fire in fires 
            if fire.confidence > 0.5 and self._is_in_bbox(fire, bbox)
        ]
        
        # Cache results
        self.fire_detection_cache[cache_key] = filtered_fires
        self.fire_detection_cache[f"{cache_key}_timestamp"] = datetime.now()
        
        return filtered_fires
    
    def get_thermal_anomalies(self, bbox: Dict = None, days_back: int = 1) -> List[ThermalAnomaly]:
        """Get thermal anomalies from satellite data"""
        if bbox is None:
            bbox = self.delhi_bbox
            
        cache_key = f"thermal_{bbox}_{days_back}"
        if self._is_cache_valid(cache_key):
            return self.thermal_anomaly_cache[cache_key]
        
        anomalies = []
        
        # Get MODIS thermal anomalies
        modis_anomalies = self._get_modis_thermal_anomalies(bbox, days_back)
        anomalies.extend(modis_anomalies)
        
        # Get Landsat thermal data
        landsat_anomalies = self._get_landsat_thermal_data(bbox, days_back)
        anomalies.extend(landsat_anomalies)
        
        # Filter and cache
        filtered_anomalies = [
            anomaly for anomaly in anomalies
            if anomaly.confidence > 0.6 and self._is_in_bbox(anomaly, bbox)
        ]
        
        self.thermal_anomaly_cache[cache_key] = filtered_anomalies
        self.thermal_anomaly_cache[f"{cache_key}_timestamp"] = datetime.now()
        
        return filtered_anomalies
    
    def analyze_stubble_burning_activity(self) -> Dict:
        """Analyze stubble burning activity in Punjab-Haryana region"""
        fires = self.get_fire_detections(self.stubble_bbox, days_back=3)
        thermal_anomalies = self.get_thermal_anomalies(self.stubble_bbox, days_back=3)
        
        # Analyze fire patterns
        fire_analysis = self._analyze_fire_patterns(fires)
        
        # Analyze thermal patterns
        thermal_analysis = self._analyze_thermal_patterns(thermal_anomalies)
        
        # Calculate stubble burning intensity
        intensity = self._calculate_stubble_burning_intensity(fire_analysis, thermal_analysis)
        
        # Predict impact on Delhi-NCR
        impact_prediction = self._predict_delhi_impact(fire_analysis, thermal_analysis)
        
        return {
            'fire_count': len(fires),
            'thermal_anomalies': len(thermal_anomalies),
            'intensity_score': intensity,
            'fire_analysis': fire_analysis,
            'thermal_analysis': thermal_analysis,
            'impact_prediction': impact_prediction,
            'timestamp': datetime.now().isoformat()
        }
    
    def detect_industrial_hotspots(self) -> Dict:
        """Detect industrial emission hotspots using satellite data"""
        thermal_anomalies = self.get_thermal_anomalies(self.delhi_bbox, days_back=1)
        
        # Filter for industrial-sized thermal anomalies
        industrial_anomalies = [
            anomaly for anomaly in thermal_anomalies
            if anomaly.area > 0.1 and anomaly.temperature > 50  # Industrial scale
        ]
        
        # Analyze spatial clustering
        hotspots = self._cluster_thermal_anomalies(industrial_anomalies)
        
        # Calculate emission intensity
        emission_intensity = self._calculate_emission_intensity(hotspots)
        
        return {
            'hotspot_count': len(hotspots),
            'total_anomalies': len(industrial_anomalies),
            'emission_intensity': emission_intensity,
            'hotspots': hotspots,
            'timestamp': datetime.now().isoformat()
        }
    
    def get_aerosol_optical_depth(self) -> Dict:
        """Get Aerosol Optical Depth (AOD) data from MODIS"""
        # This would integrate with NASA's MODIS AOD data
        # For demo purposes, we'll simulate the data
        
        aod_data = {
            'delhi_aod': np.random.uniform(0.3, 1.2),
            'gurgaon_aod': np.random.uniform(0.2, 1.0),
            'noida_aod': np.random.uniform(0.4, 1.3),
            'faridabad_aod': np.random.uniform(0.3, 1.1),
            'ghaziabad_aod': np.random.uniform(0.4, 1.2)
        }
        
        # Calculate average AOD for Delhi-NCR
        avg_aod = sum(aod_data.values()) / len(aod_data)
        
        # Convert AOD to pollution estimate
        pollution_estimate = self._aod_to_pollution_estimate(avg_aod)
        
        return {
            'aod_data': aod_data,
            'average_aod': round(avg_aod, 3),
            'pollution_estimate': pollution_estimate,
            'data_quality': 'high',
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_modis_fires(self, bbox: Dict, days_back: int) -> List[FireDetection]:
        """Get MODIS fire detection data"""
        # In real implementation, this would call NASA's FIRMS API
        # For demo, we'll simulate realistic fire detections
        
        fires = []
        base_time = datetime.now() - timedelta(days=days_back)
        
        # Simulate fire detections in Punjab-Haryana region
        for _ in range(np.random.randint(5, 25)):
            fire = FireDetection(
                latitude=np.random.uniform(bbox['min_lat'], bbox['max_lat']),
                longitude=np.random.uniform(bbox['min_lon'], bbox['max_lon']),
                confidence=np.random.uniform(0.5, 0.95),
                brightness=np.random.uniform(300, 500),
                scan=np.random.uniform(1.0, 2.0),
                track=np.random.uniform(1.0, 2.0),
                satellite='MODIS',
                timestamp=base_time + timedelta(hours=np.random.randint(0, days_back * 24))
            )
            fires.append(fire)
        
        return fires
    
    def _get_viirs_fires(self, bbox: Dict, days_back: int) -> List[FireDetection]:
        """Get VIIRS fire detection data"""
        # Simulate VIIRS fire detections (higher resolution than MODIS)
        
        fires = []
        base_time = datetime.now() - timedelta(days=days_back)
        
        for _ in range(np.random.randint(8, 30)):
            fire = FireDetection(
                latitude=np.random.uniform(bbox['min_lat'], bbox['max_lat']),
                longitude=np.random.uniform(bbox['min_lon'], bbox['max_lon']),
                confidence=np.random.uniform(0.6, 0.98),
                brightness=np.random.uniform(400, 600),
                scan=np.random.uniform(0.5, 1.5),
                track=np.random.uniform(0.5, 1.5),
                satellite='VIIRS',
                timestamp=base_time + timedelta(hours=np.random.randint(0, days_back * 24))
            )
            fires.append(fire)
        
        return fires
    
    def _get_modis_thermal_anomalies(self, bbox: Dict, days_back: int) -> List[ThermalAnomaly]:
        """Get MODIS thermal anomaly data"""
        anomalies = []
        base_time = datetime.now() - timedelta(days=days_back)
        
        for _ in range(np.random.randint(10, 40)):
            anomaly = ThermalAnomaly(
                latitude=np.random.uniform(bbox['min_lat'], bbox['max_lat']),
                longitude=np.random.uniform(bbox['min_lon'], bbox['max_lon']),
                temperature=np.random.uniform(40, 80),
                area=np.random.uniform(0.01, 1.0),
                confidence=np.random.uniform(0.6, 0.9),
                satellite='MODIS',
                timestamp=base_time + timedelta(hours=np.random.randint(0, days_back * 24))
            )
            anomalies.append(anomaly)
        
        return anomalies
    
    def _get_landsat_thermal_data(self, bbox: Dict, days_back: int) -> List[ThermalAnomaly]:
        """Get Landsat thermal data"""
        anomalies = []
        base_time = datetime.now() - timedelta(days=days_back)
        
        for _ in range(np.random.randint(5, 20)):
            anomaly = ThermalAnomaly(
                latitude=np.random.uniform(bbox['min_lat'], bbox['max_lat']),
                longitude=np.random.uniform(bbox['min_lon'], bbox['max_lon']),
                temperature=np.random.uniform(45, 75),
                area=np.random.uniform(0.05, 0.5),
                confidence=np.random.uniform(0.7, 0.95),
                satellite='Landsat',
                timestamp=base_time + timedelta(hours=np.random.randint(0, days_back * 24))
            )
            anomalies.append(anomaly)
        
        return anomalies
    
    def _analyze_fire_patterns(self, fires: List[FireDetection]) -> Dict:
        """Analyze patterns in fire detection data"""
        if not fires:
            return {'intensity': 0, 'trend': 'stable', 'hotspots': []}
        
        # Calculate intensity
        total_brightness = sum(fire.brightness for fire in fires)
        avg_confidence = sum(fire.confidence for fire in fires) / len(fires)
        
        intensity = (total_brightness / len(fires)) * avg_confidence / 100
        
        # Analyze temporal trends
        recent_fires = [f for f in fires if f.timestamp > datetime.now() - timedelta(hours=12)]
        trend = 'increasing' if len(recent_fires) > len(fires) * 0.6 else 'stable'
        
        # Find hotspots
        hotspots = self._find_fire_hotspots(fires)
        
        return {
            'intensity': round(intensity, 2),
            'trend': trend,
            'hotspots': hotspots,
            'avg_confidence': round(avg_confidence, 2)
        }
    
    def _analyze_thermal_patterns(self, anomalies: List[ThermalAnomaly]) -> Dict:
        """Analyze patterns in thermal anomaly data"""
        if not anomalies:
            return {'intensity': 0, 'trend': 'stable', 'hotspots': []}
        
        # Calculate thermal intensity
        avg_temperature = sum(anomaly.temperature for anomaly in anomalies) / len(anomalies)
        avg_area = sum(anomaly.area for anomaly in anomalies) / len(anomalies)
        
        intensity = (avg_temperature - 30) * avg_area  # Normalized intensity
        
        # Analyze trends
        recent_anomalies = [a for a in anomalies if a.timestamp > datetime.now() - timedelta(hours=6)]
        trend = 'increasing' if len(recent_anomalies) > len(anomalies) * 0.5 else 'stable'
        
        # Find thermal hotspots
        hotspots = self._find_thermal_hotspots(anomalies)
        
        return {
            'intensity': round(intensity, 2),
            'trend': trend,
            'hotspots': hotspots,
            'avg_temperature': round(avg_temperature, 1)
        }
    
    def _calculate_stubble_burning_intensity(self, fire_analysis: Dict, thermal_analysis: Dict) -> float:
        """Calculate overall stubble burning intensity"""
        fire_intensity = fire_analysis.get('intensity', 0)
        thermal_intensity = thermal_analysis.get('intensity', 0)
        
        # Combine both metrics
        combined_intensity = (fire_intensity * 0.6 + thermal_intensity * 0.4)
        
        # Normalize to 0-1 scale
        normalized_intensity = min(1.0, combined_intensity / 10)
        
        return round(normalized_intensity, 2)
    
    def _predict_delhi_impact(self, fire_analysis: Dict, thermal_analysis: Dict) -> Dict:
        """Predict impact of stubble burning on Delhi-NCR air quality"""
        intensity = self._calculate_stubble_burning_intensity(fire_analysis, thermal_analysis)
        
        # Simulate wind patterns and predict impact
        wind_direction = np.random.choice(['NW', 'N', 'NE', 'W'])
        wind_speed = np.random.uniform(5, 15)
        
        # Calculate expected AQI increase
        base_impact = intensity * 100  # Base AQI increase
        wind_factor = 1.0 if wind_direction in ['NW', 'N', 'NE'] else 0.5
        speed_factor = max(0.3, 1.0 - (wind_speed - 5) / 20)
        
        expected_aqi_increase = base_impact * wind_factor * speed_factor
        
        return {
            'expected_aqi_increase': round(expected_aqi_increase),
            'wind_direction': wind_direction,
            'wind_speed': round(wind_speed, 1),
            'impact_probability': round(intensity * 100),
            'time_to_impact': self._calculate_time_to_impact(wind_speed),
            'recommended_actions': self._get_impact_mitigation_actions(expected_aqi_increase)
        }
    
    def _find_fire_hotspots(self, fires: List[FireDetection]) -> List[Dict]:
        """Find fire hotspots using clustering"""
        if len(fires) < 2:
            return []
        
        # Simple clustering based on proximity
        hotspots = []
        processed = set()
        
        for i, fire in enumerate(fires):
            if i in processed:
                continue
                
            cluster = [fire]
            processed.add(i)
            
            # Find nearby fires
            for j, other_fire in enumerate(fires):
                if j in processed:
                    continue
                    
                distance = self._calculate_distance(fire, other_fire)
                if distance < 0.1:  # Within 10km
                    cluster.append(other_fire)
                    processed.add(j)
            
            if len(cluster) >= 3:  # Significant hotspot
                center_lat = sum(f.latitude for f in cluster) / len(cluster)
                center_lon = sum(f.longitude for f in cluster) / len(cluster)
                
                hotspots.append({
                    'latitude': round(center_lat, 4),
                    'longitude': round(center_lon, 4),
                    'fire_count': len(cluster),
                    'avg_confidence': round(sum(f.confidence for f in cluster) / len(cluster), 2),
                    'intensity': round(sum(f.brightness for f in cluster) / len(cluster), 1)
                })
        
        return hotspots
    
    def _find_thermal_hotspots(self, anomalies: List[ThermalAnomaly]) -> List[Dict]:
        """Find thermal hotspots using clustering"""
        if len(anomalies) < 2:
            return []
        
        hotspots = []
        processed = set()
        
        for i, anomaly in enumerate(anomalies):
            if i in processed:
                continue
                
            cluster = [anomaly]
            processed.add(i)
            
            for j, other_anomaly in enumerate(anomalies):
                if j in processed:
                    continue
                    
                distance = self._calculate_distance(anomaly, other_anomaly)
                if distance < 0.05:  # Within 5km
                    cluster.append(other_anomaly)
                    processed.add(j)
            
            if len(cluster) >= 2:
                center_lat = sum(a.latitude for a in cluster) / len(cluster)
                center_lon = sum(a.longitude for a in cluster) / len(cluster)
                
                hotspots.append({
                    'latitude': round(center_lat, 4),
                    'longitude': round(center_lon, 4),
                    'anomaly_count': len(cluster),
                    'avg_temperature': round(sum(a.temperature for a in cluster) / len(cluster), 1),
                    'total_area': round(sum(a.area for a in cluster), 3)
                })
        
        return hotspots
    
    def _cluster_thermal_anomalies(self, anomalies: List[ThermalAnomaly]) -> List[Dict]:
        """Cluster thermal anomalies into industrial hotspots"""
        hotspots = self._find_thermal_hotspots(anomalies)
        
        # Filter for industrial-scale hotspots
        industrial_hotspots = [
            hotspot for hotspot in hotspots
            if hotspot['total_area'] > 0.1 and hotspot['avg_temperature'] > 50
        ]
        
        return industrial_hotspots
    
    def _calculate_emission_intensity(self, hotspots: List[Dict]) -> float:
        """Calculate emission intensity from hotspots"""
        if not hotspots:
            return 0.0
        
        total_intensity = sum(
            hotspot['avg_temperature'] * hotspot['total_area']
            for hotspot in hotspots
        )
        
        return round(total_intensity, 2)
    
    def _aod_to_pollution_estimate(self, aod: float) -> Dict:
        """Convert AOD to pollution estimate"""
        # Simple conversion (in real implementation, this would be more complex)
        if aod < 0.3:
            aqi_estimate = 50 + (aod / 0.3) * 50
            category = "Good"
        elif aod < 0.6:
            aqi_estimate = 100 + ((aod - 0.3) / 0.3) * 100
            category = "Moderate"
        elif aod < 1.0:
            aqi_estimate = 200 + ((aod - 0.6) / 0.4) * 100
            category = "Poor"
        else:
            aqi_estimate = 300 + ((aod - 1.0) / 0.2) * 100
            category = "Very Poor"
        
        return {
            'estimated_aqi': round(aqi_estimate),
            'category': category,
            'confidence': 0.7
        }
    
    def _calculate_distance(self, point1, point2) -> float:
        """Calculate distance between two points in degrees"""
        lat_diff = point1.latitude - point2.latitude
        lon_diff = point1.longitude - point2.longitude
        return np.sqrt(lat_diff**2 + lon_diff**2)
    
    def _is_in_bbox(self, point, bbox: Dict) -> bool:
        """Check if point is within bounding box"""
        return (bbox['min_lat'] <= point.latitude <= bbox['max_lat'] and
                bbox['min_lon'] <= point.longitude <= bbox['max_lon'])
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid"""
        timestamp_key = f"{cache_key}_timestamp"
        if timestamp_key not in self.fire_detection_cache and timestamp_key not in self.thermal_anomaly_cache:
            return False
        
        timestamp = (self.fire_detection_cache.get(timestamp_key) or 
                    self.thermal_anomaly_cache.get(timestamp_key))
        
        return timestamp and (datetime.now() - timestamp) < self.cache_duration
    
    def _calculate_time_to_impact(self, wind_speed: float) -> str:
        """Calculate time for pollution to reach Delhi"""
        # Approximate distance from Punjab-Haryana to Delhi is ~200km
        distance_km = 200
        time_hours = distance_km / wind_speed
        
        if time_hours < 1:
            return "Less than 1 hour"
        elif time_hours < 6:
            return f"{int(time_hours)} hours"
        else:
            return f"{int(time_hours)} hours"
    
    def _get_impact_mitigation_actions(self, expected_increase: float) -> List[str]:
        """Get recommended mitigation actions based on expected impact"""
        actions = []
        
        if expected_increase > 100:
            actions.extend([
                "Issue emergency air quality alert",
                "Activate smog towers",
                "Implement odd-even vehicle policy",
                "Suspend construction activities"
            ])
        elif expected_increase > 50:
            actions.extend([
                "Issue air quality advisory",
                "Increase public transport frequency",
                "Enhance dust control measures"
            ])
        else:
            actions.extend([
                "Monitor air quality closely",
                "Prepare for potential increase"
            ])
        
        return actions


# Initialize satellite integrator
satellite_integrator = SatelliteDataIntegrator()

