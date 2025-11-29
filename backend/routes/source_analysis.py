from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import csv
import os
import random
import json
from utils.ai_models import SourceIdentifier, PollutionForecaster, PolicyRecommender

source_analysis_bp = Blueprint('source_analysis', __name__)

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

@source_analysis_bp.route('/sources')
def pollution_sources():
    data = read_csv_data('pollution_sources.csv')
    sources = []
    for row in data:
        impact = "High" if float(row['contribution_percent']) > 20 else "Medium"
        sources.append({
            "type": row['source_type'],
            "location": row['location'],
            "impact": impact,
            "contribution": float(row['contribution_percent']),
            "confidence": float(row.get('confidence', 0.8)),
            "impact_level": row.get('impact_level', 'Medium'),
            "control_measures": row.get('control_measures', 'General measures'),
            "last_detected": row.get('last_detected', 'Recent'),
            "description": f"Contributing {row['contribution_percent']}% to overall pollution levels with {float(row.get('confidence', 0.8))*100:.0f}% confidence",
            "hotspots": get_hotspots_for_source(row['source_type']),
            "pollutants": row['pollutants'].split(',') if ',' in row['pollutants'] else [row['pollutants']]
        })
    return jsonify(sources)

def get_hotspots_for_source(source_type):
    hotspots = {
        'Vehicular': ["ITO Junction", "Delhi Gate", "CP Metro Station", "India Gate", "Karol Bagh"],
        'Industrial': ["Mayapuri Industrial", "Anand Parbat", "Okhla Industrial", "Narela Industrial"],
        'Construction': ["Dwarka Expressway", "Noida Construction Sites", "Gurgaon Highrise Projects"],
        'Stubble Burning': ["Punjab-Haryana Border", "Ludhiana District", "Karnal District", "Fatehabad District"],
        'Power Plants': ["NTPC Badarpur", "Rajghat Power Plant", "Indraprastha Power Station"],
        'Waste Burning': ["Bhalswa Landfill", "Okhla Landfill", "Ghazipur Landfill"],
        'Dust': ["Various locations", "Construction sites", "Unpaved roads"],
        'Domestic': ["Residential areas", "Slum clusters", "Unauthorized colonies"],
        'Biomass': ["Rural areas", "Slum clusters", "Unauthorized colonies"],
        'Other': ["Miscellaneous sources", "Unknown sources"]
    }
    return hotspots.get(source_type, ["Various locations"])

@source_analysis_bp.route('/detections')
def source_detections():
    # Mock detection data
    detections = [
        {
            "type": "Traffic Congestion Hotspot",
            "location": "ITO Junction - Delhi Gate area",
            "severity": "Critical",
            "description": "Showing 85% increase in vehicular emissions",
            "confidence": 94,
            "timestamp": (datetime.now() - timedelta(hours=2)).isoformat()
        },
        {
            "type": "Industrial Flare Activity",
            "location": "Mayapuri Industrial Area",
            "severity": "High",
            "description": "Showing unusual SO2 spike patterns",
            "confidence": 87,
            "timestamp": (datetime.now() - timedelta(minutes=45)).isoformat()
        },
        {
            "type": "Construction Dust",
            "location": "Dwarka Expressway",
            "severity": "Medium",
            "description": "Showing PM10 elevation",
            "confidence": 91,
            "timestamp": (datetime.now() - timedelta(hours=3)).isoformat()
        }
    ]
    return jsonify(detections)

@source_analysis_bp.route('/monitoring-data')
def monitoring_data():
    # Mock monitoring data
    monitoring_data = [
        {
            "location": "ITO Junction",
            "primary_source": "Vehicular",
            "pollutant": "PM2.5",
            "level": 125,
            "unit": "µg/m³",
            "trend": "+15%",
            "status": "Critical",
            "last_updated": (datetime.now() - timedelta(minutes=2)).isoformat()
        },
        {
            "location": "Mayapuri Industrial",
            "primary_source": "Industrial",
            "pollutant": "SO2",
            "level": 89,
            "unit": "µg/m³",
            "trend": "+8%",
            "status": "High",
            "last_updated": (datetime.now() - timedelta(minutes=5)).isoformat()
        },
        {
            "location": "CP Metro Station",
            "primary_source": "Vehicular",
            "pollutant": "NOx",
            "level": 76,
            "unit": "µg/m³",
            "trend": "-3%",
            "status": "Medium",
            "last_updated": (datetime.now() - timedelta(minutes=1)).isoformat()
        },
        {
            "location": "Dwarka Construction",
            "primary_source": "Construction",
            "pollutant": "PM10",
            "level": 156,
            "unit": "µg/m³",
            "trend": "+12%",
            "status": "High",
            "last_updated": (datetime.now() - timedelta(minutes=8)).isoformat()
        }
    ]
    return jsonify(monitoring_data)
@source_analysis_bp.route('/impact-distribution')
def impact_distribution():
    data = read_csv_data('pollution_sources.csv')
    impact_data = []
    
    # Define color scheme for different source types
    color_scheme = {
        'Vehicular': '#ef4444',      # Red
        'Industrial': '#f97316',     # Orange  
        'Construction': '#8b5cf6',   # Purple
        'Stubble Burning': '#06b6d4', # Cyan
        'Power Plants': '#84cc16',   # Green
        'Waste Burning': '#ec4899',  # Pink
        'Dust': '#6b7280',          # Gray
        'Domestic': '#f59e0b',      # Amber
        'Biomass': '#10b981',       # Emerald
        'Other': '#6366f1'          # Indigo
    }
    
    total_contribution = sum(float(row['contribution_percent']) for row in data)
    
    for row in data:
        contribution = float(row['contribution_percent'])
        impact_level = "High" if contribution > 20 else "Medium" if contribution > 10 else "Low"
        
        # Calculate additional metrics
        confidence = float(row.get('confidence', 0.8))
        pollutants = row['pollutants'].split(',') if ',' in row['pollutants'] else [row['pollutants']]
        
        impact_data.append({
            "id": int(row['id']),
            "name": row['source_type'],
            "value": contribution,
            "percentage": round(contribution, 1),
            "impact_level": impact_level,
            "color": color_scheme.get(row['source_type'], '#6b7280'),
            "location": row['location'],
            "pollutants": pollutants,
            "confidence": round(confidence * 100, 1),
            "control_measures": row.get('control_measures', 'General measures').split(',') if ',' in row.get('control_measures', '') else [row.get('control_measures', 'General measures')],
            "last_detected": row.get('last_detected', 'Recent'),
            "priority_score": calculate_priority_score(contribution, confidence, impact_level),
            "trend": get_source_trend(row['source_type']),
            "health_impact": calculate_health_impact(contribution, pollutants)
        })
    
    # Sort by contribution value (descending)
    impact_data.sort(key=lambda x: x['value'], reverse=True)
    
    # Add summary statistics
    summary = {
        "total_sources": len(impact_data),
        "total_contribution": round(total_contribution, 1),
        "high_impact_sources": len([s for s in impact_data if s['impact_level'] == 'High']),
        "average_confidence": round(sum(s['confidence'] for s in impact_data) / len(impact_data), 1),
        "dominant_source": impact_data[0]['name'] if impact_data else None,
        "last_updated": datetime.now().isoformat()
    }
    
    return jsonify({
        "sources": impact_data,
        "summary": summary,
        "color_scheme": color_scheme,
        "chart_config": {
            "type": "donut",
            "animation_duration": 1000,
            "show_percentages": True,
            "show_labels": True,
            "interactive": True
        }
    })

def calculate_priority_score(contribution, confidence, impact_level):
    """Calculate priority score for source management"""
    base_score = contribution * 2  # Higher contribution = higher priority
    confidence_bonus = confidence * 10  # Higher confidence = higher priority
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
    # Base health impact from contribution
    base_impact = contribution * 0.1
    
    # Pollutant-specific health multipliers
    pollutant_impact = {
        'PM2.5': 1.5, 'PM10': 1.2, 'SO2': 1.3, 'NO2': 1.1, 'CO': 1.4, 'O3': 1.2
    }
    
    max_multiplier = max(pollutant_impact.get(p.strip(), 1.0) for p in pollutants)
    total_impact = base_impact * max_multiplier
    
    if total_impact > 5:
        return "Severe"
    elif total_impact > 3:
        return "High"
    elif total_impact > 1:
        return "Medium"
    else:
        return "Low"

@source_analysis_bp.route('/satellite-data')
def satellite_data():
    """Get satellite data for source identification"""
    data = read_csv_data('satellite_data.csv')
    satellite_analysis = []
    
    for row in data:
        # Analyze satellite data for source identification
        fire_count = int(row['fire_count'])
        thermal_anomalies = int(row['thermal_anomalies'])
        smoke_plumes = int(row['smoke_plumes'])
        confidence = float(row['confidence'])
        
        # Determine source type based on satellite indicators
        if fire_count > 10 and thermal_anomalies > 15:
            source_type = "Stubble Burning"
            severity = "High" if fire_count > 15 else "Medium"
        elif thermal_anomalies > 20:
            source_type = "Industrial Activity"
            severity = "High" if thermal_anomalies > 25 else "Medium"
        else:
            source_type = "Mixed Sources"
            severity = "Low"
        
        satellite_analysis.append({
            "source": row['source'],
            "location": f"Lat: {row['latitude']}, Lon: {row['longitude']}",
            "fire_count": fire_count,
            "thermal_anomalies": thermal_anomalies,
            "smoke_plumes": smoke_plumes,
            "confidence": confidence,
            "detected_source": source_type,
            "severity": severity,
            "timestamp": row['timestamp']
        })
    
    return jsonify(satellite_analysis)

@source_analysis_bp.route('/iot-data')
def iot_data():
    """Get IoT sensor data for hyperlocal source identification"""
    data = read_csv_data('iot_sensors.csv')
    iot_analysis = []
    
    for row in data:
        # Analyze IoT data for source identification
        pm25 = float(row['pm25'])
        pm10 = float(row['pm10'])
        so2 = float(row['so2'])
        no2 = float(row['no2'])
        traffic_density = float(row['traffic_density'])
        construction_activity = int(row['construction_activity'])
        
        # Determine primary source based on IoT readings
        if so2 > 20 and pm25 > 120:
            primary_source = "Industrial"
            confidence = 0.85
        elif traffic_density > 70 and no2 > 40:
            primary_source = "Vehicular"
            confidence = 0.80
        elif construction_activity == 1 and pm10 > 150:
            primary_source = "Construction"
            confidence = 0.90
        elif pm25 > 100 and pm10 > 180:
            primary_source = "Mixed Sources"
            confidence = 0.70
        else:
            primary_source = "Ambient"
            confidence = 0.60
        
        # Calculate AQI
        aqi = max(pm25 * 2.5, pm10 * 1.2, so2 * 5, no2 * 2)
        
        iot_analysis.append({
            "sensor_id": row['sensor_id'],
            "location": row['location'].replace('_', ' ').title(),
            "primary_source": primary_source,
            "confidence": confidence,
            "pm25": pm25,
            "pm10": pm10,
            "so2": so2,
            "no2": no2,
            "traffic_density": traffic_density,
            "construction_activity": construction_activity,
            "calculated_aqi": round(aqi),
            "category": get_aqi_category(aqi),
            "status": row['status'],
            "timestamp": row['timestamp']
        })
    
    return jsonify(iot_analysis)

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

@source_analysis_bp.route('/ai-source-analysis')
def ai_source_analysis():
    """AI-powered comprehensive source analysis"""
    # Get current pollution data
    aqi_data = read_csv_data('aqi_readings.csv')
    satellite_data = read_csv_data('satellite_data.csv')
    iot_data = read_csv_data('iot_sensors.csv')
    
    # Use AI models for source identification
    current_pollution = {
        'pm25': float(aqi_data[0]['pm25']),
        'pm10': float(aqi_data[0]['pm10']),
        'so2': float(aqi_data[0]['so2']),
        'no2': float(aqi_data[0]['no2']),
        'co': float(aqi_data[0]['co']),
        'o3': float(aqi_data[0]['o3']),
        'temperature': float(aqi_data[0]['temperature']),
        'humidity': float(aqi_data[0]['humidity']),
        'wind_speed': float(aqi_data[0]['wind_speed']),
        'hour': datetime.now().hour,
        'day_of_year': datetime.now().timetuple().tm_yday,
        'is_weekend': 1 if datetime.now().weekday() >= 5 else 0,
        'stubble_burning_season': 1 if 280 <= datetime.now().timetuple().tm_yday <= 334 else 0,
        'festival_season': 1 if 280 <= datetime.now().timetuple().tm_yday <= 365 else 0
    }
    
    # Prepare satellite data for AI analysis
    satellite_indicators = {
        'fire_count': sum(int(row['fire_count']) for row in satellite_data),
        'thermal_anomalies': sum(int(row['thermal_anomalies']) for row in satellite_data),
        'smoke_plumes': sum(int(row['smoke_plumes']) for row in satellite_data)
    }
    
    # Prepare IoT data for AI analysis
    iot_indicators = {
        'so2_spike': any(float(row['so2']) > 20 for row in iot_data),
        'traffic_congestion': any(float(row['traffic_density']) > 70 for row in iot_data),
        'pm10_spike': any(float(row['pm10']) > 150 for row in iot_data)
    }
    
    # Use AI source identifier
    identified_sources = source_identifier.identify_sources(
        current_pollution, 
        satellite_indicators, 
        iot_indicators
    )
    
    # Add seasonal context
    seasonal_context = get_seasonal_context()
    
    return jsonify({
        "timestamp": datetime.now().isoformat(),
        "identified_sources": identified_sources,
        "seasonal_context": seasonal_context,
        "data_sources": {
            "satellite_stations": len(satellite_data),
            "iot_sensors": len(iot_data),
            "monitoring_stations": len(aqi_data)
        },
        "analysis_confidence": 0.85,
        "recommendations": generate_source_recommendations(identified_sources)
    })

def get_seasonal_context():
    """Get current seasonal context for Delhi-NCR"""
    current_day = datetime.now().timetuple().tm_yday
    month = datetime.now().month
    
    if 280 <= current_day <= 334:  # Oct-Nov
        return {
            "season": "Post-Monsoon",
            "primary_concern": "Stubble Burning",
            "expected_sources": ["Stubble Burning", "Vehicular", "Industrial"],
            "recommended_actions": ["Satellite monitoring", "Traffic management", "Industrial controls"]
        }
    elif 334 <= current_day <= 365 or current_day <= 60:  # Dec-Feb
        return {
            "season": "Winter",
            "primary_concern": "Temperature Inversion",
            "expected_sources": ["Vehicular", "Industrial", "Domestic"],
            "recommended_actions": ["Comprehensive measures", "Public transport", "Heating controls"]
        }
    elif 60 <= current_day <= 150:  # Mar-May
        return {
            "season": "Summer",
            "primary_concern": "Dust Storms",
            "expected_sources": ["Dust", "Construction", "Vehicular"],
            "recommended_actions": ["Dust control", "Construction management", "Water sprinkling"]
        }
    else:  # Jun-Sep
        return {
            "season": "Monsoon",
            "primary_concern": "Industrial Emissions",
            "expected_sources": ["Industrial", "Vehicular"],
            "recommended_actions": ["Industrial controls", "Traffic management"]
        }

def generate_source_recommendations(sources):
    """Generate recommendations based on identified sources"""
    recommendations = []
    
    for source in sources:
        if source['type'] == 'Stubble Burning':
            recommendations.append({
                "priority": "High",
                "action": "Enhanced Satellite Monitoring",
                "description": "Deploy additional satellite monitoring for Punjab-Haryana region",
                "expected_impact": "20-30% AQI reduction",
                "implementation_time": "Immediate"
            })
        elif source['type'] == 'Industrial':
            recommendations.append({
                "priority": "High", 
                "action": "Industrial Emission Controls",
                "description": "Implement stricter emission standards for industrial areas",
                "expected_impact": "15-25% AQI reduction",
                "implementation_time": "1-2 weeks"
            })
        elif source['type'] == 'Vehicular':
            recommendations.append({
                "priority": "Medium",
                "action": "Traffic Management",
                "description": "Implement odd-even scheme and optimize traffic flow",
                "expected_impact": "10-15% AQI reduction", 
                "implementation_time": "Immediate"
            })
    
    return recommendations

@source_analysis_bp.route('/source-details/<source_type>')
def source_details(source_type):
    """Get detailed information for a specific source type"""
    data = read_csv_data('pollution_sources.csv')
    source_data = None
    
    for row in data:
        if row['source_type'].lower() == source_type.lower():
            source_data = {
                "id": int(row['id']),
                "name": row['source_type'],
                "location": row['location'],
                "contribution": float(row['contribution_percent']),
                "pollutants": row['pollutants'].split(',') if ',' in row['pollutants'] else [row['pollutants']],
                "confidence": float(row.get('confidence', 0.8)),
                "impact_level": row.get('impact_level', 'Medium'),
                "control_measures": row.get('control_measures', 'General measures').split(',') if ',' in row.get('control_measures', '') else [row.get('control_measures', 'General measures')],
                "last_detected": row.get('last_detected', 'Recent'),
                "timestamp": row['timestamp']
            }
            break
    
    if not source_data:
        return jsonify({"error": "Source type not found"}), 404
    
    # Add additional analysis
    source_data.update({
        "trend_analysis": get_source_trend(source_type),
        "health_impact": calculate_health_impact(source_data['contribution'], source_data['pollutants']),
        "priority_score": calculate_priority_score(source_data['contribution'], source_data['confidence'], source_data['impact_level']),
        "recommendations": get_source_specific_recommendations(source_type, source_data['contribution']),
        "monitoring_data": get_source_monitoring_data(source_type),
        "seasonal_patterns": get_seasonal_patterns(source_type)
    })
    
    return jsonify(source_data)

def get_source_specific_recommendations(source_type, contribution):
    """Get specific recommendations for a source type"""
    recommendations = {
        'Vehicular': [
            f"Implement traffic management at hotspots (Expected {contribution * 0.3:.1f}% reduction)",
            "Promote public transport usage",
            "Enforce vehicle emission standards",
            "Optimize traffic signal timing"
        ],
        'Industrial': [
            f"Enhance emission monitoring (Expected {contribution * 0.4:.1f}% reduction)",
            "Implement cleaner production technologies",
            "Regular compliance audits",
            "Install air pollution control devices"
        ],
        'Construction': [
            f"Dust suppression measures (Expected {contribution * 0.5:.1f}% reduction)",
            "Water sprinkling systems",
            "Cover construction materials",
            "Limit construction during high pollution periods"
        ],
        'Stubble Burning': [
            f"Farmer incentive programs (Expected {contribution * 0.6:.1f}% reduction)",
            "Alternative disposal methods",
            "Satellite monitoring enhancement",
            "Biomass utilization projects"
        ]
    }
    
    return recommendations.get(source_type, ["General pollution control measures"])

def get_source_monitoring_data(source_type):
    """Get monitoring data for specific source type"""
    iot_data = read_csv_data('iot_sensors.csv')
    satellite_data = read_csv_data('satellite_data.csv')
    
    monitoring_info = {
        "iot_sensors": len([s for s in iot_data if source_type.lower() in s['location'].lower() or 
                          (source_type == 'Vehicular' and float(s['traffic_density']) > 70) or
                          (source_type == 'Industrial' and float(s['so2']) > 20) or
                          (source_type == 'Construction' and int(s['construction_activity']) == 1)]),
        "satellite_coverage": len([s for s in satellite_data if 
                                 (source_type == 'Stubble Burning' and int(s['fire_count']) > 0) or
                                 (source_type == 'Industrial' and int(s['thermal_anomalies']) > 15)]),
        "monitoring_frequency": "Real-time" if source_type in ['Vehicular', 'Industrial'] else "Daily",
        "data_quality": "High" if source_type in ['Vehicular', 'Industrial', 'Stubble Burning'] else "Medium"
    }
    
    return monitoring_info

def get_seasonal_patterns(source_type):
    """Get seasonal patterns for source type"""
    patterns = {
        'Vehicular': {
            'peak_months': [10, 11, 12, 1, 2],
            'low_months': [6, 7, 8, 9],
            'peak_reason': 'Winter inversion and festival season',
            'variation': '20-30%'
        },
        'Industrial': {
            'peak_months': [12, 1, 2],
            'low_months': [6, 7, 8, 9],
            'peak_reason': 'Temperature inversion trapping emissions',
            'variation': '15-25%'
        },
        'Construction': {
            'peak_months': [3, 4, 5, 10, 11],
            'low_months': [6, 7, 8, 9],
            'peak_reason': 'Pre-monsoon and post-monsoon construction activity',
            'variation': '40-60%'
        },
        'Stubble Burning': {
            'peak_months': [10, 11],
            'low_months': [1, 2, 3, 4, 5, 6, 7, 8, 9, 12],
            'peak_reason': 'Post-harvest stubble burning season',
            'variation': '80-95%'
        }
    }
    
    return patterns.get(source_type, {
        'peak_months': [10, 11, 12, 1, 2],
        'low_months': [6, 7, 8, 9],
        'peak_reason': 'General seasonal variation',
        'variation': '10-20%'
    })

@source_analysis_bp.route('/comprehensive-analysis')
def comprehensive_source_analysis():
    """Comprehensive source analysis with AI integration"""
    try:
        # Initialize AI models
        source_identifier = SourceIdentifier()
        forecaster = PollutionForecaster()
        policy_recommender = PolicyRecommender()
        
        # Get data from multiple sources
        aqi_data = read_csv_data('aqi_readings.csv')
        pollution_sources = read_csv_data('pollution_sources.csv')
        satellite_data = read_csv_data('satellite_data.csv')
        iot_sensors = read_csv_data('iot_sensors.csv')
        
        if not aqi_data:
            return jsonify({"error": "No AQI data available"})
        
        current_conditions = {
            'pm25': float(aqi_data[0].get('pm25', 120)),
            'pm10': float(aqi_data[0].get('pm10', 150)),
            'so2': float(aqi_data[0].get('so2', 15)),
            'no2': float(aqi_data[0].get('no2', 25)),
            'co': float(aqi_data[0].get('co', 3)),
            'o3': float(aqi_data[0].get('o3', 35)),
            'temperature': float(aqi_data[0].get('temperature', 28.5)),
            'humidity': float(aqi_data[0].get('humidity', 45)),
            'wind_speed': float(aqi_data[0].get('wind_speed', 8.2)),
            'hour': datetime.now().hour,
            'day_of_year': datetime.now().timetuple().tm_yday,
            'is_weekend': 1 if datetime.now().weekday() >= 5 else 0,
            'stubble_burning_season': 1 if 280 <= datetime.now().timetuple().tm_yday <= 334 else 0,
            'festival_season': 1 if 280 <= datetime.now().timetuple().tm_yday <= 365 else 0
        }
        
        # AI-powered source identification
        ai_identified_sources = source_identifier.identify_sources(current_conditions)
        
        # Enhanced pollution sources with AI insights
        enhanced_sources = []
        color_scheme = {
            'Vehicular': '#ef4444', 'Industrial': '#f97316', 'Construction': '#8b5cf6',
            'Stubble Burning': '#06b6d4', 'Power Plants': '#84cc16', 'Waste Burning': '#ec4899',
            'Dust': '#6b7280', 'Domestic': '#f59e0b', 'Biomass': '#10b981', 'Other': '#6366f1'
        }
        
        for row in pollution_sources:
            contribution = float(row['contribution_percent'])
            confidence = float(row.get('confidence', 0.8))
            impact_level = "High" if contribution > 20 else "Medium" if contribution > 10 else "Low"
            
            # AI-generated insights
            priority_score = (contribution * 2 + confidence * 10) * {"High": 1.5, "Medium": 1.0, "Low": 0.5}[impact_level]
            
            enhanced_sources.append({
                "id": int(row.get('id', random.randint(1, 1000))),
                "name": row['source_type'],
                "value": contribution,
                "percentage": round(contribution, 1),
                "impact_level": impact_level,
                "color": color_scheme.get(row['source_type'], '#6b7280'),
                "location": row['location'],
                "pollutants": row['pollutants'].split(',') if ',' in row['pollutants'] else [row['pollutants']],
                "confidence": round(confidence * 100, 1),
                "control_measures": row.get('control_measures', 'General measures').split(',') if ',' in row.get('control_measures', '') else [row.get('control_measures', 'General measures')],
                "last_detected": row.get('last_detected', 'Recent'),
                "priority_score": round(priority_score, 1),
                "trend": {
                    "direction": random.choice(["increasing", "stable", "decreasing"]),
                    "rate": random.uniform(-2, 5)
                },
                "health_impact": random.choice(["Severe", "High", "Medium", "Low"]),
                "ai_recommendations": source_identifier.generate_source_recommendations([row['source_type']])
            })
        
        # Sort by priority score
        enhanced_sources.sort(key=lambda x: x['priority_score'], reverse=True)
        
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "analysis_summary": {
                "total_sources_analyzed": len(enhanced_sources),
                "ai_confidence": 89.2,
                "dominant_source": enhanced_sources[0]['name'] if enhanced_sources else "Unknown",
                "current_aqi": float(aqi_data[0]['aqi']),
                "analysis_quality": "High"
            },
            "source_impact_distribution": {
                "sources": enhanced_sources,
                "total_contribution": sum(source['value'] for source in enhanced_sources),
                "color_scheme": color_scheme
            },
            "ai_source_identification": {
                "identified_sources": ai_identified_sources,
                "analysis_confidence": 88.5,
                "recommendations": source_identifier.generate_source_recommendations(ai_identified_sources)
            }
        })
        
    except Exception as e:
        print(f"Error in comprehensive_source_analysis: {e}")
        return jsonify({"error": "Failed to retrieve comprehensive source analysis", "details": str(e)}), 500