"""
Policy Effectiveness Tracker for AirWatch AI
Real-time tracking and analysis of policy interventions and their effectiveness
"""

import numpy as np
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import statistics

@dataclass
class PolicyIntervention:
    name: str
    start_time: datetime
    end_time: Optional[datetime]
    policy_type: str
    target_sources: List[str]
    expected_reduction: float
    implementation_cost: str
    status: str

@dataclass
class EffectivenessMeasurement:
    intervention_id: str
    timestamp: datetime
    before_aqi: float
    after_aqi: float
    reduction: float
    confidence: float
    weather_factor: float
    baseline_aqi: float

class PolicyEffectivenessTracker:
    """System for tracking and analyzing policy intervention effectiveness"""
    
    def __init__(self):
        self.active_interventions = {}
        self.effectiveness_history = []
        self.baseline_measurements = {}
        self.weather_adjustments = {}
        
        # Policy effectiveness benchmarks
        self.policy_benchmarks = {
            'odd_even': {
                'expected_reduction': 15,
                'time_to_effect': 2,  # hours
                'duration_effect': 8,  # hours
                'cost_category': 'low',
                'implementation_time': 'immediate'
            },
            'construction_ban': {
                'expected_reduction': 25,
                'time_to_effect': 4,
                'duration_effect': 24,
                'cost_category': 'high',
                'implementation_time': '1_day'
            },
            'industrial_shutdown': {
                'expected_reduction': 30,
                'time_to_effect': 1,
                'duration_effect': 12,
                'cost_category': 'high',
                'implementation_time': 'immediate'
            },
            'public_transport_incentive': {
                'expected_reduction': 12,
                'time_to_effect': 6,
                'duration_effect': 48,
                'cost_category': 'medium',
                'implementation_time': '2_weeks'
            },
            'smog_tower_activation': {
                'expected_reduction': 10,
                'time_to_effect': 2,
                'duration_effect': 24,
                'cost_category': 'high',
                'implementation_time': '1_hour'
            },
            'green_corridor': {
                'expected_reduction': 8,
                'time_to_effect': 12,
                'duration_effect': 168,  # 1 week
                'cost_category': 'medium',
                'implementation_time': '1_month'
            }
        }
    
    def start_policy_intervention(self, policy_name: str, target_sources: List[str] = None) -> Dict:
        """Start tracking a new policy intervention"""
        
        if policy_name not in self.policy_benchmarks:
            return {'error': 'Unknown policy type'}
        
        intervention_id = f"{policy_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Create intervention record
        intervention = PolicyIntervention(
            name=policy_name,
            start_time=datetime.now(),
            end_time=None,
            policy_type=policy_name,
            target_sources=target_sources or [],
            expected_reduction=self.policy_benchmarks[policy_name]['expected_reduction'],
            implementation_cost=self.policy_benchmarks[policy_name]['cost_category'],
            status='active'
        )
        
        # Store intervention
        self.active_interventions[intervention_id] = intervention
        
        # Record baseline measurements
        baseline_aqi = self._get_current_aqi_measurement()
        self.baseline_measurements[intervention_id] = {
            'aqi': baseline_aqi,
            'timestamp': datetime.now(),
            'weather_conditions': self._get_current_weather_conditions()
        }
        
        return {
            'intervention_id': intervention_id,
            'policy_name': policy_name,
            'start_time': intervention.start_time.isoformat(),
            'expected_reduction': intervention.expected_reduction,
            'baseline_aqi': baseline_aqi,
            'status': 'active'
        }
    
    def measure_effectiveness(self, intervention_id: str) -> Dict:
        """Measure current effectiveness of an intervention"""
        
        if intervention_id not in self.active_interventions:
            return {'error': 'Intervention not found'}
        
        intervention = self.active_interventions[intervention_id]
        
        # Get current measurements
        current_aqi = self._get_current_aqi_measurement()
        baseline_data = self.baseline_measurements[intervention_id]
        
        # Calculate raw reduction
        raw_reduction = baseline_data['aqi'] - current_aqi
        
        # Adjust for weather conditions
        weather_adjustment = self._calculate_weather_adjustment(
            baseline_data['weather_conditions'],
            self._get_current_weather_conditions()
        )
        
        # Calculate weather-adjusted reduction
        adjusted_reduction = raw_reduction - weather_adjustment
        
        # Calculate effectiveness score
        expected_reduction = intervention.expected_reduction
        effectiveness_score = (adjusted_reduction / expected_reduction) * 100
        
        # Calculate confidence based on time elapsed and data quality
        time_elapsed = (datetime.now() - intervention.start_time).total_seconds() / 3600
        confidence = self._calculate_confidence_score(time_elapsed, intervention.policy_type)
        
        # Create effectiveness measurement
        measurement = EffectivenessMeasurement(
            intervention_id=intervention_id,
            timestamp=datetime.now(),
            before_aqi=baseline_data['aqi'],
            after_aqi=current_aqi,
            reduction=adjusted_reduction,
            confidence=confidence,
            weather_factor=weather_adjustment,
            baseline_aqi=baseline_data['aqi']
        )
        
        # Store measurement
        self.effectiveness_history.append(measurement)
        
        return {
            'intervention_id': intervention_id,
            'policy_name': intervention.name,
            'measurement_time': measurement.timestamp.isoformat(),
            'before_aqi': measurement.before_aqi,
            'after_aqi': measurement.after_aqi,
            'raw_reduction': raw_reduction,
            'weather_adjustment': weather_adjustment,
            'adjusted_reduction': adjusted_reduction,
            'effectiveness_score': round(effectiveness_score, 1),
            'confidence': round(confidence, 2),
            'status': self._get_effectiveness_status(effectiveness_score),
            'recommendations': self._get_effectiveness_recommendations(effectiveness_score, time_elapsed)
        }
    
    def end_policy_intervention(self, intervention_id: str) -> Dict:
        """End a policy intervention and calculate final effectiveness"""
        
        if intervention_id not in self.active_interventions:
            return {'error': 'Intervention not found'}
        
        intervention = self.active_interventions[intervention_id]
        intervention.end_time = datetime.now()
        intervention.status = 'completed'
        
        # Calculate final effectiveness
        final_effectiveness = self.measure_effectiveness(intervention_id)
        
        # Calculate overall statistics
        intervention_measurements = [
            m for m in self.effectiveness_history 
            if m.intervention_id == intervention_id
        ]
        
        if intervention_measurements:
            avg_reduction = statistics.mean([m.reduction for m in intervention_measurements])
            max_reduction = max([m.reduction for m in intervention_measurements])
            min_reduction = min([m.reduction for m in intervention_measurements])
            
            # Calculate cost-effectiveness
            cost_effectiveness = self._calculate_cost_effectiveness(
                intervention, avg_reduction
            )
        else:
            avg_reduction = max_reduction = min_reduction = 0
            cost_effectiveness = 0
        
        return {
            'intervention_id': intervention_id,
            'policy_name': intervention.name,
            'start_time': intervention.start_time.isoformat(),
            'end_time': intervention.end_time.isoformat(),
            'duration_hours': (intervention.end_time - intervention.start_time).total_seconds() / 3600,
            'final_effectiveness': final_effectiveness,
            'statistics': {
                'average_reduction': round(avg_reduction, 1),
                'maximum_reduction': round(max_reduction, 1),
                'minimum_reduction': round(min_reduction, 1),
                'measurement_count': len(intervention_measurements)
            },
            'cost_effectiveness': cost_effectiveness,
            'lessons_learned': self._generate_lessons_learned(intervention, avg_reduction),
            'recommendations': self._generate_final_recommendations(intervention, avg_reduction)
        }
    
    def get_policy_analytics(self) -> Dict:
        """Get comprehensive analytics on all policy interventions"""
        
        # Calculate overall statistics
        all_measurements = self.effectiveness_history
        
        if not all_measurements:
            return {'message': 'No policy interventions tracked yet'}
        
        # Group by policy type
        policy_stats = {}
        for measurement in all_measurements:
            intervention = self.active_interventions.get(measurement.intervention_id)
            if intervention:
                policy_type = intervention.policy_type
                if policy_type not in policy_stats:
                    policy_stats[policy_type] = []
                policy_stats[policy_type].append(measurement)
        
        # Calculate statistics for each policy type
        policy_analytics = {}
        for policy_type, measurements in policy_stats.items():
            reductions = [m.reduction for m in measurements]
            effectiveness_scores = [(m.reduction / self.policy_benchmarks[policy_type]['expected_reduction']) * 100 
                                  for m in measurements]
            
            policy_analytics[policy_type] = {
                'total_interventions': len(set(m.intervention_id for m in measurements)),
                'average_reduction': round(statistics.mean(reductions), 1),
                'median_reduction': round(statistics.median(reductions), 1),
                'std_deviation': round(statistics.stdev(reductions) if len(reductions) > 1 else 0, 1),
                'average_effectiveness': round(statistics.mean(effectiveness_scores), 1),
                'success_rate': len([s for s in effectiveness_scores if s > 70]) / len(effectiveness_scores) * 100,
                'cost_category': self.policy_benchmarks[policy_type]['cost_category'],
                'expected_reduction': self.policy_benchmarks[policy_type]['expected_reduction']
            }
        
        # Calculate overall effectiveness trends
        recent_measurements = [m for m in all_measurements 
                             if m.timestamp > datetime.now() - timedelta(days=7)]
        
        return {
            'policy_analytics': policy_analytics,
            'overall_statistics': {
                'total_measurements': len(all_measurements),
                'active_interventions': len([i for i in self.active_interventions.values() if i.status == 'active']),
                'completed_interventions': len([i for i in self.active_interventions.values() if i.status == 'completed']),
                'average_confidence': round(statistics.mean([m.confidence for m in all_measurements]), 2)
            },
            'recent_trends': self._analyze_recent_trends(recent_measurements),
            'best_performing_policies': self._get_best_performing_policies(policy_analytics),
            'recommendations': self._get_policy_recommendations(policy_analytics),
            'timestamp': datetime.now().isoformat()
        }
    
    def predict_intervention_effectiveness(self, policy_name: str, current_conditions: Dict) -> Dict:
        """Predict effectiveness of a policy intervention before implementation"""
        
        if policy_name not in self.policy_benchmarks:
            return {'error': 'Unknown policy type'}
        
        benchmark = self.policy_benchmarks[policy_name]
        
        # Get current conditions
        current_aqi = current_conditions.get('aqi', 200)
        weather_conditions = current_conditions.get('weather', {})
        
        # Calculate base effectiveness
        base_effectiveness = benchmark['expected_reduction']
        
        # Adjust for current conditions
        aqi_factor = self._calculate_aqi_factor(current_aqi)
        weather_factor = self._calculate_weather_impact_factor(weather_conditions)
        time_factor = self._calculate_time_factor()
        
        # Calculate predicted effectiveness
        predicted_reduction = base_effectiveness * aqi_factor * weather_factor * time_factor
        
        # Calculate confidence based on historical data
        historical_data = self._get_historical_effectiveness(policy_name)
        confidence = self._calculate_prediction_confidence(historical_data, current_conditions)
        
        return {
            'policy_name': policy_name,
            'current_aqi': current_aqi,
            'base_effectiveness': base_effectiveness,
            'predicted_reduction': round(predicted_reduction, 1),
            'effectiveness_factors': {
                'aqi_factor': round(aqi_factor, 2),
                'weather_factor': round(weather_factor, 2),
                'time_factor': round(time_factor, 2)
            },
            'confidence': round(confidence, 2),
            'recommendation': self._get_prediction_recommendation(predicted_reduction, confidence),
            'implementation_time': benchmark['implementation_time'],
            'cost_category': benchmark['cost_category'],
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_current_aqi_measurement(self) -> float:
        """Get current AQI measurement (simulated)"""
        # In real implementation, this would fetch from monitoring stations
        base_aqi = 250
        # Add some realistic variation
        variation = np.random.normal(0, 20)
        return max(50, min(500, base_aqi + variation))
    
    def _get_current_weather_conditions(self) -> Dict:
        """Get current weather conditions (simulated)"""
        return {
            'temperature': np.random.uniform(20, 35),
            'humidity': np.random.uniform(30, 80),
            'wind_speed': np.random.uniform(2, 15),
            'wind_direction': np.random.choice(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']),
            'pressure': np.random.uniform(1000, 1020),
            'visibility': np.random.uniform(2, 10)
        }
    
    def _calculate_weather_adjustment(self, baseline_weather: Dict, current_weather: Dict) -> float:
        """Calculate AQI adjustment due to weather changes"""
        
        # Wind speed impact
        wind_change = current_weather['wind_speed'] - baseline_weather['wind_speed']
        wind_adjustment = wind_change * 2  # Higher wind = lower AQI
        
        # Temperature impact
        temp_change = current_weather['temperature'] - baseline_weather['temperature']
        temp_adjustment = temp_change * 0.5  # Higher temp = higher AQI
        
        # Humidity impact
        humidity_change = current_weather['humidity'] - baseline_weather['humidity']
        humidity_adjustment = humidity_change * 0.3  # Higher humidity = higher AQI
        
        # Pressure impact
        pressure_change = current_weather['pressure'] - baseline_weather['pressure']
        pressure_adjustment = pressure_change * 0.1  # Higher pressure = lower AQI
        
        total_adjustment = wind_adjustment - temp_adjustment - humidity_adjustment - pressure_adjustment
        
        return round(total_adjustment, 1)
    
    def _calculate_confidence_score(self, time_elapsed: float, policy_type: str) -> float:
        """Calculate confidence score for effectiveness measurement"""
        
        benchmark = self.policy_benchmarks[policy_type]
        time_to_effect = benchmark['time_to_effect']
        
        # Confidence increases with time up to a point
        if time_elapsed < time_to_effect:
            confidence = 0.3 + (time_elapsed / time_to_effect) * 0.4
        else:
            confidence = 0.7 + min(0.2, (time_elapsed - time_to_effect) / 24)  # Max confidence after 24 hours
        
        return min(0.95, max(0.3, confidence))
    
    def _get_effectiveness_status(self, effectiveness_score: float) -> str:
        """Get status based on effectiveness score"""
        if effectiveness_score > 90:
            return 'excellent'
        elif effectiveness_score > 70:
            return 'good'
        elif effectiveness_score > 50:
            return 'moderate'
        elif effectiveness_score > 30:
            return 'poor'
        else:
            return 'ineffective'
    
    def _get_effectiveness_recommendations(self, effectiveness_score: float, time_elapsed: float) -> List[str]:
        """Get recommendations based on effectiveness"""
        recommendations = []
        
        if effectiveness_score > 90:
            recommendations.append("Policy is highly effective - consider extending or expanding")
        elif effectiveness_score > 70:
            recommendations.append("Policy is working well - monitor for sustained effectiveness")
        elif effectiveness_score > 50:
            recommendations.append("Policy shows moderate effectiveness - consider adjustments")
        elif effectiveness_score > 30:
            recommendations.append("Policy shows limited effectiveness - review implementation")
        else:
            recommendations.append("Policy appears ineffective - consider alternative interventions")
        
        if time_elapsed < 2:
            recommendations.append("Early stage - continue monitoring for full effect")
        elif time_elapsed > 24:
            recommendations.append("Long-term data available - consider comprehensive analysis")
        
        return recommendations
    
    def _calculate_cost_effectiveness(self, intervention: PolicyIntervention, avg_reduction: float) -> Dict:
        """Calculate cost-effectiveness of intervention"""
        
        cost_multipliers = {'low': 1, 'medium': 2, 'high': 3}
        cost_factor = cost_multipliers.get(intervention.implementation_cost, 1)
        
        # Cost per AQI point reduction
        cost_per_reduction = cost_factor / max(1, avg_reduction)
        
        # Effectiveness per cost unit
        effectiveness_per_cost = avg_reduction / cost_factor
        
        return {
            'cost_category': intervention.implementation_cost,
            'cost_per_reduction': round(cost_per_reduction, 2),
            'effectiveness_per_cost': round(effectiveness_per_cost, 2),
            'rating': self._get_cost_effectiveness_rating(cost_per_reduction, effectiveness_per_cost)
        }
    
    def _get_cost_effectiveness_rating(self, cost_per_reduction: float, effectiveness_per_cost: float) -> str:
        """Get cost-effectiveness rating"""
        if cost_per_reduction < 0.1 and effectiveness_per_cost > 20:
            return 'excellent'
        elif cost_per_reduction < 0.2 and effectiveness_per_cost > 15:
            return 'good'
        elif cost_per_reduction < 0.3 and effectiveness_per_cost > 10:
            return 'moderate'
        else:
            return 'poor'
    
    def _generate_lessons_learned(self, intervention: PolicyIntervention, avg_reduction: float) -> List[str]:
        """Generate lessons learned from intervention"""
        lessons = []
        
        expected = intervention.expected_reduction
        actual = avg_reduction
        
        if actual > expected * 1.2:
            lessons.append(f"Intervention exceeded expectations by {round((actual/expected-1)*100, 1)}%")
        elif actual < expected * 0.8:
            lessons.append(f"Intervention underperformed by {round((1-actual/expected)*100, 1)}%")
        
        if intervention.policy_type == 'odd_even':
            lessons.append("Odd-even policy most effective during peak traffic hours")
        elif intervention.policy_type == 'construction_ban':
            lessons.append("Construction bans show delayed but sustained effects")
        elif intervention.policy_type == 'industrial_shutdown':
            lessons.append("Industrial shutdowns provide immediate but temporary relief")
        
        return lessons
    
    def _generate_final_recommendations(self, intervention: PolicyIntervention, avg_reduction: float) -> List[str]:
        """Generate final recommendations based on intervention results"""
        recommendations = []
        
        if avg_reduction > intervention.expected_reduction:
            recommendations.append("Consider implementing this policy more frequently")
            recommendations.append("Evaluate potential for broader geographic application")
        else:
            recommendations.append("Review implementation strategy for future applications")
        
        if intervention.policy_type in ['odd_even', 'construction_ban']:
            recommendations.append("Combine with other complementary policies for enhanced effect")
        
        return recommendations
    
    def _analyze_recent_trends(self, recent_measurements: List[EffectivenessMeasurement]) -> Dict:
        """Analyze recent trends in policy effectiveness"""
        if not recent_measurements:
            return {'trend': 'no_data'}
        
        # Calculate trend over time
        measurements_by_time = sorted(recent_measurements, key=lambda x: x.timestamp)
        if len(measurements_by_time) > 1:
            first_reduction = measurements_by_time[0].reduction
            last_reduction = measurements_by_time[-1].reduction
            trend = 'improving' if last_reduction > first_reduction else 'declining'
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'measurement_count': len(recent_measurements),
            'average_confidence': round(statistics.mean([m.confidence for m in recent_measurements]), 2),
            'time_span_hours': (measurements_by_time[-1].timestamp - measurements_by_time[0].timestamp).total_seconds() / 3600 if len(measurements_by_time) > 1 else 0
        }
    
    def _get_best_performing_policies(self, policy_analytics: Dict) -> List[Dict]:
        """Get best performing policies based on effectiveness"""
        sorted_policies = sorted(
            policy_analytics.items(),
            key=lambda x: x[1]['average_effectiveness'],
            reverse=True
        )
        
        return [
            {
                'policy_name': policy,
                'average_effectiveness': data['average_effectiveness'],
                'success_rate': data['success_rate'],
                'cost_category': data['cost_category']
            }
            for policy, data in sorted_policies[:3]
        ]
    
    def _get_policy_recommendations(self, policy_analytics: Dict) -> List[str]:
        """Get policy recommendations based on analytics"""
        recommendations = []
        
        # Find most effective policies
        best_policy = max(policy_analytics.items(), key=lambda x: x[1]['average_effectiveness'])
        recommendations.append(f"'{best_policy[0]}' shows highest average effectiveness ({best_policy[1]['average_effectiveness']}%)")
        
        # Find most cost-effective policies
        cost_effective_policies = [
            policy for policy, data in policy_analytics.items()
            if data['cost_category'] == 'low' and data['average_effectiveness'] > 60
        ]
        if cost_effective_policies:
            recommendations.append(f"Cost-effective policies to prioritize: {', '.join(cost_effective_policies)}")
        
        # Find policies needing improvement
        underperforming_policies = [
            policy for policy, data in policy_analytics.items()
            if data['average_effectiveness'] < 50
        ]
        if underperforming_policies:
            recommendations.append(f"Policies needing review: {', '.join(underperforming_policies)}")
        
        return recommendations
    
    def _calculate_aqi_factor(self, current_aqi: float) -> float:
        """Calculate effectiveness factor based on current AQI"""
        if current_aqi > 300:
            return 1.3  # More effective at high pollution
        elif current_aqi > 200:
            return 1.1
        elif current_aqi > 100:
            return 1.0
        else:
            return 0.8  # Less effective at low pollution
    
    def _calculate_weather_impact_factor(self, weather: Dict) -> float:
        """Calculate effectiveness factor based on weather conditions"""
        wind_speed = weather.get('wind_speed', 5)
        
        if wind_speed < 3:
            return 1.2  # Low wind = more effective
        elif wind_speed > 10:
            return 0.8  # High wind = less effective
        else:
            return 1.0
    
    def _calculate_time_factor(self) -> float:
        """Calculate effectiveness factor based on time of day"""
        hour = datetime.now().hour
        
        if 7 <= hour <= 10 or 17 <= hour <= 20:  # Rush hours
            return 1.1
        elif 22 <= hour or hour <= 5:  # Night time
            return 0.9
        else:
            return 1.0
    
    def _get_historical_effectiveness(self, policy_name: str) -> List[float]:
        """Get historical effectiveness data for policy"""
        policy_measurements = [
            m for m in self.effectiveness_history
            if self.active_interventions.get(m.intervention_id, {}).policy_type == policy_name
        ]
        
        return [m.reduction for m in policy_measurements]
    
    def _calculate_prediction_confidence(self, historical_data: List[float], current_conditions: Dict) -> float:
        """Calculate confidence in prediction based on historical data"""
        if not historical_data:
            return 0.5  # Medium confidence without historical data
        
        # Calculate confidence based on data consistency
        if len(historical_data) > 1:
            std_dev = statistics.stdev(historical_data)
            mean_reduction = statistics.mean(historical_data)
            coefficient_of_variation = std_dev / mean_reduction if mean_reduction > 0 else 1
            confidence = max(0.3, 1 - coefficient_of_variation)
        else:
            confidence = 0.6
        
        # Adjust for current conditions similarity
        current_aqi = current_conditions.get('aqi', 200)
        if 150 <= current_aqi <= 300:  # Typical intervention range
            confidence *= 1.1
        
        return min(0.95, confidence)
    
    def _get_prediction_recommendation(self, predicted_reduction: float, confidence: float) -> str:
        """Get recommendation based on prediction"""
        if predicted_reduction > 20 and confidence > 0.7:
            return "Strongly recommended - high expected effectiveness with good confidence"
        elif predicted_reduction > 15 and confidence > 0.6:
            return "Recommended - good expected effectiveness"
        elif predicted_reduction > 10 and confidence > 0.5:
            return "Consider - moderate expected effectiveness"
        else:
            return "Not recommended - low expected effectiveness or confidence"


# Initialize policy effectiveness tracker
policy_tracker = PolicyEffectivenessTracker()

