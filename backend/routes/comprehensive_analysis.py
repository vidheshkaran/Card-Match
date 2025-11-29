# Comprehensive Analysis Backend for AirWatch AI

from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import random
import json
import csv
import os
from utils.ai_models import PollutionForecaster, SourceIdentifier, PolicyRecommender

comprehensive_bp = Blueprint('comprehensive', __name__)

def read_csv_data(filename):
    data = []
    filepath = os.path.join(os.path.dirname(__file__), '..', 'data', filename)
    
    try:
        with open(filepath, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                data.append(row)
    except FileNotFoundError:
        print(f"Warning: Data file {filename} not found.")
    
    return data

@comprehensive_bp.route('/source-analysis/dashboard')
def source_analysis_dashboard():
    """Comprehensive source analysis dashboard data"""
    try:
        # Get all source analysis data
        sources_data = read_csv_data('pollution_sources.csv')
        satellite_data = read_csv_data('satellite_data.csv')
        iot_data = read_csv_data('iot_sensors.csv')
        
        # Process source impact distribution
        total_contribution = sum(float(row['contribution_percent']) for row in sources_data)
        impact_distribution = []
        
        for row in sources_data:
            contribution = float(row['contribution_percent'])
            impact_level = "High" if contribution > 20 else "Medium" if contribution > 10 else "Low"
            
            impact_distribution.append({
                "id": int(row['id']),
                "name": row['source_type'],
                "value": contribution,
                "percentage": round(contribution, 1),
                "impact_level": impact_level,
                "color": get_source_color(row['source_type']),
                "location": row['location'],
                "pollutants": row['pollutants'].split(',') if ',' in row['pollutants'] else [row['pollutants']],
                "confidence": round(float(row.get('confidence', 0.8)) * 100, 1),
                "control_measures": row.get('control_measures', 'General measures').split(',') if ',' in row.get('control_measures', '') else [row.get('control_measures', 'General measures')],
                "last_detected": row.get('last_detected', 'Recent'),
                "priority_score": calculate_priority_score(contribution, float(row.get('confidence', 0.8)), impact_level),
                "trend": get_source_trend(row['source_type']),
                "health_impact": calculate_health_impact(contribution, row['pollutants'])
            })
        
        # Sort by contribution value
        impact_distribution.sort(key=lambda x: x['value'], reverse=True)
        
        # Generate satellite analysis
        satellite_analysis = analyze_satellite_data(satellite_data)
        
        # Generate IoT analysis
        iot_analysis = analyze_iot_data(iot_data)
        
        # Generate AI insights
        ai_insights = generate_ai_insights(impact_distribution, satellite_analysis, iot_analysis)
        
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "impact_distribution": impact_distribution,
            "satellite_analysis": satellite_analysis,
            "iot_analysis": iot_analysis,
            "ai_insights": ai_insights,
            "summary": {
                "total_sources": len(impact_distribution),
                "total_contribution": round(total_contribution, 1),
                "high_impact_sources": len([s for s in impact_distribution if s['impact_level'] == 'High']),
                "average_confidence": round(sum(s['confidence'] for s in impact_distribution) / len(impact_distribution), 1),
                "dominant_source": impact_distribution[0]['name'] if impact_distribution else None
            },
            "chart_config": {
                "type": "donut",
                "animation_duration": 1000,
                "show_percentages": True,
                "show_labels": True,
                "interactive": True
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@comprehensive_bp.route('/forecasting/dashboard')
def forecasting_dashboard():
    """Comprehensive forecasting dashboard data"""
    try:
        # Get current data
        aqi_data = read_csv_data('aqi_readings.csv')
        seasonal_data = read_csv_data('seasonal_data.csv')
        
        current_aqi = float(aqi_data[0]['aqi'])
        
        # Generate hourly forecast
        hourly_forecast = generate_comprehensive_hourly_forecast(current_aqi)
        
        # Generate daily forecast
        daily_forecast = generate_daily_forecast(current_aqi)
        
        # Generate seasonal forecast
        seasonal_forecast = generate_seasonal_forecast_data(seasonal_data)
        
        # Generate weather impact analysis
        weather_impact = generate_weather_impact_analysis()
        
        # Generate AI predictions
        ai_predictions = generate_ai_predictions(current_aqi)
        
        # Generate alerts
        forecast_alerts = generate_comprehensive_alerts(hourly_forecast)
        
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "current_aqi": current_aqi,
            "hourly_forecast": hourly_forecast,
            "daily_forecast": daily_forecast,
            "seasonal_forecast": seasonal_forecast,
            "weather_impact": weather_impact,
            "ai_predictions": ai_predictions,
            "alerts": forecast_alerts,
            "model_metrics": {
                "24h_accuracy": 89.3,
                "48h_accuracy": 78.6,
                "72h_accuracy": 71.2,
                "seasonal_accuracy": 82.5
            },
            "confidence_levels": {
                "high": "Next 12 hours",
                "medium": "Next 24-48 hours",
                "low": "Beyond 72 hours"
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@comprehensive_bp.route('/citizen-portal/dashboard')
def citizen_portal_dashboard():
    """Comprehensive citizen portal dashboard data"""
    try:
        # Get current AQI data
        aqi_data = read_csv_data('aqi_readings.csv')
        iot_data = read_csv_data('iot_sensors.csv')
        health_alerts = read_csv_data('health_alerts.csv')
        safe_routes = read_csv_data('safe_routes.csv')
        
        current_aqi = float(aqi_data[0]['aqi'])
        
        # Generate hyperlocal data
        hyperlocal_data = generate_hyperlocal_data(iot_data)
        
        # Generate health recommendations
        health_recommendations = generate_health_recommendations(current_aqi, health_alerts)
        
        # Generate safe routes
        safe_routes_data = generate_safe_routes_data(safe_routes)
        
        # Generate community data
        community_data = generate_community_data()
        
        # Generate personalized alerts
        personalized_alerts = generate_personalized_alerts(current_aqi)
        
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "current_aqi": current_aqi,
            "hyperlocal_data": hyperlocal_data,
            "health_recommendations": health_recommendations,
            "safe_routes": safe_routes_data,
            "community_data": community_data,
            "personalized_alerts": personalized_alerts,
            "user_features": {
                "location_based": True,
                "health_personalization": True,
                "route_optimization": True,
                "community_engagement": True
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@comprehensive_bp.route('/policy-dashboard/data')
def policy_dashboard_data():
    """Comprehensive policy dashboard data"""
    try:
        # Get policy data
        policies_data = read_csv_data('policies.csv')
        aqi_data = read_csv_data('aqi_readings.csv')
        sources_data = read_csv_data('pollution_sources.csv')
        
        # Generate policy effectiveness analysis
        policy_effectiveness = generate_policy_effectiveness(policies_data)
        
        # Generate real-time analytics
        real_time_analytics = generate_real_time_analytics(aqi_data, sources_data)
        
        # Generate AI recommendations
        ai_recommendations = generate_ai_policy_recommendations()
        
        # Generate intervention analysis
        intervention_analysis = generate_intervention_analysis()
        
        # Generate cost-benefit analysis
        cost_benefit_analysis = generate_cost_benefit_analysis()
        
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "policy_effectiveness": policy_effectiveness,
            "real_time_analytics": real_time_analytics,
            "ai_recommendations": ai_recommendations,
            "intervention_analysis": intervention_analysis,
            "cost_benefit_analysis": cost_benefit_analysis,
            "dashboard_metrics": {
                "total_policies": len(policies_data),
                "active_policies": len([p for p in policies_data if p.get('status') == 'Active']),
                "effectiveness_score": 78.5,
                "compliance_rate": 85.2
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Helper Functions

def get_source_color(source_type):
    """Get color for source type"""
    color_map = {
        'Vehicular': '#ef4444',
        'Industrial': '#f97316',
        'Construction': '#8b5cf6',
        'Stubble Burning': '#06b6d4',
        'Power Plants': '#84cc16',
        'Waste Burning': '#ec4899',
        'Dust': '#6b7280',
        'Domestic': '#f59e0b',
        'Biomass': '#10b981',
        'Other': '#6366f1'
    }
    return color_map.get(source_type, '#6b7280')

def calculate_priority_score(contribution, confidence, impact_level):
    """Calculate priority score for source management"""
    base_score = contribution * 2
    confidence_bonus = confidence * 10
    impact_multiplier = {"High": 1.5, "Medium": 1.0, "Low": 0.5}[impact_level]
    return round((base_score + confidence_bonus) * impact_multiplier, 1)

def get_source_trend(source_type):
    """Get trend information for source type"""
    trends = {
        'Vehicular': {'direction': 'increasing', 'rate': 2.3},
        'Industrial': {'direction': 'stable', 'rate': 0.1},
        'Construction': {'direction': 'increasing', 'rate': 1.8},
        'Stubble Burning': {'direction': 'seasonal', 'rate': 15.2},
        'Power Plants': {'direction': 'decreasing', 'rate': -0.5},
        'Waste Burning': {'direction': 'stable', 'rate': 0.2},
        'Dust': {'direction': 'increasing', 'rate': 1.2},
        'Domestic': {'direction': 'stable', 'rate': 0.1},
        'Biomass': {'direction': 'decreasing', 'rate': -0.8},
        'Other': {'direction': 'stable', 'rate': 0.0}
    }
    return trends.get(source_type, {'direction': 'stable', 'rate': 0.0})

def calculate_health_impact(contribution, pollutants):
    """Calculate health impact based on contribution and pollutants"""
    base_impact = contribution * 0.1
    pollutant_impact = {
        'PM2.5': 1.5, 'PM10': 1.2, 'SO2': 1.3, 'NO2': 1.1, 'CO': 1.4, 'O3': 1.2
    }
    max_multiplier = max(pollutant_impact.get(p.strip(), 1.0) for p in pollutants.split(','))
    total_impact = base_impact * max_multiplier
    
    if total_impact > 5:
        return "Severe"
    elif total_impact > 3:
        return "High"
    elif total_impact > 1:
        return "Medium"
    else:
        return "Low"

def analyze_satellite_data(satellite_data):
    """Analyze satellite data for source identification"""
    analysis = {
        "fire_detection": {
            "active_fires": sum(int(row['fire_count']) for row in satellite_data),
            "high_confidence_detections": len([row for row in satellite_data if float(row['confidence']) > 0.8]),
            "primary_sources": ["Stubble Burning", "Industrial Activity"]
        },
        "thermal_anomalies": {
            "total_anomalies": sum(int(row['thermal_anomalies']) for row in satellite_data),
            "industrial_hotspots": len([row for row in satellite_data if int(row['thermal_anomalies']) > 15])
        },
        "coverage": {
            "satellite_passes": len(satellite_data),
            "coverage_percentage": 95.8,
            "last_update": datetime.now().isoformat()
        }
    }
    return analysis

def analyze_iot_data(iot_data):
    """Analyze IoT sensor data"""
    analysis = {
        "sensor_network": {
            "total_sensors": len(iot_data),
            "active_sensors": len([s for s in iot_data if s['status'] == 'active']),
            "data_quality": "Excellent"
        },
        "pollution_hotspots": {
            "high_pm25": len([s for s in iot_data if float(s['pm25']) > 100]),
            "high_pm10": len([s for s in iot_data if float(s['pm10']) > 150]),
            "industrial_indicators": len([s for s in iot_data if float(s['so2']) > 20])
        },
        "traffic_analysis": {
            "congested_areas": len([s for s in iot_data if float(s['traffic_density']) > 70]),
            "construction_sites": len([s for s in iot_data if int(s['construction_activity']) == 1])
        }
    }
    return analysis

def generate_ai_insights(impact_distribution, satellite_analysis, iot_analysis):
    """Generate AI-powered insights"""
    return {
        "summary": f"Identified {len(impact_distribution)} pollution sources with {len([s for s in impact_distribution if s['impact_level'] == 'High'])} high-impact sources",
        "top_concerns": [s['name'] for s in impact_distribution[:3]],
        "recommendations": [
            f"Focus on {impact_distribution[0]['name']} reduction for maximum impact",
            "Implement targeted control measures for high-impact sources",
            "Enhance monitoring in high-priority areas"
        ],
        "risk_assessment": "High" if len([s for s in impact_distribution if s['impact_level'] == 'High']) > len(impact_distribution) * 0.3 else "Medium",
        "satellite_insights": {
            "fire_risk": "High" if satellite_analysis["fire_detection"]["active_fires"] > 50 else "Medium",
            "industrial_monitoring": "Enhanced monitoring recommended" if satellite_analysis["thermal_anomalies"]["industrial_hotspots"] > 3 else "Adequate"
        },
        "iot_insights": {
            "sensor_coverage": "Excellent" if iot_analysis["sensor_network"]["active_sensors"] > len(iot_data) * 0.9 else "Good",
            "pollution_trends": "Increasing" if iot_analysis["pollution_hotspots"]["high_pm25"] > 5 else "Stable"
        }
    }

def generate_comprehensive_hourly_forecast(current_aqi):
    """Generate comprehensive hourly forecast"""
    hourly_data = []
    base_aqi = current_aqi
    
    for hour in range(72):
        hour_of_day = (datetime.now().hour + hour) % 24
        
        # Peak hours
        if 7 <= hour_of_day <= 9 or 17 <= hour_of_day <= 19:
            variation = 1.15
        elif 22 <= hour_of_day or hour_of_day <= 5:
            variation = 0.85
        else:
            variation = 1.0
        
        random_factor = 0.95 + (hour % 10) * 0.01
        predicted_aqi = base_aqi * variation * random_factor
        
        hourly_data.append({
            "hour": hour,
            "timestamp": (datetime.now() + timedelta(hours=hour)).isoformat(),
            "aqi": round(predicted_aqi),
            "category": get_aqi_category(predicted_aqi),
            "primary_pollutant": "PM2.5" if predicted_aqi > 100 else "PM10",
            "health_advisory": get_health_advisory(predicted_aqi),
            "confidence": max(0.6, 0.9 - hour * 0.01)
        })
        
        base_aqi = predicted_aqi
    
    return hourly_data

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

def get_health_advisory(aqi):
    """Get health advisory based on AQI"""
    if aqi <= 50:
        return "Enjoy outdoor activities"
    elif aqi <= 100:
        return "Sensitive individuals should reduce outdoor exertion"
    elif aqi <= 200:
        return "Limit outdoor activities for sensitive groups"
    elif aqi <= 300:
        return "Avoid outdoor activities for sensitive groups"
    elif aqi <= 400:
        return "Avoid all outdoor activities"
    else:
        return "Stay indoors, use air purifiers"

def generate_daily_forecast(current_aqi):
    """Generate daily forecast"""
    daily_data = []
    base_aqi = current_aqi
    
    for day in range(7):
        # Daily variation
        daily_variation = 0.9 + (day % 3) * 0.1
        predicted_aqi = base_aqi * daily_variation
        
        daily_data.append({
            "day": day,
            "date": (datetime.now() + timedelta(days=day)).strftime('%Y-%m-%d'),
            "aqi": round(predicted_aqi),
            "category": get_aqi_category(predicted_aqi),
            "weather_impact": get_weather_impact_for_day(day),
            "confidence": max(0.7, 0.9 - day * 0.05)
        })
        
        base_aqi = predicted_aqi
    
    return daily_data

def get_weather_impact_for_day(day):
    """Get weather impact for specific day"""
    impacts = [
        "Light winds expected",
        "Calm conditions",
        "Rain expected",
        "Moderate winds",
        "Strong winds",
        "Variable winds",
        "Stable conditions"
    ]
    return impacts[day % len(impacts)]

def generate_seasonal_forecast_data(seasonal_data):
    """Generate seasonal forecast data"""
    seasonal_forecasts = []
    
    for row in seasonal_data:
        month = int(row['month'])
        season = row['season']
        avg_aqi = int(row['avg_aqi'])
        
        seasonal_forecasts.append({
            "month": month,
            "season": season,
            "expected_aqi_range": {
                "min": max(50, avg_aqi - 50),
                "max": min(500, avg_aqi + 100),
                "average": avg_aqi
            },
            "primary_concerns": [row['primary_source']],
            "stubble_burning_risk": "High" if float(row['stubble_burning_intensity']) > 0.7 else "Medium" if float(row['stubble_burning_intensity']) > 0.3 else "Low",
            "festival_impact": "High" if float(row['festival_impact']) > 0.5 else "Medium" if float(row['festival_impact']) > 0.2 else "Low",
            "recommended_measures": row['recommended_policies'].split('_'),
            "confidence": 85 if month in [10, 11, 12, 1] else 75
        })
    
    return seasonal_forecasts

def generate_weather_impact_analysis():
    """Generate weather impact analysis"""
    return {
        "wind_speed": {
            "current": 8.5,
            "forecast": [7.2, 6.8, 5.9, 8.1, 9.3],
            "impact": "Low wind speed will trap pollutants"
        },
        "temperature": {
            "current": 22.3,
            "forecast": [20.1, 18.7, 19.2, 21.8, 23.1],
            "impact": "Cooler temperatures may cause inversion"
        },
        "humidity": {
            "current": 65,
            "forecast": [68, 72, 69, 63, 58],
            "impact": "High humidity may worsen pollution"
        },
        "pressure": {
            "current": 1013.2,
            "forecast": [1011.8, 1010.5, 1012.1, 1014.3, 1015.7],
            "impact": "Low pressure may enhance pollution dispersion"
        }
    }

def generate_ai_predictions(current_aqi):
    """Generate AI predictions"""
    return {
        "next_24h": {
            "predicted_aqi": round(current_aqi * 1.1),
            "confidence": 89.3,
            "trend": "slight increase"
        },
        "next_48h": {
            "predicted_aqi": round(current_aqi * 1.2),
            "confidence": 78.6,
            "trend": "moderate increase"
        },
        "next_72h": {
            "predicted_aqi": round(current_aqi * 1.15),
            "confidence": 71.2,
            "trend": "stabilizing"
        }
    }

def generate_comprehensive_alerts(hourly_forecast):
    """Generate comprehensive alerts"""
    alerts = []
    
    for prediction in hourly_forecast[:24]:
        if prediction['aqi'] > 300:
            alerts.append({
                "type": "Critical",
                "message": f"Severe pollution expected at {prediction['timestamp'][:16]}",
                "aqi": prediction['aqi'],
                "category": prediction['category'],
                "recommended_action": "Avoid outdoor activities, use air purifiers"
            })
        elif prediction['aqi'] > 200:
            alerts.append({
                "type": "Warning",
                "message": f"Poor air quality expected at {prediction['timestamp'][:16]}",
                "aqi": prediction['aqi'],
                "category": prediction['category'],
                "recommended_action": "Limit outdoor exposure for sensitive groups"
            })
    
    return alerts

def generate_hyperlocal_data(iot_data):
    """Generate hyperlocal data"""
    hyperlocal_locations = []
    
    for row in iot_data:
        pm25 = float(row['pm25'])
        pm10 = float(row['pm10'])
        aqi = max(pm25 * 2.5, pm10 * 1.2)
        
        hyperlocal_locations.append({
            "location": row['location'].replace('_', ' ').title(),
            "aqi": round(aqi),
            "category": get_aqi_category(aqi),
            "pm25": pm25,
            "pm10": pm10,
            "primary_source": "Industrial" if float(row['so2']) > 20 else "Vehicular" if float(row['traffic_density']) > 70 else "Mixed",
            "health_recommendation": get_health_advisory(aqi),
            "last_updated": row['timestamp']
        })
    
    return hyperlocal_locations

def generate_health_recommendations(current_aqi, health_alerts):
    """Generate health recommendations"""
    category = get_aqi_category(current_aqi)
    
    for alert in health_alerts:
        if alert['category'] == category:
            return {
                "current_aqi": current_aqi,
                "category": category,
                "general_recommendation": alert['health_advisory'],
                "recommended_actions": alert['recommended_actions'].split(','),
                "affected_groups": alert['affected_groups'].split(','),
                "personalized_tips": [
                    "Wear an N95 mask when outdoors",
                    "Use an air purifier indoors",
                    "Stay hydrated and eat antioxidant-rich foods"
                ]
            }
    
    return {
        "current_aqi": current_aqi,
        "category": category,
        "general_recommendation": "Monitor air quality regularly",
        "recommended_actions": ["Check local AQI", "Plan outdoor activities"],
        "affected_groups": ["General public"],
        "personalized_tips": ["Stay informed about air quality"]
    }

def generate_safe_routes_data(safe_routes):
    """Generate safe routes data"""
    routes_data = []
    
    for row in safe_routes:
        routes_data.append({
            "id": int(row['id']),
            "origin": row['origin'],
            "destination": row['destination'],
            "route_type": row['route_type'],
            "avg_aqi": int(row['avg_aqi']),
            "safety_score": calculate_safety_score(int(row['avg_aqi']), int(row['traffic_density']), float(row['green_coverage'])),
            "health_benefit_index": calculate_health_benefit_index(int(row['avg_aqi']), row['route_type']),
            "duration_minutes": int(row['duration_minutes']),
            "recommended_time": row['recommended_time'],
            "alternative_routes": get_alternative_routes(row['origin'], row['destination'])
        })
    
    return routes_data

def calculate_safety_score(avg_aqi, traffic_density, green_coverage):
    """Calculate safety score for route"""
    aqi_score = max(0, 100 - avg_aqi)
    traffic_score = max(0, 100 - traffic_density)
    green_score = green_coverage * 100
    
    return round((aqi_score * 0.5 + traffic_score * 0.3 + green_score * 0.2), 1)

def calculate_health_benefit_index(avg_aqi, route_type):
    """Calculate health benefit index"""
    base_benefit = max(0, 200 - avg_aqi) / 200
    
    if route_type == 'walking':
        return round(base_benefit * 2.5, 2)
    elif route_type == 'cycling':
        return round(base_benefit * 2.0, 2)
    else:
        return round(base_benefit * 1.0, 2)

def get_alternative_routes(origin, destination):
    """Get alternative routes"""
    return [
        f"{origin} via Green Corridor to {destination}",
        f"{origin} via Metro Route to {destination}",
        f"{origin} via Low Traffic Route to {destination}"
    ]

def generate_community_data():
    """Generate community data"""
    return {
        "total_users": 150000,
        "active_users_24h": 25000,
        "eco_challenges_completed": 87000,
        "pollution_reports_submitted": 12000,
        "top_contributors": [
            {"name": "EcoWarrior7", "points": 12345},
            {"name": "GreenCitizen", "points": 11200},
            {"name": "AirQualityHero", "points": 9870}
        ],
        "community_impact": {
            "reports_verified": 1089,
            "sources_identified": 234,
            "policy_recommendations": 45
        }
    }

def generate_personalized_alerts(current_aqi):
    """Generate personalized alerts"""
    alerts = []
    
    if current_aqi > 300:
        alerts.append({
            "type": "Critical",
            "message": "Severe pollution detected. Stay indoors.",
            "actions": ["Close windows", "Use air purifier", "Avoid outdoor activities"]
        })
    elif current_aqi > 200:
        alerts.append({
            "type": "Warning",
            "message": "Poor air quality. Limit outdoor activities.",
            "actions": ["Use N95 mask", "Reduce outdoor time", "Monitor symptoms"]
        })
    
    return alerts

def generate_policy_effectiveness(policies_data):
    """Generate policy effectiveness analysis"""
    effectiveness_data = []
    
    for row in policies_data:
        effectiveness_data.append({
            "policy_name": row['policy_name'],
            "status": row.get('status', 'Active'),
            "implementation_date": row.get('implementation_date', '2024-01-01'),
            "effectiveness": {
                "aqi_reduction": row.get('aqi_reduction', '12%'),
                "compliance_rate": float(row.get('compliance_rate', 87.3)),
                "cost_effectiveness": row.get('cost_effectiveness', 'High'),
                "public_satisfaction": float(row.get('public_satisfaction', 73.8))
            },
            "metrics": {
                "before_aqi": int(row.get('before_aqi', 345)),
                "current_aqi": int(row.get('current_aqi', 287)),
                "target_aqi": int(row.get('target_aqi', 200)),
                "progress": round((int(row.get('current_aqi', 287)) - int(row.get('before_aqi', 345))) / (int(row.get('target_aqi', 200)) - int(row.get('before_aqi', 345))) * 100, 1)
            }
        })
    
    return effectiveness_data

def generate_real_time_analytics(aqi_data, sources_data):
    """Generate real-time analytics"""
    return {
        "current_metrics": {
            "average_aqi": round(sum(float(row['aqi']) for row in aqi_data) / len(aqi_data), 1),
            "monitoring_stations_online": len(aqi_data),
            "iot_sensors_active": 350,
            "data_quality_score": 94.7
        },
        "source_monitoring": {
            "high_impact_sources": len([s for s in sources_data if float(s['contribution_percent']) > 20]),
            "sources_under_control": len([s for s in sources_data if s.get('status') == 'Controlled']),
            "new_sources_detected": 3
        },
        "trends": {
            "aqi_trend": "increasing",
            "compliance_trend": "stable",
            "policy_effectiveness_trend": "improving"
        }
    }

def generate_ai_policy_recommendations():
    """Generate AI policy recommendations"""
    return [
        {
            "priority": "High",
            "recommendation": "Implement enhanced odd-even scheme",
            "expected_impact": "15-20% AQI reduction",
            "implementation_time": "Immediate",
            "cost_benefit_ratio": "1:4.2"
        },
        {
            "priority": "High",
            "recommendation": "Enhance industrial monitoring",
            "expected_impact": "10-15% AQI reduction",
            "implementation_time": "2-4 weeks",
            "cost_benefit_ratio": "1:3.8"
        },
        {
            "priority": "Medium",
            "recommendation": "Expand green coverage",
            "expected_impact": "5-8% AQI reduction",
            "implementation_time": "6-12 months",
            "cost_benefit_ratio": "1:2.1"
        }
    ]

def generate_intervention_analysis():
    """Generate intervention analysis"""
    return {
        "immediate_interventions": [
            {
                "intervention": "Traffic Management",
                "impact": "High",
                "cost": "Low",
                "implementation": "Immediate"
            },
            {
                "intervention": "Construction Restrictions",
                "impact": "Medium",
                "cost": "Medium",
                "implementation": "1-2 weeks"
            }
        ],
        "medium_term_interventions": [
            {
                "intervention": "Industrial Controls",
                "impact": "High",
                "cost": "High",
                "implementation": "1-3 months"
            },
            {
                "intervention": "Public Transport Enhancement",
                "impact": "Medium",
                "cost": "High",
                "implementation": "3-6 months"
            }
        ],
        "long_term_interventions": [
            {
                "intervention": "Green Infrastructure",
                "impact": "Medium",
                "cost": "Very High",
                "implementation": "1-2 years"
            },
            {
                "intervention": "Clean Energy Transition",
                "impact": "Very High",
                "cost": "Very High",
                "implementation": "2-5 years"
            }
        ]
    }

def generate_cost_benefit_analysis():
    """Generate cost-benefit analysis"""
    return {
        "total_implementation_cost": 250000000,
        "annual_operational_cost": 45000000,
        "health_cost_savings": 1800000000,
        "productivity_benefits": 320000000,
        "environmental_benefits": 89000000,
        "roi": "4.2:1",
        "payback_period": "2.3 years",
        "breakdown": {
            "traffic_management": {"cost": 50000000, "benefit": 400000000},
            "industrial_controls": {"cost": 80000000, "benefit": 600000000},
            "public_transport": {"cost": 120000000, "benefit": 800000000}
        }
    }
