// Hero Animations and Particle Effects for AirWatch AI

class HeroAnimations {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.mousePosition = { x: 0, y: 0 };
        this.animationId = null;
        this.init();
    }

    init() {
        this.createCanvas();
        this.createParticles();
        this.setupEventListeners();
        this.startAnimation();
    }

    createCanvas() {
        this.canvas = document.getElementById('heroCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        if (!this.canvas) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    createParticles() {
        this.particles = [];
        const particleCount = 100;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                color: this.getRandomColor(),
                alpha: Math.random() * 0.5 + 0.3,
                life: 1.0,
                maxLife: 1.0,
                type: Math.random() > 0.5 ? 'glow' : 'sparkle'
            });
        }
    }

    getRandomColor() {
        const colors = [
            '#3b82f6', // Blue
            '#8b5cf6', // Purple
            '#06b6d4', // Cyan
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#ef4444'  // Red
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    setupEventListeners() {
        if (!this.canvas) return;

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePosition.x = e.clientX - rect.left;
            this.mousePosition.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mousePosition.x = this.canvas.width / 2;
            this.mousePosition.y = this.canvas.height / 2;
        });
    }

    startAnimation() {
        const animate = () => {
            this.updateParticles();
            this.draw();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    updateParticles() {
        this.particles.forEach((particle, index) => {
            // Mouse interaction
            const dx = this.mousePosition.x - particle.x;
            const dy = this.mousePosition.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100 * 0.01;
                particle.vx += (dx / distance) * force;
                particle.vy += (dy / distance) * force;
            }

            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Boundary wrapping
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            // Damping
            particle.vx *= 0.99;
            particle.vy *= 0.99;

            // Life cycle
            particle.life -= 0.002;
            if (particle.life <= 0) {
                this.resetParticle(particle);
            }

            // Pulsing effect
            particle.alpha = (particle.life / particle.maxLife) * 0.8;
        });
    }

    resetParticle(particle) {
        particle.x = Math.random() * this.canvas.width;
        particle.y = Math.random() * this.canvas.height;
        particle.vx = (Math.random() - 0.5) * 0.5;
        particle.vy = (Math.random() - 0.5) * 0.5;
        particle.life = 1.0;
        particle.color = this.getRandomColor();
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw gradient background
        this.drawGradientBackground();
        
        // Draw particles
        this.particles.forEach(particle => {
            this.drawParticle(particle);
        });
        
        // Draw connections
        this.drawConnections();
        
        // Draw mouse effect
        this.drawMouseEffect();
    }

    drawGradientBackground() {
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height) / 2
        );
        
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
        gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.05)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.alpha;
        
        if (particle.type === 'glow') {
            this.drawGlowParticle(particle);
        } else {
            this.drawSparkleParticle(particle);
        }
        
        this.ctx.restore();
    }

    drawGlowParticle(particle) {
        // Outer glow
        const glowGradient = this.ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 4
        );
        glowGradient.addColorStop(0, particle.color);
        glowGradient.addColorStop(0.5, particle.color + '80');
        glowGradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Core particle
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSparkleParticle(particle) {
        const time = Date.now() * 0.005;
        const sparkleSize = particle.size + Math.sin(time + particle.x * 0.01) * 0.5;
        
        // Draw sparkle cross
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'round';
        
        // Horizontal line
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x - sparkleSize, particle.y);
        this.ctx.lineTo(particle.x + sparkleSize, particle.y);
        this.ctx.stroke();
        
        // Vertical line
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x, particle.y - sparkleSize);
        this.ctx.lineTo(particle.x, particle.y + sparkleSize);
        this.ctx.stroke();
        
        // Center dot
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, 1, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawConnections() {
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    const opacity = (100 - distance) / 100 * 0.2;
                    this.ctx.globalAlpha = opacity;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }

    drawMouseEffect() {
        if (this.mousePosition.x === this.canvas.width / 2 && this.mousePosition.y === this.canvas.height / 2) return;
        
        const distance = Math.sqrt(
            Math.pow(this.mousePosition.x - this.canvas.width / 2, 2) + 
            Math.pow(this.mousePosition.y - this.canvas.height / 2, 2)
        );
        
        if (distance < 200) {
            // Mouse hover glow
            const glowGradient = this.ctx.createRadialGradient(
                this.mousePosition.x, this.mousePosition.y, 0,
                this.mousePosition.x, this.mousePosition.y, 100
            );
            glowGradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
            glowGradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.1)');
            glowGradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(this.mousePosition.x, this.mousePosition.y, 100, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Text Animation Effects
class TextAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.animateTitle();
        this.animateSubtitle();
        this.animateButtons();
        this.animateStats();
    }

    animateTitle() {
        const title = document.querySelector('.hero-title');
        if (!title) return;

        const text = title.textContent;
        title.textContent = '';
        
        for (let i = 0; i < text.length; i++) {
            const span = document.createElement('span');
            span.textContent = text[i];
            span.style.opacity = '0';
            span.style.transform = 'translateY(30px)';
            span.style.animationDelay = `${i * 0.05}s`;
            title.appendChild(span);
        }

        // Animate each character
        const spans = title.querySelectorAll('span');
        spans.forEach((span, index) => {
            setTimeout(() => {
                span.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                span.style.opacity = '1';
                span.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    animateSubtitle() {
        const subtitle = document.querySelector('.hero-subtitle');
        if (!subtitle) return;

        subtitle.style.opacity = '0';
        subtitle.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            subtitle.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            subtitle.style.opacity = '1';
            subtitle.style.transform = 'translateY(0)';
        }, 500);
    }

    animateButtons() {
        const buttons = document.querySelectorAll('.hero-actions .btn-primary, .hero-actions .btn-secondary');
        
        buttons.forEach((button, index) => {
            button.style.opacity = '0';
            button.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                button.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                button.style.opacity = '1';
                button.style.transform = 'translateY(0)';
            }, 800 + (index * 200));
        });
    }

    animateStats() {
        const statCards = document.querySelectorAll('.hero-stats .stat-card');
        
        statCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateX(50px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateX(0)';
            }, 1000 + (index * 200));
        });
    }
}

// Scroll-triggered animations
class ScrollAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.stat-card, .feature-card, .insight-card, .recommendation-card').forEach(el => {
            observer.observe(el);
        });
    }

    animateElement(element) {
        if (element.classList.contains('animated')) return;
        
        element.classList.add('animated');
        
        // Add stagger effect based on element type
        const cards = element.parentElement.querySelectorAll('.stat-card, .feature-card, .insight-card, .recommendation-card');
        const index = Array.from(cards).indexOf(element);
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    }
}

// Initialize all animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HeroAnimations();
    new TextAnimations();
    new ScrollAnimations();
});

// Add animation styles
const animationStyles = `
<style>
.hero-title span {
    display: inline-block;
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card, .feature-card, .insight-card, .recommendation-card {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.animated {
    opacity: 1 !important;
    transform: translateY(0) !important;
}

/* Enhanced hover effects */
.stat-card:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
}

.feature-card:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
}

.insight-card:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
}

.recommendation-card:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
}

/* Button animations */
.btn-primary, .btn-secondary, .btn-action, .btn-feature {
    position: relative;
    overflow: hidden;
}

.btn-primary::before, .btn-secondary::before, .btn-action::before, .btn-feature::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.btn-primary:hover::before, .btn-secondary:hover::before, .btn-action:hover::before, .btn-feature:hover::before {
    left: 100%;
}

/* Pulse animation for important elements */
@keyframes pulse {
    0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
    }
    50% {
        transform: scale(1.05);
        box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }
}

.pulse-animation {
    animation: pulse 2s infinite;
}

/* Glow animation */
@keyframes glow {
    0%, 100% {
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    }
    50% {
        box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
    }
}

.glow-animation {
    animation: glow 2s infinite;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', animationStyles);
