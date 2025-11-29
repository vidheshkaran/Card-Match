"""
Enhanced Policy Enforcement Module
Real-time compliance tracking, automated interventions, and enforcement mechanisms
"""

import asyncio
import aiohttp
from datetime import datetime, timedelta
import json
import logging
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class PolicyStatus(Enum):
    ACTIVE = "active"
    VIOLATED = "violated"
    COMPLIANT = "compliant"
    SUSPENDED = "suspended"
    UNDER_REVIEW = "under_review"

class InterventionType(Enum):
    IMMEDIATE = "immediate"
    SCHEDULED = "scheduled"
    AUTOMATIC = "automatic"
    MANUAL = "manual"

@dataclass
class PolicyViolation:
    policy_id: str
    policy_name: str
    violation_type: str
    location: str
    severity: str
    timestamp: datetime
    evidence: Dict
    compliance_rate: float
    impact_score: float

@dataclass
class Intervention:
    intervention_id: str
    policy_id: str
    intervention_type: InterventionType
    description: str
    target_location: str
    expected_impact: float
    cost_estimate: float
    implementation_time: str
    status: str
    timestamp: datetime

class PolicyEnforcementEngine:
    """Enhanced policy enforcement with real-time monitoring and automated interventions"""
    
    def __init__(self):
        self.active_policies = {}
        self.violation_thresholds = {
            'critical': 0.7,    # 70% violation rate triggers immediate action
            'high': 0.5,        # 50% violation rate triggers high priority action
            'medium': 0.3,      # 30% violation rate triggers medium priority action
            'low': 0.1          # 10% violation rate triggers low priority action
        }
        
        self.intervention_templates = {
            'odd_even_vehicle': {
                'name': 'Odd-Even Vehicle Policy',
                'interventions': [
                    {
                        'type': 'traffic_restriction',
                        'description': 'Implement odd-even vehicle restrictions',
                        'cost_per_day': 500000,  # 5 lakhs
                        'expected_aqi_reduction': 15,
                        'implementation_time': 'immediate'
                    },
                    {
                        'type': 'public_transport_boost',
                        'description': 'Increase public transport frequency',
                        'cost_per_day': 2000000,  # 20 lakhs
                        'expected_aqi_reduction': 10,
                        'implementation_time': '2_hours'
                    }
                ]
            },
            'industrial_emission': {
                'name': 'Industrial Emission Control',
                'interventions': [
                    {
                        'type': 'emission_restriction',
                        'description': 'Impose strict emission limits on industries',
                        'cost_per_day': 1000000,  # 10 lakhs
                        'expected_aqi_reduction': 25,
                        'implementation_time': '4_hours'
                    },
                    {
                        'type': 'temporary_shutdown',
                        'description': 'Temporary shutdown of non-compliant industries',
                        'cost_per_day': 5000000,  # 50 lakhs
                        'expected_aqi_reduction': 40,
                        'implementation_time': '6_hours'
                    }
                ]
            },
            'construction_dust': {
                'name': 'Construction Dust Control',
                'interventions': [
                    {
                        'type': 'dust_suppression',
                        'description': 'Mandatory dust suppression at construction sites',
                        'cost_per_day': 300000,  # 3 lakhs
                        'expected_aqi_reduction': 12,
                        'implementation_time': '2_hours'
                    },
                    {
                        'type': 'construction_halt',
                        'description': 'Halt construction activities in high-pollution areas',
                        'cost_per_day': 2000000,  # 20 lakhs
                        'expected_aqi_reduction': 20,
                        'implementation_time': '1_hour'
                    }
                ]
            },
            'stubble_burning': {
                'name': 'Stubble Burning Prevention',
                'interventions': [
                    {
                        'type': 'satellite_monitoring',
                        'description': 'Enhanced satellite monitoring of stubble burning',
                        'cost_per_day': 100000,  # 1 lakh
                        'expected_aqi_reduction': 5,
                        'implementation_time': 'immediate'
                    },
                    {
                        'type': 'farmer_incentives',
                        'description': 'Provide incentives for alternative stubble disposal',
                        'cost_per_day': 5000000,  # 50 lakhs
                        'expected_aqi_reduction': 30,
                        'implementation_time': '24_hours'
                    }
                ]
            }
        }
        
        self.compliance_monitoring = {}
        self.automated_interventions = []
        
    async def monitor_policy_compliance(self, policy_id: str, real_time_data: Dict) -> Dict:
        """Monitor real-time compliance for a specific policy"""
        try:
            policy = self.active_policies.get(policy_id)
            if not policy:
                logger.warning(f"Policy {policy_id} not found")
                return {'status': 'error', 'message': 'Policy not found'}
            
            # Get current compliance data
            compliance_data = await self.get_compliance_data(policy_id, real_time_data)
            
            # Analyze compliance
            compliance_analysis = self.analyze_compliance(compliance_data, policy)
            
            # Check for violations
            violations = self.detect_violations(compliance_analysis, policy)
            
            # Update compliance monitoring
            self.compliance_monitoring[policy_id] = {
                'last_updated': datetime.now().isoformat(),
                'compliance_rate': compliance_analysis['compliance_rate'],
                'violations': violations,
                'status': compliance_analysis['status']
            }
            
            # Trigger interventions if needed
            if violations:
                await self.trigger_interventions(policy_id, violations, real_time_data)
            
            return {
                'policy_id': policy_id,
                'compliance_rate': compliance_analysis['compliance_rate'],
                'status': compliance_analysis['status'],
                'violations': len(violations),
                'interventions_triggered': len(self.automated_interventions),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error monitoring policy compliance: {e}")
            return {'status': 'error', 'message': str(e)}
    
    async def get_compliance_data(self, policy_id: str, real_time_data: Dict) -> Dict:
        """Get compliance data from various sources"""
        compliance_data = {
            'traffic_data': {},
            'industrial_data': {},
            'construction_data': {},
            'satellite_data': {},
            'iot_sensor_data': {}
        }
        
        try:
            # Get traffic compliance data
            if policy_id in ['odd_even_vehicle', 'traffic_management']:
                compliance_data['traffic_data'] = await self.get_traffic_compliance_data(real_time_data)
            
            # Get industrial compliance data
            if policy_id in ['industrial_emission', 'industrial_control']:
                compliance_data['industrial_data'] = await self.get_industrial_compliance_data(real_time_data)
            
            # Get construction compliance data
            if policy_id in ['construction_dust', 'construction_control']:
                compliance_data['construction_data'] = await self.get_construction_compliance_data(real_time_data)
            
            # Get satellite data for stubble burning
            if policy_id in ['stubble_burning', 'agricultural_control']:
                compliance_data['satellite_data'] = await self.get_satellite_compliance_data(real_time_data)
            
            # Get IoT sensor data for general compliance
            compliance_data['iot_sensor_data'] = await self.get_iot_compliance_data(real_time_data)
            
        except Exception as e:
            logger.error(f"Error getting compliance data: {e}")
        
        return compliance_data
    
    async def get_traffic_compliance_data(self, real_time_data: Dict) -> Dict:
        """Get traffic compliance data"""
        # Simulate traffic compliance monitoring
        traffic_data = {
            'vehicle_count': real_time_data.get('traffic_density', 0),
            'odd_vehicles': int(real_time_data.get('traffic_density', 100) * 0.52),
            'even_vehicles': int(real_time_data.get('traffic_density', 100) * 0.48),
            'violations_detected': int(real_time_data.get('traffic_density', 100) * 0.15),
            'compliance_rate': 0.85,
            'monitoring_points': 25
        }
        
        return traffic_data
    
    async def get_industrial_compliance_data(self, real_time_data: Dict) -> Dict:
        """Get industrial compliance data"""
        # Simulate industrial compliance monitoring
        industrial_data = {
            'monitored_facilities': 45,
            'compliant_facilities': 38,
            'emission_readings': {
                'so2': real_time_data.get('so2', 15),
                'pm25': real_time_data.get('pm25', 100),
                'no2': real_time_data.get('no2', 25)
            },
            'compliance_rate': 0.84,
            'violations_detected': 7,
            'warning_issued': 3
        }
        
        return industrial_data
    
    async def get_construction_compliance_data(self, real_time_data: Dict) -> Dict:
        """Get construction compliance data"""
        # Simulate construction compliance monitoring
        construction_data = {
            'active_sites': 120,
            'compliant_sites': 95,
            'dust_suppression_active': 88,
            'pm10_readings': real_time_data.get('pm10', 150),
            'compliance_rate': 0.79,
            'violations_detected': 25,
            'fines_issued': 8
        }
        
        return construction_data
    
    async def get_satellite_compliance_data(self, real_time_data: Dict) -> Dict:
        """Get satellite compliance data for stubble burning"""
        # Simulate satellite monitoring
        satellite_data = {
            'fire_detections': real_time_data.get('fire_count', 12),
            'thermal_anomalies': real_time_data.get('thermal_anomalies', 18),
            'monitored_area': 'Punjab-Haryana',
            'compliance_rate': 0.75,
            'violations_detected': 8,
            'warning_sent': 5
        }
        
        return satellite_data
    
    async def get_iot_compliance_data(self, real_time_data: Dict) -> Dict:
        """Get IoT sensor compliance data"""
        # Simulate IoT sensor monitoring
        iot_data = {
            'active_sensors': 150,
            'data_quality': 0.92,
            'pollution_readings': {
                'aqi': real_time_data.get('aqi', 250),
                'pm25': real_time_data.get('pm25', 100),
                'pm10': real_time_data.get('pm10', 150)
            },
            'anomaly_detections': 12,
            'compliance_rate': 0.88
        }
        
        return iot_data
    
    def analyze_compliance(self, compliance_data: Dict, policy: Dict) -> Dict:
        """Analyze compliance data and determine status"""
        total_compliance = 0
        total_weight = 0
        
        # Calculate weighted compliance rate
        for data_type, data in compliance_data.items():
            if isinstance(data, dict) and 'compliance_rate' in data:
                weight = self.get_data_weight(data_type)
                total_compliance += data['compliance_rate'] * weight
                total_weight += weight
        
        overall_compliance = total_compliance / total_weight if total_weight > 0 else 0
        
        # Determine status
        if overall_compliance >= 0.9:
            status = PolicyStatus.COMPLIANT
        elif overall_compliance >= 0.7:
            status = PolicyStatus.ACTIVE
        elif overall_compliance >= 0.5:
            status = PolicyStatus.UNDER_REVIEW
        else:
            status = PolicyStatus.VIOLATED
        
        return {
            'compliance_rate': overall_compliance,
            'status': status.value,
            'data_breakdown': compliance_data,
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def get_data_weight(self, data_type: str) -> float:
        """Get weight for different data types in compliance calculation"""
        weights = {
            'traffic_data': 0.3,
            'industrial_data': 0.25,
            'construction_data': 0.2,
            'satellite_data': 0.15,
            'iot_sensor_data': 0.1
        }
        return weights.get(data_type, 0.1)
    
    def detect_violations(self, compliance_analysis: Dict, policy: Dict) -> List[PolicyViolation]:
        """Detect policy violations from compliance analysis"""
        violations = []
        
        compliance_rate = compliance_analysis['compliance_rate']
        
        # Check if compliance is below threshold
        if compliance_rate < self.violation_thresholds['critical']:
            violation = PolicyViolation(
                policy_id=policy['id'],
                policy_name=policy['name'],
                violation_type='critical_compliance_failure',
                location='Multiple locations',
                severity='critical',
                timestamp=datetime.now(),
                evidence=compliance_analysis['data_breakdown'],
                compliance_rate=compliance_rate,
                impact_score=self.calculate_impact_score(compliance_rate)
            )
            violations.append(violation)
        
        # Check specific data types for violations
        for data_type, data in compliance_analysis['data_breakdown'].items():
            if isinstance(data, dict) and data.get('compliance_rate', 1) < 0.7:
                violation = PolicyViolation(
                    policy_id=policy['id'],
                    policy_name=policy['name'],
                    violation_type=f'{data_type}_compliance_failure',
                    location=self.get_location_for_data_type(data_type),
                    severity=self.get_severity_for_compliance_rate(data['compliance_rate']),
                    timestamp=datetime.now(),
                    evidence=data,
                    compliance_rate=data['compliance_rate'],
                    impact_score=self.calculate_impact_score(data['compliance_rate'])
                )
                violations.append(violation)
        
        return violations
    
    def get_location_for_data_type(self, data_type: str) -> str:
        """Get location description for data type"""
        locations = {
            'traffic_data': 'Traffic corridors and major roads',
            'industrial_data': 'Industrial areas (Mayapuri, Okhla, Narela)',
            'construction_data': 'Construction sites across Delhi-NCR',
            'satellite_data': 'Punjab-Haryana agricultural areas',
            'iot_sensor_data': 'Monitoring stations across Delhi-NCR'
        }
        return locations.get(data_type, 'Various locations')
    
    def get_severity_for_compliance_rate(self, compliance_rate: float) -> str:
        """Get severity level based on compliance rate"""
        if compliance_rate < 0.3:
            return 'critical'
        elif compliance_rate < 0.5:
            return 'high'
        elif compliance_rate < 0.7:
            return 'medium'
        else:
            return 'low'
    
    def calculate_impact_score(self, compliance_rate: float) -> float:
        """Calculate impact score based on compliance rate"""
        return (1 - compliance_rate) * 100
    
    async def trigger_interventions(self, policy_id: str, violations: List[PolicyViolation], real_time_data: Dict):
        """Trigger appropriate interventions based on violations"""
        try:
            policy_template = self.intervention_templates.get(policy_id)
            if not policy_template:
                logger.warning(f"No intervention template found for policy {policy_id}")
                return
            
            for violation in violations:
                # Determine intervention type based on severity
                intervention_type = self.get_intervention_type_for_severity(violation.severity)
                
                # Select appropriate intervention
                intervention = self.select_intervention(
                    policy_template, 
                    violation, 
                    intervention_type,
                    real_time_data
                )
                
                if intervention:
                    # Execute intervention
                    await self.execute_intervention(intervention, real_time_data)
                    
                    # Log intervention
                    self.automated_interventions.append({
                        'intervention_id': intervention['intervention_id'],
                        'policy_id': policy_id,
                        'violation_id': violation.policy_id,
                        'triggered_at': datetime.now().isoformat(),
                        'status': 'triggered'
                    })
        
        except Exception as e:
            logger.error(f"Error triggering interventions: {e}")
    
    def get_intervention_type_for_severity(self, severity: str) -> InterventionType:
        """Get intervention type based on violation severity"""
        if severity == 'critical':
            return InterventionType.IMMEDIATE
        elif severity == 'high':
            return InterventionType.AUTOMATIC
        else:
            return InterventionType.SCHEDULED
    
    def select_intervention(self, policy_template: Dict, violation: PolicyViolation, 
                          intervention_type: InterventionType, real_time_data: Dict) -> Optional[Dict]:
        """Select appropriate intervention from template"""
        interventions = policy_template['interventions']
        
        # Filter interventions by type and effectiveness
        suitable_interventions = []
        for intervention in interventions:
            if intervention['implementation_time'] == 'immediate' and intervention_type == InterventionType.IMMEDIATE:
                suitable_interventions.append(intervention)
            elif intervention['implementation_time'] != 'immediate' and intervention_type in [InterventionType.AUTOMATIC, InterventionType.SCHEDULED]:
                suitable_interventions.append(intervention)
        
        if not suitable_interventions:
            return None
        
        # Select intervention with best cost-effectiveness ratio
        best_intervention = max(suitable_interventions, 
                              key=lambda x: x['expected_aqi_reduction'] / max(1, x['cost_per_day'] / 1000000))
        
        return {
            'intervention_id': f"{policy_template['name'].replace(' ', '_').lower()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'policy_id': violation.policy_id,
            'intervention_type': intervention_type.value,
            'description': best_intervention['description'],
            'target_location': violation.location,
            'expected_impact': best_intervention['expected_aqi_reduction'],
            'cost_estimate': best_intervention['cost_per_day'],
            'implementation_time': best_intervention['implementation_time'],
            'status': 'pending',
            'timestamp': datetime.now(),
            'violation_trigger': violation.violation_type
        }
    
    async def execute_intervention(self, intervention: Dict, real_time_data: Dict):
        """Execute the selected intervention"""
        try:
            logger.info(f"Executing intervention: {intervention['description']}")
            
            # Simulate intervention execution
            if intervention['intervention_type'] == 'immediate':
                # Immediate interventions (e.g., traffic restrictions)
                await self.execute_immediate_intervention(intervention)
            elif intervention['intervention_type'] == 'automatic':
                # Automatic interventions (e.g., automated alerts)
                await self.execute_automatic_intervention(intervention)
            else:
                # Scheduled interventions (e.g., planned shutdowns)
                await self.execute_scheduled_intervention(intervention)
            
            # Update intervention status
            intervention['status'] = 'executed'
            intervention['executed_at'] = datetime.now().isoformat()
            
            # Send notifications
            await self.send_intervention_notifications(intervention)
            
        except Exception as e:
            logger.error(f"Error executing intervention: {e}")
            intervention['status'] = 'failed'
            intervention['error'] = str(e)
    
    async def execute_immediate_intervention(self, intervention: Dict):
        """Execute immediate interventions"""
        # Simulate immediate intervention execution
        logger.info(f"Executing immediate intervention: {intervention['description']}")
        
        # This would integrate with actual systems:
        # - Traffic management systems
        # - Industrial control systems
        # - Emergency response systems
        
        await asyncio.sleep(1)  # Simulate execution time
    
    async def execute_automatic_intervention(self, intervention: Dict):
        """Execute automatic interventions"""
        logger.info(f"Executing automatic intervention: {intervention['description']}")
        
        # This would trigger automated systems:
        # - Automated alerts to authorities
        # - Automated compliance checks
        # - Automated reporting systems
        
        await asyncio.sleep(2)  # Simulate execution time
    
    async def execute_scheduled_intervention(self, intervention: Dict):
        """Execute scheduled interventions"""
        logger.info(f"Scheduling intervention: {intervention['description']}")
        
        # This would schedule interventions:
        # - Schedule maintenance activities
        # - Schedule compliance audits
        # - Schedule public announcements
        
        await asyncio.sleep(1)  # Simulate execution time
    
    async def send_intervention_notifications(self, intervention: Dict):
        """Send notifications about intervention execution"""
        notifications = [
            {
                'type': 'policy_violation',
                'title': 'Policy Violation Detected',
                'message': f"Violation detected in {intervention['target_location']}. Intervention: {intervention['description']}",
                'severity': 'high'
            },
            {
                'type': 'intervention_executed',
                'title': 'Intervention Executed',
                'message': f"Intervention '{intervention['description']}' has been executed successfully.",
                'severity': 'info'
            }
        ]
        
        # This would send actual notifications:
        # - Email alerts to authorities
        # - SMS alerts to emergency contacts
        # - Push notifications to mobile app users
        # - Dashboard updates
        
        for notification in notifications:
            logger.info(f"Sending notification: {notification['title']}")
    
    def get_enforcement_summary(self) -> Dict:
        """Get summary of policy enforcement activities"""
        return {
            'active_policies': len(self.active_policies),
            'monitored_locations': len(self.compliance_monitoring),
            'total_interventions': len(self.automated_interventions),
            'recent_violations': len([v for v in self.compliance_monitoring.values() 
                                    if v.get('status') == PolicyStatus.VIOLATED.value]),
            'compliance_rate': np.mean([data.get('compliance_rate', 0) 
                                      for data in self.compliance_monitoring.values()]),
            'last_updated': datetime.now().isoformat()
        }

# Global instance
policy_enforcement_engine = PolicyEnforcementEngine()
