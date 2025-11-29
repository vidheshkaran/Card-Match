import csv
import os
from datetime import datetime

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

def get_current_aqi():
    data = read_csv_data('aqi_readings.csv')
    if data:
        # Return the first reading as current
        return data[0]
    return None

def get_station_data():
    return read_csv_data('aqi_readings.csv')

def get_source_breakdown():
    return read_csv_data('pollution_sources.csv')

def get_pollution_sources():
    return read_csv_data('pollution_sources.csv')

def get_forecasts():
    return read_csv_data('forecasts.csv')

def get_citizen_reports():
    return read_csv_data('citizen_reports.csv')

def get_policies():
    return read_csv_data('policies.csv')