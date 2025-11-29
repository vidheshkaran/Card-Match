"""
Health Guidance API - Mask Guidance and Safe Routes
Provides mask recommendations and safe route planning based on AQI
"""

from flask import Blueprint, jsonify, request
from datetime import datetime
import random

health_guidance_bp = Blueprint('health_guidance', __name__)

# ============================================================================
# MASK GUIDANCE
# ============================================================================

@health_guidance_bp.route('/mask-guidance')
def mask_guidance():
    """Get personalized mask guidance based on current AQI and user profile"""
    try:
        # Get query parameters
        aqi = request.args.get('aqi', type=int, default=287)
        user_profile = request.args.get('profile', default='general')  # general, sensitive, athlete, elderly
        
        # Determine mask recommendation based on AQI
        if aqi <= 50:
            mask_type = "No mask required"
            mask_level = "none"
            recommendation = "Air quality is good. No mask needed for outdoor activities."
            protection_level = "Not needed"
        elif aqi <= 100:
            mask_type = "Cloth mask (optional)"
            mask_level = "low"
            recommendation = "Air quality is satisfactory. Cloth mask optional for sensitive individuals."
            protection_level = "Basic"
        elif aqi <= 150:
            mask_type = "Surgical mask"
            mask_level = "medium"
            recommendation = "Air quality is moderate. Surgical mask recommended for outdoor activities."
            protection_level = "Moderate"
        elif aqi <= 200:
            mask_type = "N95 or KN95 mask"
            mask_level = "high"
            recommendation = "Air quality is unhealthy. N95/KN95 mask strongly recommended for all outdoor activities."
            protection_level = "High"
        elif aqi <= 300:
            mask_type = "N95 or N99 mask"
            mask_level = "very_high"
            recommendation = "Air quality is very poor. N95/N99 mask essential. Limit outdoor exposure."
            protection_level = "Very High"
        else:
            mask_type = "N99 or P100 respirator"
            mask_level = "critical"
            recommendation = "Air quality is hazardous. N99/P100 respirator required. Avoid outdoor activities if possible."
            protection_level = "Critical"
        
        # Adjust based on user profile
        profile_adjustments = {
            'sensitive': {
                'adjustment': 'Use one level higher protection',
                'additional_advice': 'Consider staying indoors during peak pollution hours (6-9 AM, 5-8 PM)'
            },
            'athlete': {
                'adjustment': 'Use N95 minimum for any outdoor exercise',
                'additional_advice': 'Move workouts indoors when AQI > 150'
            },
            'elderly': {
                'adjustment': 'Use N95 minimum, avoid outdoor activities when AQI > 200',
                'additional_advice': 'Keep windows closed and use air purifiers indoors'
            },
            'pregnant': {
                'adjustment': 'Use N95 minimum, limit outdoor exposure',
                'additional_advice': 'Consult with healthcare provider for specific guidance'
            },
            'child': {
                'adjustment': 'Use child-sized N95 mask, limit outdoor play',
                'additional_advice': 'Children are more vulnerable - keep indoors when AQI > 150'
            }
        }
        
        profile_info = profile_adjustments.get(user_profile, {
            'adjustment': 'Follow standard recommendations',
            'additional_advice': 'Monitor air quality regularly'
        })
        
        # Mask types with details
        mask_types_info = {
            'none': {
                'name': 'No mask required',
                'filtration': 'N/A',
                'fit': 'N/A',
                'when_to_use': 'AQI ≤ 50',
                'price_range': 'Free'
            },
            'low': {
                'name': 'Cloth mask',
                'filtration': '20-50%',
                'fit': 'Basic',
                'when_to_use': 'AQI 51-100',
                'price_range': '₹50-200'
            },
            'medium': {
                'name': 'Surgical mask',
                'filtration': '60-80%',
                'fit': 'Moderate',
                'when_to_use': 'AQI 101-150',
                'price_range': '₹100-300'
            },
            'high': {
                'name': 'N95/KN95 mask',
                'filtration': '95%+',
                'fit': 'Tight-fitting',
                'when_to_use': 'AQI 151-200',
                'price_range': '₹200-500'
            },
            'very_high': {
                'name': 'N95/N99 mask',
                'filtration': '95-99%',
                'fit': 'Tight-fitting with seal',
                'when_to_use': 'AQI 201-300',
                'price_range': '₹300-800'
            },
            'critical': {
                'name': 'N99/P100 respirator',
                'filtration': '99.97%+',
                'fit': 'Professional seal',
                'when_to_use': 'AQI > 300',
                'price_range': '₹500-2000'
            }
        }
        
        mask_details = mask_types_info.get(mask_level, mask_types_info['high'])
        
        # Usage tips
        usage_tips = [
            'Ensure mask covers nose and mouth completely',
            'Check for proper fit - no gaps around edges',
            'Replace mask if it becomes wet or damaged',
            'Wash reusable masks daily',
            'Store masks in clean, dry place',
            'Don\'t touch the mask while wearing it',
            'Remove mask by straps, not the front',
            'Dispose of single-use masks properly'
        ]
        
        # Where to buy (mock data)
        purchase_options = [
            {
                'store': 'Online - Amazon',
                'url': 'https://amazon.in/masks',
                'rating': 4.5,
                'price_range': mask_details['price_range']
            },
            {
                'store': 'Online - Flipkart',
                'url': 'https://flipkart.com/masks',
                'rating': 4.3,
                'price_range': mask_details['price_range']
            },
            {
                'store': 'Local Pharmacy',
                'url': None,
                'rating': None,
                'price_range': mask_details['price_range']
            },
            {
                'store': 'Medical Supply Store',
                'url': None,
                'rating': None,
                'price_range': mask_details['price_range']
            }
        ]
        
        return jsonify({
            'status': 'success',
            'current_aqi': aqi,
            'user_profile': user_profile,
            'recommendation': {
                'mask_type': mask_type,
                'mask_level': mask_level,
                'protection_level': protection_level,
                'message': recommendation
            },
            'mask_details': mask_details,
            'profile_adjustment': profile_info,
            'usage_tips': usage_tips,
            'purchase_options': purchase_options,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 200

# ============================================================================
# SAFE ROUTES
# ============================================================================

@health_guidance_bp.route('/safe-routes')
def safe_routes():
    """Get safe routes based on origin, destination, and current AQI data"""
    try:
        # Get query parameters
        origin = request.args.get('origin', default='Current Location')
        destination = request.args.get('destination', default='Connaught Place, Delhi')
        mode = request.args.get('mode', default='driving')  # driving, walking, cycling, metro
        
        # Mock route data with AQI information
        routes = []
        
        # Generate multiple route options
        route_modes = ['driving', 'metro', 'walking', 'cycling'] if mode == 'all' else [mode]
        
        for route_mode in route_modes:
            # Calculate route metrics based on mode
            base_distance = random.uniform(5, 25)  # km
            base_duration = random.uniform(15, 60)  # minutes
            
            if route_mode == 'metro':
                base_duration = base_duration * 0.7  # Metro is faster
                base_aqi = random.uniform(80, 120)  # Lower AQI in metro
            elif route_mode == 'walking':
                base_duration = base_duration * 2.5  # Walking is slower
                base_aqi = random.uniform(150, 250)  # Higher AQI when walking
            elif route_mode == 'cycling':
                base_duration = base_duration * 1.8  # Cycling is moderate speed
                base_aqi = random.uniform(120, 200)  # Moderate AQI
            else:  # driving
                base_aqi = random.uniform(180, 300)  # Higher AQI in traffic
            
            # Calculate safety score (lower AQI = higher score)
            safety_score = max(0, min(100, 100 - (base_aqi / 5)))
            
            # Determine route quality
            if safety_score >= 80:
                quality = 'Excellent'
                quality_color = '#10b981'
            elif safety_score >= 60:
                quality = 'Good'
                quality_color = '#3b82f6'
            elif safety_score >= 40:
                quality = 'Moderate'
                quality_color = '#f59e0b'
            else:
                quality = 'Poor'
                quality_color = '#ef4444'
            
            # Generate waypoints with AQI data
            waypoints = []
            num_waypoints = random.randint(2, 5)
            for i in range(num_waypoints):
                waypoint_aqi = base_aqi + random.uniform(-30, 30)
                waypoints.append({
                    'name': f'Waypoint {i+1}',
                    'aqi': round(waypoint_aqi),
                    'latitude': 28.6139 + random.uniform(-0.1, 0.1),
                    'longitude': 77.2090 + random.uniform(-0.1, 0.1)
                })
            
            routes.append({
                'id': f'route_{route_mode}_{len(routes)+1}',
                'mode': route_mode,
                'origin': origin,
                'destination': destination,
                'distance_km': round(base_distance, 1),
                'duration_minutes': round(base_duration),
                'estimated_aqi': round(base_aqi),
                'safety_score': round(safety_score, 1),
                'quality': quality,
                'quality_color': quality_color,
                'waypoints': waypoints,
                'pollution_hotspots': [
                    {
                        'name': 'ITO Junction',
                        'aqi': round(base_aqi + random.uniform(20, 50)),
                        'avoid': True if base_aqi > 200 else False
                    }
                ] if route_mode == 'driving' else [],
                'recommendations': [
                    f'Use {route_mode} mode for this route',
                    f'Expected AQI exposure: {round(base_aqi)}',
                    'Wear appropriate mask based on AQI level'
                ] if base_aqi > 150 else [
                    f'Route is safe for {route_mode}',
                    'Minimal mask protection needed'
                ]
            })
        
        # Sort routes by safety score (highest first)
        routes.sort(key=lambda x: x['safety_score'], reverse=True)
        
        return jsonify({
            'status': 'success',
            'origin': origin,
            'destination': destination,
            'routes': routes,
            'best_route': routes[0] if routes else None,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'routes': []
        }), 200

@health_guidance_bp.route('/safe-routes/quick')
def quick_safe_routes():
    """Get quick safe route recommendations for common destinations"""
    try:
        current_location = request.args.get('current', default='Current Location')
        
        # Common destinations in Delhi
        common_destinations = [
            {'name': 'Connaught Place', 'lat': 28.6315, 'lon': 77.2167, 'type': 'commercial'},
            {'name': 'India Gate', 'lat': 28.6129, 'lon': 77.2295, 'type': 'monument'},
            {'name': 'Delhi Metro Station', 'lat': 28.6139, 'lon': 77.2090, 'type': 'transport'},
            {'name': 'Lodi Gardens', 'lat': 28.5925, 'lon': 77.2197, 'type': 'park'},
            {'name': 'Akshardham Temple', 'lat': 28.6127, 'lon': 77.2773, 'type': 'religious'}
        ]
        
        quick_routes = []
        for dest in common_destinations:
            # Calculate quick route
            route_aqi = random.uniform(100, 200)
            safety_score = max(0, min(100, 100 - (route_aqi / 5)))
            
            quick_routes.append({
                'destination': dest['name'],
                'latitude': dest['lat'],
                'longitude': dest['lon'],
                'estimated_aqi': round(route_aqi),
                'safety_score': round(safety_score, 1),
                'best_mode': 'metro' if safety_score > 70 else 'driving',
                'estimated_time': random.randint(20, 45),
                'distance_km': round(random.uniform(5, 15), 1)
            })
        
        return jsonify({
            'status': 'success',
            'current_location': current_location,
            'quick_routes': quick_routes,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'quick_routes': []
        }), 200

