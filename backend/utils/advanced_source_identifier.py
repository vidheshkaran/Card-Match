"""
Advanced Source Identification Module
Real-time integration with satellite data, IoT sensors, and pattern recognition
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json
import logging
from typing import Dict, List, Tuple, Optional
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
import requests
import asyncio
import aiohttp

logger = logging.getLogger(__name__)

class AdvancedSourceIdentifier:
    """Enhanced source identification using multiple data sources and AI"""
    
    def __init__(self):
        self.source_patterns = {
            'stubble_burning': {
                'indicators': ['fire_count', 'thermal_anomaly', 'smoke_plume', 'seasonal_pattern'],
                'thresholds': {'fire_count': 5, 'thermal_anomaly': 0.7, 'smoke_plume': 0.8},
                'seasonal_weight': 0.9,  # Higher weight during Oct-Nov
                'location_clusters': ['Punjab', 'Haryana', 'Western UP']
            },
            'vehicular': {
                'indicators': ['no2_spike', 'traffic_correlation', 'rush_hour_pattern', 'co_levels'],
                'thresholds': {'no2_spike': 0.4, 'traffic_correlation': 0.6, 'rush_hour_pattern': 0.8},
                'temporal_patterns': ['morning_rush', 'evening_rush', 'weekday_high'],
                'location_clusters': ['ITO', 'CP', 'India Gate', 'Delhi Gate']
            },
            'industrial': {
                'indicators': ['so2_spike', 'thermal_emission', 'particle_density', 'consistent_pattern'],
                'thresholds': {'so2_spike': 0.6, 'thermal_emission': 0.5, 'particle_density': 0.7},
                'location_clusters': ['Mayapuri', 'Okhla', 'Narela', 'Bawana']
            },
            'construction': {
                'indicators': ['pm10_spike', 'dust_plume', 'activity_correlation', 'temporal_pattern'],
                'thresholds': {'pm10_spike': 0.5, 'dust_plume': 0.7, 'activity_correlation': 0.6},
                'temporal_patterns': ['daytime_high', 'weekday_high'],
                'location_clusters': ['Dwarka', 'Noida', 'Gurgaon']
            },
            'waste_burning': {
                'indicators': ['co_spike', 'particle_composition', 'thermal_signature'],
                'thresholds': {'co_spike': 0.7, 'particle_composition': 0.6, 'thermal_signature': 0.5},
                'location_clusters': ['Bhalswa', 'Okhla', 'Ghazipur']
            }
        }
        
        self.location_clusters = {}
        self.temporal_patterns = {}
        self.source_confidence_threshold = 0.7
        
    async def identify_sources_comprehensive(self, pollution_data: Dict, satellite_data: Dict = None, 
                                           iot_data: Dict = None, weather_data: Dict = None) -> List[Dict]:
        """Comprehensive source identification using multiple data sources"""
        sources = []
        
        # 1. Satellite-based identification
        if satellite_data:
            satellite_sources = await self.analyze_satellite_data(satellite_data, pollution_data)
            sources.extend(satellite_sources)
        
        # 2. IoT sensor-based identification
        if iot_data:
            iot_sources = await self.analyze_iot_data(iot_data, pollution_data)
            sources.extend(iot_sources)
        
        # 3. Pattern-based identification
        pattern_sources = self.analyze_pollution_patterns(pollution_data, weather_data)
        sources.extend(pattern_sources)
        
        # 4. Temporal pattern analysis
        temporal_sources = self.analyze_temporal_patterns(pollution_data)
        sources.extend(temporal_sources)
        
        # 5. Spatial clustering analysis
        spatial_sources = self.analyze_spatial_clusters(pollution_data)
        sources.extend(spatial_sources)
        
        # 6. Remove duplicates and rank by confidence
        unique_sources = self.deduplicate_and_rank_sources(sources)
        
        return unique_sources[:10]  # Return top 10 sources
    
    async def analyze_satellite_data(self, satellite_data: Dict, pollution_data: Dict) -> List[Dict]:
        """Analyze satellite data for source identification"""
        sources = []
        
        # Analyze fire detections for stubble burning
        if 'fire_detections' in satellite_data:
            fire_sources = self.analyze_fire_detections(satellite_data['fire_detections'], pollution_data)
            sources.extend(fire_sources)
        
        # Analyze thermal anomalies for industrial sources
        if 'thermal_anomalies' in satellite_data:
            thermal_sources = self.analyze_thermal_anomalies(satellite_data['thermal_anomalies'], pollution_data)
            sources.extend(thermal_sources)
        
        # Analyze aerosol optical depth for dust sources
        if 'aerosol_data' in satellite_data:
            aerosol_sources = self.analyze_aerosol_data(satellite_data['aerosol_data'], pollution_data)
            sources.extend(aerosol_sources)
        
        return sources
    
    def analyze_fire_detections(self, fire_data: List[Dict], pollution_data: Dict) -> List[Dict]:
        """Analyze fire detection data for stubble burning"""
        sources = []
        
        # Filter fires in stubble burning regions
        stubble_regions = [
            {'lat_min': 29.5, 'lat_max': 31.5, 'lon_min': 74.0, 'lon_max': 78.0},  # Punjab-Haryana
        ]
        
        for fire in fire_data:
            lat, lon = fire['latitude'], fire['longitude']
            
            # Check if fire is in stubble burning region
            in_stubble_region = any(
                region['lat_min'] <= lat <= region['lat_max'] and 
                region['lon_min'] <= lon <= region['lon_max']
                for region in stubble_regions
            )
            
            if in_stubble_region:
                # Calculate confidence based on fire characteristics
                brightness = fire.get('brightness', 0)
                confidence = fire.get('confidence', 0)
                
                # Higher brightness and confidence indicate stronger fire
                fire_intensity = (brightness / 400.0) * (confidence / 100.0)
                
                # Seasonal weight (higher during stubble burning season)
                current_day = datetime.now().timetuple().tm_yday
                seasonal_weight = 1.0
                if 280 <= current_day <= 334:  # Oct-Nov
                    seasonal_weight = 2.0
                elif 300 <= current_day <= 320:  # Peak stubble burning
                    seasonal_weight = 3.0
                
                final_confidence = min(1.0, fire_intensity * seasonal_weight)
                
                if final_confidence > self.source_confidence_threshold:
                    sources.append({
                        'type': 'Stubble Burning',
                        'location': f"Punjab-Haryana Region ({lat:.3f}, {lon:.3f})",
                        'confidence': final_confidence,
                        'contribution': min(40, final_confidence * 50),
                        'fire_intensity': fire_intensity,
                        'brightness': brightness,
                        'detection_time': fire.get('detection_time', datetime.now().isoformat()),
                        'satellite': fire.get('satellite', 'Unknown'),
                        'source_indicators': ['fire_detection', 'thermal_signature', 'seasonal_pattern'],
                        'timestamp': datetime.now().isoformat()
                    })
        
        return sources
    
    def analyze_thermal_anomalies(self, thermal_data: List[Dict], pollution_data: Dict) -> List[Dict]:
        """Analyze thermal anomalies for industrial sources"""
        sources = []
        
        # Industrial areas in Delhi-NCR
        industrial_areas = [
            {'name': 'Mayapuri Industrial', 'lat': 28.6279, 'lon': 77.1031, 'radius': 5},
            {'name': 'Okhla Industrial', 'lat': 28.5500, 'lon': 77.2500, 'radius': 5},
            {'name': 'Narela Industrial', 'lat': 28.8500, 'lon': 77.1000, 'radius': 5},
            {'name': 'Bawana Industrial', 'lat': 28.8000, 'lon': 77.0500, 'radius': 5}
        ]
        
        for anomaly in thermal_data:
            lat, lon = anomaly['latitude'], anomaly['longitude']
            temperature = anomaly.get('temperature', 0)
            
            # Find nearest industrial area
            nearest_area = None
            min_distance = float('inf')
            
            for area in industrial_areas:
                distance = np.sqrt((lat - area['lat'])**2 + (lon - area['lon'])**2)
                if distance < min_distance and distance <= area['radius']:
                    min_distance = distance
                    nearest_area = area
            
            if nearest_area:
                # Calculate confidence based on temperature anomaly and location
                temp_anomaly = (temperature - 25) / 10  # Normalize temperature anomaly
                location_confidence = 1.0 - (min_distance / nearest_area['radius'])
                
                final_confidence = min(1.0, temp_anomaly * location_confidence * 0.8)
                
                if final_confidence > 0.6:  # Lower threshold for industrial sources
                    sources.append({
                        'type': 'Industrial',
                        'location': nearest_area['name'],
                        'confidence': final_confidence,
                        'contribution': min(30, final_confidence * 40),
                        'temperature_anomaly': temperature,
                        'distance_to_center': min_distance,
                        'detection_time': anomaly.get('detection_time', datetime.now().isoformat()),
                        'source_indicators': ['thermal_anomaly', 'location_correlation', 'consistent_pattern'],
                        'timestamp': datetime.now().isoformat()
                    })
        
        return sources
    
    async def analyze_iot_data(self, iot_data: Dict, pollution_data: Dict) -> List[Dict]:
        """Analyze IoT sensor data for local source identification"""
        sources = []
        
        if 'sensors' not in iot_data:
            return sources
        
        # Group sensors by location clusters
        location_clusters = self.cluster_sensors_by_location(iot_data['sensors'])
        
        for cluster_name, sensors in location_clusters.items():
            # Analyze cluster for source identification
            cluster_sources = self.analyze_sensor_cluster(cluster_name, sensors, pollution_data)
            sources.extend(cluster_sources)
        
        return sources
    
    def cluster_sensors_by_location(self, sensors: List[Dict]) -> Dict[str, List[Dict]]:
        """Cluster sensors by geographic location"""
        clusters = {}
        
        for sensor in sensors:
            location = sensor.get('location', 'Unknown')
            
            # Map to cluster based on location
            cluster_name = self.get_location_cluster(location)
            
            if cluster_name not in clusters:
                clusters[cluster_name] = []
            clusters[cluster_name].append(sensor)
        
        return clusters
    
    def get_location_cluster(self, location: str) -> str:
        """Map sensor location to cluster"""
        location_lower = location.lower()
        
        if any(area in location_lower for area in ['ito', 'cp', 'india_gate', 'delhi_gate']):
            return 'Central_Delhi_Traffic'
        elif any(area in location_lower for area in ['mayapuri', 'okhla', 'narela', 'bawana']):
            return 'Industrial_Areas'
        elif any(area in location_lower for area in ['dwarka', 'noida', 'gurgaon']):
            return 'Construction_Areas'
        elif any(area in location_lower for area in ['bhalswa', 'ghazipur']):
            return 'Waste_Management'
        else:
            return 'Other_Areas'
    
    def analyze_sensor_cluster(self, cluster_name: str, sensors: List[Dict], pollution_data: Dict) -> List[Dict]:
        """Analyze a cluster of sensors for source identification"""
        sources = []
        
        # Calculate cluster statistics
        cluster_stats = self.calculate_cluster_statistics(sensors)
        
        # Identify sources based on cluster characteristics
        if cluster_name == 'Central_Delhi_Traffic':
            vehicular_source = self.identify_vehicular_source(cluster_stats, sensors)
            if vehicular_source:
                sources.append(vehicular_source)
        
        elif cluster_name == 'Industrial_Areas':
            industrial_source = self.identify_industrial_source(cluster_stats, sensors)
            if industrial_source:
                sources.append(industrial_source)
        
        elif cluster_name == 'Construction_Areas':
            construction_source = self.identify_construction_source(cluster_stats, sensors)
            if construction_source:
                sources.append(construction_source)
        
        elif cluster_name == 'Waste_Management':
            waste_source = self.identify_waste_burning_source(cluster_stats, sensors)
            if waste_source:
                sources.append(waste_source)
        
        return sources
    
    def calculate_cluster_statistics(self, sensors: List[Dict]) -> Dict:
        """Calculate statistics for a cluster of sensors"""
        if not sensors:
            return {}
        
        stats = {
            'avg_pm25': np.mean([float(s.get('pm25', 0)) for s in sensors]),
            'avg_pm10': np.mean([float(s.get('pm10', 0)) for s in sensors]),
            'avg_so2': np.mean([float(s.get('so2', 0)) for s in sensors]),
            'avg_no2': np.mean([float(s.get('no2', 0)) for s in sensors]),
            'avg_co': np.mean([float(s.get('co', 0)) for s in sensors]),
            'avg_traffic_density': np.mean([float(s.get('traffic_density', 0)) for s in sensors]),
            'construction_activity': sum([int(s.get('construction_activity', 0)) for s in sensors]),
            'sensor_count': len(sensors),
            'active_sensors': len([s for s in sensors if s.get('status') == 'active'])
        }
        
        return stats
    
    def identify_vehicular_source(self, cluster_stats: Dict, sensors: List[Dict]) -> Optional[Dict]:
        """Identify vehicular pollution source from sensor data"""
        if cluster_stats['avg_no2'] > 40 and cluster_stats['avg_traffic_density'] > 70:
            confidence = min(1.0, (cluster_stats['avg_no2'] / 100) * (cluster_stats['avg_traffic_density'] / 100))
            
            # Check for rush hour pattern
            current_hour = datetime.now().hour
            rush_hour_bonus = 0.2 if (7 <= current_hour <= 10) or (17 <= current_hour <= 20) else 0
            
            final_confidence = min(1.0, confidence + rush_hour_bonus)
            
            if final_confidence > 0.6:
                return {
                    'type': 'Vehicular',
                    'location': 'Central Delhi Traffic Corridors',
                    'confidence': final_confidence,
                    'contribution': min(35, final_confidence * 45),
                    'no2_level': cluster_stats['avg_no2'],
                    'traffic_density': cluster_stats['avg_traffic_density'],
                    'sensors_analyzed': cluster_stats['sensor_count'],
                    'source_indicators': ['no2_spike', 'traffic_correlation', 'rush_hour_pattern'],
                    'timestamp': datetime.now().isoformat()
                }
        
        return None
    
    def identify_industrial_source(self, cluster_stats: Dict, sensors: List[Dict]) -> Optional[Dict]:
        """Identify industrial pollution source from sensor data"""
        if cluster_stats['avg_so2'] > 20 and cluster_stats['avg_pm25'] > 120:
            confidence = min(1.0, (cluster_stats['avg_so2'] / 50) * (cluster_stats['avg_pm25'] / 200))
            
            if confidence > 0.7:
                return {
                    'type': 'Industrial',
                    'location': 'Industrial Areas (Mayapuri, Okhla, Narela)',
                    'confidence': confidence,
                    'contribution': min(30, confidence * 40),
                    'so2_level': cluster_stats['avg_so2'],
                    'pm25_level': cluster_stats['avg_pm25'],
                    'sensors_analyzed': cluster_stats['sensor_count'],
                    'source_indicators': ['so2_spike', 'particle_density', 'consistent_pattern'],
                    'timestamp': datetime.now().isoformat()
                }
        
        return None
    
    def identify_construction_source(self, cluster_stats: Dict, sensors: List[Dict]) -> Optional[Dict]:
        """Identify construction pollution source from sensor data"""
        if cluster_stats['avg_pm10'] > 150 and cluster_stats['construction_activity'] > 0:
            confidence = min(1.0, (cluster_stats['avg_pm10'] / 250) * (cluster_stats['construction_activity'] / len(sensors)))
            
            if confidence > 0.6:
                return {
                    'type': 'Construction',
                    'location': 'Construction Areas (Dwarka, Noida, Gurgaon)',
                    'confidence': confidence,
                    'contribution': min(25, confidence * 35),
                    'pm10_level': cluster_stats['avg_pm10'],
                    'construction_sites': cluster_stats['construction_activity'],
                    'sensors_analyzed': cluster_stats['sensor_count'],
                    'source_indicators': ['pm10_spike', 'dust_plume', 'activity_correlation'],
                    'timestamp': datetime.now().isoformat()
                }
        
        return None
    
    def identify_waste_burning_source(self, cluster_stats: Dict, sensors: List[Dict]) -> Optional[Dict]:
        """Identify waste burning source from sensor data"""
        if cluster_stats['avg_co'] > 2 and cluster_stats['avg_pm25'] > 100:
            confidence = min(1.0, (cluster_stats['avg_co'] / 5) * (cluster_stats['avg_pm25'] / 150))
            
            if confidence > 0.6:
                return {
                    'type': 'Waste Burning',
                    'location': 'Landfill Sites (Bhalswa, Ghazipur, Okhla)',
                    'confidence': confidence,
                    'contribution': min(20, confidence * 30),
                    'co_level': cluster_stats['avg_co'],
                    'pm25_level': cluster_stats['avg_pm25'],
                    'sensors_analyzed': cluster_stats['sensor_count'],
                    'source_indicators': ['co_spike', 'particle_composition', 'thermal_signature'],
                    'timestamp': datetime.now().isoformat()
                }
        
        return None
    
    def analyze_pollution_patterns(self, pollution_data: Dict, weather_data: Dict = None) -> List[Dict]:
        """Analyze pollution patterns for source identification"""
        sources = []
        
        # Analyze pollutant ratios for source fingerprinting
        pm25_pm10_ratio = pollution_data.get('pm25', 0) / max(1, pollution_data.get('pm10', 1))
        no2_so2_ratio = pollution_data.get('no2', 0) / max(1, pollution_data.get('so2', 1))
        
        # Vehicular source indicators
        if pm25_pm10_ratio > 0.7 and no2_so2_ratio > 1.5:
            sources.append({
                'type': 'Vehicular',
                'location': 'Traffic Corridors',
                'confidence': 0.75,
                'contribution': 25,
                'pm25_pm10_ratio': pm25_pm10_ratio,
                'no2_so2_ratio': no2_so2_ratio,
                'source_indicators': ['pollutant_ratios', 'traffic_pattern'],
                'timestamp': datetime.now().isoformat()
            })
        
        # Industrial source indicators
        if pollution_data.get('so2', 0) > 20 and pm25_pm10_ratio < 0.6:
            sources.append({
                'type': 'Industrial',
                'location': 'Industrial Zones',
                'confidence': 0.8,
                'contribution': 30,
                'so2_level': pollution_data.get('so2', 0),
                'pm25_pm10_ratio': pm25_pm10_ratio,
                'source_indicators': ['so2_dominance', 'particle_composition'],
                'timestamp': datetime.now().isoformat()
            })
        
        return sources
    
    def analyze_temporal_patterns(self, pollution_data: Dict) -> List[Dict]:
        """Analyze temporal patterns for source identification"""
        sources = []
        current_hour = datetime.now().hour
        current_day = datetime.now().weekday()
        
        # Rush hour patterns (vehicular)
        if (7 <= current_hour <= 10) or (17 <= current_hour <= 20):
            if pollution_data.get('no2', 0) > 30:
                sources.append({
                    'type': 'Vehicular',
                    'location': 'Rush Hour Traffic',
                    'confidence': 0.85,
                    'contribution': 20,
                    'hour': current_hour,
                    'no2_level': pollution_data.get('no2', 0),
                    'source_indicators': ['rush_hour_pattern', 'temporal_correlation'],
                    'timestamp': datetime.now().isoformat()
                })
        
        # Weekend vs weekday patterns
        if current_day >= 5:  # Weekend
            if pollution_data.get('pm25', 0) > 100:
                sources.append({
                    'type': 'Mixed Sources',
                    'location': 'Weekend Activities',
                    'confidence': 0.7,
                    'contribution': 15,
                    'day_type': 'Weekend',
                    'pm25_level': pollution_data.get('pm25', 0),
                    'source_indicators': ['weekend_pattern', 'activity_correlation'],
                    'timestamp': datetime.now().isoformat()
                })
        
        return sources
    
    def analyze_spatial_clusters(self, pollution_data: Dict) -> List[Dict]:
        """Analyze spatial clusters for source identification"""
        sources = []
        
        # This would typically use clustering algorithms on sensor data
        # For now, we'll use simplified spatial analysis
        
        # High pollution clusters
        if pollution_data.get('aqi', 0) > 200:
            sources.append({
                'type': 'Mixed Sources',
                'location': 'High Pollution Cluster',
                'confidence': 0.7,
                'contribution': 20,
                'aqi_level': pollution_data.get('aqi', 0),
                'cluster_type': 'high_pollution',
                'source_indicators': ['spatial_clustering', 'high_concentration'],
                'timestamp': datetime.now().isoformat()
            })
        
        return sources
    
    def deduplicate_and_rank_sources(self, sources: List[Dict]) -> List[Dict]:
        """Remove duplicate sources and rank by confidence"""
        # Group sources by type
        source_groups = {}
        
        for source in sources:
            source_type = source['type']
            if source_type not in source_groups:
                source_groups[source_type] = []
            source_groups[source_type].append(source)
        
        # Merge similar sources and keep the best one
        merged_sources = []
        
        for source_type, source_list in source_groups.items():
            if len(source_list) == 1:
                merged_sources.append(source_list[0])
            else:
                # Find the source with highest confidence
                best_source = max(source_list, key=lambda x: x['confidence'])
                
                # Combine contribution from all sources of this type
                total_contribution = sum(s['contribution'] for s in source_list)
                best_source['contribution'] = min(50, total_contribution)
                best_source['source_count'] = len(source_list)
                
                merged_sources.append(best_source)
        
        # Sort by confidence
        merged_sources.sort(key=lambda x: x['confidence'], reverse=True)
        
        return merged_sources
    
    def get_source_recommendations(self, sources: List[Dict]) -> List[Dict]:
        """Generate recommendations based on identified sources"""
        recommendations = []
        
        for source in sources:
            source_type = source['type']
            confidence = source['confidence']
            contribution = source['contribution']
            
            if source_type == 'Stubble Burning':
                recommendations.append({
                    'priority': 'High',
                    'action': 'Enhanced Satellite Monitoring',
                    'description': f'Deploy additional satellite monitoring for Punjab-Haryana region (Confidence: {confidence:.1%})',
                    'expected_impact': f'{contribution * 0.3:.1f}% AQI reduction',
                    'implementation_time': 'Immediate',
                    'cost_estimate': '₹5-10 Cr',
                    'target_area': 'Punjab-Haryana Border'
                })
            
            elif source_type == 'Industrial':
                recommendations.append({
                    'priority': 'High',
                    'action': 'Industrial Emission Controls',
                    'description': f'Implement stricter emission standards for industrial areas (Confidence: {confidence:.1%})',
                    'expected_impact': f'{contribution * 0.4:.1f}% AQI reduction',
                    'implementation_time': '2-4 weeks',
                    'cost_estimate': '₹20-30 Cr',
                    'target_area': source['location']
                })
            
            elif source_type == 'Vehicular':
                recommendations.append({
                    'priority': 'Medium',
                    'action': 'Traffic Management',
                    'description': f'Implement traffic optimization and odd-even scheme (Confidence: {confidence:.1%})',
                    'expected_impact': f'{contribution * 0.3:.1f}% AQI reduction',
                    'implementation_time': 'Immediate',
                    'cost_estimate': '₹10-15 Cr',
                    'target_area': 'Traffic Corridors'
                })
            
            elif source_type == 'Construction':
                recommendations.append({
                    'priority': 'Medium',
                    'action': 'Dust Control Measures',
                    'description': f'Implement dust suppression and construction management (Confidence: {confidence:.1%})',
                    'expected_impact': f'{contribution * 0.5:.1f}% AQI reduction',
                    'implementation_time': '1-2 weeks',
                    'cost_estimate': '₹5-8 Cr',
                    'target_area': source['location']
                })
        
        return recommendations

# Global instance
advanced_source_identifier = AdvancedSourceIdentifier()
