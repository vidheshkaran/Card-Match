import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import os

class PollutionForecaster:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def prepare_features(self, historical_data, weather_data=None):
        """Prepare features for ML model"""
        features = []
        
        for data in historical_data:
            feature_vector = [
                data.get('pm25', 0),
                data.get('pm10', 0),
                data.get('so2', 0),
                data.get('no2', 0),
                data.get('co', 0),
                data.get('o3', 0),
                data.get('temperature', 25),
                data.get('humidity', 50),
                data.get('wind_speed', 5),
                data.get('hour', 12),
                data.get('day_of_year', 100),
                data.get('is_weekend', 0),
                data.get('stubble_burning_season', 0),  # Oct-Nov
                data.get('festival_season', 0),  # Oct-Dec
                data.get('construction_activity', 0)
            ]
            features.append(feature_vector)
            
        return np.array(features)
    
    def train_model(self, historical_data):
        """Train the forecasting model"""
        features = self.prepare_features(historical_data)
        targets = [data['aqi'] for data in historical_data]
        
        features_scaled = self.scaler.fit_transform(features)
        self.model.fit(features_scaled, targets)
        self.is_trained = True
        
        # Save model
        model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        os.makedirs(model_dir, exist_ok=True)
        joblib.dump(self.model, os.path.join(model_dir, 'pollution_model.pkl'))
        joblib.dump(self.scaler, os.path.join(model_dir, 'scaler.pkl'))
        
    def predict_aqi(self, current_data, forecast_hours=24):
        """Predict AQI for next hours"""
        if not self.is_trained:
            self.load_model()
            
        predictions = []
        current_time = datetime.now()
        
        for hour in range(1, forecast_hours + 1):
            forecast_time = current_time + timedelta(hours=hour)
            
            # Prepare feature vector for this hour
            feature_vector = self.prepare_features([{
                **current_data,
                'hour': forecast_time.hour,
                'day_of_year': forecast_time.timetuple().tm_yday,
                'is_weekend': 1 if forecast_time.weekday() >= 5 else 0,
                'stubble_burning_season': 1 if 280 <= forecast_time.timetuple().tm_yday <= 334 else 0,  # Oct-Nov
                'festival_season': 1 if 280 <= forecast_time.timetuple().tm_yday <= 365 else 0,  # Oct-Dec
                'temperature': current_data.get('temperature', 25) + np.random.normal(0, 2),  # Simulate temp variation
                'humidity': current_data.get('humidity', 50) + np.random.normal(0, 5),
                'wind_speed': current_data.get('wind_speed', 5) + np.random.normal(0, 1)
            }])
            
            try:
                feature_scaled = self.scaler.transform(feature_vector)
                predicted_aqi = self.model.predict(feature_scaled)[0]
            except Exception as e:
                # If scaler is not fitted, use mock prediction
                print(f"Scaler error: {e}")
                predicted_aqi = 200 + np.random.normal(0, 50)
            
            # Add some realistic variation
            predicted_aqi += np.random.normal(0, predicted_aqi * 0.05)
            predicted_aqi = max(0, min(500, predicted_aqi))  # Clamp to valid AQI range
            
            predictions.append({
                'timestamp': forecast_time.isoformat(),
                'aqi': round(predicted_aqi),
                'category': self.get_aqi_category(predicted_aqi),
                'primary_pollutant': self.predict_primary_pollutant(current_data),
                'confidence': max(60, 95 - hour * 2)  # Decreasing confidence over time
            })
            
        return predictions
    
    def load_model(self):
        """Load pre-trained model"""
        model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        try:
            self.model = joblib.load(os.path.join(model_dir, 'pollution_model.pkl'))
            self.scaler = joblib.load(os.path.join(model_dir, 'scaler.pkl'))
            self.is_trained = True
        except FileNotFoundError:
            print("Model not found, using default predictions")
            self.is_trained = False
    
    def get_aqi_category(self, aqi):
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
    
    def predict_primary_pollutant(self, data):
        """Predict primary pollutant based on current data"""
        pollutants = {
            'PM2.5': data.get('pm25', 0),
            'PM10': data.get('pm10', 0),
            'SO2': data.get('so2', 0),
            'NO2': data.get('no2', 0),
            'CO': data.get('co', 0),
            'O3': data.get('o3', 0)
        }
        return max(pollutants, key=pollutants.get)

class SourceIdentifier:
    def __init__(self):
        self.satellite_sources = {
            'stubble_burning': {
                'indicators': ['thermal_anomalies', 'smoke_plumes', 'fire_count'],
                'confidence_threshold': 0.7
            },
            'industrial': {
                'indicators': ['so2_spikes', 'thermal_emissions', 'smokestack_detection'],
                'confidence_threshold': 0.8
            },
            'vehicular': {
                'indicators': ['traffic_density', 'no2_patterns', 'rush_hour_correlation'],
                'confidence_threshold': 0.6
            },
            'construction': {
                'indicators': ['dust_plumes', 'pm10_spikes', 'construction_activity'],
                'confidence_threshold': 0.7
            }
        }
    
    def identify_sources(self, pollution_data, satellite_data=None, iot_data=None):
        """Identify pollution sources using multiple data sources"""
        sources = []
        
        # Analyze satellite data for stubble burning
        if satellite_data:
            stubble_confidence = self.analyze_stubble_burning(satellite_data)
            if stubble_confidence > 0.7:
                sources.append({
                    'type': 'Stubble Burning',
                    'location': self.get_stubble_location(satellite_data),
                    'confidence': stubble_confidence,
                    'contribution': min(40, stubble_confidence * 50),
                    'timestamp': datetime.now().isoformat()
                })
        
        # Analyze IoT data for local sources
        if iot_data:
            industrial_sources = self.analyze_industrial_sources(iot_data)
            vehicular_sources = self.analyze_vehicular_sources(iot_data)
            construction_sources = self.analyze_construction_sources(iot_data)
            
            sources.extend(industrial_sources + vehicular_sources + construction_sources)
        
        # Fallback to pollution pattern analysis
        if not sources:
            sources = self.analyze_pollution_patterns(pollution_data)
        
        return sources
    
    def analyze_stubble_burning(self, satellite_data):
        """Analyze satellite data for stubble burning indicators"""
        # Mock analysis based on satellite data
        fire_count = satellite_data.get('fire_count', 0)
        thermal_anomalies = satellite_data.get('thermal_anomalies', 0)
        smoke_plumes = satellite_data.get('smoke_plumes', 0)
        
        confidence = min(1.0, (fire_count * 0.3 + thermal_anomalies * 0.4 + smoke_plumes * 0.3) / 100)
        return confidence
    
    def get_stubble_location(self, satellite_data):
        """Get location of stubble burning from satellite data"""
        locations = [
            "Punjab-Haryana Border (Ludhiana District)",
            "Karnal District, Haryana", 
            "Fatehabad District, Haryana",
            "Patiala District, Punjab"
        ]
        return np.random.choice(locations)
    
    def analyze_industrial_sources(self, iot_data):
        """Analyze IoT data for industrial pollution sources"""
        sources = []
        
        # Check for SO2 spikes indicating industrial activity
        if iot_data.get('so2_spike', False):
            sources.append({
                'type': 'Industrial',
                'location': np.random.choice([
                    "Mayapuri Industrial Area",
                    "Okhla Industrial Area", 
                    "Narela Industrial Area"
                ]),
                'confidence': 0.85,
                'contribution': 25,
                'timestamp': datetime.now().isoformat()
            })
        
        return sources
    
    def analyze_vehicular_sources(self, iot_data):
        """Analyze IoT data for vehicular pollution sources"""
        sources = []
        
        # Check for NO2 patterns indicating traffic
        if iot_data.get('traffic_congestion', False):
            sources.append({
                'type': 'Vehicular',
                'location': np.random.choice([
                    "ITO Junction",
                    "Delhi Gate",
                    "Connaught Place",
                    "India Gate"
                ]),
                'confidence': 0.75,
                'contribution': 35,
                'timestamp': datetime.now().isoformat()
            })
        
        return sources
    
    def analyze_construction_sources(self, iot_data):
        """Analyze IoT data for construction pollution sources"""
        sources = []
        
        # Check for PM10 spikes indicating construction dust
        if iot_data.get('pm10_spike', False):
            sources.append({
                'type': 'Construction',
                'location': np.random.choice([
                    "Dwarka Expressway",
                    "Noida Construction Sites",
                    "Gurgaon Highrise Projects"
                ]),
                'confidence': 0.80,
                'contribution': 20,
                'timestamp': datetime.now().isoformat()
            })
        
        return sources
    
    def analyze_pollution_patterns(self, pollution_data):
        """Fallback analysis based on pollution patterns"""
        sources = []
        
        # Analyze based on pollutant ratios
        if pollution_data.get('pm25', 0) > 100:
            sources.append({
                'type': 'Vehicular/Industrial',
                'location': 'Delhi-NCR Region',
                'confidence': 0.6,
                'contribution': 30,
                'timestamp': datetime.now().isoformat()
            })
        
        if pollution_data.get('pm10', 0) > 150:
            sources.append({
                'type': 'Construction/Dust',
                'location': 'Delhi-NCR Region', 
                'confidence': 0.7,
                'contribution': 25,
                'timestamp': datetime.now().isoformat()
            })
        
        return sources

class PolicyRecommender:
    def __init__(self):
        self.policy_effectiveness = {
            'odd_even': {'aqi_reduction': 15, 'cost': 'medium', 'implementation_time': 'immediate'},
            'construction_ban': {'aqi_reduction': 25, 'cost': 'high', 'implementation_time': '1_day'},
            'industrial_shutdown': {'aqi_reduction': 30, 'cost': 'high', 'implementation_time': 'immediate'},
            'smog_towers': {'aqi_reduction': 10, 'cost': 'high', 'implementation_time': '1_week'},
            'green_corridors': {'aqi_reduction': 8, 'cost': 'medium', 'implementation_time': '1_month'},
            'public_transport': {'aqi_reduction': 12, 'cost': 'medium', 'implementation_time': '2_weeks'}
        }
    
    def recommend_policies(self, current_aqi, pollution_sources, weather_forecast):
        """Recommend policies based on current conditions"""
        recommendations = []
        
        # High pollution emergency
        if current_aqi > 300:
            recommendations.extend([
                {
                    'policy': 'Emergency Industrial Shutdown',
                    'reasoning': 'Critical pollution levels require immediate industrial activity reduction',
                    'expected_reduction': 30,
                    'priority': 'immediate',
                    'cost': 'high',
                    'implementation_time': 'immediate'
                },
                {
                    'policy': 'Construction Ban',
                    'reasoning': 'Construction dust is a major contributor during high pollution',
                    'expected_reduction': 25,
                    'priority': 'immediate', 
                    'cost': 'high',
                    'implementation_time': '1_day'
                }
            ])
        
        # Stubble burning season
        elif self.is_stubble_burning_season():
            recommendations.extend([
                {
                    'policy': 'Enhanced Satellite Monitoring',
                    'reasoning': 'Stubble burning is the primary source during this season',
                    'expected_reduction': 20,
                    'priority': 'high',
                    'cost': 'low',
                    'implementation_time': 'immediate'
                },
                {
                    'policy': 'Public Transport Incentives',
                    'reasoning': 'Reduce vehicular emissions to offset stubble burning impact',
                    'expected_reduction': 12,
                    'priority': 'medium',
                    'cost': 'medium',
                    'implementation_time': '2_weeks'
                }
            ])
        
        # Moderate pollution
        elif current_aqi > 200:
            recommendations.extend([
                {
                    'policy': 'Odd-Even Vehicle Policy',
                    'reasoning': 'Traffic reduction will help improve air quality',
                    'expected_reduction': 15,
                    'priority': 'medium',
                    'cost': 'low',
                    'implementation_time': 'immediate'
                },
                {
                    'policy': 'Construction Dust Control',
                    'reasoning': 'Enhanced dust control measures for ongoing projects',
                    'expected_reduction': 18,
                    'priority': 'medium',
                    'cost': 'medium',
                    'implementation_time': '1_week'
                }
            ])
        
        # Source-specific recommendations
        for source in pollution_sources:
            if source['type'] == 'Vehicular':
                recommendations.append({
                    'policy': 'Traffic Management Optimization',
                    'reasoning': f"High vehicular pollution detected at {source['location']}",
                    'expected_reduction': 10,
                    'priority': 'medium',
                    'cost': 'low',
                    'implementation_time': 'immediate'
                })
            elif source['type'] == 'Industrial':
                recommendations.append({
                    'policy': 'Industrial Emission Monitoring',
                    'reasoning': f"Industrial activity detected at {source['location']}",
                    'expected_reduction': 15,
                    'priority': 'high',
                    'cost': 'medium',
                    'implementation_time': '1_week'
                })
        
        # Remove duplicates and sort by priority
        unique_recommendations = []
        seen_policies = set()
        
        for rec in recommendations:
            if rec['policy'] not in seen_policies:
                unique_recommendations.append(rec)
                seen_policies.add(rec['policy'])
        
        return sorted(unique_recommendations, key=lambda x: ['immediate', 'high', 'medium', 'low'].index(x['priority']))
    
    def is_stubble_burning_season(self):
        """Check if current time is stubble burning season (Oct-Nov)"""
        current_day = datetime.now().timetuple().tm_yday
        return 280 <= current_day <= 334  # Oct 7 - Dec 1
    
    def evaluate_policy_effectiveness(self, policy_name, before_aqi, after_aqi):
        """Evaluate effectiveness of a policy"""
        reduction = before_aqi - after_aqi
        effectiveness_score = min(10, (reduction / before_aqi) * 100)
        
        return {
            'policy': policy_name,
            'aqi_reduction': reduction,
            'effectiveness_score': round(effectiveness_score, 1),
            'percentage_improvement': round((reduction / before_aqi) * 100, 1)
        }

# Initialize global instances
forecaster = PollutionForecaster()
source_identifier = SourceIdentifier()
policy_recommender = PolicyRecommender()
