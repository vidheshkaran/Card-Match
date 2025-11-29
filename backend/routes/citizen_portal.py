from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import csv
import os
import random
import json
from utils.ai_models import PollutionForecaster, SourceIdentifier, PolicyRecommender

citizen_portal_bp = Blueprint('citizen_portal', __name__)

def read_csv_data(filename):
    data = []
    filepath = os.path.join(os.path.dirname(__file__), '..', 'data', filename)
    
    try:
        with open(filepath, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                data.append(row)
        return data
    except FileNotFoundError:
        print(f"Warning: Data file {filename} not found.")
        return []

@citizen_portal_bp.route('/reports')
def get_citizen_reports():
    data = read_csv_data('citizen_reports.csv')
    reports = []
    for row in data:
        reports.append({
            "title": row['issue_type'],
            "location": row['location'],
            "description": row['description'],
            "status": row['status'],
            "reporter": f"User {row['user_id']}",
            "timestamp": row['created_at']
        })
    return jsonify(reports)

@citizen_portal_bp.route('/alerts', methods=['GET'])
def get_community_alerts():
    """Get community alerts"""
    # Mock community alerts
    alerts = [
        {
            "title": "Health Advisory: High Pollution",
            "description": "AQI exceeding 300 in Central Delhi. Avoid outdoor activities.",
            "severity": "Critical",
            "issued": (datetime.now() - timedelta(hours=3)).isoformat(),
            "expires": (datetime.now() + timedelta(hours=20)).isoformat()
        },
        {
            "title": "Traffic Advisory",
            "description": "Major traffic congestion on NH8 causing elevated pollution levels.",
            "severity": "High",
            "issued": (datetime.now() - timedelta(hours=2, minutes=45)).isoformat(),
            "expires": (datetime.now() + timedelta(hours=2, minutes=45)).isoformat()
        },
        {
            "title": "Weekend Forecast",
            "description": "Pollution levels expected to improve over the weekend due to wind changes.",
            "severity": "Medium",
            "issued": (datetime.now() - timedelta(hours=19, minutes=15)).isoformat(),
            "expires": (datetime.now() + timedelta(days=2)).isoformat()
        }
    ]
    return jsonify(alerts)

@citizen_portal_bp.route('/create-alert', methods=['POST', 'OPTIONS'])
def create_alert():
    """Create a new alert for a station"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    try:
        # Get request data - handle multiple formats
        data = {}
        
        if request.is_json:
            data = request.get_json() or {}
        elif request.form:
            data = request.form.to_dict()
        elif request.data:
            try:
                import json
                data = json.loads(request.data.decode('utf-8'))
            except:
                pass
        
        print(f"[CREATE-ALERT] Received request: {request.method}")
        print(f"[CREATE-ALERT] Content-Type: {request.content_type}")
        print(f"[CREATE-ALERT] Data: {data}")
        
        # Extract and validate data with defaults
        station_id = str(data.get('station_id') or data.get('stationId') or 'unknown')
        station_name = str(data.get('station_name') or data.get('stationName') or 'Unknown Station')
        
        # Validate threshold
        threshold_raw = data.get('threshold', 150)
        try:
            threshold = int(float(threshold_raw))  # Handle string numbers
        except (ValueError, TypeError):
            print(f"[CREATE-ALERT] Invalid threshold: {threshold_raw}")
            return jsonify({
                'success': False,
                'error': 'Invalid threshold value. Must be a number between 0 and 500.'
            }), 400
        
        if threshold < 0 or threshold > 500:
            return jsonify({
                'success': False,
                'error': 'Threshold must be between 0 and 500'
            }), 400
        
        # Get boolean values
        enable_notifications = bool(data.get('enable_notifications') or data.get('enableNotifications') or False)
        enable_email = bool(data.get('enable_email') or data.get('enableEmail') or False)
        
        # Get current AQI
        current_aqi_raw = data.get('current_aqi') or data.get('currentAqi') or 0
        try:
            current_aqi = int(float(current_aqi_raw))
        except (ValueError, TypeError):
            current_aqi = 0
        
        # Store alert (in a real app, this would be saved to a database)
        alert_id = f"alert_{station_id}_{int(datetime.now().timestamp())}"
        
        print(f"[CREATE-ALERT] Creating alert: {alert_id}")
        print(f"[CREATE-ALERT] Station: {station_name} ({station_id})")
        print(f"[CREATE-ALERT] Threshold: {threshold}, Current AQI: {current_aqi}")
        print(f"[CREATE-ALERT] Notifications: {enable_notifications}, Email: {enable_email}")
        
        response_data = {
            'success': True,
            'alert_id': alert_id,
            'message': f'Alert set for {station_name} when AQI exceeds {threshold}',
            'alert': {
                'id': alert_id,
                'station_id': station_id,
                'station_name': station_name,
                'threshold': threshold,
                'current_aqi': current_aqi,
                'enable_notifications': enable_notifications,
                'enable_email': enable_email,
                'created_at': datetime.now().isoformat(),
                'status': 'active'
            }
        }
        
        print(f"[CREATE-ALERT] Success! Returning response: {response_data}")
        
        response = jsonify(response_data)
        response.status_code = 201
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except ValueError as e:
        print(f"[CREATE-ALERT] ValueError: {e}")
        return jsonify({
            'success': False,
            'error': f'Invalid data format: {str(e)}'
        }), 400
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[CREATE-ALERT] Exception: {e}")
        print(f"[CREATE-ALERT] Traceback:\n{error_trace}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'An error occurred while saving the alert'
        }), 500

def get_community_alerts():
    # Mock community alerts
    alerts = [
        {
            "title": "Health Advisory: High Pollution",
            "description": "AQI exceeding 300 in Central Delhi. Avoid outdoor activities.",
            "severity": "Critical",
            "issued": (datetime.now() - timedelta(hours=3)).isoformat(),
            "expires": (datetime.now() + timedelta(hours=20)).isoformat()
        },
        {
            "title": "Traffic Advisory",
            "description": "Major traffic congestion on NH8 causing elevated pollution levels.",
            "severity": "High",
            "issued": (datetime.now() - timedelta(hours=2, minutes=45)).isoformat(),
            "expires": (datetime.now() + timedelta(hours=2, minutes=45)).isoformat()
        },
        {
            "title": "Weekend Forecast",
            "description": "Pollution levels expected to improve over the weekend due to wind changes.",
            "severity": "Medium",
            "issued": (datetime.now() - timedelta(hours=19, minutes=15)).isoformat(),
            "expires": (datetime.now() + timedelta(days=2)).isoformat()
        }
    ]
    return jsonify(alerts)

@citizen_portal_bp.route('/initiatives')
def get_community_initiatives():
    # Mock community initiatives
    initiatives = [
        {
            "name": "Tree Plantation Drive",
            "description": "Join us in planting 5000 trees across Delhi-NCR",
            "participants": 243,
            "icon": "tree"
        },
        {
            "name": "Car-Free Day",
            "description": "Pledge to not use your car every Tuesday",
            "participants": 1847,
            "icon": "car"
        },
        {
            "name": "School Awareness",
            "description": "Educational program for schools about air pollution",
            "participants": 56,
            "icon": "school"
        }
    ]
    return jsonify(initiatives)

@citizen_portal_bp.route('/submit-report', methods=['POST'])
def submit_report():
    # In a real implementation, this would save the report to the CSV
    data = request.json
    return jsonify({"message": "Report submitted successfully", "id": 12345})

@citizen_portal_bp.route('/hyperlocal-aqi')
def hyperlocal_aqi():
    """Get hyperlocal AQI data for citizen portal"""
    # Get user location from request parameters (in real app, from GPS or user input)
    user_lat = request.args.get('lat', '28.6139')  # Default to Delhi coordinates
    user_lon = request.args.get('lon', '77.2090')
    
    # Get nearest monitoring stations and IoT sensors
    aqi_data = read_csv_data('aqi_readings.csv')
    iot_data = read_csv_data('iot_sensors.csv')
    
    # Find nearest stations (simplified - in real app, use proper distance calculation)
    nearest_stations = []
    for station in aqi_data[:5]:  # Get 5 nearest stations
        nearest_stations.append({
            "station_id": station['station_id'],
            "location": station['station_id'].replace('_', ' ').title(),
            "aqi": int(station['aqi']),
            "pm25": float(station['pm25']),
            "pm10": float(station['pm10']),
            "category": station['category'],
            "distance": f"{1.2 + len(nearest_stations) * 0.5:.1f} km",  # Mock distance
            "last_updated": station['timestamp']
        })
    
    # Get hyperlocal IoT data
    hyperlocal_sensors = []
    for sensor in iot_data[:3]:  # Get 3 nearest sensors
        hyperlocal_sensors.append({
            "sensor_id": sensor['sensor_id'],
            "location": sensor['location'].replace('_', ' ').title(),
            "aqi": round(max(float(sensor['pm25']) * 2.5, float(sensor['pm10']) * 1.2)),
            "pm25": float(sensor['pm25']),
            "pm10": float(sensor['pm10']),
            "traffic_density": float(sensor['traffic_density']),
            "status": sensor['status'],
            "last_updated": sensor['timestamp']
        })
    
    # Calculate average hyperlocal AQI
    all_aqi_values = [station['aqi'] for station in nearest_stations] + [sensor['aqi'] for sensor in hyperlocal_sensors]
    avg_aqi = sum(all_aqi_values) / len(all_aqi_values)
    
    # Generate health recommendations
    health_recommendations = generate_health_recommendations(avg_aqi)
    
    return jsonify({
        "user_location": {
            "latitude": user_lat,
            "longitude": user_lon,
            "area": "Delhi-NCR"
        },
        "hyperlocal_aqi": {
            "current_aqi": round(avg_aqi),
            "category": get_aqi_category(avg_aqi),
            "primary_pollutant": "PM2.5",
            "last_updated": datetime.now().isoformat()
        },
        "nearest_stations": nearest_stations,
        "hyperlocal_sensors": hyperlocal_sensors,
        "health_recommendations": health_recommendations,
        "air_quality_trend": "deteriorating",  # Could be calculated from historical data
        "recommended_actions": get_recommended_actions(avg_aqi)
    })

def get_aqi_category(aqi):
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

def generate_health_recommendations(aqi):
    """Generate personalized health recommendations based on AQI"""
    recommendations = []
    
    if aqi > 300:
        recommendations.extend([
            {
                "group": "General Population",
                "recommendation": "Avoid outdoor activities completely",
                "severity": "Critical"
            },
            {
                "group": "Sensitive Groups",
                "recommendation": "Stay indoors with air purifiers",
                "severity": "Critical"
            },
            {
                "group": "Children & Elderly",
                "recommendation": "Postpone outdoor activities",
                "severity": "Critical"
            }
        ])
    elif aqi > 200:
        recommendations.extend([
            {
                "group": "General Population",
                "recommendation": "Limit outdoor activities",
                "severity": "High"
            },
            {
                "group": "Sensitive Groups",
                "recommendation": "Avoid outdoor activities",
                "severity": "High"
            },
            {
                "group": "Children & Elderly",
                "recommendation": "Minimize outdoor exposure",
                "severity": "High"
            }
        ])
    elif aqi > 100:
        recommendations.extend([
            {
                "group": "Sensitive Groups",
                "recommendation": "Limit outdoor activities",
                "severity": "Medium"
            },
            {
                "group": "General Population",
                "recommendation": "Outdoor activities generally okay",
                "severity": "Low"
            }
        ])
    else:
        recommendations.append({
            "group": "All Groups",
            "recommendation": "Enjoy outdoor activities",
            "severity": "None"
        })
    
    return recommendations

def get_recommended_actions(aqi):
    """Get recommended actions based on AQI level"""
    actions = []
    
    if aqi > 200:
        actions.extend([
            "Use N95 masks when going outside",
            "Keep windows and doors closed",
            "Use air purifiers indoors",
            "Avoid outdoor exercise",
            "Limit time spent in traffic"
        ])
    elif aqi > 100:
        actions.extend([
            "Sensitive groups should limit outdoor activities",
            "Consider using air purifiers",
            "Avoid outdoor exercise during peak hours"
        ])
    else:
        actions.extend([
            "Outdoor activities are generally safe",
            "Good time for outdoor exercise",
            "Consider opening windows for ventilation"
        ])
    
    return actions

@citizen_portal_bp.route('/safe-routes')
def safe_routes():
    """Get safe route suggestions for citizens"""
    route_data = read_csv_data('safe_routes.csv')
    
    # Get user preferences from request
    route_type = request.args.get('type', 'all')  # walking, cycling, driving, all
    time_preference = request.args.get('time', 'any')  # morning, evening, any
    
    safe_routes = []
    for row in route_data:
        if route_type != 'all' and route_type not in row['route_type']:
            continue
            
        # Calculate route safety score
        aqi_score = float(row['avg_aqi'])
        traffic_score = float(row['traffic_density'])
        green_score = float(row['green_coverage'])
        
        safety_score = calculate_route_safety(aqi_score, traffic_score, green_score)
        
        route_info = {
            "route_id": row['id'],
            "origin": row['origin'].replace('_', ' '),
            "destination": row['destination'].replace('_', ' '),
            "route_type": row['route_type'],
            "safety_score": safety_score,
            "avg_aqi": int(float(row['avg_aqi'])),
            "pm25_level": float(row['pm25_level']),
            "pm10_level": float(row['pm10_level']),
            "traffic_density": f"{float(row['traffic_density'])*100:.0f}%",
            "green_coverage": f"{float(row['green_coverage'])*100:.0f}%",
            "recommended_time": row['recommended_time'],
            "duration": f"{row['duration_minutes']} minutes",
            "health_benefit": calculate_health_benefit(safety_score),
            "alternative_routes": get_alternative_routes(row['origin'], row['destination'])
        }
        
        safe_routes.append(route_info)
    
    # Sort by safety score
    safe_routes.sort(key=lambda x: x['safety_score'], reverse=True)
    
    return jsonify({
        "safe_routes": safe_routes[:10],  # Top 10 safest routes
        "recommendations": {
            "best_time_for_exercise": "Morning (6-8 AM)" if datetime.now().hour < 12 else "Evening (6-8 PM)",
            "best_route_type": "Walking" if safe_routes[0]['route_type'] == 'walking' else "Cycling",
            "avoid_times": "Peak hours (8-10 AM, 6-8 PM)"
        },
        "air_quality_tips": [
            "Choose routes with maximum green coverage",
            "Avoid main roads during peak traffic hours",
            "Use cycling tracks and pedestrian paths",
            "Check real-time AQI before heading out"
        ]
    })

def calculate_route_safety(aqi, traffic_density, green_coverage):
    """Calculate route safety score (0-100)"""
    # Lower AQI is better, lower traffic is better, higher green coverage is better
    aqi_score = max(0, 100 - aqi * 0.3)  # Convert AQI to score
    traffic_score = max(0, 100 - traffic_density * 100)  # Convert traffic density to score
    green_score = green_coverage * 100  # Green coverage is already 0-1
    
    # Weighted average
    safety_score = (aqi_score * 0.5 + traffic_score * 0.3 + green_score * 0.2)
    return round(min(100, max(0, safety_score)))

def calculate_health_benefit(safety_score):
    """Calculate health benefit of taking this route"""
    if safety_score >= 80:
        return "Excellent - Significant health benefits"
    elif safety_score >= 60:
        return "Good - Moderate health benefits"
    elif safety_score >= 40:
        return "Fair - Some health benefits"
    else:
        return "Poor - Limited health benefits"

def get_alternative_routes(origin, destination):
    """Get alternative routes for the same origin-destination"""
    # In a real implementation, this would query a routing database
    alternatives = [
        {
            "type": "Public Transport",
            "aqi": "Moderate",
            "duration": "25 minutes",
            "safety_score": 75
        },
        {
            "type": "Main Road",
            "aqi": "Poor", 
            "duration": "15 minutes",
            "safety_score": 45
        }
    ]
    return alternatives

@citizen_portal_bp.route('/health-alerts')
def health_alerts():
    """Get personalized health alerts for citizens"""
    health_data = read_csv_data('health_alerts.csv')
    aqi_data = read_csv_data('aqi_readings.csv')
    
    current_aqi = int(aqi_data[0]['aqi']) if aqi_data else 200
    
    # Find relevant health alerts based on current AQI
    relevant_alerts = []
    for row in health_data:
        aqi_min, aqi_max = map(int, row['aqi_range'].split('-'))
        if aqi_min <= current_aqi <= aqi_max:
            relevant_alerts.append({
                "category": row['category'],
                "health_advisory": row['health_advisory'],
                "recommended_actions": row['recommended_actions'].split(',') if ',' in row['recommended_actions'] else [row['recommended_actions']],
                "affected_groups": row['affected_groups'].split(',') if ',' in row['affected_groups'] else [row['affected_groups']],
                "severity": get_severity_from_aqi(current_aqi),
                "timestamp": row['timestamp']
            })
    
    # Generate additional personalized alerts
    personalized_alerts = generate_personalized_alerts(current_aqi)
    
    return jsonify({
        "current_aqi": current_aqi,
        "aqi_category": get_aqi_category(current_aqi),
        "general_alerts": relevant_alerts,
        "personalized_alerts": personalized_alerts,
        "emergency_contacts": {
            "health_helpline": "+91-11-23978046",
            "pollution_control": "+91-11-23388111",
            "emergency": "108"
        },
        "last_updated": datetime.now().isoformat()
    })

def get_severity_from_aqi(aqi):
    """Get severity level from AQI value"""
    if aqi > 300:
        return "Critical"
    elif aqi > 200:
        return "High"
    elif aqi > 100:
        return "Medium"
    else:
        return "Low"

def generate_personalized_alerts(aqi):
    """Generate personalized alerts based on current conditions"""
    alerts = []
    
    if aqi > 300:
        alerts.extend([
            {
                "type": "Emergency",
                "title": "Severe Pollution Alert",
                "message": "Air quality is hazardous. Stay indoors immediately.",
                "action_required": "Immediate",
                "icon": "exclamation-triangle"
            },
            {
                "type": "Health",
                "title": "Respiratory Protection",
                "message": "Use N95 masks if you must go outside.",
                "action_required": "High",
                "icon": "mask"
            }
        ])
    elif aqi > 200:
        alerts.extend([
            {
                "type": "Warning",
                "title": "Poor Air Quality",
                "message": "Limit outdoor activities and use air purifiers.",
                "action_required": "Medium",
                "icon": "warning"
            }
        ])
    
    # Add time-based alerts
    current_hour = datetime.now().hour
    if 8 <= current_hour <= 10 or 18 <= current_hour <= 20:
        alerts.append({
            "type": "Traffic",
            "title": "Peak Traffic Hours",
            "message": "Traffic congestion may worsen air quality in your area.",
            "action_required": "Low",
            "icon": "car"
        })
    
    return alerts

@citizen_portal_bp.route('/nearby-facilities')
def nearby_facilities():
    """Get nearby health facilities and air quality resources"""
    facilities = [
        {
            "type": "Hospital",
            "name": "AIIMS Delhi",
            "distance": "2.3 km",
            "specialty": "Respiratory Medicine",
            "contact": "+91-11-26588500",
            "rating": 4.8
        },
        {
            "type": "Air Purifier Store",
            "name": "Crompton Air Purifiers",
            "distance": "1.5 km", 
            "specialty": "Air Purifiers & Filters",
            "contact": "+91-11-23456789",
            "rating": 4.2
        },
        {
            "type": "Pharmacy",
            "name": "Apollo Pharmacy",
            "distance": "0.8 km",
            "specialty": "Respiratory Medications",
            "contact": "+91-11-23789012",
            "rating": 4.5
        },
        {
            "type": "Emergency",
            "name": "Delhi Police Control Room",
            "distance": "1.2 km",
            "specialty": "Emergency Services",
            "contact": "100",
            "rating": 4.0
        }
    ]
    
    return jsonify({
        "facilities": facilities,
        "recommendations": [
            "Keep emergency contacts handy",
            "Stock up on N95 masks and air purifier filters",
            "Know the location of nearest hospitals",
            "Download health monitoring apps"
        ]
    })

@citizen_portal_bp.route('/hyperlocal-dashboard')
def hyperlocal_dashboard():
    """Comprehensive hyperlocal dashboard for citizens"""
    try:
        # Initialize AI models
        forecaster = PollutionForecaster()
        source_identifier = SourceIdentifier()
        
        # Get user location from request or use default
        user_lat = request.args.get('lat', 28.6139)  # Default to Delhi
        user_lon = request.args.get('lon', 77.2090)
        
        # Get data
        aqi_data = read_csv_data('aqi_readings.csv')
        iot_sensors = read_csv_data('iot_sensors.csv')
        health_alerts = read_csv_data('health_alerts.csv')
        safe_routes = read_csv_data('safe_routes.csv')
        citizen_reports = read_csv_data('citizen_reports.csv')
        
        if not aqi_data:
            return jsonify({"error": "No AQI data available"})
        
        # Calculate hyperlocal AQI (simplified distance-based)
        closest_station = aqi_data[0]  # Simplified for demo
        hyperlocal_aqi = float(closest_station['aqi'])
        
        # Get nearby IoT sensor data
        nearby_sensors = []
        for sensor in iot_sensors:
            sensor_aqi = max(float(sensor['pm25']) * 2.5, float(sensor['pm10']) * 1.2)
            nearby_sensors.append({
                "sensor_id": sensor['sensor_id'],
                "location": sensor['location'].replace('_', ' ').title(),
                "aqi": round(sensor_aqi),
                "pm25": float(sensor['pm25']),
                "pm10": float(sensor['pm10']),
                "distance_km": round(random.uniform(0.5, 5.0), 1),
                "status": sensor['status']
            })
        
        # Generate personalized health recommendations
        health_recommendations = []
        aqi_category = get_aqi_category(hyperlocal_aqi)
        
        if hyperlocal_aqi > 200:
            health_recommendations.extend([
                {
                    "type": "emergency",
                    "title": "Stay Indoors",
                    "description": "AQI is in hazardous range. Avoid all outdoor activities.",
                    "priority": "critical",
                    "icon": "fas fa-home"
                },
                {
                    "type": "health",
                    "title": "Use Air Purifiers",
                    "description": "Keep indoor air clean with HEPA filters.",
                    "priority": "high",
                    "icon": "fas fa-wind"
                }
            ])
        elif hyperlocal_aqi > 100:
            health_recommendations.extend([
                {
                    "type": "activity",
                    "title": "Limit Outdoor Exercise",
                    "description": "Postpone jogging and outdoor sports.",
                    "priority": "medium",
                    "icon": "fas fa-running"
                },
                {
                    "type": "protection",
                    "title": "Wear N95 Masks",
                    "description": "Use proper respiratory protection when outdoors.",
                    "priority": "medium",
                    "icon": "fas fa-mask"
                }
            ])
        
        # Generate safe routes
        safe_route_options = []
        for route in safe_routes:
            route_safety = calculate_route_safety(float(route['avg_aqi']))
            safe_route_options.append({
                "origin": route['origin'],
                "destination": route['destination'],
                "type": route['route_type'],
                "distance_km": float(route['duration_minutes']),  # Using as distance for demo
                "aqi_score": float(route['avg_aqi']),
                "safety_score": route_safety,
                "health_benefit": calculate_health_benefit(route_safety),
                "estimated_time": f"{random.randint(15, 45)} minutes",
                "recommendation": "Recommended" if route_safety > 80 else "Alternative route available"
            })
        
        # Community insights
        community_stats = {
            "total_users_in_area": random.randint(500, 2000),
            "active_reports_24h": len([r for r in citizen_reports if '2024-01-15' in r.get('timestamp', '')]),
            "average_community_aqi": round(hyperlocal_aqi + random.uniform(-20, 20)),
            "pollution_trend": random.choice(["improving", "stable", "worsening"]),
            "top_concerns": ["Respiratory issues", "Outdoor activities", "Children's health"]
        }
        
        # Personalized insights
        personalized_insights = {
            "your_risk_level": "High" if hyperlocal_aqi > 200 else "Medium" if hyperlocal_aqi > 100 else "Low",
            "recommended_activities": get_recommended_activities(hyperlocal_aqi),
            "best_times_to_go_out": get_best_outdoor_times(),
            "nearby_clean_areas": get_nearby_clean_areas(),
            "air_quality_forecast": {
                "next_6_hours": "Improving" if random.random() > 0.5 else "Stable",
                "tomorrow": "Better" if random.random() > 0.5 else "Similar",
                "confidence": random.randint(75, 95)
            }
        }
        
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "user_location": {
                "latitude": float(user_lat),
                "longitude": float(user_lon),
                "location_name": "Delhi-NCR"
            },
            "hyperlocal_aqi": {
                "current_aqi": hyperlocal_aqi,
                "category": aqi_category,
                "primary_pollutant": closest_station.get('primary_pollutant', 'PM2.5'),
                "last_updated": datetime.now().isoformat(),
                "confidence": 92.5
            },
            "nearby_sensors": nearby_sensors,
            "health_recommendations": health_recommendations,
            "safe_routes": safe_route_options,
            "community_stats": community_stats,
            "personalized_insights": personalized_insights,
            "emergency_contacts": {
                "health_helpline": "104",
                "emergency": "112",
                "pollution_control_board": "011-2380-2401",
                "air_quality_alert": "011-2397-8000"
            }
        })
        
    except Exception as e:
        print(f"Error in hyperlocal_dashboard: {e}")
        return jsonify({"error": "Failed to retrieve hyperlocal dashboard", "details": str(e)}), 500

@citizen_portal_bp.route('/community-engagement')
def community_engagement():
    """Community engagement features and gamification"""
    try:
        # Get community data
        citizen_reports = read_csv_data('citizen_reports.csv')
        
        # Mock user data (in real app, this would come from user session)
        user_id = request.args.get('user_id', 'user_123')
        
        # Community challenges
        challenges = [
            {
                "id": "clean_air_week",
                "title": "Clean Air Week Challenge",
                "description": "Report air quality issues in your area",
                "progress": 75,
                "target": 100,
                "reward": "Clean Air Champion Badge",
                "deadline": (datetime.now() + timedelta(days=7)).isoformat(),
                "participants": 1250
            },
            {
                "id": "eco_warrior",
                "title": "Eco Warrior Challenge",
                "description": "Complete 10 environmental actions",
                "progress": 6,
                "target": 10,
                "reward": "Eco Warrior Badge + 500 points",
                "deadline": (datetime.now() + timedelta(days=14)).isoformat(),
                "participants": 890
            },
            {
                "id": "health_advocate",
                "title": "Health Advocate Challenge",
                "description": "Share health tips with community",
                "progress": 3,
                "target": 5,
                "reward": "Health Advocate Badge",
                "deadline": (datetime.now() + timedelta(days=10)).isoformat(),
                "participants": 567
            }
        ]
        
        # Leaderboard
        leaderboard = [
            {"rank": 1, "username": "EcoWarrior7", "points": 12345, "badges": 12, "location": "South Delhi"},
            {"rank": 2, "username": "GreenCitizen", "points": 11200, "badges": 10, "location": "Central Delhi"},
            {"rank": 3, "username": "AirGuardian", "points": 9850, "badges": 9, "location": "East Delhi"},
            {"rank": 4, "username": "CleanAirHero", "points": 9200, "badges": 8, "location": "West Delhi"},
            {"rank": 5, "username": "PollutionFighter", "points": 8750, "badges": 7, "location": "North Delhi"}
        ]
        
        # User achievements
        user_achievements = [
            {
                "badge": "First Report",
                "description": "Submitted your first pollution report",
                "earned_date": "2024-01-10",
                "icon": "fas fa-flag"
            },
            {
                "badge": "Community Helper",
                "description": "Helped 5 community members",
                "earned_date": "2024-01-12",
                "icon": "fas fa-hands-helping"
            },
            {
                "badge": "Data Contributor",
                "description": "Contributed to 20 data points",
                "earned_date": "2024-01-14",
                "icon": "fas fa-chart-line"
            }
        ]
        
        # Community discussions
        discussions = [
            {
                "id": "disc_1",
                "title": "Best air purifiers for Delhi homes",
                "author": "CleanAirLover",
                "replies": 23,
                "views": 456,
                "last_activity": (datetime.now() - timedelta(hours=2)).isoformat(),
                "tags": ["air-purifier", "home", "recommendations"]
            },
            {
                "id": "disc_2",
                "title": "Indoor plants that help with air quality",
                "author": "PlantParent",
                "replies": 18,
                "views": 234,
                "last_activity": (datetime.now() - timedelta(hours=5)).isoformat(),
                "tags": ["plants", "indoor", "air-quality"]
            },
            {
                "id": "disc_3",
                "title": "Morning jogging routes with better air quality",
                "author": "FitnessFanatic",
                "replies": 31,
                "views": 567,
                "last_activity": (datetime.now() - timedelta(hours=1)).isoformat(),
                "tags": ["exercise", "routes", "health"]
            }
        ]
        
        # Community impact metrics
        community_impact = {
            "total_reports_submitted": len(citizen_reports),
            "issues_resolved": len([r for r in citizen_reports if r.get('status') == 'Resolved']),
            "community_engagement_score": 85.2,
            "active_contributors": 1250,
            "total_points_earned": 456789,
            "environmental_actions_taken": 2340
        }
        
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "challenges": challenges,
            "leaderboard": leaderboard,
            "user_achievements": user_achievements,
            "discussions": discussions,
            "community_impact": community_impact,
            "gamification_stats": {
                "user_level": "Air Quality Expert",
                "user_points": 8750,
                "user_badges": 7,
                "next_level_points": 1250,
                "contribution_streak": 12
            }
        })
        
    except Exception as e:
        print(f"Error in community_engagement: {e}")
        return jsonify({"error": "Failed to retrieve community engagement data", "details": str(e)}), 500

def get_recommended_activities(aqi_value):
    """Get recommended activities based on AQI"""
    if aqi_value <= 50:
        return ["Outdoor exercise", "Walking", "Cycling", "Picnics", "Gardening"]
    elif aqi_value <= 100:
        return ["Light outdoor activities", "Walking", "Indoor exercise"]
    elif aqi_value <= 150:
        return ["Indoor activities", "Gym workouts", "Swimming", "Mall walking"]
    elif aqi_value <= 200:
        return ["Indoor activities only", "Home workouts", "Reading", "Indoor games"]
    else:
        return ["Stay indoors", "Use air purifiers", "Avoid physical exertion"]

def get_best_outdoor_times():
    """Get best times for outdoor activities"""
    return {
        "morning": "6:00 AM - 8:00 AM",
        "evening": "6:00 PM - 8:00 PM",
        "reason": "Lower traffic and better dispersion",
        "avoid": "10:00 AM - 4:00 PM (peak pollution hours)"
    }

def get_nearby_clean_areas():
    """Get nearby areas with better air quality"""
    return [
        {"name": "Lodi Gardens", "distance": "2.5 km", "aqi": 85, "type": "Park"},
        {"name": "India Gate Lawns", "distance": "3.2 km", "aqi": 92, "type": "Open Space"},
        {"name": "Delhi Ridge", "distance": "5.8 km", "aqi": 78, "type": "Forest Area"},
        {"name": "Yamuna Riverfront", "distance": "4.1 km", "aqi": 88, "type": "Waterfront"}
    ]