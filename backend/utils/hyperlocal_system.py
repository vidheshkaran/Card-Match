"""
Hyperlocal AQI and Safe Routes System for AirWatch AI
Provides neighborhood-level air quality and personalized route recommendations
"""

import numpy as np
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import math

@dataclass
class Location:
    latitude: float
    longitude: float
    name: str
    aqi: float
    pollutants: Dict
    timestamp: datetime

@dataclass
class RouteSegment:
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    aqi: float
    duration: int  # minutes
    distance: float  # km
    route_type: str  # 'road', 'metro', 'walking', 'cycling'

@dataclass
class SafeRoute:
    segments: List[RouteSegment]
    total_duration: int
    total_distance: float
    avg_aqi: float
    max_aqi: float
    pollution_exposure: float
    route_score: float

class HyperlocalAQISystem:
    """System for hyperlocal air quality monitoring and route optimization"""
    
    def __init__(self):
        # Delhi-NCR monitoring stations and their coordinates
        self.monitoring_stations = {
            'central_delhi': Location(28.6139, 77.2090, 'Central Delhi', 287, 
                                    {'pm25': 112.5, 'pm10': 195.3, 'no2': 45.6}, datetime.now()),
            'east_delhi': Location(28.6358, 77.3145, 'East Delhi', 245,
                                 {'pm25': 98.7, 'pm10': 176.4, 'no2': 38.7}, datetime.now()),
            'west_delhi': Location(28.6139, 77.1025, 'West Delhi', 312,
                                 {'pm25': 125.8, 'pm10': 210.6, 'no2': 52.3}, datetime.now()),
            'south_delhi': Location(28.4595, 77.0266, 'South Delhi', 178,
                                  {'pm25': 78.3, 'pm10': 145.2, 'no2': 29.4}, datetime.now()),
            'north_delhi': Location(28.7041, 77.1025, 'North Delhi', 95,
                                  {'pm25': 42.6, 'pm10': 89.7, 'no2': 18.9}, datetime.now()),
            'ito_junction': Location(28.6315, 77.2167, 'ITO Junction', 325,
                                   {'pm25': 134.7, 'pm10': 201.5, 'no2': 54.3}, datetime.now()),
            'cp_metro': Location(28.6315, 77.2167, 'CP Metro', 267,
                               {'pm25': 105.6, 'pm10': 182.9, 'no2': 47.2}, datetime.now()),
            'india_gate': Location(28.6129, 77.2295, 'India Gate', 278,
                                 {'pm25': 112.5, 'pm10': 189.3, 'no2': 49.7}, datetime.now()),
            'mayapuri': Location(28.6289, 77.2065, 'Mayapuri', 342,
                               {'pm25': 156.8, 'pm10': 234.6, 'no2': 35.4}, datetime.now()),
            'okhla': Location(28.5314, 77.2728, 'Okhla', 298,
                            {'pm25': 142.3, 'pm10': 218.7, 'no2': 38.2}, datetime.now())
        }
        
        # Metro stations for route planning
        self.metro_stations = {
            'rajiv_chowk': Location(28.6315, 77.2167, 'Rajiv Chowk', 260, {}, datetime.now()),
            'central_secretariat': Location(28.6129, 77.2081, 'Central Secretariat', 270, {}, datetime.now()),
            'india_gate': Location(28.6129, 77.2295, 'India Gate', 278, {}, datetime.now()),
            'connaught_place': Location(28.6315, 77.2167, 'Connaught Place', 250, {}, datetime.now()),
            'karol_bagh': Location(28.6514, 77.1909, 'Karol Bagh', 290, {}, datetime.now()),
            'new_delhi': Location(28.6439, 77.2190, 'New Delhi', 280, {}, datetime.now()),
            'old_delhi': Location(28.6562, 77.2410, 'Old Delhi', 320, {}, datetime.now())
        }
        
        # Traffic corridors with typical AQI levels
        self.traffic_corridors = {
            'ring_road': {'aqi_multiplier': 1.2, 'congestion_factor': 1.3},
            'outer_ring_road': {'aqi_multiplier': 1.1, 'congestion_factor': 1.1},
            'metro_corridor': {'aqi_multiplier': 0.8, 'congestion_factor': 0.5},
            'green_corridor': {'aqi_multiplier': 0.7, 'congestion_factor': 0.3}
        }
    
    def get_hyperlocal_aqi(self, latitude: float, longitude: float, radius_km: float = 2.0) -> Dict:
        """Get hyperlocal AQI for a specific location"""
        
        # Find nearby monitoring stations
        nearby_stations = self._find_nearby_stations(latitude, longitude, radius_km)
        
        if not nearby_stations:
            # Use city average if no nearby stations
            return self._get_city_average_aqi()
        
        # Interpolate AQI based on distance-weighted average
        interpolated_aqi = self._interpolate_aqi(latitude, longitude, nearby_stations)
        
        # Add micro-environmental factors
        micro_factors = self._calculate_micro_environmental_factors(latitude, longitude)
        
        # Adjust AQI based on local factors
        adjusted_aqi = self._adjust_aqi_for_local_factors(interpolated_aqi, micro_factors)
        
        return {
            'latitude': latitude,
            'longitude': longitude,
            'aqi': adjusted_aqi['aqi'],
            'category': self._get_aqi_category(adjusted_aqi['aqi']),
            'pollutants': adjusted_aqi['pollutants'],
            'confidence': adjusted_aqi['confidence'],
            'nearby_stations': [{'name': station.name, 'distance': station.distance, 'aqi': station.aqi} 
                              for station in nearby_stations],
            'micro_factors': micro_factors,
            'health_recommendations': self._get_health_recommendations(adjusted_aqi['aqi']),
            'timestamp': datetime.now().isoformat()
        }
    
    def get_safe_routes(self, start_lat: float, start_lon: float, 
                       end_lat: float, end_lon: float, 
                       route_type: str = 'optimal') -> List[SafeRoute]:
        """Get safe routes between two points"""
        
        # Generate multiple route options
        routes = []
        
        # 1. Direct route
        direct_route = self._generate_direct_route(start_lat, start_lon, end_lat, end_lon)
        routes.append(direct_route)
        
        # 2. Metro route
        metro_route = self._generate_metro_route(start_lat, start_lon, end_lat, end_lon)
        if metro_route:
            routes.append(metro_route)
        
        # 3. Green route (through parks and low-traffic areas)
        green_route = self._generate_green_route(start_lat, start_lon, end_lat, end_lon)
        if green_route:
            routes.append(green_route)
        
        # 4. Cycling route
        cycling_route = self._generate_cycling_route(start_lat, start_lon, end_lat, end_lon)
        if cycling_route:
            routes.append(cycling_route)
        
        # 5. Walking route (for short distances)
        if self._calculate_distance(start_lat, start_lon, end_lat, end_lon) < 3:
            walking_route = self._generate_walking_route(start_lat, start_lon, end_lat, end_lon)
            if walking_route:
                routes.append(walking_route)
        
        # Sort routes by pollution exposure
        routes.sort(key=lambda x: x.pollution_exposure)
        
        return routes[:5]  # Return top 5 routes
    
    def get_neighborhood_air_quality(self, center_lat: float, center_lon: float, 
                                   grid_size: int = 5) -> Dict:
        """Get air quality grid for a neighborhood"""
        
        # Create grid of points around the center
        grid_points = self._create_air_quality_grid(center_lat, center_lon, grid_size)
        
        # Calculate AQI for each grid point
        air_quality_map = []
        for point in grid_points:
            aqi_data = self.get_hyperlocal_aqi(point['lat'], point['lon'], radius_km=1.0)
            air_quality_map.append({
                'latitude': point['lat'],
                'longitude': point['lon'],
                'aqi': aqi_data['aqi'],
                'category': aqi_data['category'],
                'pollutants': aqi_data['pollutants']
            })
        
        # Calculate neighborhood statistics
        aqi_values = [point['aqi'] for point in air_quality_map]
        avg_aqi = sum(aqi_values) / len(aqi_values)
        min_aqi = min(aqi_values)
        max_aqi = max(aqi_values)
        
        # Find cleanest and dirtiest spots
        cleanest_spot = min(air_quality_map, key=lambda x: x['aqi'])
        dirtiest_spot = max(air_quality_map, key=lambda x: x['aqi'])
        
        return {
            'center_latitude': center_lat,
            'center_longitude': center_lon,
            'grid_size': grid_size,
            'air_quality_map': air_quality_map,
            'statistics': {
                'average_aqi': round(avg_aqi, 1),
                'minimum_aqi': min_aqi,
                'maximum_aqi': max_aqi,
                'aqi_range': max_aqi - min_aqi,
                'cleanest_spot': cleanest_spot,
                'dirtiest_spot': dirtiest_spot
            },
            'recommendations': self._get_neighborhood_recommendations(avg_aqi, min_aqi, max_aqi),
            'timestamp': datetime.now().isoformat()
        }
    
    def get_activity_recommendations(self, latitude: float, longitude: float, 
                                   activity_type: str, duration_minutes: int = 60) -> Dict:
        """Get activity recommendations based on current air quality"""
        
        # Get current hyperlocal AQI
        aqi_data = self.get_hyperlocal_aqi(latitude, longitude)
        current_aqi = aqi_data['aqi']
        
        # Get activity-specific recommendations
        recommendations = self._get_activity_specific_recommendations(
            activity_type, current_aqi, duration_minutes
        )
        
        # Find nearby safe locations for the activity
        safe_locations = self._find_safe_activity_locations(
            latitude, longitude, activity_type, current_aqi
        )
        
        # Get time-based recommendations
        time_recommendations = self._get_time_based_recommendations(
            activity_type, current_aqi
        )
        
        return {
            'current_location': {
                'latitude': latitude,
                'longitude': longitude,
                'aqi': current_aqi,
                'category': aqi_data['category']
            },
            'activity_type': activity_type,
            'duration_minutes': duration_minutes,
            'recommendations': recommendations,
            'safe_locations': safe_locations,
            'time_recommendations': time_recommendations,
            'health_impact': self._calculate_health_impact(activity_type, current_aqi, duration_minutes),
            'timestamp': datetime.now().isoformat()
        }
    
    def _find_nearby_stations(self, lat: float, lon: float, radius_km: float) -> List:
        """Find monitoring stations within radius"""
        nearby = []
        
        for station in self.monitoring_stations.values():
            distance = self._calculate_distance(lat, lon, station.latitude, station.longitude)
            if distance <= radius_km:
                station.distance = distance
                nearby.append(station)
        
        return sorted(nearby, key=lambda x: x.distance)
    
    def _interpolate_aqi(self, lat: float, lon: float, nearby_stations: List) -> Dict:
        """Interpolate AQI based on nearby stations"""
        if not nearby_stations:
            return {'aqi': 200, 'pollutants': {}, 'confidence': 0.5}
        
        # Distance-weighted interpolation
        total_weight = 0
        weighted_aqi = 0
        weighted_pollutants = {}
        
        for station in nearby_stations:
            weight = 1 / (station.distance + 0.1)  # Add small constant to avoid division by zero
            total_weight += weight
            weighted_aqi += station.aqi * weight
            
            for pollutant, value in station.pollutants.items():
                if pollutant not in weighted_pollutants:
                    weighted_pollutants[pollutant] = 0
                weighted_pollutants[pollutant] += value * weight
        
        # Normalize
        interpolated_aqi = weighted_aqi / total_weight
        interpolated_pollutants = {
            pollutant: value / total_weight 
            for pollutant, value in weighted_pollutants.items()
        }
        
        # Calculate confidence based on station proximity and count
        avg_distance = sum(station.distance for station in nearby_stations) / len(nearby_stations)
        confidence = max(0.3, min(0.95, 1.0 - (avg_distance / 2.0) + (len(nearby_stations) * 0.1)))
        
        return {
            'aqi': round(interpolated_aqi, 1),
            'pollutants': {k: round(v, 1) for k, v in interpolated_pollutants.items()},
            'confidence': round(confidence, 2)
        }
    
    def _calculate_micro_environmental_factors(self, lat: float, lon: float) -> Dict:
        """Calculate micro-environmental factors affecting air quality"""
        factors = {}
        
        # Time of day factor
        hour = datetime.now().hour
        if 6 <= hour <= 9 or 17 <= hour <= 20:  # Rush hours
            factors['time_factor'] = 1.2
        elif 22 <= hour or hour <= 5:  # Night time
            factors['time_factor'] = 0.8
        else:
            factors['time_factor'] = 1.0
        
        # Proximity to major roads (simulated)
        factors['traffic_factor'] = np.random.uniform(0.9, 1.3)
        
        # Green space factor (simulated)
        factors['green_space_factor'] = np.random.uniform(0.7, 1.1)
        
        # Industrial activity factor (simulated)
        factors['industrial_factor'] = np.random.uniform(0.8, 1.2)
        
        # Construction activity factor (simulated)
        factors['construction_factor'] = np.random.uniform(0.9, 1.4)
        
        return factors
    
    def _adjust_aqi_for_local_factors(self, base_aqi: Dict, micro_factors: Dict) -> Dict:
        """Adjust AQI based on local micro-environmental factors"""
        
        adjustment_factors = [
            micro_factors.get('time_factor', 1.0),
            micro_factors.get('traffic_factor', 1.0),
            micro_factors.get('green_space_factor', 1.0),
            micro_factors.get('industrial_factor', 1.0),
            micro_factors.get('construction_factor', 1.0)
        ]
        
        # Calculate combined adjustment
        combined_factor = np.mean(adjustment_factors)
        
        # Adjust AQI
        adjusted_aqi = base_aqi['aqi'] * combined_factor
        adjusted_aqi = max(0, min(500, adjusted_aqi))  # Clamp to valid range
        
        # Adjust pollutants proportionally
        adjusted_pollutants = {
            pollutant: value * combined_factor
            for pollutant, value in base_aqi['pollutants'].items()
        }
        
        # Reduce confidence slightly due to micro-adjustments
        adjusted_confidence = base_aqi['confidence'] * 0.95
        
        return {
            'aqi': round(adjusted_aqi, 1),
            'pollutants': {k: round(v, 1) for k, v in adjusted_pollutants.items()},
            'confidence': round(adjusted_confidence, 2)
        }
    
    def _generate_direct_route(self, start_lat: float, start_lon: float, 
                              end_lat: float, end_lon: float) -> SafeRoute:
        """Generate direct route between two points"""
        distance = self._calculate_distance(start_lat, start_lon, end_lat, end_lon)
        duration = int(distance * 2)  # Assume 30 km/h average speed
        
        # Calculate average AQI along route
        mid_lat = (start_lat + end_lat) / 2
        mid_lon = (start_lon + end_lon) / 2
        mid_aqi_data = self.get_hyperlocal_aqi(mid_lat, mid_lon)
        avg_aqi = mid_aqi_data['aqi']
        
        # Create route segment
        segment = RouteSegment(
            start_lat, start_lon, end_lat, end_lon,
            avg_aqi, duration, distance, 'road'
        )
        
        # Calculate pollution exposure (AQI * duration)
        pollution_exposure = avg_aqi * (duration / 60)  # AQI-hours
        
        # Calculate route score (lower is better)
        route_score = pollution_exposure + (duration * 0.1)  # Penalty for longer duration
        
        return SafeRoute(
            segments=[segment],
            total_duration=duration,
            total_distance=distance,
            avg_aqi=avg_aqi,
            max_aqi=avg_aqi,
            pollution_exposure=pollution_exposure,
            route_score=route_score
        )
    
    def _generate_metro_route(self, start_lat: float, start_lon: float, 
                             end_lat: float, end_lon: float) -> Optional[SafeRoute]:
        """Generate metro route between two points"""
        
        # Find nearest metro stations
        start_station = self._find_nearest_metro_station(start_lat, start_lon)
        end_station = self._find_nearest_metro_station(end_lat, end_lon)
        
        if not start_station or not end_station:
            return None
        
        # Calculate walking time to/from stations
        walk_to_start = int(self._calculate_distance(start_lat, start_lon, 
                                                   start_station.latitude, start_station.longitude) * 10)
        walk_from_end = int(self._calculate_distance(end_station.latitude, end_station.longitude,
                                                   end_lat, end_lon) * 10)
        
        # Estimate metro travel time (simplified)
        metro_distance = self._calculate_distance(start_station.latitude, start_station.longitude,
                                                end_station.latitude, end_station.longitude)
        metro_time = int(metro_distance * 1.5)  # Assume 40 km/h metro speed
        
        total_duration = walk_to_start + metro_time + walk_from_end
        total_distance = (walk_to_start + walk_from_end) / 10 + metro_distance
        
        # Metro has lower AQI exposure
        metro_aqi = 180  # Typical metro AQI
        walking_aqi = 250  # Typical street-level AQI
        
        avg_aqi = (metro_aqi * metro_time + walking_aqi * (walk_to_start + walk_from_end)) / total_duration
        
        # Create segments
        segments = [
            RouteSegment(start_lat, start_lon, start_station.latitude, start_station.longitude,
                        walking_aqi, walk_to_start, walk_to_start/10, 'walking'),
            RouteSegment(start_station.latitude, start_station.longitude,
                        end_station.latitude, end_station.longitude,
                        metro_aqi, metro_time, metro_distance, 'metro'),
            RouteSegment(end_station.latitude, end_station.longitude, end_lat, end_lon,
                        walking_aqi, walk_from_end, walk_from_end/10, 'walking')
        ]
        
        pollution_exposure = (walking_aqi * (walk_to_start + walk_from_end) + metro_aqi * metro_time) / 60
        
        route_score = pollution_exposure + (total_duration * 0.05)  # Lower penalty for metro
        
        return SafeRoute(
            segments=segments,
            total_duration=total_duration,
            total_distance=total_distance,
            avg_aqi=avg_aqi,
            max_aqi=max(walking_aqi, metro_aqi),
            pollution_exposure=pollution_exposure,
            route_score=route_score
        )
    
    def _generate_green_route(self, start_lat: float, start_lon: float, 
                             end_lat: float, end_lon: float) -> Optional[SafeRoute]:
        """Generate route through green spaces and low-traffic areas"""
        
        # Simulate green route (through parks, residential areas)
        distance = self._calculate_distance(start_lat, start_lon, end_lat, end_lon)
        green_distance = distance * 1.3  # Green route is typically longer
        duration = int(green_distance * 2.5)  # Slower due to indirect route
        
        # Green routes have lower AQI
        green_aqi = 150  # Typical green corridor AQI
        
        segment = RouteSegment(
            start_lat, start_lon, end_lat, end_lon,
            green_aqi, duration, green_distance, 'road'
        )
        
        pollution_exposure = green_aqi * (duration / 60)
        route_score = pollution_exposure + (duration * 0.08)  # Moderate penalty for longer route
        
        return SafeRoute(
            segments=[segment],
            total_duration=duration,
            total_distance=green_distance,
            avg_aqi=green_aqi,
            max_aqi=green_aqi,
            pollution_exposure=pollution_exposure,
            route_score=route_score
        )
    
    def _generate_cycling_route(self, start_lat: float, start_lon: float, 
                               end_lat: float, end_lon: float) -> Optional[SafeRoute]:
        """Generate cycling route"""
        
        distance = self._calculate_distance(start_lat, start_lon, end_lat, end_lon)
        
        # Only recommend cycling for reasonable distances
        if distance > 15:
            return None
        
        # Cycling is faster than walking but slower than driving
        duration = int(distance * 4)  # Assume 15 km/h cycling speed
        
        # Cycling routes typically have moderate AQI
        cycling_aqi = 200
        
        segment = RouteSegment(
            start_lat, start_lon, end_lat, end_lon,
            cycling_aqi, duration, distance, 'cycling'
        )
        
        pollution_exposure = cycling_aqi * (duration / 60)
        route_score = pollution_exposure + (duration * 0.03)  # Low penalty for cycling
        
        return SafeRoute(
            segments=[segment],
            total_duration=duration,
            total_distance=distance,
            avg_aqi=cycling_aqi,
            max_aqi=cycling_aqi,
            pollution_exposure=pollution_exposure,
            route_score=route_score
        )
    
    def _generate_walking_route(self, start_lat: float, start_lon: float, 
                               end_lat: float, end_lon: float) -> Optional[SafeRoute]:
        """Generate walking route for short distances"""
        
        distance = self._calculate_distance(start_lat, start_lon, end_lat, end_lon)
        duration = int(distance * 12)  # Assume 5 km/h walking speed
        
        # Walking routes have higher AQI exposure
        walking_aqi = 250
        
        segment = RouteSegment(
            start_lat, start_lon, end_lat, end_lon,
            walking_aqi, duration, distance, 'walking'
        )
        
        pollution_exposure = walking_aqi * (duration / 60)
        route_score = pollution_exposure + (duration * 0.02)  # Very low penalty for walking
        
        return SafeRoute(
            segments=[segment],
            total_duration=duration,
            total_distance=distance,
            avg_aqi=walking_aqi,
            max_aqi=walking_aqi,
            pollution_exposure=pollution_exposure,
            route_score=route_score
        )
    
    def _find_nearest_metro_station(self, lat: float, lon: float) -> Optional[Location]:
        """Find nearest metro station"""
        min_distance = float('inf')
        nearest_station = None
        
        for station in self.metro_stations.values():
            distance = self._calculate_distance(lat, lon, station.latitude, station.longitude)
            if distance < min_distance and distance < 2.0:  # Within 2km
                min_distance = distance
                nearest_station = station
        
        return nearest_station
    
    def _create_air_quality_grid(self, center_lat: float, center_lon: float, 
                                grid_size: int) -> List[Dict]:
        """Create grid of points for neighborhood air quality mapping"""
        grid_points = []
        
        # Create grid around center point
        lat_step = 0.01  # Approximately 1km
        lon_step = 0.01
        
        for i in range(grid_size):
            for j in range(grid_size):
                lat = center_lat + (i - grid_size//2) * lat_step
                lon = center_lon + (j - grid_size//2) * lon_step
                
                grid_points.append({
                    'lat': lat,
                    'lon': lon
                })
        
        return grid_points
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in kilometers"""
        R = 6371  # Earth's radius in kilometers
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat/2) * math.sin(dlat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlon/2) * math.sin(dlon/2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return distance
    
    def _get_aqi_category(self, aqi: float) -> str:
        """Convert AQI to category"""
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
    
    def _get_health_recommendations(self, aqi: float) -> List[str]:
        """Get health recommendations based on AQI"""
        if aqi <= 50:
            return ["Enjoy outdoor activities", "Good air quality for everyone"]
        elif aqi <= 100:
            return ["Sensitive groups may experience minor breathing discomfort"]
        elif aqi <= 200:
            return ["Sensitive groups should limit outdoor activities", "Use N95 masks if needed"]
        elif aqi <= 300:
            return ["Avoid outdoor activities", "Keep windows closed", "Use air purifiers"]
        elif aqi <= 400:
            return ["Stay indoors", "Use N95 masks", "Run air purifiers continuously"]
        else:
            return ["Emergency conditions - avoid all outdoor activities", "Use HEPA air purifiers"]
    
    def _get_city_average_aqi(self) -> Dict:
        """Get city average AQI when no nearby stations"""
        avg_aqi = sum(station.aqi for station in self.monitoring_stations.values()) / len(self.monitoring_stations)
        
        return {
            'aqi': round(avg_aqi, 1),
            'category': self._get_aqi_category(avg_aqi),
            'pollutants': {'pm25': avg_aqi/2.5, 'pm10': avg_aqi/1.2},
            'confidence': 0.6,
            'note': 'City average - less precise than hyperlocal data'
        }
    
    def _get_neighborhood_recommendations(self, avg_aqi: float, min_aqi: float, max_aqi: float) -> List[str]:
        """Get recommendations for neighborhood air quality"""
        recommendations = []
        
        if avg_aqi > 200:
            recommendations.append("Consider indoor activities for the neighborhood")
        
        if max_aqi - min_aqi > 100:
            recommendations.append("Significant air quality variation - avoid high pollution areas")
        
        if min_aqi < 100:
            recommendations.append("Some areas have good air quality - plan activities there")
        
        return recommendations
    
    def _get_activity_specific_recommendations(self, activity_type: str, aqi: float, 
                                             duration: int) -> List[Dict]:
        """Get activity-specific recommendations"""
        recommendations = []
        
        if activity_type == 'running':
            if aqi > 150:
                recommendations.append({
                    'type': 'avoid',
                    'message': 'Avoid outdoor running due to poor air quality',
                    'alternative': 'Use indoor treadmill or gym'
                })
            elif aqi > 100:
                recommendations.append({
                    'type': 'caution',
                    'message': 'Reduce running intensity and duration',
                    'alternative': 'Consider indoor running'
                })
            else:
                recommendations.append({
                    'type': 'go',
                    'message': 'Good conditions for outdoor running',
                    'alternative': None
                })
        
        elif activity_type == 'cycling':
            if aqi > 200:
                recommendations.append({
                    'type': 'avoid',
                    'message': 'Avoid cycling due to high pollution',
                    'alternative': 'Use public transport or car'
                })
            elif aqi > 150:
                recommendations.append({
                    'type': 'caution',
                    'message': 'Wear N95 mask while cycling',
                    'alternative': 'Choose cycling routes through parks'
                })
            else:
                recommendations.append({
                    'type': 'go',
                    'message': 'Good conditions for cycling',
                    'alternative': None
                })
        
        elif activity_type == 'walking':
            if aqi > 300:
                recommendations.append({
                    'type': 'avoid',
                    'message': 'Avoid outdoor walking',
                    'alternative': 'Stay indoors or use covered areas'
                })
            elif aqi > 200:
                recommendations.append({
                    'type': 'caution',
                    'message': 'Limit walking time and wear mask',
                    'alternative': 'Choose walking routes through green spaces'
                })
            else:
                recommendations.append({
                    'type': 'go',
                    'message': 'Safe for walking',
                    'alternative': None
                })
        
        return recommendations
    
    def _find_safe_activity_locations(self, lat: float, lon: float, 
                                     activity_type: str, current_aqi: float) -> List[Dict]:
        """Find nearby safe locations for specific activities"""
        safe_locations = []
        
        # Find locations with better air quality
        for station in self.monitoring_stations.values():
            if station.aqi < current_aqi - 20:  # Significantly better air quality
                distance = self._calculate_distance(lat, lon, station.latitude, station.longitude)
                
                if distance < 5:  # Within 5km
                    safe_locations.append({
                        'name': station.name,
                        'latitude': station.latitude,
                        'longitude': station.longitude,
                        'aqi': station.aqi,
                        'distance_km': round(distance, 1),
                        'improvement': round(current_aqi - station.aqi, 1)
                    })
        
        return sorted(safe_locations, key=lambda x: x['distance_km'])[:3]
    
    def _get_time_based_recommendations(self, activity_type: str, current_aqi: float) -> List[Dict]:
        """Get time-based recommendations for activities"""
        recommendations = []
        current_hour = datetime.now().hour
        
        # Morning recommendations (6-10 AM)
        if 6 <= current_hour <= 10:
            if current_aqi > 200:
                recommendations.append({
                    'time': 'morning',
                    'recommendation': 'Air quality typically improves in early morning',
                    'best_time': '6:00-8:00 AM'
                })
        
        # Evening recommendations (6-10 PM)
        elif 18 <= current_hour <= 22:
            if current_aqi > 200:
                recommendations.append({
                    'time': 'evening',
                    'recommendation': 'Wait for evening when traffic decreases',
                    'best_time': '8:00-10:00 PM'
                })
        
        # Night recommendations (10 PM - 6 AM)
        else:
            recommendations.append({
                'time': 'night',
                'recommendation': 'Night time typically has better air quality',
                'best_time': '10:00 PM - 6:00 AM'
            })
        
        return recommendations
    
    def _calculate_health_impact(self, activity_type: str, aqi: float, duration: int) -> Dict:
        """Calculate health impact of activity in current air quality"""
        
        # Base exposure calculation
        exposure_factor = {
            'running': 2.0,
            'cycling': 1.5,
            'walking': 1.0,
            'standing': 0.5
        }.get(activity_type, 1.0)
        
        # Calculate effective exposure
        effective_exposure = aqi * exposure_factor * (duration / 60)  # AQI-hours
        
        # Determine health risk level
        if effective_exposure < 50:
            risk_level = 'low'
            impact = 'minimal'
        elif effective_exposure < 150:
            risk_level = 'moderate'
            impact = 'minor breathing discomfort possible'
        elif effective_exposure < 300:
            risk_level = 'high'
            impact = 'breathing difficulties, eye irritation'
        else:
            risk_level = 'severe'
            impact = 'serious health effects possible'
        
        return {
            'effective_exposure': round(effective_exposure, 1),
            'risk_level': risk_level,
            'health_impact': impact,
            'recommendation': self._get_health_impact_recommendation(risk_level)
        }
    
    def _get_health_impact_recommendation(self, risk_level: str) -> str:
        """Get recommendation based on health impact risk level"""
        recommendations = {
            'low': 'Safe to proceed with activity',
            'moderate': 'Consider reducing intensity or duration',
            'high': 'Avoid or postpone activity',
            'severe': 'Do not perform this activity outdoors'
        }
        
        return recommendations.get(risk_level, 'Consult healthcare provider')


# Initialize hyperlocal system
hyperlocal_system = HyperlocalAQISystem()

