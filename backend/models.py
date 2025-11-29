from datetime import datetime
from database import db

class AQIReading(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    station_id = db.Column(db.String(50), nullable=False)
    pm25 = db.Column(db.Float, nullable=False)
    pm10 = db.Column(db.Float, nullable=False)
    so2 = db.Column(db.Float)
    no2 = db.Column(db.Float)
    co = db.Column(db.Float)
    o3 = db.Column(db.Float)
    aqi = db.Column(db.Integer, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class PollutionSource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    source_type = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    contribution_percent = db.Column(db.Float, nullable=False)
    pollutants = db.Column(db.String(200))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Forecast(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    forecast_type = db.Column(db.String(50), nullable=False)  # short-term, medium-term, long-term
    aqi_prediction = db.Column(db.Integer, nullable=False)
    primary_pollutant = db.Column(db.String(50))
    confidence = db.Column(db.Float)
    forecast_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CitizenReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    location = db.Column(db.String(200), nullable=False)
    issue_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='Pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Policy(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    policy_type = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    status = db.Column(db.String(50), default='Active')
    effectiveness_score = db.Column(db.Float)
    aqi_reduction = db.Column(db.Float)
    areas_covered = db.Column(db.Text)