export class AudioController {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = "anonymous";
        this.audioElement.loop = false;

        this.sourceNode = null;
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048; // High resolution for better frequency analysis
        this.analyser.smoothingTimeConstant = 0.8;

        this.gainNode = this.audioContext.createGain();
        this.streamDestination = this.audioContext.createMediaStreamDestination();

        // Connect: Source -> Analyser -> Gain -> [Destination, StreamDestination]
        // Source will be connected when file is loaded
        this.analyser.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.connect(this.streamDestination);

        this.isPlaying = false;
    }

    async loadFile(file) {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const objectUrl = URL.createObjectURL(file);
        this.audioElement.src = objectUrl;

        if (this.sourceNode) {
            this.sourceNode.disconnect();
        }

        this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
        this.sourceNode.connect(this.analyser);

        return new Promise((resolve) => {
            this.audioElement.oncanplaythrough = () => resolve();
        });
    }

    play() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        this.audioElement.play();
        this.isPlaying = true;
    }

    pause() {
        this.audioElement.pause();
        this.isPlaying = false;
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
        return this.isPlaying;
    }

    setVolume(value) {
        this.gainNode.gain.value = value;
    }

    toggleMute() {
        if (this.gainNode.gain.value > 0) {
            this.previousVolume = this.gainNode.gain.value;
            this.gainNode.gain.value = 0;
            return true; // Muted
        } else {
            this.gainNode.gain.value = this.previousVolume || 1;
            return false; // Unmuted
        }
    }

    getFrequencyData(dataArray) {
        this.analyser.getByteFrequencyData(dataArray);
    }

    getAudioStream() {
        return this.streamDestination.stream;
    }
}
