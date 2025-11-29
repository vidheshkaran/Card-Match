// Holographic Charts and 3D Visualizations
class HolographicCharts {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = [];
        this.is3DMode = false;
        this.isHolographicMode = false;
        this.animationId = null;
        this.data = this.getDefaultData();
        this.canvas = null;
        this.ctx = null;
        this.resizeHandler = null;
        
        if (!this.container) {
            console.error(`Container ${containerId} not found`);
            return;
        }
        
        this.init();
    }
    
    init() {
        console.log('[HolographicCharts] Initializing...');
        
        // Ensure container has proper size
        if (this.container) {
            const rect = this.container.getBoundingClientRect();
            if (rect.height < 300) {
                this.container.style.minHeight = '400px';
                this.container.style.height = '400px';
            }
        }
        
        // Create canvas for 2D visualization
        this.createCanvas();
        
        // Set canvas size
        this.resize();
        this.resizeHandler = () => this.resize();
        window.addEventListener('resize', this.resizeHandler);
        
        console.log('[HolographicCharts] Initialization complete');
    }
    
    createCanvas() {
        console.log('[HolographicCharts] Creating canvas...');
        
        // Remove existing canvas/renderer
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.remove();
        }
        if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
            this.renderer.domElement.remove();
            this.renderer.dispose();
        }
        
        // Hide placeholder
        const placeholder = this.container.querySelector('.holographic-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.display = 'block';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '10';
        this.canvas.style.visibility = 'visible';
        this.canvas.style.opacity = '1';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        console.log('[HolographicCharts] Canvas created and added to container');
    }
    
    resize() {
        if (!this.container) return;
        
        const rect = this.container.getBoundingClientRect();
        // Ensure minimum size
        const width = Math.max(rect.width || 800, 400);
        const height = Math.max(rect.height || 400, 300);
        
        if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;
            // Set display size
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
        }
        
        if (this.renderer && this.camera) {
            this.renderer.setSize(width, height);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
        
        // Re-render if we have data
        if (this.data) {
            if (this.is3DMode) {
                // 3D will auto-update
            } else {
                this.render2D();
            }
        }
    }
    
    loadData(data) {
        console.log('[HolographicCharts] loadData called with:', data);
        this.data = data;
        if (this.is3DMode) {
            this.init3D();
        } else {
            // Ensure canvas exists before rendering
            if (!this.canvas || !this.ctx) {
                console.log('[HolographicCharts] Creating canvas for 2D mode...');
                this.createCanvas();
            }
            // Force a small delay to ensure canvas is ready
            setTimeout(() => {
                this.render2D();
            }, 50);
        }
    }
    
    render2D() {
        console.log('[HolographicCharts] render2D called');
        console.log('[HolographicCharts] Data:', this.data);
        
        if (!this.data || !this.data.source_impact_distribution) {
            console.warn('[HolographicCharts] No data, using default dataset');
            this.data = this.getDefaultData();
        }
        
        const sources = this.data.source_impact_distribution.sources || [];
        if (sources.length === 0) {
            console.warn('[HolographicCharts] No sources, showing placeholder');
            this.renderPlaceholder();
            return;
        }
        
        console.log(`[HolographicCharts] Rendering ${sources.length} sources`);
        
        if (!this.canvas || !this.ctx) {
            console.log('[HolographicCharts] Creating canvas...');
            this.createCanvas();
        }
        
        // Ensure container has proper size
        if (this.container) {
            const rect = this.container.getBoundingClientRect();
            if (rect.height < 300) {
                this.container.style.minHeight = '400px';
                this.container.style.height = '400px';
            }
        }
        
        this.resize();
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        console.log(`[HolographicCharts] Canvas size: ${width}x${height}`);
        
        if (width === 0 || height === 0) {
            console.error('[HolographicCharts] Canvas has zero size!');
            return;
        }
        
        // Clear canvas with dark background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        // Create gradient background overlay
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        console.log(`[HolographicCharts] Background drawn on ${width}x${height} canvas`);
        
        // Draw holographic effect
        if (this.isHolographicMode) {
            this.drawHolographicEffect(ctx, width, height);
        }
        
        // Calculate total for percentages
        const total = sources.reduce((sum, s) => sum + (s.value || s.percentage || 0), 0);
        
        if (total === 0) {
            this.renderPlaceholder();
            return;
        }
        
        // Draw pie chart
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;
        let currentAngle = -Math.PI / 2;
        
        sources.forEach((source, index) => {
            const value = source.value || source.percentage || 0;
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            if (sliceAngle <= 0) return;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            
            // Gradient fill
            const sliceGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, radius
            );
            const color = source.color || this.getColorForSource(source.name);
            sliceGradient.addColorStop(0, this.lightenColor(color, 0.3));
            sliceGradient.addColorStop(1, color);
            ctx.fillStyle = sliceGradient;
            ctx.fill();
            
            // Holographic glow
            if (this.isHolographicMode) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = color;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
            
            // Label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Truncate long names
            let displayName = source.name || 'Unknown';
            if (displayName.length > 12) {
                displayName = displayName.substring(0, 10) + '...';
            }
            ctx.fillText(displayName, labelX, labelY - 10);
            
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px Inter, sans-serif';
            ctx.fillText(`${value.toFixed(1)}%`, labelX, labelY + 8);
            
            currentAngle += sliceAngle;
        });
        
        // Draw center info circle
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw center text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Source Impact', centerX, centerY - 10);
        
        ctx.fillStyle = '#3b82f6';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`${sources.length} Sources`, centerX, centerY + 10);
        
        // Hide placeholder if still visible
        const placeholder = this.container.querySelector('.holographic-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
            placeholder.style.visibility = 'hidden';
        }
        
        // Force canvas to be visible and on top
        if (this.canvas) {
            this.canvas.style.display = 'block';
            this.canvas.style.visibility = 'visible';
            this.canvas.style.opacity = '1';
            this.canvas.style.zIndex = '100';
            this.canvas.style.pointerEvents = 'auto';
        }
        
        console.log(`[HolographicCharts] ✓✓✓ Pie chart rendered successfully with ${sources.length} slices ✓✓✓`);
        console.log(`[HolographicCharts] Canvas visible: ${this.canvas ? 'YES' : 'NO'}, Size: ${width}x${height}`);
        
        // Final check - if canvas is still not visible, try one more time
        setTimeout(() => {
            if (this.canvas && this.canvas.offsetWidth === 0) {
                console.warn('[HolographicCharts] Canvas has zero width, forcing resize...');
                this.resize();
                this.render2D();
            }
        }, 100);
    }
    
    drawHolographicEffect(ctx, width, height) {
        // Animated holographic lines
        const time = Date.now() * 0.001;
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 5; i++) {
            const y = (height / 6) * (i + 1) + Math.sin(time + i) * 10;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Glowing particles
        for (let i = 0; i < 20; i++) {
            const x = (width / 20) * i + Math.cos(time * 2 + i) * 20;
            const y = (height / 20) * i + Math.sin(time * 2 + i) * 20;
            const size = 2 + Math.sin(time + i) * 1;
            
            ctx.fillStyle = `rgba(139, 92, 246, ${0.3 + Math.sin(time + i) * 0.2})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    
    init3D() {
        if (typeof THREE === 'undefined') {
            console.error('Three.js not loaded');
            this.render2D();
            return;
        }
        
        if (!this.data || !this.data.source_impact_distribution) {
            console.warn('[HolographicCharts] No data for 3D visualization, using default');
            this.data = this.getDefaultData();
        }
        
        // Remove canvas
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.remove();
            this.canvas = null;
            this.ctx = null;
        }
        
        // Stop any existing animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        const rect = this.container.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 400;
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.borderRadius = '8px';
        this.container.appendChild(this.renderer.domElement);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const pointLight1 = new THREE.PointLight(0x3b82f6, 1);
        pointLight1.position.set(5, 5, 5);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0x8b5cf6, 0.8);
        pointLight2.position.set(-5, -5, -5);
        this.scene.add(pointLight2);
        
        // Create 3D visualization
        this.create3DVisualization();
        
        // Start animation
        this.animate3D();
    }
    
    create3DVisualization() {
        if (!this.data || !this.data.source_impact_distribution) return;
        
        const sources = this.data.source_impact_distribution.sources || [];
        const total = sources.reduce((sum, s) => sum + (s.value || s.percentage || 0), 0);
        
        if (total === 0) return;
        
        // Clear existing objects
        this.particles.forEach(particle => {
            this.scene.remove(particle);
            if (particle.geometry) particle.geometry.dispose();
            if (particle.material) particle.material.dispose();
        });
        this.particles = [];
        
        // Create 3D bars in a circle
        const numSources = sources.length;
        const radius = 2.5;
        
        sources.forEach((source, index) => {
            const value = (source.value || source.percentage || 0) / total;
            const height = Math.max(0.5, value * 4); // Minimum height
            const color = source.color || this.getColorForSource(source.name);
            
            // Create bar
            const geometry = new THREE.BoxGeometry(0.4, height, 0.4);
            const material = new THREE.MeshPhongMaterial({ 
                color: color,
                emissive: color,
                emissiveIntensity: 0.4,
                transparent: true,
                opacity: 0.9
            });
            
            const bar = new THREE.Mesh(geometry, material);
            const angle = (index / numSources) * Math.PI * 2;
            bar.position.x = Math.cos(angle) * radius;
            bar.position.z = Math.sin(angle) * radius;
            bar.position.y = height / 2;
            
            // Add label (text sprite would be better, but using simple approach)
            bar.userData = {
                name: source.name,
                value: value * 100,
                color: color
            };
            
            this.scene.add(bar);
            this.particles.push(bar);
        });
        
        // Add a base plane
        const planeGeometry = new THREE.PlaneGeometry(6, 6);
        const planeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x1e293b,
            transparent: true,
            opacity: 0.3
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = 0;
        this.scene.add(plane);
    }
    
    animate3D() {
        if (!this.is3DMode || !this.renderer || !this.scene || !this.camera) return;
        
        this.animationId = requestAnimationFrame(() => this.animate3D());
        
        // Rotate camera around the scene
        const time = Date.now() * 0.0005;
        this.camera.position.x = Math.cos(time) * 6;
        this.camera.position.z = Math.sin(time) * 6;
        this.camera.position.y = 3 + Math.sin(time * 0.5) * 1;
        this.camera.lookAt(0, 1, 0);
        
        // Rotate and animate particles
        this.particles.forEach((particle, index) => {
            if (particle.rotation) {
                particle.rotation.y += 0.01;
            }
            // Subtle bounce
            const bounce = Math.sin(time * 2 + index) * 0.1;
            if (particle.userData && particle.userData.originalY !== undefined) {
                particle.position.y = particle.userData.originalY + bounce;
            } else {
                particle.userData.originalY = particle.position.y;
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
    
    async loadThreeJS() {
        if (typeof THREE !== 'undefined') {
            return true;
        }
        
        if (window.__threeLoadingPromise) {
            return window.__threeLoadingPromise;
        }
        
        window.__threeLoadingPromise = new Promise((resolve, reject) => {
            console.log('[HolographicCharts] Loading Three.js dynamically...');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = () => {
                console.log('[HolographicCharts] Three.js loaded successfully');
                resolve(true);
            };
            script.onerror = (error) => {
                console.error('[HolographicCharts] Failed to load Three.js', error);
                reject(error);
            };
            document.head.appendChild(script);
        });
        
        return window.__threeLoadingPromise;
    }
    
    async toggle3D() {
        console.log('[HolographicCharts] Toggling 3D mode. Current:', this.is3DMode);
        this.is3DMode = !this.is3DMode;
        
        if (this.is3DMode) {
            console.log('[HolographicCharts] Switching to 3D mode...');
            
            if (typeof THREE === 'undefined') {
                try {
                    await this.loadThreeJS();
                } catch (error) {
                    console.error('[HolographicCharts] Unable to enable 3D mode - Three.js failed to load');
                    this.is3DMode = false;
                    this.showNotification && this.showNotification('3D mode unavailable. Please check your internet connection.', 'warning');
                    return;
                }
            }
            
            if (!this.data || !this.data.source_impact_distribution) {
                console.warn('[HolographicCharts] No data available, using default dataset for 3D');
                this.data = this.getDefaultData();
            }
            
            this.init3D();
        } else {
            console.log('[HolographicCharts] Switching to 2D mode...');
            // Stop 3D animation
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            
            // Remove 3D renderer
            if (this.renderer) {
                if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                    this.renderer.domElement.remove();
                }
                this.renderer.dispose();
                this.renderer = null;
            }
            
            // Clean up 3D objects
            if (this.scene) {
                this.particles.forEach(particle => {
                    if (particle.geometry) particle.geometry.dispose();
                    if (particle.material) particle.material.dispose();
                });
                this.particles = [];
                this.scene = null;
            }
            
            this.camera = null;
            
            // Create 2D canvas and render
            console.log('[HolographicCharts] Creating 2D canvas...');
            this.createCanvas();
            this.resize();
            
            // Ensure placeholder is hidden
            const placeholder = this.container.querySelector('.holographic-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            
            // Render 2D with data
            if (this.data) {
                console.log('[HolographicCharts] Rendering 2D with existing data...');
                setTimeout(() => {
                    this.render2D();
                }, 100);
            } else {
                console.warn('[HolographicCharts] No data available for 2D rendering');
                this.renderPlaceholder();
            }
        }
    }
    
    toggleHolographic() {
        this.isHolographicMode = !this.isHolographicMode;
        if (!this.is3DMode && this.data) {
            this.render2D();
        }
    }
    
    getDefaultData() {
        return {
            source_impact_distribution: {
                sources: [
                    { name: 'Vehicular', value: 32, percentage: 32, color: '#ef4444' },
                    { name: 'Industrial', value: 24, percentage: 24, color: '#f97316' },
                    { name: 'Construction', value: 19, percentage: 19, color: '#8b5cf6' },
                    { name: 'Stubble Burning', value: 12, percentage: 12, color: '#06b6d4' },
                    { name: 'Power Plants', value: 8, percentage: 8, color: '#84cc16' },
                    { name: 'Waste Burning', value: 5, percentage: 5, color: '#ec4899' }
                ]
            },
            timestamp: new Date().toISOString(),
            analysis_type: 'Default Dataset'
        };
    }
    
    renderPlaceholder() {
        console.log('[HolographicCharts] Rendering placeholder...');
        if (!this.canvas || !this.ctx) {
            this.createCanvas();
        }
        
        this.resize();
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        if (width === 0 || height === 0) {
            console.error('[HolographicCharts] Canvas has zero size in placeholder!');
            return;
        }
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Loading source data...', width / 2, height / 2);
        
        console.log('[HolographicCharts] Placeholder rendered');
    }
    
    getColorForSource(sourceName) {
        const colors = {
            'Vehicular': '#ef4444',
            'Industrial': '#f97316',
            'Construction': '#8b5cf6',
            'Stubble Burning': '#06b6d4',
            'Power Plants': '#84cc16',
            'Waste Burning': '#ec4899',
            'Dust': '#6b7280',
            'Domestic': '#f59e0b',
            'Biomass': '#10b981',
            'Other': '#6366f1'
        };
        return colors[sourceName] || '#6366f1';
    }
    
    lightenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, ((num >> 16) & 0xFF) + amount * 255);
        const g = Math.min(255, ((num >> 8) & 0xFF) + amount * 255);
        const b = Math.min(255, (num & 0xFF) + amount * 255);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        if (this.scene) {
            this.particles.forEach(particle => {
                if (particle.geometry) particle.geometry.dispose();
                if (particle.material) particle.material.dispose();
            });
        }
    }
}
