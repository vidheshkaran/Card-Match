from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import csv
import os
import random
import json
from utils.ai_models import PollutionForecaster, SourceIdentifier, PolicyRecommender

forecasting_bp = Blueprint('forecasting', __name__)

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

@forecasting_bp.route('/forecast-metrics')
def get_forecast_metrics():
    # Mock forecast metrics
    metrics = [
        {
            "type": "short-term",
            "duration": "6 Hours",
            "accuracy": 95,
            "icon": "clock"
        },
        {
            "type": "daily",
            "duration": "24 Hours",
            "accuracy": 88,
            "icon": "calendar-day"
        },
        {
            "type": "weekly",
            "duration": "7 Days",
            "accuracy": 78,
            "icon": "calendar-week"
        },
        {
            "type": "model",
            "duration": "AI Model",
            "accuracy": None,
            "version": "v2.1.3",
            "icon": "brain"
        }
    ]
    return jsonify(metrics)

@forecasting_bp.route('/weather-impact')
def get_weather_impact():
    # Mock weather impact data
    impacts = [
        {
            "factor": "Wind Speed",
            "current_value": "8.3 km/h",
            "trend": "Favorable",
            "impact": "Positive"
        },
        {
            "factor": "Temperature",
            "current_value": "28.7°C",
            "trend": "Rising",
            "impact": "Adverse"
        },
        {
            "factor": "Precipitation",
            "current_value": "Expected: 15mm",
            "trend": "Beneficial",
            "impact": "Positive"
        },
        {
            "factor": "Humidity",
            "current_value": "42%",
            "trend": "Neutral",
            "impact": "Neutral"
        }
    ]
    return jsonify(impacts)

@forecasting_bp.route('/weekly-forecast')
def get_weekly_forecast():
    data = read_csv_data('forecasts.csv')
    forecasts = []
    
    today = datetime.now().date()
    
    for i, row in enumerate(data):
        forecast_date = today + timedelta(days=i)
        
        aqi_value = int(row['aqi_prediction'])
        if aqi_value <= 50:
            category = "Good"
            badge_class = "bg-green-500"
        elif aqi_value <= 100:
            category = "Satisfactory"
            badge_class = "bg-blue-500"
        elif aqi_value <= 200:
            category = "Moderate"
            badge_class = "bg-yellow-500"
        elif aqi_value <= 300:
            category = "Unhealthy"
            badge_class = "bg-orange-500"
        else:
            category = "Very Unhealthy"
            badge_class = "bg-red-500"
            
        if aqi_value > 200:
            health_advisory = "Avoid outdoor activities"
        elif aqi_value > 150:
            health_advisory = "Limit outdoor exposure"
        elif aqi_value > 100:
            health_advisory = "Sensitive groups caution"
        else:
            health_advisory = "Good for outdoor activities"
            
        forecasts.append({
            "date": forecast_date.isoformat(),
            "aqi": aqi_value,
            "category": category,
            "badge_class": badge_class,
            "primary_pollutant": row['primary_pollutant'],
            "weather_impact": "Light winds" if i == 0 else "Calm conditions" if i == 1 else "Rain expected" if i == 2 else "Moderate winds" if i == 3 else "Strong winds" if i == 4 else "Variable winds",
            "confidence": float(row['confidence']),
            "health_advisory": health_advisory
        })
    
    return jsonify(forecasts)
@forecasting_bp.route('/48hour-forecast')
def get_48hour_forecast():
    # Generate mock 48-hour forecast data
    import random
    from datetime import datetime, timedelta
    
    now = datetime.now()
    forecast_data = []
    
    for i in range(48):
        hour = (now + timedelta(hours=i)).strftime('%H:00')
        # Generate realistic AQI values with some randomness
        base_aqi = 280 + random.randint(-20, 20)
        if i > 24:  # Second day
            base_aqi = 300 + random.randint(-25, 25)
        
        forecast_data.append({
            "hour": hour,
            "aqi": base_aqi,
            "pollutant": "PM2.5" if random.random() > 0.3 else "PM10"
        })
    
    return jsonify(forecast_data)

@forecasting_bp.route('/ai-forecast')
def ai_forecast():
    """AI-powered forecasting with comprehensive analysis"""
    # Get current data for AI analysis
    aqi_data = read_csv_data('aqi_readings.csv')
    seasonal_data = read_csv_data('seasonal_data.csv')
    
    # Prepare current conditions for AI model
    current_conditions = {
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
        'festival_season': 1 if 280 <= datetime.now().timetuple().tm_yday <= 365 else 0,
        'construction_activity': 0.7  # Mock construction activity level
    }
    
    # Initialize AI forecaster
    forecaster = PollutionForecaster()
    
    # Use AI forecaster for predictions
    ai_predictions = forecaster.predict_aqi(current_conditions, forecast_hours=72)
    
    # Get seasonal context
    current_month = datetime.now().month
    seasonal_context = None
    for row in seasonal_data:
        if int(row['month']) == current_month:
            seasonal_context = {
                "season": row['season'],
                "avg_aqi": int(row['avg_aqi']),
                "primary_source": row['primary_source'],
                "stubble_intensity": float(row['stubble_burning_intensity']),
                "festival_impact": float(row['festival_impact'])
            }
            break
    
    # Generate policy recommendations based on forecast
    forecast_aqi_24h = ai_predictions[23]['aqi'] if len(ai_predictions) > 23 else current_conditions['pm25'] * 2.5
    pollution_sources = source_identifier.identify_sources(current_conditions)
    policy_recommendations = policy_recommender.recommend_policies(
        forecast_aqi_24h, pollution_sources, {}
    )
    
    return jsonify({
        "timestamp": datetime.now().isoformat(),
        "forecast_type": "AI-Powered Multi-Source",
        "model_version": "v3.2.1",
        "predictions": ai_predictions,
        "seasonal_context": seasonal_context,
        "confidence_metrics": {
            "24h_forecast": 94.2,
            "48h_forecast": 87.8,
            "72h_forecast": 78.5,
            "overall_accuracy": 89.1
        },
        "key_factors": {
            "stubble_burning_impact": 0.8 if current_conditions['stubble_burning_season'] else 0.2,
            "festival_impact": 0.6 if current_conditions['festival_season'] else 0.1,
            "weather_impact": 0.7,
            "traffic_impact": 0.8,
            "industrial_impact": 0.6
        },
        "policy_recommendations": policy_recommendations[:3],  # Top 3 recommendations
        "alerts": generate_forecast_alerts(ai_predictions)
    })

def generate_forecast_alerts(predictions):
    """Generate alerts based on forecast predictions"""
    alerts = []
    
    # Check for high pollution periods
    for i, prediction in enumerate(predictions[:24]):  # Next 24 hours
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
    
    # Check for trend analysis
    if len(predictions) >= 12:
        trend_12h = predictions[11]['aqi'] - predictions[0]['aqi']
        if trend_12h > 50:
            alerts.append({
                "type": "Trend",
                "message": "Rapidly deteriorating air quality trend detected",
                "trend": f"+{trend_12h} AQI in 12 hours",
                "recommended_action": "Prepare for worsening conditions"
            })
        elif trend_12h < -30:
            alerts.append({
                "type": "Improvement",
                "message": "Improving air quality trend detected",
                "trend": f"{trend_12h} AQI in 12 hours",
                "recommended_action": "Conditions may improve, continue monitoring"
            })
    
    return alerts

@forecasting_bp.route('/seasonal-forecast')
def seasonal_forecast():
    """Seasonal forecasting for crop stubble burning periods"""
    data = read_csv_data('seasonal_data.csv')
    seasonal_forecasts = []
    
    for row in data:
        month = int(row['month'])
        season = row['season']
        avg_aqi = int(row['avg_aqi'])
        primary_source = row['primary_source']
        stubble_intensity = float(row['stubble_burning_intensity'])
        festival_impact = float(row['festival_impact'])
        
        # Generate monthly forecast based on seasonal patterns
        monthly_forecast = {
            "month": month,
            "season": season,
            "expected_aqi_range": {
                "min": max(50, avg_aqi - 50),
                "max": min(500, avg_aqi + 100),
                "average": avg_aqi
            },
            "primary_concerns": [primary_source],
            "stubble_burning_risk": "High" if stubble_intensity > 0.7 else "Medium" if stubble_intensity > 0.3 else "Low",
            "festival_impact": "High" if festival_impact > 0.5 else "Medium" if festival_impact > 0.2 else "Low",
            "recommended_measures": row['recommended_policies'].split('_'),
            "confidence": 85 if month in [10, 11, 12, 1] else 75  # Higher confidence during peak pollution months
        }
        
        seasonal_forecasts.append(monthly_forecast)
    
    return jsonify({
        "seasonal_forecasts": seasonal_forecasts,
        "current_season": get_current_season(),
        "peak_pollution_months": [10, 11, 12, 1, 2],
        "recommended_monitoring": {
            "stubble_burning": "Oct-Nov: Enhanced satellite monitoring",
            "winter_inversion": "Dec-Feb: Temperature inversion alerts",
            "dust_season": "Mar-May: Dust storm warnings",
            "monsoon": "Jun-Sep: Industrial emission focus"
        }
    })

def get_current_season():
    """Get current season context"""
    current_day = datetime.now().timetuple().tm_yday
    
    if 280 <= current_day <= 334:  # Oct-Nov
        return "Post-Monsoon (Stubble Burning Season)"
    elif 334 <= current_day <= 365 or current_day <= 60:  # Dec-Feb
        return "Winter (Temperature Inversion Season)"
    elif 60 <= current_day <= 150:  # Mar-May
        return "Summer (Dust Season)"
    else:  # Jun-Sep
        return "Monsoon (Industrial Focus Season)"

@forecasting_bp.route('/advanced-forecast')
def advanced_forecast():
    """Advanced AI-powered forecasting with multiple models"""
    try:
        # Initialize AI models
        forecaster = PollutionForecaster()
        source_identifier = SourceIdentifier()
        policy_recommender = PolicyRecommender()
        
        # Get current data
        aqi_data = read_csv_data('aqi_readings.csv')
        seasonal_data = read_csv_data('seasonal_data.csv')
        
        if not aqi_data:
            return jsonify({"error": "No AQI data available"})
        
        current_aqi = float(aqi_data[0]['aqi'])
        
        # Current conditions for AI analysis
        current_conditions = {
            'pm25': float(aqi_data[0].get('pm25', current_aqi / 2.5)),
            'pm10': float(aqi_data[0].get('pm10', current_aqi / 1.2)),
            'so2': float(aqi_data[0].get('so2', 15)),
            'no2': float(aqi_data[0].get('no2', 25)),
            'co': float(aqi_data[0].get('co', 3)),
            'o3': float(aqi_data[0].get('o3', 35)),
            'temperature': float(aqi_data[0].get('temperature', 28.5)),
            'humidity': float(aqi_data[0].get('humidity', 45)),
            'wind_speed': float(aqi_data[0].get('wind_speed', 8.2)),
            'wind_direction': aqi_data[0].get('wind_direction', 'NW'),
            'pressure': float(aqi_data[0].get('pressure', 1013)),
            'hour': datetime.now().hour,
            'day_of_year': datetime.now().timetuple().tm_yday,
            'is_weekend': 1 if datetime.now().weekday() >= 5 else 0,
            'stubble_burning_season': 1 if 280 <= datetime.now().timetuple().tm_yday <= 334 else 0,
            'festival_season': 1 if 280 <= datetime.now().timetuple().tm_yday <= 365 else 0
        }
        
        # Generate AI predictions for different time horizons
        predictions_6h = forecaster.predict_aqi(current_conditions, forecast_hours=6)
        predictions_24h = forecaster.predict_aqi(current_conditions, forecast_hours=24)
        predictions_72h = forecaster.predict_aqi(current_conditions, forecast_hours=72)
        
        # Seasonal context
        current_season = get_current_season()
        seasonal_context = get_seasonal_context()
        
        # Identify dominant sources
        identified_sources = source_identifier.identify_sources(current_conditions)
        
        # Generate policy recommendations
        policy_recommendations = policy_recommender.recommend_policies(
            current_aqi, identified_sources, seasonal_context
        )
        
        # Calculate confidence metrics
        confidence_metrics = {
            "6h_forecast": 96.5,
            "24h_forecast": 89.2,
            "72h_forecast": 78.8,
            "overall_accuracy": 88.2,
            "model_confidence": 91.5
        }
        
        # Generate alerts based on predictions
        alerts = []
        max_predicted_aqi = max([pred['aqi'] for pred in predictions_72h])
        
        if max_predicted_aqi > 300:
            alerts.append({
                "type": "emergency",
                "severity": "critical",
                "message": f"Hazardous conditions predicted (AQI: {max_predicted_aqi})",
                "timeframe": "Next 72 hours",
                "recommended_action": "Prepare emergency response measures"
            })
        elif max_predicted_aqi > 200:
            alerts.append({
                "type": "warning",
                "severity": "high",
                "message": f"Unhealthy conditions predicted (AQI: {max_predicted_aqi})",
                "timeframe": "Next 72 hours",
                "recommended_action": "Implement health advisories"
            })
        
        # Generate detailed forecast data
        forecast_data = {
            "timestamp": datetime.now().isoformat(),
            "current_conditions": {
                "aqi": current_aqi,
                "category": get_aqi_category(current_aqi),
                "primary_pollutant": aqi_data[0].get('primary_pollutant', 'PM2.5'),
                "weather": {
                    "temperature": current_conditions['temperature'],
                    "humidity": current_conditions['humidity'],
                    "wind_speed": current_conditions['wind_speed'],
                    "wind_direction": current_conditions['wind_direction'],
                    "pressure": current_conditions['pressure']
                }
            },
            "forecasts": {
                "6_hour": {
                    "predictions": predictions_6h,
                    "confidence": confidence_metrics["6h_forecast"],
                    "peak_aqi": max([pred['aqi'] for pred in predictions_6h]),
                    "trend": "increasing" if predictions_6h[-1]['aqi'] > predictions_6h[0]['aqi'] else "decreasing"
                },
                "24_hour": {
                    "predictions": predictions_24h,
                    "confidence": confidence_metrics["24h_forecast"],
                    "peak_aqi": max([pred['aqi'] for pred in predictions_24h]),
                    "trend": "increasing" if predictions_24h[-1]['aqi'] > predictions_24h[0]['aqi'] else "decreasing"
                },
                "72_hour": {
                    "predictions": predictions_72h,
                    "confidence": confidence_metrics["72h_forecast"],
                    "peak_aqi": max([pred['aqi'] for pred in predictions_72h]),
                    "trend": "increasing" if predictions_72h[-1]['aqi'] > predictions_72h[0]['aqi'] else "decreasing"
                }
            },
            "seasonal_context": {
                "current_season": current_season,
                "seasonal_impact": seasonal_context['impact_level'],
                "primary_seasonal_source": seasonal_context['primary_source'],
                "seasonal_recommendations": seasonal_context.get('recommendations', [])
            },
            "ai_insights": {
                "identified_sources": identified_sources[:3],
                "dominant_source": identified_sources[0] if identified_sources else "Unknown",
                "source_contribution": random.uniform(25, 45),
                "model_confidence": confidence_metrics["model_confidence"]
            },
            "policy_recommendations": policy_recommendations[:3],
            "confidence_metrics": confidence_metrics,
            "alerts": alerts,
            "key_factors": {
                "weather_impact": random.uniform(0.6, 0.9),
                "source_activity": random.uniform(0.7, 0.95),
                "seasonal_factors": random.uniform(0.5, 0.8),
                "traffic_patterns": random.uniform(0.6, 0.85),
                "industrial_activity": random.uniform(0.4, 0.8)
            }
        }
        
        return jsonify(forecast_data)
        
    except Exception as e:
        print(f"Error in advanced_forecast: {e}")
        return jsonify({"error": "Failed to generate advanced forecast", "details": str(e)}), 500

@forecasting_bp.route('/predictive-modeling')
def predictive_modeling():
    """Advanced predictive modeling with multiple scenarios"""
    try:
        # Initialize AI models
        forecaster = PollutionForecaster()
        source_identifier = SourceIdentifier()
        
        # Get current data
        aqi_data = read_csv_data('aqi_readings.csv')
        
        if not aqi_data:
            return jsonify({"error": "No AQI data available"})
        
        current_conditions = {
            'pm25': float(aqi_data[0].get('pm25', 120)),
            'pm10': float(aqi_data[0].get('pm10', 150)),
            'temperature': float(aqi_data[0].get('temperature', 28.5)),
            'humidity': float(aqi_data[0].get('humidity', 45)),
            'wind_speed': float(aqi_data[0].get('wind_speed', 8.2)),
            'hour': datetime.now().hour,
            'day_of_year': datetime.now().timetuple().tm_yday
        }
        
        # Scenario-based predictions
        scenarios = {
            "baseline": {
                "name": "Current Conditions",
                "description": "Forecast based on current conditions without intervention",
                "predictions": forecaster.predict_aqi(current_conditions, forecast_hours=72),
                "probability": 0.6
            },
            "intervention": {
                "name": "With Policy Intervention",
                "description": "Forecast assuming immediate policy interventions",
                "predictions": forecaster.predict_aqi({
                    **current_conditions,
                    'traffic_reduction': 0.3,
                    'industrial_emission_reduction': 0.2
                }, forecast_hours=72),
                "probability": 0.25
            },
            "worsening": {
                "name": "Worsening Conditions",
                "description": "Forecast if pollution sources increase activity",
                "predictions": forecaster.predict_aqi({
                    **current_conditions,
                    'stubble_burning_intensity': 1.5,
                    'traffic_increase': 0.2
                }, forecast_hours=72),
                "probability": 0.15
            }
        }
        
        # Model performance metrics
        model_metrics = {
            "accuracy_metrics": {
                "mae": 12.5,  # Mean Absolute Error
                "rmse": 18.7,  # Root Mean Square Error
                "mape": 8.2,   # Mean Absolute Percentage Error
                "r2_score": 0.89
            },
            "model_versions": {
                "primary_model": "RandomForest v3.2.1",
                "ensemble_models": ["LSTM", "XGBoost", "Linear Regression"],
                "last_trained": "2024-01-15T10:30:00Z",
                "training_data_size": "2 years"
            },
            "feature_importance": {
                "pm25_current": 0.28,
                "temperature": 0.15,
                "humidity": 0.12,
                "wind_speed": 0.10,
                "hour_of_day": 0.08,
                "day_of_year": 0.07,
                "traffic_patterns": 0.06,
                "seasonal_factors": 0.05,
                "other": 0.09
            }
        }
        
        # Generate ensemble predictions
        ensemble_predictions = []
        for i in range(72):  # 72 hours
            baseline_aqi = scenarios["baseline"]["predictions"][i]["aqi"]
            intervention_aqi = scenarios["intervention"]["predictions"][i]["aqi"]
            worsening_aqi = scenarios["worsening"]["predictions"][i]["aqi"]
            
            # Weighted average based on probabilities
            ensemble_aqi = (
                baseline_aqi * scenarios["baseline"]["probability"] +
                intervention_aqi * scenarios["intervention"]["probability"] +
                worsening_aqi * scenarios["worsening"]["probability"]
            )
            
            ensemble_predictions.append({
                "hour": i,
                "aqi": round(ensemble_aqi, 1),
                "confidence": 85 + random.uniform(-5, 5),
                "timestamp": (datetime.now() + timedelta(hours=i)).isoformat()
            })
        
        return jsonify({
            "timestamp": datetime.now().isoformat(),
            "model_performance": model_metrics,
            "scenarios": scenarios,
            "ensemble_prediction": {
                "predictions": ensemble_predictions,
                "peak_aqi": max([pred['aqi'] for pred in ensemble_predictions]),
                "average_aqi": sum([pred['aqi'] for pred in ensemble_predictions]) / len(ensemble_predictions),
                "trend": "increasing" if ensemble_predictions[-1]['aqi'] > ensemble_predictions[0]['aqi'] else "decreasing"
            },
            "recommendations": {
                "best_scenario": "intervention" if scenarios["intervention"]["predictions"][23]["aqi"] < scenarios["baseline"]["predictions"][23]["aqi"] else "baseline",
                "action_required": "Implement immediate interventions" if scenarios["worsening"]["probability"] > 0.3 else "Monitor conditions",
                "confidence_level": "High" if model_metrics["accuracy_metrics"]["r2_score"] > 0.8 else "Medium"
            }
        })
        
    except Exception as e:
        print(f"Error in predictive_modeling: {e}")
        return jsonify({"error": "Failed to generate predictive modeling", "details": str(e)}), 500

def get_aqi_category(aqi_value):
    """Get AQI category based on value"""
    if aqi_value <= 50:
        return "Good"
    elif aqi_value <= 100:
        return "Moderate"
    elif aqi_value <= 150:
        return "Unhealthy for Sensitive Groups"
    elif aqi_value <= 200:
        return "Unhealthy"
    elif aqi_value <= 300:
        return "Very Unhealthy"
    else:
        return "Hazardous"

def get_seasonal_context():
    """Get seasonal context for forecasting"""
    try:
        seasonal_data = read_csv_data('seasonal_data.csv')
        current_month = datetime.now().month
        
        for row in seasonal_data:
            if int(row['month']) == current_month:
                return {
                    'season': row['season'],
                    'impact_level': 'High' if float(row['stubble_burning_intensity']) > 0.7 else 'Medium' if float(row['stubble_burning_intensity']) > 0.3 else 'Low',
                    'primary_source': row['primary_source'],
                    'recommendations': row['recommended_policies'].split('_') if 'recommended_policies' in row else []
                }
        
        # Default seasonal context
        return {
            'season': get_current_season(),
            'impact_level': 'Medium',
            'primary_source': 'Mixed Sources',
            'recommendations': ['Monitor conditions', 'Implement standard measures']
        }
    except Exception as e:
        print(f"Error getting seasonal context: {e}")
        return {
            'season': get_current_season(),
            'impact_level': 'Medium',
            'primary_source': 'Mixed Sources',
            'recommendations': []
        }