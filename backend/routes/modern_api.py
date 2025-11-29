# Modern API endpoints for enhanced AirWatch AI features

from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import random
import json
from utils.csv_data import read_csv_data
from utils.ai_models import PollutionForecaster, SourceIdentifier, PolicyRecommender

modern_api_bp = Blueprint('modern_api', __name__)

@modern_api_bp.route('/dashboard/overview')
def dashboard_overview():
    """Get comprehensive dashboard overview data"""
    try:
        # Read current AQI data
        aqi_data = read_csv_data('aqi_readings.csv')
        current_station = aqi_data[0] if aqi_data else {}
        
        # Calculate trends
        recent_readings = aqi_data[:24] if len(aqi_data) >= 24 else aqi_data
        avg_aqi = sum(float(r['aqi']) for r in recent_readings) / len(recent_readings) if recent_readings else 0
        
        # Get alerts count
        alerts_count = random.randint(8, 15)
        
        # Get monitoring stations count
        stations_count = len(aqi_data)
        
        return jsonify({
            "current_aqi": {
                "value": float(current_station.get('aqi', 287)),
                "category": get_aqi_category(float(current_station.get('aqi', 287))),
                "trend": "increasing" if avg_aqi > 280 else "stable",
                "change": f"+{random.randint(5, 15)}",
                "timestamp": current_station.get('timestamp', datetime.now().isoformat())
            },
            "alerts": {
                "active": alerts_count,
                "critical": random.randint(2, 5),
                "warning": alerts_count - random.randint(2, 5),
                "info": random.randint(3, 8)
            },
            "monitoring": {
                "stations": stations_count,
                "active": stations_count - random.randint(1, 3),
                "coverage": f"{((stations_count - random.randint(1, 3)) / stations_count * 100):.1f}%" if stations_count > 0 else "95.2%"
            },
            "forecast": {
                "next_24h": "Poor to Very Poor",
                "confidence": random.randint(85, 95),
                "primary_concern": "Stubble Burning"
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@modern_api_bp.route('/alerts/realtime')
def realtime_alerts():
    """Get real-time pollution alerts"""
    alerts = [
        {
            "id": 1,
            "type": "critical",
            "title": "High AQI Alert",
            "message": "AQI levels have reached 287 in Central Delhi. Limit outdoor activities.",
            "location": "Central Delhi",
            "severity": "High",
            "timestamp": (datetime.now() - timedelta(minutes=5)).isoformat(),
            "action_required": True,
            "affected_areas": ["Central Delhi", "East Delhi"],
            "recommendations": [
                "Avoid outdoor activities",
                "Use N95 masks",
                "Keep windows closed"
            ]
        },
        {
            "id": 2,
            "type": "warning",
            "title": "Stubble Burning Detected",
            "message": "Satellite imagery shows active fires in Haryana region.",
            "location": "Haryana",
            "severity": "Medium",
            "timestamp": (datetime.now() - timedelta(minutes=15)).isoformat(),
            "action_required": False,
            "affected_areas": ["North Delhi", "West Delhi"],
            "recommendations": [
                "Monitor AQI levels",
                "Consider indoor activities",
                "Check air purifiers"
            ]
        },
        {
            "id": 3,
            "type": "info",
            "title": "Weather Update",
            "message": "Wind speed decreased to 8 km/h, pollution may persist.",
            "location": "Delhi-NCR",
            "severity": "Low",
            "timestamp": (datetime.now() - timedelta(minutes=30)).isoformat(),
            "action_required": False,
            "affected_areas": ["All areas"],
            "recommendations": [
                "Plan indoor activities",
                "Use air purifiers",
                "Stay hydrated"
            ]
        }
    ]
    
    return jsonify({
        "alerts": alerts,
        "summary": {
            "total": len(alerts),
            "critical": len([a for a in alerts if a['type'] == 'critical']),
            "warning": len([a for a in alerts if a['type'] == 'warning']),
            "info": len([a for a in alerts if a['type'] == 'info'])
        },
        "last_updated": datetime.now().isoformat()
    })

@modern_api_bp.route('/community/stats')
def community_stats():
    """Get community engagement statistics"""
    return jsonify({
        "users": {
            "active": 12547,
            "new_today": 89,
            "growth_rate": "+12.5%"
        },
        "actions": {
            "eco_actions": 8923,
            "reports_submitted": 1567,
            "challenges_completed": 2341
        },
        "engagement": {
            "green_points": 156,
            "top_contributors": [
                {"name": "EcoWarrior123", "points": 2450, "badges": 8},
                {"name": "CleanAirAdvocate", "points": 2180, "badges": 6},
                {"name": "GreenDelhi", "points": 1950, "badges": 7}
            ],
            "leaderboard": [
                {"rank": 1, "name": "EcoWarrior123", "points": 2450},
                {"rank": 2, "name": "CleanAirAdvocate", "points": 2180},
                {"rank": 3, "name": "GreenDelhi", "points": 1950},
                {"rank": 4, "name": "AirQualityHero", "points": 1780},
                {"rank": 5, "name": "PollutionFighter", "points": 1620}
            ]
        },
        "recent_activity": [
            {
                "user": "EcoWarrior123",
                "action": "Reported industrial emissions",
                "location": "Industrial Area, Ghaziabad",
                "timestamp": (datetime.now() - timedelta(minutes=10)).isoformat(),
                "points_earned": 50
            },
            {
                "user": "CleanAirAdvocate",
                "action": "Completed daily challenge",
                "location": "Home",
                "timestamp": (datetime.now() - timedelta(minutes=25)).isoformat(),
                "points_earned": 25
            },
            {
                "user": "GreenDelhi",
                "action": "Shared air quality tips",
                "location": "Community Forum",
                "timestamp": (datetime.now() - timedelta(minutes=45)).isoformat(),
                "points_earned": 15
            }
        ]
    })

@modern_api_bp.route('/health/recommendations')
def health_recommendations():
    """Get personalized health recommendations"""
    try:
        # Get current AQI
        aqi_data = read_csv_data('aqi_readings.csv')
        current_aqi = float(aqi_data[0]['aqi']) if aqi_data else 287
        
        # Generate recommendations based on AQI
        recommendations = generate_health_recommendations(current_aqi)
        
        return jsonify({
            "current_conditions": {
                "aqi": current_aqi,
                "category": get_aqi_category(current_aqi),
                "primary_pollutant": "PM2.5",
                "timestamp": datetime.now().isoformat()
            },
            "recommendations": recommendations,
            "affected_groups": get_affected_groups(current_aqi),
            "emergency_contacts": [
                {"name": "Air Quality Helpline", "number": "1800-180-1551"},
                {"name": "Health Emergency", "number": "108"},
                {"name": "Delhi Pollution Control", "number": "011-2339-3388"}
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@modern_api_bp.route('/routes/safe-routes')
def safe_routes():
    """Get safe route recommendations"""
    origin = request.args.get('origin', 'Central Delhi')
    destination = request.args.get('destination', 'East Delhi')
    transport_mode = request.args.get('mode', 'driving')
    
    routes = [
        {
            "id": 1,
            "name": "Green Route",
            "origin": origin,
            "destination": destination,
            "transport_mode": transport_mode,
            "distance": "12.5 km",
            "duration": "35 minutes",
            "avg_aqi": 245,
            "safety_score": 85,
            "pollution_reduction": "23%",
            "features": [
                "Parks and green spaces",
                "Low traffic areas",
                "Air purifier stations"
            ],
            "waypoints": [
                {"name": "Lodi Garden", "aqi": 180, "type": "green_space"},
                {"name": "India Gate", "aqi": 220, "type": "landmark"},
                {"name": "Rajpath", "aqi": 210, "type": "wide_road"}
            ]
        },
        {
            "id": 2,
            "name": "Fast Route",
            "origin": origin,
            "destination": destination,
            "transport_mode": transport_mode,
            "distance": "8.2 km",
            "duration": "22 minutes",
            "avg_aqi": 295,
            "safety_score": 65,
            "pollution_reduction": "8%",
            "features": [
                "Highway access",
                "Direct route",
                "Moderate traffic"
            ],
            "waypoints": [
                {"name": "Ring Road", "aqi": 310, "type": "highway"},
                {"name": "Metro Station", "aqi": 280, "type": "transit"}
            ]
        }
    ]
    
    return jsonify({
        "routes": routes,
        "recommendations": {
            "best_overall": routes[0],
            "fastest": routes[1],
            "safest": routes[0]
        },
        "tips": [
            "Use N95 masks for all routes",
            "Avoid peak hours (8-10 AM, 6-8 PM)",
            "Consider public transport for longer distances"
        ]
    })

@modern_api_bp.route('/gamification/challenges')
def gamification_challenges():
    """Get daily eco-challenges and gamification data"""
    challenges = [
        {
            "id": 1,
            "title": "Zero Waste Day",
            "description": "Avoid using single-use plastics for 24 hours",
            "points": 50,
            "difficulty": "Medium",
            "category": "Waste Reduction",
            "progress": 75,
            "max_progress": 100,
            "deadline": (datetime.now() + timedelta(hours=8)).isoformat(),
            "icon": "♻️"
        },
        {
            "id": 2,
            "title": "Green Commute",
            "description": "Use public transport or carpool for your commute",
            "points": 30,
            "difficulty": "Easy",
            "category": "Transportation",
            "progress": 100,
            "max_progress": 100,
            "deadline": (datetime.now() + timedelta(hours=2)).isoformat(),
            "icon": "🚌",
            "completed": True
        },
        {
            "id": 3,
            "title": "Air Quality Reporter",
            "description": "Report 3 pollution sources in your area",
            "points": 75,
            "difficulty": "Hard",
            "category": "Community Action",
            "progress": 33,
            "max_progress": 100,
            "deadline": (datetime.now() + timedelta(days=1)).isoformat(),
            "icon": "📊"
        }
    ]
    
    return jsonify({
        "challenges": challenges,
        "user_stats": {
            "level": 12,
            "experience": 2450,
            "next_level": 3000,
            "total_points": 5670,
            "badges": [
                {"name": "Eco Warrior", "icon": "🌱", "earned": True},
                {"name": "Air Quality Expert", "icon": "🌬️", "earned": True},
                {"name": "Community Helper", "icon": "🤝", "earned": True},
                {"name": "Green Innovator", "icon": "💡", "earned": False}
            ],
            "streak": 7,
            "longest_streak": 23
        },
        "leaderboard": [
            {"rank": 1, "username": "EcoWarrior123", "points": 12450, "level": 25},
            {"rank": 2, "username": "CleanAirAdvocate", "points": 11280, "level": 23},
            {"rank": 3, "username": "GreenDelhi", "points": 9850, "level": 20}
        ]
    })

@modern_api_bp.route('/analytics/predictive')
def predictive_analytics():
    """Get predictive analytics and insights"""
    try:
        forecaster = PollutionForecaster()
        source_identifier = SourceIdentifier()
        
        # Get current conditions
        aqi_data = read_csv_data('aqi_readings.csv')
        current_aqi = float(aqi_data[0]['aqi']) if aqi_data else 287
        
        # Generate predictions
        predictions = forecaster.predict_aqi({
            'pm25': current_aqi * 0.4,
            'pm10': current_aqi * 0.6,
            'temperature': 22,
            'humidity': 65,
            'wind_speed': 8
        }, 72)
        
        # Get source analysis
        source_analysis = source_identifier.identify_sources({
            'aqi': current_aqi,
            'location': 'Delhi-NCR',
            'timestamp': datetime.now().isoformat()
        })
        
        return jsonify({
            "predictions": {
                "next_24h": {
                    "avg_aqi": sum(p['aqi'] for p in predictions[:24]) / 24,
                    "peak_aqi": max(p['aqi'] for p in predictions[:24]),
                    "trend": "increasing",
                    "confidence": 87
                },
                "next_72h": {
                    "avg_aqi": sum(p['aqi'] for p in predictions) / len(predictions),
                    "peak_aqi": max(p['aqi'] for p in predictions),
                    "trend": "stable",
                    "confidence": 72
                }
            },
            "insights": {
                "primary_concern": "Stubble burning from Haryana",
                "weather_impact": "Low wind speed will trap pollutants",
                "seasonal_factors": "Post-monsoon pollution accumulation",
                "intervention_effectiveness": "Vehicle restrictions: 15% reduction expected"
            },
            "recommendations": [
                {
                    "priority": "High",
                    "action": "Implement emergency measures",
                    "expected_impact": "20-25% AQI reduction",
                    "implementation_time": "Immediate"
                },
                {
                    "priority": "Medium",
                    "action": "Enhance monitoring in hotspots",
                    "expected_impact": "Better data accuracy",
                    "implementation_time": "24 hours"
                }
            ],
            "source_analysis": source_analysis,
            "confidence_metrics": {
                "overall": 85,
                "weather_forecast": 92,
                "source_identification": 78,
                "intervention_modeling": 81
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_aqi_category(aqi):
    """Get AQI category based on value"""
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
    """Generate health recommendations based on AQI"""
    if aqi <= 50:
        return {
            "general": ["Enjoy outdoor activities", "Open windows for ventilation"],
            "sensitive": ["Monitor symptoms", "Consult doctor if needed"],
            "children": ["Normal outdoor play", "Encourage physical activity"]
        }
    elif aqi <= 100:
        return {
            "general": ["Limit prolonged outdoor activities", "Monitor air quality"],
            "sensitive": ["Reduce outdoor time", "Use air purifiers"],
            "children": ["Limit outdoor sports", "Monitor breathing"]
        }
    elif aqi <= 200:
        return {
            "general": ["Avoid outdoor activities", "Use N95 masks", "Keep windows closed"],
            "sensitive": ["Stay indoors", "Use HEPA air purifiers", "Consult doctor"],
            "children": ["Keep indoors", "Postpone outdoor activities"]
        }
    else:
        return {
            "general": ["Stay indoors", "Use N95 masks", "Close all windows", "Use air purifiers"],
            "sensitive": ["Stay indoors", "Emergency medications ready", "Contact doctor immediately"],
            "children": ["Keep indoors", "Cancel all outdoor activities", "Monitor for symptoms"]
        }

def get_affected_groups(aqi):
    """Get affected population groups based on AQI"""
    groups = []
    if aqi > 100:
        groups.append("Children")
    if aqi > 150:
        groups.append("Elderly")
    if aqi > 200:
        groups.append("People with respiratory conditions")
    if aqi > 250:
        groups.append("People with heart disease")
    if aqi > 300:
        groups.append("Everyone")
    
    return groups if groups else ["General population"]
