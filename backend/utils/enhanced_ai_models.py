"""
Enhanced AI/ML Models for AirWatch AI
Improved accuracy, real-time processing, and advanced analytics
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json
import joblib
import os
from typing import Dict, List, Tuple, Optional
import logging
logger = logging.getLogger(__name__)
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logger.warning("XGBoost not available. XGBoost features will be disabled.")
try:
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from tensorflow.keras.optimizers import Adam
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    logger.warning("TensorFlow not available. LSTM features will be disabled.")
import warnings
warnings.filterwarnings('ignore')

class EnhancedPollutionForecaster:
    """Enhanced pollution forecasting with ensemble methods and LSTM"""
    
    def __init__(self):
        self.models = {
            'random_forest': RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1),
            'gradient_boosting': GradientBoostingRegressor(n_estimators=200, random_state=42),
            'neural_network': MLPRegressor(hidden_layer_sizes=(100, 50, 25), random_state=42, max_iter=1000),
            'lstm': None  # Will be initialized separately
        }
        
        # Add XGBoost only if available
        if XGBOOST_AVAILABLE:
            self.models['xgboost'] = xgb.XGBRegressor(n_estimators=200, random_state=42, n_jobs=-1)
        
        self.scalers = {
            'standard': StandardScaler(),
            'robust': RobustScaler()
        }
        
        self.feature_importance = {}
        self.model_weights = {}
        self.is_trained = False
        self.performance_metrics = {}
        
    def prepare_enhanced_features(self, historical_data: List[Dict], weather_data: Dict = None) -> np.ndarray:
        """Prepare enhanced feature set with temporal and spatial features"""
        features = []
        
        for i, data in enumerate(historical_data):
            # Basic pollution features
            basic_features = [
                data.get('pm25', 0),
                data.get('pm10', 0),
                data.get('so2', 0),
                data.get('no2', 0),
                data.get('co', 0),
                data.get('o3', 0)
            ]
            
            # Weather features
            weather_features = [
                data.get('temperature', 25),
                data.get('humidity', 50),
                data.get('wind_speed', 5),
                data.get('wind_direction', 0) / 360,  # Normalize direction
                data.get('pressure', 1013),
                data.get('visibility', 10)
            ]
            
            # Temporal features
            current_time = datetime.now()
            temporal_features = [
                current_time.hour / 24,  # Hour of day (0-1)
                current_time.timetuple().tm_yday / 365,  # Day of year (0-1)
                current_time.weekday() / 7,  # Day of week (0-1)
                current_time.month / 12,  # Month (0-1)
                1 if current_time.weekday() >= 5 else 0,  # Weekend flag
            ]
            
            # Seasonal features for Delhi-NCR
            seasonal_features = [
                1 if 280 <= current_time.timetuple().tm_yday <= 334 else 0,  # Stubble burning season
                1 if 334 <= current_time.timetuple().tm_yday <= 365 or current_time.timetuple().tm_yday <= 60 else 0,  # Winter
                1 if 60 <= current_time.timetuple().tm_yday <= 150 else 0,  # Summer/Dust season
                1 if 280 <= current_time.timetuple().tm_yday <= 365 else 0,  # Festival season
            ]
            
            # Lag features (previous hour values)
            lag_features = []
            if i > 0:
                prev_data = historical_data[i-1]
                lag_features = [
                    prev_data.get('pm25', 0),
                    prev_data.get('pm10', 0),
                    prev_data.get('aqi', 0)
                ]
            else:
                lag_features = [0, 0, 0]
            
            # Rolling averages (if we have enough data)
            if len(historical_data) >= 6:
                recent_data = historical_data[-6:]
                rolling_features = [
                    np.mean([d.get('pm25', 0) for d in recent_data]),
                    np.mean([d.get('pm10', 0) for d in recent_data]),
                    np.mean([d.get('aqi', 0) for d in recent_data])
                ]
            else:
                rolling_features = [data.get('pm25', 0), data.get('pm10', 0), data.get('aqi', 0)]
            
            # Combine all features
            feature_vector = (basic_features + weather_features + temporal_features + 
                            seasonal_features + lag_features + rolling_features)
            
            features.append(feature_vector)
        
        return np.array(features)
    
    def create_lstm_model(self, input_shape: Tuple[int, int]):
        """Create LSTM model for time series forecasting"""
        if not TENSORFLOW_AVAILABLE:
            logger.warning("TensorFlow not available. Cannot create LSTM model.")
            return None
            
        model = Sequential([
            LSTM(128, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(64, return_sequences=False),
            Dropout(0.2),
            Dense(32, activation='relu'),
            Dense(16, activation='relu'),
            Dense(1, activation='linear')
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        return model
    
    def prepare_lstm_data(self, historical_data: List[Dict], sequence_length: int = 24) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for LSTM model"""
        features = []
        targets = []
        
        # Create sequences
        for i in range(sequence_length, len(historical_data)):
            sequence = historical_data[i-sequence_length:i]
            target = historical_data[i]['aqi']
            
            # Extract features for the sequence
            seq_features = []
            for data in sequence:
                feature_vector = [
                    data.get('pm25', 0),
                    data.get('pm10', 0),
                    data.get('so2', 0),
                    data.get('no2', 0),
                    data.get('temperature', 25),
                    data.get('humidity', 50),
                    data.get('wind_speed', 5)
                ]
                seq_features.append(feature_vector)
            
            features.append(seq_features)
            targets.append(target)
        
        return np.array(features), np.array(targets)
    
    def train_ensemble_models(self, historical_data: List[Dict], weather_data: Dict = None):
        """Train ensemble of models for better accuracy"""
        logger.info("Training enhanced ensemble models...")
        
        # Prepare features
        X = self.prepare_enhanced_features(historical_data, weather_data)
        y = np.array([data['aqi'] for data in historical_data])
        
        # Scale features
        X_scaled = self.scalers['standard'].fit_transform(X)
        
        # Train individual models
        for name, model in self.models.items():
            if name == 'lstm':
                continue  # LSTM will be trained separately
                
            logger.info(f"Training {name}...")
            model.fit(X_scaled, y)
            
            # Calculate feature importance
            if hasattr(model, 'feature_importances_'):
                self.feature_importance[name] = model.feature_importances_
            
            # Calculate model performance
            y_pred = model.predict(X_scaled)
            mae = mean_absolute_error(y, y_pred)
            rmse = np.sqrt(mean_squared_error(y, y_pred))
            r2 = r2_score(y, y_pred)
            
            self.performance_metrics[name] = {
                'mae': mae,
                'rmse': rmse,
                'r2': r2
            }
            
            logger.info(f"{name} - MAE: {mae:.2f}, RMSE: {rmse:.2f}, R²: {r2:.3f}")
        
        # Train LSTM model
        if len(historical_data) >= 24:
            self.train_lstm_model(historical_data)
        
        # Calculate ensemble weights based on performance
        self.calculate_ensemble_weights()
        
        self.is_trained = True
        logger.info("Ensemble training completed!")
    
    def train_lstm_model(self, historical_data: List[Dict]):
        """Train LSTM model for time series forecasting"""
        if not TENSORFLOW_AVAILABLE:
            logger.warning("TensorFlow not available. Skipping LSTM training.")
            return
            
        try:
            logger.info("Training LSTM model...")
            
            X_lstm, y_lstm = self.prepare_lstm_data(historical_data)
            
            if len(X_lstm) > 0:
                # Create LSTM model
                input_shape = (X_lstm.shape[1], X_lstm.shape[2])
                lstm_model = self.create_lstm_model(input_shape)
                
                if lstm_model is None:
                    logger.warning("Could not create LSTM model. Skipping training.")
                    return
                
                self.models['lstm'] = lstm_model
                
                # Train LSTM
                self.models['lstm'].fit(
                    X_lstm, y_lstm,
                    epochs=50,
                    batch_size=32,
                    validation_split=0.2,
                    verbose=0
                )
                
                # Calculate performance
                y_pred = self.models['lstm'].predict(X_lstm)
                mae = mean_absolute_error(y_lstm, y_pred)
                rmse = np.sqrt(mean_squared_error(y_lstm, y_pred))
                r2 = r2_score(y_lstm, y_pred)
                
                self.performance_metrics['lstm'] = {
                    'mae': mae,
                    'rmse': rmse,
                    'r2': r2
                }
                
                logger.info(f"LSTM - MAE: {mae:.2f}, RMSE: {rmse:.2f}, R²: {r2:.3f}")
            
        except Exception as e:
            logger.error(f"Error training LSTM model: {e}")
    
    def calculate_ensemble_weights(self):
        """Calculate weights for ensemble prediction based on model performance"""
        total_r2 = sum(metrics['r2'] for metrics in self.performance_metrics.values())
        
        for model_name, metrics in self.performance_metrics.items():
            if total_r2 > 0:
                self.model_weights[model_name] = metrics['r2'] / total_r2
            else:
                self.model_weights[model_name] = 1.0 / len(self.performance_metrics)
        
        logger.info(f"Ensemble weights: {self.model_weights}")
    
    def predict_enhanced(self, current_data: Dict, forecast_hours: int = 72) -> List[Dict]:
        """Enhanced prediction using ensemble methods"""
        if not self.is_trained:
            logger.warning("Models not trained, using fallback prediction")
            return self.fallback_prediction(current_data, forecast_hours)
        
        predictions = []
        current_time = datetime.now()
        
        for hour in range(1, forecast_hours + 1):
            forecast_time = current_time + timedelta(hours=hour)
            
            # Prepare enhanced features for this hour
            feature_vector = self.prepare_enhanced_features([{
                **current_data,
                'hour': forecast_time.hour,
                'day_of_year': forecast_time.timetuple().tm_yday,
                'is_weekend': 1 if forecast_time.weekday() >= 5 else 0,
                'stubble_burning_season': 1 if 280 <= forecast_time.timetuple().tm_yday <= 334 else 0,
                'festival_season': 1 if 280 <= forecast_time.timetuple().tm_yday <= 365 else 0,
                'temperature': current_data.get('temperature', 25) + np.random.normal(0, 1.5),
                'humidity': current_data.get('humidity', 50) + np.random.normal(0, 3),
                'wind_speed': current_data.get('wind_speed', 5) + np.random.normal(0, 0.5)
            }])
            
            # Scale features
            feature_scaled = self.scalers['standard'].transform(feature_vector)
            
            # Get predictions from all models
            model_predictions = {}
            for model_name, model in self.models.items():
                if model is None:
                    continue
                    
                try:
                    if model_name == 'lstm':
                        # LSTM needs sequence data
                        lstm_pred = self.predict_lstm(current_data, forecast_time)
                        model_predictions[model_name] = lstm_pred
                    else:
                        pred = model.predict(feature_scaled)[0]
                        model_predictions[model_name] = pred
                        
                except Exception as e:
                    logger.warning(f"Error predicting with {model_name}: {e}")
                    continue
            
            # Ensemble prediction
            if model_predictions:
                ensemble_pred = 0
                total_weight = 0
                
                for model_name, pred in model_predictions.items():
                    weight = self.model_weights.get(model_name, 0.1)
                    ensemble_pred += pred * weight
                    total_weight += weight
                
                if total_weight > 0:
                    final_prediction = ensemble_pred / total_weight
                else:
                    final_prediction = np.mean(list(model_predictions.values()))
            else:
                final_prediction = 200  # Fallback
            
            # Add realistic variation and bounds
            final_prediction += np.random.normal(0, final_prediction * 0.03)
            final_prediction = max(0, min(500, final_prediction))
            
            # Calculate confidence based on model agreement
            if len(model_predictions) > 1:
                predictions_list = list(model_predictions.values())
                std_dev = np.std(predictions_list)
                confidence = max(60, 95 - (std_dev / np.mean(predictions_list)) * 100)
            else:
                confidence = 85
            
            predictions.append({
                'timestamp': forecast_time.isoformat(),
                'aqi': round(final_prediction),
                'category': self.get_aqi_category(final_prediction),
                'primary_pollutant': self.predict_primary_pollutant(current_data),
                'confidence': round(confidence, 1),
                'model_agreement': len(model_predictions),
                'ensemble_components': list(model_predictions.keys())
            })
        
        return predictions
    
    def predict_lstm(self, current_data: Dict, forecast_time: datetime) -> float:
        """Predict using LSTM model"""
        if not TENSORFLOW_AVAILABLE or self.models['lstm'] is None:
            return 200  # Fallback
        
        try:
            # Create sequence for LSTM prediction
            sequence = []
            for i in range(24):  # 24-hour sequence
                hour_back = forecast_time - timedelta(hours=24-i)
                sequence.append([
                    current_data.get('pm25', 100),
                    current_data.get('pm10', 150),
                    current_data.get('so2', 15),
                    current_data.get('no2', 25),
                    current_data.get('temperature', 25),
                    current_data.get('humidity', 50),
                    current_data.get('wind_speed', 5)
                ])
            
            sequence = np.array(sequence).reshape(1, 24, 7)
            prediction = self.models['lstm'].predict(sequence, verbose=0)[0][0]
            
            return max(0, min(500, prediction))
            
        except Exception as e:
            logger.error(f"LSTM prediction error: {e}")
            return 200
    
    def predict_primary_pollutant(self, data: Dict) -> str:
        """Predict primary pollutant based on conditions"""
        pollutants = {
            'PM2.5': data.get('pm25', 0),
            'PM10': data.get('pm10', 0),
            'SO2': data.get('so2', 0),
            'NO2': data.get('no2', 0),
            'CO': data.get('co', 0),
            'O3': data.get('o3', 0)
        }
        
        # Apply seasonal and temporal factors
        current_time = datetime.now()
        
        # Stubble burning season increases PM2.5 and PM10
        if 280 <= current_time.timetuple().tm_yday <= 334:
            pollutants['PM2.5'] *= 1.3
            pollutants['PM10'] *= 1.2
        
        # Winter increases SO2 and CO
        if 334 <= current_time.timetuple().tm_yday <= 365 or current_time.timetuple().tm_yday <= 60:
            pollutants['SO2'] *= 1.4
            pollutants['CO'] *= 1.3
        
        # Summer increases O3
        if 60 <= current_time.timetuple().tm_yday <= 150:
            pollutants['O3'] *= 1.5
        
        return max(pollutants, key=pollutants.get)
    
    def get_aqi_category(self, aqi: float) -> str:
        """Get AQI category"""
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
    
    def fallback_prediction(self, current_data: Dict, forecast_hours: int) -> List[Dict]:
        """Fallback prediction when models are not trained"""
        predictions = []
        current_time = datetime.now()
        
        for hour in range(1, forecast_hours + 1):
            forecast_time = current_time + timedelta(hours=hour)
            
            # Simple prediction based on current conditions and time
            base_aqi = current_data.get('aqi', 200)
            
            # Add time-based variation
            hour_factor = 1 + 0.1 * np.sin(2 * np.pi * forecast_time.hour / 24)
            
            # Add seasonal variation
            day_of_year = forecast_time.timetuple().tm_yday
            seasonal_factor = 1 + 0.2 * np.sin(2 * np.pi * day_of_year / 365)
            
            predicted_aqi = base_aqi * hour_factor * seasonal_factor
            predicted_aqi = max(0, min(500, predicted_aqi))
            
            predictions.append({
                'timestamp': forecast_time.isoformat(),
                'aqi': round(predicted_aqi),
                'category': self.get_aqi_category(predicted_aqi),
                'primary_pollutant': self.predict_primary_pollutant(current_data),
                'confidence': 75.0,
                'model_agreement': 1,
                'ensemble_components': ['fallback']
            })
        
        return predictions
    
    def get_model_performance(self) -> Dict:
        """Get performance metrics for all models"""
        return {
            'performance_metrics': self.performance_metrics,
            'model_weights': self.model_weights,
            'feature_importance': self.feature_importance,
            'is_trained': self.is_trained,
            'last_updated': datetime.now().isoformat()
        }
    
    def save_models(self, model_dir: str = None):
        """Save trained models"""
        if model_dir is None:
            model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        
        os.makedirs(model_dir, exist_ok=True)
        
        # Save traditional ML models
        for name, model in self.models.items():
            if name != 'lstm' and model is not None:
                joblib.dump(model, os.path.join(model_dir, f'{name}_model.pkl'))
        
        # Save scalers
        joblib.dump(self.scalers['standard'], os.path.join(model_dir, 'standard_scaler.pkl'))
        
        # Save LSTM model
        if self.models['lstm'] is not None:
            self.models['lstm'].save(os.path.join(model_dir, 'lstm_model.h5'))
        
        # Save metadata
        metadata = {
            'performance_metrics': self.performance_metrics,
            'model_weights': self.model_weights,
            'feature_importance': self.feature_importance,
            'is_trained': self.is_trained,
            'timestamp': datetime.now().isoformat()
        }
        
        with open(os.path.join(model_dir, 'model_metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Models saved to {model_dir}")

# Global instance
enhanced_forecaster = EnhancedPollutionForecaster()
