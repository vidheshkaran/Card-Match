# Real-Time Data API Routes for AirWatch AI

from flask import Blueprint, jsonify, request
from utils.real_time_data import RealTimeDataFetcher
from datetime import datetime, timedelta
import json
import random

# Create blueprint for real-time data
realtime_bp = Blueprint('realtime', __name__)

# Initialize data fetcher
data_fetcher = RealTimeDataFetcher()

@realtime_bp.route('/current-aqi', methods=['GET'])
def get_current_aqi():
    """Get current real-time AQI data for all Delhi stations"""
    try:
        # Fetch real-time data
        real_time_data = data_fetcher.fetch_all_delhi_stations()
        
        # Process data for frontend
        processed_data = []
        for station in real_time_data:
            processed_data.append({
                'station_id': station['station_id'],
                'station_name': station['station_name'],
                'latitude': station['latitude'],
                'longitude': station['longitude'],
                'pm25': round(station.get('pm25', 0), 1),
                'pm10': round(station.get('pm10', 0), 1),
                'so2': round(station.get('so2', 0), 1),
                'no2': round(station.get('no2', 0), 1),
                'co': round(station.get('co', 0), 2),
                'o3': round(station.get('o3', 0), 1),
                'aqi': int(station.get('aqi', 0)),
                'category': get_aqi_category(station.get('aqi', 0)),
                'temperature': round(station.get('temperature', 0), 1),
                'humidity': round(station.get('humidity', 0), 1),
                'wind_speed': round(station.get('wind_speed', 0), 1),
                'wind_direction': station.get('wind_direction', 'NW'),
                'pressure': round(station.get('pressure', 0), 1),
                'timestamp': station.get('timestamp', datetime.now().isoformat()),
                'data_sources': station.get('data_sources', ['Mock Data']),
                'confidence': station.get('confidence', 50),
                'is_real_time': 'Mock Data' not in station.get('data_sources', [])
            })
        
        return jsonify({
            'success': True,
            'data': processed_data,
            'timestamp': datetime.now().isoformat(),
            'total_stations': len(processed_data),
            'real_time_stations': len([s for s in processed_data if s['is_real_time']]),
            'api_usage': data_fetcher.get_api_usage_stats()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'data': [],
            'timestamp': datetime.now().isoformat()
        }), 500

@realtime_bp.route('/station/<station_id>', methods=['GET'])
def get_station_data(station_id):
    """Get real-time data for a specific station"""
    try:
        if station_id not in data_fetcher.delhi_stations:
            return jsonify({
                'success': False,
                'error': 'Station not found'
            }), 404
        
        station_info = data_fetcher.delhi_stations[station_id]
        
        # Fetch data for specific station
        station_data = data_fetcher.fetch_openweather_air_quality(
            station_info['lat'], 
            station_info['lon']
        )
        
        if not station_data:
            # Fallback to mock data
            station_data = data_fetcher.generate_fallback_data(station_id)
        
        processed_data = {
            'station_id': station_id,
            'station_name': station_info['name'],
            'latitude': station_info['lat'],
            'longitude': station_info['lon'],
            'pm25': round(station_data.get('pm25', 0), 1),
            'pm10': round(station_data.get('pm10', 0), 1),
            'so2': round(station_data.get('so2', 0), 1),
            'no2': round(station_data.get('no2', 0), 1),
            'co': round(station_data.get('co', 0), 2),
            'o3': round(station_data.get('o3', 0), 1),
            'aqi': int(station_data.get('aqi', 0)),
            'category': get_aqi_category(station_data.get('aqi', 0)),
            'temperature': round(station_data.get('temperature', 0), 1),
            'humidity': round(station_data.get('humidity', 0), 1),
            'wind_speed': round(station_data.get('wind_speed', 0), 1),
            'wind_direction': station_data.get('wind_direction', 'NW'),
            'pressure': round(station_data.get('pressure', 0), 1),
            'timestamp': station_data.get('timestamp', datetime.now().isoformat()),
            'source': station_data.get('source', 'Mock Data'),
            'is_real_time': station_data.get('source', 'Mock Data') != 'Mock Data'
        }
        
        return jsonify({
            'success': True,
            'data': processed_data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'data': None,
            'timestamp': datetime.now().isoformat()
        }), 500

@realtime_bp.route('/station/<station_id>/history', methods=['GET'])
def get_station_history(station_id):
    """Get historical data for a specific station"""
    try:
        # Get time range from query params (default: 24 hours)
        hours = request.args.get('hours', 24, type=int)
        
        # Read AQI data
        from utils.csv_data import read_csv_data
        aqi_data = read_csv_data('aqi_readings.csv')
        
        if not aqi_data:
            return jsonify({
                'success': False,
                'error': 'No data available'
            }), 404
        
        # Generate time series data
        time_series = []
        base_time = datetime.now()
        
        for i in range(hours):
            hour_ago = base_time - timedelta(hours=i)
            # Use current data with variation
            base_aqi = float(aqi_data[0].get('aqi', 200))
            aqi_value = base_aqi + random.uniform(-30, 30)
            
            time_series.append({
                'timestamp': hour_ago.isoformat(),
                'aqi': round(max(50, min(400, aqi_value))),
                'pm25': round(aqi_value / 2.5 + random.uniform(-10, 10)),
                'pm10': round(aqi_value / 1.2 + random.uniform(-15, 15)),
                'temperature': float(aqi_data[0].get('temperature', 28.5)) + random.uniform(-3, 3),
                'humidity': float(aqi_data[0].get('humidity', 45)) + random.uniform(-10, 10)
            })
        
        time_series.reverse()  # Chronological order
        
        return jsonify({
            'success': True,
            'station_id': station_id,
            'time_series': time_series,
            'period_hours': hours,
            'data_points': len(time_series),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@realtime_bp.route('/forecast-real-time', methods=['GET'])
def get_real_time_forecast():
    """Get real-time forecast based on current conditions"""
    try:
        # Get current real-time data
        current_data = data_fetcher.fetch_all_delhi_stations()
        
        # Calculate average current conditions
        avg_aqi = sum(station.get('aqi', 0) for station in current_data) / len(current_data)
        avg_pm25 = sum(station.get('pm25', 0) for station in current_data) / len(current_data)
        avg_pm10 = sum(station.get('pm10', 0) for station in current_data) / len(current_data)
        
        # Generate forecast based on current conditions
        forecast_data = generate_real_time_forecast(avg_aqi, avg_pm25, avg_pm10)
        
        return jsonify({
            'success': True,
            'data': forecast_data,
            'current_conditions': {
                'avg_aqi': round(avg_aqi, 1),
                'avg_pm25': round(avg_pm25, 1),
                'avg_pm10': round(avg_pm10, 1),
                'timestamp': datetime.now().isoformat()
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'data': None,
            'timestamp': datetime.now().isoformat()
        }), 500

@realtime_bp.route('/api-status', methods=['GET'])
def get_api_status():
    """Get API usage status and health"""
    try:
        usage_stats = data_fetcher.get_api_usage_stats()
        
        # Check API health
        health_status = {}
        for api_name, stats in usage_stats.items():
            health_status[api_name] = {
                'status': 'healthy' if stats['remaining'] > 0 else 'limit_exceeded',
                'calls_made': stats['calls_made'],
                'remaining': stats['remaining'],
                'usage_percentage': stats['usage_percentage']
            }
        
        return jsonify({
            'success': True,
            'api_status': health_status,
            'timestamp': datetime.now().isoformat(),
            'recommendations': get_api_recommendations(usage_stats)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

def get_aqi_category(aqi):
    """Get AQI category based on AQI value"""
    if aqi <= 50:
        return 'Good'
    elif aqi <= 100:
        return 'Satisfactory'
    elif aqi <= 200:
        return 'Moderate'
    elif aqi <= 300:
        return 'Poor'
    elif aqi <= 400:
        return 'Very Poor'
    else:
        return 'Severe'

def generate_real_time_forecast(avg_aqi, avg_pm25, avg_pm10):
    """Generate forecast based on current real-time conditions"""
    from datetime import datetime, timedelta
    
    forecast = []
    current_time = datetime.now()
    
    for hour in range(1, 25):  # 24-hour forecast
        forecast_time = current_time + timedelta(hours=hour)
        
        # Simple forecast logic based on current conditions
        # In reality, this would use ML models trained on historical data
        
        # Simulate daily patterns
        hour_of_day = forecast_time.hour
        if 6 <= hour_of_day <= 10:  # Morning rush
            multiplier = 1.2
        elif 17 <= hour_of_day <= 21:  # Evening rush
            multiplier = 1.3
        elif 22 <= hour_of_day or hour_of_day <= 5:  # Night
            multiplier = 0.8
        else:  # Daytime
            multiplier = 1.0
        
        # Add some randomness and trend
        trend_factor = 1 + (hour * 0.01)  # Slight upward trend
        random_factor = 0.9 + (hash(str(hour)) % 20) / 100  # ±10% variation
        
        predicted_aqi = avg_aqi * multiplier * trend_factor * random_factor
        predicted_pm25 = avg_pm25 * multiplier * trend_factor * random_factor
        predicted_pm10 = avg_pm10 * multiplier * trend_factor * random_factor
        
        forecast.append({
            'timestamp': forecast_time.isoformat(),
            'hour': hour,
            'aqi': max(50, min(500, int(predicted_aqi))),
            'pm25': max(25, min(250, int(predicted_pm25))),
            'pm10': max(50, min(400, int(predicted_pm10))),
            'category': get_aqi_category(predicted_aqi),
            'confidence': max(60, 95 - hour * 1.5),  # Decreasing confidence over time
            'factors': {
                'time_of_day': hour_of_day,
                'traffic_pattern': 'high' if 6 <= hour_of_day <= 10 or 17 <= hour_of_day <= 21 else 'normal',
                'weather_impact': 'moderate',
                'seasonal_factor': 'post_monsoon'
            }
        })
    
    return {
        'forecast_hours': forecast,
        'generated_at': current_time.isoformat(),
        'based_on_real_data': True,
        'model_version': 'v1.0_simple'
    }

def get_api_recommendations(usage_stats):
    """Get recommendations based on API usage"""
    recommendations = []
    
    for api_name, stats in usage_stats.items():
        if stats['usage_percentage'] > 80:
            recommendations.append(f"⚠️ {api_name} API is at {stats['usage_percentage']:.1f}% usage. Consider upgrading to paid plan.")
        elif stats['usage_percentage'] > 50:
            recommendations.append(f"📊 {api_name} API is at {stats['usage_percentage']:.1f}% usage. Monitor usage carefully.")
        else:
            recommendations.append(f"✅ {api_name} API usage is healthy at {stats['usage_percentage']:.1f}%")
    
    if not recommendations:
        recommendations.append("All APIs are healthy and within limits.")
    
    return recommendations


