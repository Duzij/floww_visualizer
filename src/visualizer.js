import { VISUALIZER_CONFIG } from './config.js';

export class Visualizer {
    constructor(canvas, audioController) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioController = audioController;

        this.width = 0;
        this.height = 0;
        this.animationId = null;

        // Data array for frequency analysis
        this.dataArray = new Uint8Array(audioController.analyser.frequencyBinCount);

        // Smooth amplitudes for each wave to prevent jitter
        this.smoothedAmplitudes = new Array(VISUALIZER_CONFIG.waves.length).fill(0);

        this.intensity = 3; // Default intensity

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.start();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    start() {
        this.draw();
    }

    getFrequencyEnergy(range) {
        const nyquist = this.audioController.audioContext.sampleRate / 2;
        const lowIndex = Math.round(range[0] / nyquist * this.dataArray.length);
        const highIndex = Math.round(range[1] / nyquist * this.dataArray.length);

        let sum = 0;
        let count = 0;

        for (let i = lowIndex; i <= highIndex; i++) {
            sum += this.dataArray[i];
            count++;
        }

        return count > 0 ? sum / count : 0;
    }

    draw() {
        this.animationId = requestAnimationFrame(() => this.draw());

        this.ctx.clearRect(0, 0, this.width, this.height);

        // If audio is paused or not playing, we can skip heavy calculations or just draw empty
        // But requirement says "Silence Detection", so we should check if there is actual sound
        this.audioController.getFrequencyData(this.dataArray);

        // Check for silence (simple check: if average energy is very low)
        // Or just rely on the fact that dataArray will be 0s.

        const time = Date.now() / 1000;

        VISUALIZER_CONFIG.waves.forEach((waveConfig, index) => {
            const energy = this.getFrequencyEnergy(waveConfig.range);
            const normalizedEnergy = energy / 255; // 0 to 1

            // Smoothing
            this.smoothedAmplitudes[index] += (normalizedEnergy - this.smoothedAmplitudes[index]) * VISUALIZER_CONFIG.smoothingTimeConstant;

            // Apply global intensity multiplier
            const amplitude = this.smoothedAmplitudes[index] * waveConfig.amplitudeFactor * (this.height / 4) * this.intensity;

            this.drawWave(waveConfig.color, amplitude, waveConfig.phaseShift, time, index);
        });
    }

    drawWave(color, amplitude, phaseShift, time, index) {
        if (amplitude < 0.1) return; // Optimization for silence

        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;

        // Additive blending for glowing effect
        this.ctx.globalCompositeOperation = 'screen';

        const centerY = this.height / 2;
        // Base frequency
        const frequency = index * 0.0005;

        this.ctx.moveTo(0, centerY);

        for (let x = 0; x <= this.width; x += 5) {
            // Normalized position (0 to 1)
            const normX = x / this.width;

            // Attenuation function (Parabolic window) to taper ends
            // 4 * x * (1-x) is a parabola peaking at 1 in the center and 0 at ends
            // Raise to power to make it sharper
            const attenuation = Math.pow(4 * normX * (1 - normX), 2);

            // Main wave (Standing wave: spatial part separated from temporal part)
            // Math.sin(x * frequency + phaseShift) defines the shape
            // Math.sin(time) defines the oscillation over time
            const y1 = Math.sin(x * frequency + phaseShift) * Math.sin(time * 2);

            // Secondary wave for organic complexity
            const y2 = Math.sin(x * frequency * 2.5 + phaseShift) * Math.cos(time * 1.5);

            // Combined wave with attenuation
            const y = (y1 + y2 * 0.5) * amplitude * attenuation;

            this.ctx.lineTo(x, centerY + y);
        }

        // Fill to bottom (or just fill the shape?)
        // Let's try filling to the bottom but with low opacity, or maybe just a thick line?
        this.ctx.lineTo(this.width, centerY);
        this.ctx.closePath();
        this.ctx.fill();

        // Reset composite operation
        this.ctx.globalCompositeOperation = 'source-over';
    }

    setIntensity(value) {
        this.intensity = value;
    }
}
