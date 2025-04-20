import * as THREE from 'three';

class WindParticles {
    constructor(scene, windSpeed, windDirection) {
        this.scene = scene;
        this.windSpeed = windSpeed;
        this.windDirection = windDirection;
        this.particles = null;
        this.count = 10000; // Increased number of particles
        this.init();
    }

    init() {
        // Create particle geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.count * 3);
        const velocities = new Float32Array(this.count * 3);
        const colors = new Float32Array(this.count * 3);
        const sizes = new Float32Array(this.count);

        // Initialize particle positions and velocities
        for (let i = 0; i < this.count; i++) {
            // Create a larger, flatter distribution
            const radius = 50 + Math.random() * 100; // Increased radius
            const theta = Math.random() * Math.PI * 2; // Azimuthal angle
            const phi = Math.acos(2 * Math.random() - 1) * 0.3; // Reduced vertical spread
            
            // Convert spherical to cartesian coordinates
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = 5 + Math.random() * 10; // Keep particles closer to ground
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            // Initial velocities based on wind direction
            const speed = 0.1 + Math.random() * 0.2;
            velocities[i * 3] = Math.cos(this.windDirection) * speed;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = Math.sin(this.windDirection) * speed;

            // Colors (white to light blue with more variation)
            colors[i * 3] = 0.7 + Math.random() * 0.3;
            colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
            colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;

            // Randomize particle sizes
            sizes[i] = 0.1 + Math.random() * 0.2; // Slightly larger particles
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Create particle material
        const material = new THREE.PointsMaterial({
            size: 0.2, // Increased base size
            vertexColors: true,
            transparent: true,
            opacity: 0.4, // Slightly reduced opacity
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        // Create particle system
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    update(windSpeed, windDirection) {
        if (!this.particles) return;

        const positions = this.particles.geometry.attributes.position.array;
        const velocities = this.particles.geometry.attributes.velocity.array;
        const sizes = this.particles.geometry.attributes.size.array;

        // Calculate spacing factor based on wind speed
        const spacingFactor = Math.max(0.1, 1 - (windSpeed / 25));

        for (let i = 0; i < this.count; i++) {
            // Update velocities based on wind direction and speed
            const speed = windSpeed * (0.1 + Math.random() * 0.2);
            velocities[i * 3] = Math.cos(windDirection) * speed;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = Math.sin(windDirection) * speed;

            // Update positions with spacing factor
            positions[i * 3] += velocities[i * 3] * spacingFactor;
            positions[i * 3 + 1] += velocities[i * 3 + 1] * spacingFactor;
            positions[i * 3 + 2] += velocities[i * 3 + 2] * spacingFactor;

            // Adjust particle size based on wind speed
            sizes[i] = 0.1 + (0.2 * (1 - windSpeed / 25));

            // Reset particles that go too far
            const distance = Math.sqrt(
                positions[i * 3] * positions[i * 3] +
                positions[i * 3 + 1] * positions[i * 3 + 1] +
                positions[i * 3 + 2] * positions[i * 3 + 2]
            );

            if (distance > 150) { // Increased reset distance
                // Reset position with larger distribution
                const radius = 50 + Math.random() * 100;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1) * 0.3;
                
                positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = 5 + Math.random() * 10;
                positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            }
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.geometry.attributes.size.needsUpdate = true;
    }

    dispose() {
        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.particles = null;
        }
    }
}

export default WindParticles; 