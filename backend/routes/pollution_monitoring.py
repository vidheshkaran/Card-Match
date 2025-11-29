"""
Pollution Source Monitoring API
Real-time monitoring of transport emissions, stubble burning, and biomass burning
"""

from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import csv
import os
import random
import json

# Try to import free API, but provide fallback if not available
try:
    from utils.free_api_integration import FreeAPIDataFetcher
    free_api_fetcher = FreeAPIDataFetcher()
except ImportError:
    free_api_fetcher = None
    print("Warning: FreeAPIDataFetcher not available, using fallback data")

pollution_monitoring_bp = Blueprint('pollution_monitoring', __name__)

# ============================================================================
# 1. TRANSPORT EMISSIONS - ANPR & Vehicle Compliance
# ============================================================================

@pollution_monitoring_bp.route('/transport-emissions')
def transport_emissions():
    """Get transport emissions data with ANPR violations - Only non-compliant vehicles raise complaints"""
    try:
        # Get real-time AQI data to base vehicle detection on current conditions
        from utils.csv_data import read_csv_data
        aqi_data = read_csv_data('aqi_readings.csv')
        current_aqi = float(aqi_data[0]['aqi']) if aqi_data else 250
        
        # Vehicles that are ALLOWED (no complaints): BS6, BS4 Diesel, BS3 Petrol
        allowed_vehicle_types = ['BS6', 'BS4 Diesel', 'BS3 Petrol']
        
        # Vehicles that should raise complaints: All others (BS3 Diesel, BS4 Petrol, etc.)
        violation_vehicle_types = ['BS3 Diesel', 'BS4 Petrol', 'BS2 Petrol', 'BS2 Diesel', 'Pre-BS']
        
        vehicles = []
        violation_locations = [
            {'lat': 28.6139, 'lon': 77.2090, 'name': 'ITO Junction'},
            {'lat': 28.6279, 'lon': 77.2770, 'name': 'Delhi Gate'},
            {'lat': 28.6562, 'lon': 77.2410, 'name': 'CP Metro'},
            {'lat': 28.4595, 'lon': 77.0266, 'name': 'India Gate'},
            {'lat': 28.7041, 'lon': 77.1025, 'name': 'Karol Bagh'}
        ]
        
        # Generate vehicle violations - only for vehicles that should raise complaints
        # Higher violation rate when AQI is high (more strict enforcement)
        # Use real-time AQI to determine complaint frequency and severity
        if current_aqi > 300:
            violation_rate = 0.6  # Very high AQI = more complaints
        elif current_aqi > 250:
            violation_rate = 0.5
        elif current_aqi > 200:
            violation_rate = 0.4
        elif current_aqi > 150:
            violation_rate = 0.3
        else:
            violation_rate = 0.2
        
        # Generate violations based on violation rate - only non-compliant vehicles
        for location in violation_locations:
            if random.random() < violation_rate:
                vehicle_type = random.choice(violation_vehicle_types)  # Only violation types
                plate_number = f"DL{random.randint(1, 99)}{chr(random.randint(65, 90))}{chr(random.randint(65, 90))}{random.randint(1000, 9999)}"
                
                # Determine violation reason based on vehicle type and current AQI
                if vehicle_type == 'BS3 Diesel':
                    violation_reason = f'BS3 Diesel not allowed - Contributing to poor air quality (AQI: {int(current_aqi)}) - Complaint filed'
                elif vehicle_type == 'BS4 Petrol':
                    violation_reason = f'BS4 Petrol not allowed - Air quality concern (AQI: {int(current_aqi)}) - Complaint filed'
                elif vehicle_type in ['BS2 Petrol', 'BS2 Diesel', 'Pre-BS']:
                    violation_reason = f'{vehicle_type} not allowed - Vehicle too old, contributing to air pollution (AQI: {int(current_aqi)}) - Complaint filed'
                else:
                    violation_reason = f'{vehicle_type} not allowed - Non-compliant vehicle (AQI: {int(current_aqi)}) - Complaint filed'
                
                # Add severity based on current AQI
                severity = 'High' if current_aqi > 250 else 'Medium' if current_aqi > 200 else 'Low'
                
                vehicles.append({
                    'plate_number': plate_number,
                    'vehicle_type': vehicle_type,
                    'location': location['name'],
                    'latitude': location['lat'],
                    'longitude': location['lon'],
                    'is_violation': True,
                    'violation_reason': violation_reason,
                    'severity': severity,
                    'current_aqi': int(current_aqi),
                    'complaint_id': f'COMP-{datetime.now().strftime("%Y%m%d")}-{random.randint(1000, 9999)}',
                    'complaint_status': 'Filed',
                    'timestamp': (datetime.now() - timedelta(minutes=random.randint(1, 60))).isoformat(),
                    'image_url': f'/static/vehicle_images/vehicle_{random.randint(1, 20)}.jpg'
                })
        
        # Calculate total vehicles (violations + compliant vehicles)
        # Compliant vehicles are BS6, BS4 Diesel, BS3 Petrol (not shown in violations)
        if current_aqi > 250:
            compliant_count = random.randint(80, 150)
        elif current_aqi > 200:
            compliant_count = random.randint(70, 130)
        else:
            compliant_count = random.randint(60, 120)
        
        total_detected = len(vehicles) + compliant_count
        violations_count = len(vehicles)
        
        # Calculate complaint statistics
        high_severity = len([v for v in vehicles if v.get('severity') == 'High'])
        medium_severity = len([v for v in vehicles if v.get('severity') == 'Medium'])
        low_severity = len([v for v in vehicles if v.get('severity') == 'Low'])
        
        print(f"[TRANSPORT-EMISSIONS] Current AQI: {current_aqi}, Violations: {violations_count}, Total: {total_detected}")
        
        return jsonify({
            'status': 'success',
            'total_vehicles_detected': total_detected,
            'violations_count': violations_count,
            'complaints_count': violations_count,  # Same as violations
            'compliant_count': compliant_count,
            'compliance_rate': round(((total_detected - violations_count) / total_detected * 100), 1) if total_detected > 0 else 100,
            'violations': vehicles,  # Only vehicles that should raise complaints (BS6, BS4 Diesel, BS3 Petrol excluded)
            'complaints': vehicles,  # Complaints are the same as violations
            'complaint_statistics': {
                'total_complaints': violations_count,
                'high_severity': high_severity,
                'medium_severity': medium_severity,
                'low_severity': low_severity,
                'complaints_filed_today': violations_count,
                'based_on_aqi': int(current_aqi)
            },
            'allowed_vehicles': allowed_vehicle_types,  # BS6, BS4 Diesel, BS3 Petrol (not in complaints)
            'rules': {
                'bs6': 'Allowed (all days) - No complaint needed',
                'bs4_diesel': 'Allowed (all days) - No complaint needed',
                'bs3_petrol': 'Allowed (all days) - No complaint needed',
                'bs3_diesel': 'Not allowed - Complaint required',
                'bs4_petrol': 'Not allowed - Complaint required',
                'bs2_and_below': 'Not allowed - Complaint required'
            },
            'current_aqi': int(current_aqi),
            'aqi_category': 'Hazardous' if current_aqi > 300 else 'Very Unhealthy' if current_aqi > 250 else 'Unhealthy' if current_aqi > 200 else 'Unhealthy for Sensitive' if current_aqi > 150 else 'Moderate' if current_aqi > 100 else 'Good',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        import traceback
        print(f"[TRANSPORT-EMISSIONS] Error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': str(e),
            'violations': [],
            'total_vehicles_detected': 0,
            'violations_count': 0,
            'compliant_count': 0
        }), 200

@pollution_monitoring_bp.route('/transport-emissions/upload', methods=['POST'])
def upload_vehicle_image():
    """Handle vehicle image upload for ANPR processing - Only non-compliant vehicles raise complaints"""
    try:
        # In production, this would process the uploaded image
        # For now, return mock ANPR result
        data = request.get_json() or {}
        
        plate_number = data.get('plate_number', f"DL{random.randint(1, 99)}{chr(random.randint(65, 90))}{chr(random.randint(65, 90))}{random.randint(1000, 9999)}")
        
        # Get real-time AQI data
        from utils.csv_data import read_csv_data
        aqi_data = read_csv_data('aqi_readings.csv')
        current_aqi = float(aqi_data[0]['aqi']) if aqi_data else 250
        
        # Vehicles that are ALLOWED (no complaints): BS6, BS4 Diesel, BS3 Petrol
        allowed_vehicle_types = ['BS6', 'BS4 Diesel', 'BS3 Petrol']
        
        # If vehicle type is provided, use it; otherwise randomly choose
        if 'vehicle_type' in data:
            vehicle_type = data.get('vehicle_type')
        else:
            # Randomly choose between allowed and violation types based on AQI
            violation_vehicle_types = ['BS3 Diesel', 'BS4 Petrol', 'BS2 Petrol', 'BS2 Diesel']
            if random.random() < 0.4:  # 40% chance of violation
                vehicle_type = random.choice(violation_vehicle_types)
            else:
                vehicle_type = random.choice(allowed_vehicle_types)
        
        # Check compliance - only non-allowed vehicles raise complaints
        is_violation = vehicle_type not in allowed_vehicle_types
        violation_reason = None
        
        if is_violation:
            if vehicle_type == 'BS3 Diesel':
                violation_reason = 'BS3 Diesel not allowed in Delhi - Complaint required'
            elif vehicle_type == 'BS4 Petrol':
                violation_reason = 'BS4 Petrol not allowed - Complaint required'
            elif vehicle_type in ['BS2 Petrol', 'BS2 Diesel']:
                violation_reason = f'{vehicle_type} not allowed - Vehicle too old, Complaint required'
            else:
                violation_reason = f'{vehicle_type} not allowed - Complaint required'
        
        print(f"[ANPR-UPLOAD] Vehicle: {vehicle_type}, Is Violation: {is_violation}, Current AQI: {current_aqi}")
        
        return jsonify({
            'status': 'success',
            'plate_number': plate_number,
            'vehicle_type': vehicle_type,
            'is_violation': is_violation,
            'violation_reason': violation_reason,
            'compliance_status': 'Compliant - No complaint needed' if not is_violation else 'Violation - Complaint required',
            'current_aqi': int(current_aqi),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        import traceback
        print(f"[ANPR-UPLOAD] Error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 200

# ============================================================================
# 2. STUBBLE BURNING - Satellite Data & Wind Prediction
# ============================================================================

@pollution_monitoring_bp.route('/stubble-burning')
def stubble_burning():
    """Get stubble burning hotspots from satellite data"""
    try:
        # Simulate satellite hotspot data (VIIRS/MODIS)
        hotspots = []
        
        # Punjab, Haryana, UP regions
        regions = [
            {'name': 'Punjab', 'lat': 30.7333, 'lon': 76.7794, 'intensity': 'high'},
            {'name': 'Haryana', 'lat': 29.0588, 'lon': 76.0856, 'intensity': 'medium'},
            {'name': 'Western UP', 'lat': 28.4089, 'lon': 77.3178, 'intensity': 'high'},
            {'name': 'Eastern UP', 'lat': 26.4499, 'lon': 80.3319, 'intensity': 'low'}
        ]
        
        for region in regions:
            # Generate multiple hotspots per region
            for i in range(random.randint(3, 8)):
                hotspot_lat = region['lat'] + random.uniform(-0.5, 0.5)
                hotspot_lon = region['lon'] + random.uniform(-0.5, 0.5)
                
                # Calculate distance to Delhi
                delhi_lat, delhi_lon = 28.6139, 77.2090
                distance_km = ((hotspot_lat - delhi_lat)**2 + (hotspot_lon - delhi_lon)**2)**0.5 * 111  # Approximate km
                
                # Predict smoke movement based on wind
                wind_speed = random.uniform(5, 15)  # km/h
                wind_direction = random.choice(['NW', 'N', 'NE', 'W'])
                
                # Estimate time for smoke to reach Delhi
                if wind_direction in ['NW', 'N', 'NE']:
                    estimated_arrival_hours = max(6, distance_km / wind_speed)
                    risk_level = 'high' if estimated_arrival_hours < 24 else 'medium'
                else:
                    estimated_arrival_hours = None
                    risk_level = 'low'
                
                hotspots.append({
                    'id': f"hotspot_{region['name']}_{i+1}",
                    'latitude': round(hotspot_lat, 4),
                    'longitude': round(hotspot_lon, 4),
                    'region': region['name'],
                    'intensity': region['intensity'],
                    'fire_count': random.randint(1, 5),
                    'area_affected_hectares': round(random.uniform(10, 100), 2),
                    'distance_to_delhi_km': round(distance_km, 1),
                    'wind_speed_kmh': round(wind_speed, 1),
                    'wind_direction': wind_direction,
                    'estimated_arrival_hours': round(estimated_arrival_hours, 1) if estimated_arrival_hours else None,
                    'risk_level': risk_level,
                    'timestamp': (datetime.now() - timedelta(hours=random.randint(0, 6))).isoformat(),
                    'data_source': 'VIIRS/MODIS Satellite'
                })
        
        # Calculate summary
        high_risk_count = len([h for h in hotspots if h['risk_level'] == 'high'])
        total_fires = sum(h['fire_count'] for h in hotspots)
        
        return jsonify({
            'status': 'success',
            'hotspots': hotspots,
            'summary': {
                'total_hotspots': len(hotspots),
                'high_risk_hotspots': high_risk_count,
                'total_fires': total_fires,
                'regions_affected': len(set(h['region'] for h in hotspots)),
                'estimated_delhi_impact_hours': min([h['estimated_arrival_hours'] for h in hotspots if h['estimated_arrival_hours']], default=None)
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'hotspots': []
        }), 200

@pollution_monitoring_bp.route('/stubble-burning/alerts')
def stubble_burning_alerts():
    """Get alerts for farmers and citizens based on stubble burning"""
    try:
        # Get current month for crop cycle awareness
        current_month = datetime.now().month
        
        # Stubble burning season: October-November
        is_burning_season = current_month in [10, 11]
        
        alerts = []
        
        if is_burning_season:
            alerts.append({
                'type': 'farmer_alert',
                'severity': 'high',
                'title': 'Stubble Burning Season Active',
                'message': 'This is the peak stubble burning season. Consider alternative disposal methods.',
                'recommendations': [
                    'Use Happy Seeder for direct sowing',
                    'Apply decomposer solutions',
                    'Contact local agriculture department for subsidies',
                    'Consider crop residue management machines'
                ],
                'timestamp': datetime.now().isoformat()
            })
            
            alerts.append({
                'type': 'citizen_alert',
                'severity': 'medium',
                'title': 'Increased Air Pollution Risk',
                'message': 'Stubble burning in neighboring states may affect Delhi air quality in next 24-48 hours.',
                'recommendations': [
                    'Limit outdoor activities',
                    'Use air purifiers indoors',
                    'Wear N95 masks when outside',
                    'Monitor AQI updates regularly'
                ],
                'timestamp': datetime.now().isoformat()
            })
        
        return jsonify({
            'status': 'success',
            'alerts': alerts,
            'is_burning_season': is_burning_season,
            'current_month': current_month,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'alerts': []
        }), 200

# ============================================================================
# 3. BIOMASS & DOMESTIC FUEL BURNING
# ============================================================================

@pollution_monitoring_bp.route('/biomass-burning')
def biomass_burning():
    """Get biomass and domestic fuel burning data"""
    try:
        # Delhi wards/districts
        wards = [
            {'name': 'Rohini', 'ward_number': 1, 'households': 15000, 'biomass_usage_percent': 12},
            {'name': 'Pitampura', 'ward_number': 2, 'households': 12000, 'biomass_usage_percent': 8},
            {'name': 'Dwarka', 'ward_number': 3, 'households': 18000, 'biomass_usage_percent': 15},
            {'name': 'Janakpuri', 'ward_number': 4, 'households': 14000, 'biomass_usage_percent': 10},
            {'name': 'Karol Bagh', 'ward_number': 5, 'households': 10000, 'biomass_usage_percent': 18},
            {'name': 'Old Delhi', 'ward_number': 6, 'households': 8000, 'biomass_usage_percent': 25},
            {'name': 'Seelampur', 'ward_number': 7, 'households': 6000, 'biomass_usage_percent': 30},
            {'name': 'Okhla', 'ward_number': 8, 'households': 11000, 'biomass_usage_percent': 14}
        ]
        
        # Calculate eligible households for LPG schemes
        lpg_schemes = [
            {
                'scheme_name': 'Pradhan Mantri Ujjwala Yojana (PMUY)',
                'eligibility': 'Below Poverty Line (BPL) families',
                'benefit': 'Free LPG connection + first refill',
                'application_url': 'https://pmuy.gov.in',
                'contact': '1800-180-1551'
            },
            {
                'scheme_name': 'Delhi LPG Subsidy Scheme',
                'eligibility': 'All Delhi residents using biomass',
                'benefit': 'Subsidy on LPG cylinders',
                'application_url': 'https://delhi.gov.in/lpg-subsidy',
                'contact': '011-23392020'
            }
        ]
        
        # Generate ward data with LPG eligibility
        ward_data = []
        total_biomass_households = 0
        
        for ward in wards:
            biomass_households = int(ward['households'] * ward['biomass_usage_percent'] / 100)
            total_biomass_households += biomass_households
            
            # Estimate eligible households (assuming 60% are eligible)
            eligible_households = int(biomass_households * 0.6)
            
            ward_data.append({
                'ward_name': ward['name'],
                'ward_number': ward['ward_number'],
                'total_households': ward['households'],
                'biomass_households': biomass_households,
                'biomass_usage_percent': ward['biomass_usage_percent'],
                'eligible_for_lpg_subsidy': eligible_households,
                'lpg_adoption_rate': round(100 - ward['biomass_usage_percent'], 1),
                'priority_level': 'high' if ward['biomass_usage_percent'] > 20 else 'medium' if ward['biomass_usage_percent'] > 10 else 'low'
            })
        
        return jsonify({
            'status': 'success',
            'wards': ward_data,
            'summary': {
                'total_wards': len(ward_data),
                'total_households': sum(w['total_households'] for w in ward_data),
                'total_biomass_households': total_biomass_households,
                'overall_biomass_usage_percent': round((total_biomass_households / sum(w['total_households'] for w in ward_data)) * 100, 1),
                'total_eligible_for_subsidy': sum(w['eligible_for_lpg_subsidy'] for w in ward_data),
                'high_priority_wards': len([w for w in ward_data if w['priority_level'] == 'high'])
            },
            'lpg_schemes': lpg_schemes,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'wards': []
        }), 200

@pollution_monitoring_bp.route('/biomass-burning/alerts')
def biomass_burning_alerts():
    """Get alerts for households about LPG schemes"""
    try:
        alerts = []
        
        # High priority wards
        high_priority_wards = ['Old Delhi', 'Seelampur', 'Karol Bagh']
        
        for ward in high_priority_wards:
            alerts.append({
                'type': 'lpg_scheme_alert',
                'ward': ward,
                'severity': 'high',
                'title': f'LPG Subsidy Available in {ward}',
                'message': f'You may be eligible for free LPG connection under PMUY scheme. Check eligibility now.',
                'scheme': 'Pradhan Mantri Ujjwala Yojana',
                'action_url': 'https://pmuy.gov.in',
                'contact': '1800-180-1551',
                'timestamp': datetime.now().isoformat()
            })
        
        return jsonify({
            'status': 'success',
            'alerts': alerts,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'alerts': []
        }), 200

# ============================================================================
# COMBINED ENDPOINT
# ============================================================================

@pollution_monitoring_bp.route('/all-sources')
def all_sources():
    """Get comprehensive data from all pollution sources"""
    try:
        # Import functions to avoid circular issues
        from routes.pollution_monitoring import transport_emissions, stubble_burning, biomass_burning
        
        # Get data from each source
        transport_data = transport_emissions().get_json()
        stubble_data = stubble_burning().get_json()
        biomass_data = biomass_burning().get_json()
        
        return jsonify({
            'status': 'success',
            'transport_emissions': transport_data,
            'stubble_burning': stubble_data,
            'biomass_burning': biomass_data,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 200
