#!/usr/bin/env python3
"""
AirWatch AI Flask Application
Main application file that initializes Flask and registers all blueprints
"""

import os
from flask import Flask, send_from_directory
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__, 
            static_folder='../frontend',
            template_folder='../frontend')

# Enable CORS for all routes
CORS(app)

# Configure app
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JSON_SORT_KEYS'] = False

# Register all blueprints
from routes.overview import overview_bp
from routes.forecasting import forecasting_bp
from routes.source_analysis import source_analysis_bp
from routes.comprehensive_analysis import comprehensive_bp
from routes.advanced_features import advanced_features_bp
from routes.advanced_features_enhanced import advanced_features_enhanced_bp
from routes.citizen_portal import citizen_portal_bp
from routes.health_guidance import health_guidance_bp
from routes.modern_api import modern_api_bp
from routes.policy_dashboard import policy_dashboard_bp
from routes.pollution_monitoring import pollution_monitoring_bp
from routes.realtime_data import realtime_bp
from routes.enhanced_api import enhanced_api_bp

# Register blueprints with URL prefixes
app.register_blueprint(overview_bp, url_prefix='/api/overview')
app.register_blueprint(forecasting_bp, url_prefix='/api/forecasting')
app.register_blueprint(source_analysis_bp, url_prefix='/api/source-analysis')
app.register_blueprint(comprehensive_bp, url_prefix='/api/comprehensive')
app.register_blueprint(advanced_features_bp, url_prefix='/api/advanced')
app.register_blueprint(advanced_features_enhanced_bp, url_prefix='/api/advanced')
app.register_blueprint(citizen_portal_bp, url_prefix='/api/citizen-portal')
app.register_blueprint(health_guidance_bp, url_prefix='/api/health-guidance')
app.register_blueprint(modern_api_bp, url_prefix='/api/v2')
app.register_blueprint(policy_dashboard_bp, url_prefix='/api/policy-dashboard')
app.register_blueprint(pollution_monitoring_bp, url_prefix='/api/pollution-monitoring')
app.register_blueprint(realtime_bp, url_prefix='/api/realtime')
app.register_blueprint(enhanced_api_bp, url_prefix='/api/v2')

# Serve static files and HTML pages
@app.route('/')
def index():
    """Serve the main index page"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (HTML, CSS, JS, images, etc.)"""
    return send_from_directory(app.static_folder, filename)

# Health check endpoint
@app.route('/health')
def health():
    """Health check endpoint"""
    return {'status': 'healthy', 'service': 'AirWatch AI'}, 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return {'error': 'Not found', 'message': 'The requested resource was not found'}, 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return {'error': 'Internal server error', 'message': 'An unexpected error occurred'}, 500

if __name__ == '__main__':
    # Run the Flask app
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000,
        threaded=True
    )

