// Gauges JavaScript
class GaugeChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.options = {
            value: 0,
            max: 100,
            min: 0,
            color: '#3b82f6',
            backgroundColor: '#e5e7eb',
            thickness: 20,
            startAngle: Math.PI,
            endAngle: 2 * Math.PI,
            showValue: true,
            showLabel: true,
            label: '',
            valueFontSize: 24,
            labelFontSize: 14,
            animationDuration: 1000,
            ...options
        };
        
        this.currentValue = this.options.min;
        this.targetValue = this.options.value;
        this.animationId = null;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.draw();
        this.animate();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.centerX = rect.width / 2;
        this.centerY = rect.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - this.options.thickness / 2 - 10;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background arc
        this.drawArc(
            this.centerX,
            this.centerY,
            this.radius,
            this.options.startAngle,
            this.options.endAngle,
            this.options.backgroundColor,
            this.options.thickness
        );
        
        // Draw value arc
        const angle = this.options.startAngle + 
            (this.currentValue - this.options.min) / 
            (this.options.max - this.options.min) * 
            (this.options.endAngle - this.options.startAngle);
        
        this.drawArc(
            this.centerX,
            this.centerY,
            this.radius,
            this.options.startAngle,
            angle,
            this.options.color,
            this.options.thickness
        );
        
        // Draw value text
        if (this.options.showValue) {
            this.drawValue();
        }
        
        // Draw label
        if (this.options.showLabel && this.options.label) {
            this.drawLabel();
        }
    }

    drawArc(x, y, radius, startAngle, endAngle, color, thickness) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, startAngle, endAngle);
        this.ctx.lineWidth = thickness;
        this.ctx.strokeStyle = color;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    }

    drawValue() {
        this.ctx.fillStyle = this.options.color;
        this.ctx.font = `bold ${this.options.valueFontSize}px Inter, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const valueText = `${Math.round(this.currentValue)}%`;
        this.ctx.fillText(valueText, this.centerX, this.centerY + 8);
    }

    drawLabel() {
        this.ctx.fillStyle = '#6b7280';
        this.ctx.font = `${this.options.labelFontSize}px Inter, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillText(
            this.options.label,
            this.centerX,
            this.centerY + this.options.valueFontSize + 20
        );
    }

    animate() {
        const diff = this.targetValue - this.currentValue;
        const step = diff * 0.1;
        
        if (Math.abs(diff) > 0.1) {
            this.currentValue += step;
            this.draw();
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.currentValue = this.targetValue;
            this.draw();
        }
    }

    updateValue(newValue) {
        this.targetValue = Math.max(this.options.min, Math.min(this.options.max, newValue));
        if (!this.animationId) {
            this.animate();
        }
    }

    updateColor(newColor) {
        this.options.color = newColor;
        this.draw();
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize gauges when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize accuracy gauge
    const accuracyGauge = new GaugeChart('accuracyGauge', {
        value: 89.2,
        max: 100,
        min: 0,
        color: '#10b981',
        backgroundColor: '#e5e7eb',
        thickness: 20,
        label: 'Accuracy',
        valueFontSize: 24,
        labelFontSize: 14
    });

    // Initialize confidence gauge
    const confidenceGauge = new GaugeChart('confidenceGauge', {
        value: 92.5,
        max: 100,
        min: 0,
        color: '#3b82f6',
        backgroundColor: '#e5e7eb',
        thickness: 20,
        label: 'Confidence',
        valueFontSize: 24,
        labelFontSize: 14
    });

    // Initialize uptime gauge
    const uptimeGauge = new GaugeChart('uptimeGauge', {
        value: 99.1,
        max: 100,
        min: 0,
        color: '#8b5cf6',
        backgroundColor: '#e5e7eb',
        thickness: 20,
        label: 'Uptime',
        valueFontSize: 24,
        labelFontSize: 14
    });

    // Store gauges globally for updates
    window.gauges = {
        accuracy: accuracyGauge,
        confidence: confidenceGauge,
        uptime: uptimeGauge
    };

    // Update gauges periodically
    setInterval(() => {
        // Simulate real-time updates
        const accuracy = 89.2 + (Math.random() - 0.5) * 2;
        const confidence = 92.5 + (Math.random() - 0.5) * 1;
        const uptime = 99.1 + (Math.random() - 0.5) * 0.5;

        accuracyGauge.updateValue(accuracy);
        confidenceGauge.updateValue(confidence);
        uptimeGauge.updateValue(uptime);
    }, 5000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GaugeChart;
}

