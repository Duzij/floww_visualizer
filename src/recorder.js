export class Recorder {
    constructor(canvas, audioController) {
        this.canvas = canvas;
        this.audioController = audioController;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.mimeType = 'video/webm'; // Default fallback
        this.extension = 'webm';
    }

    async exportFullVideo() {
        if (this.isRecording) return;

        // Determine supported mime type for H.264/MP4
        const types = [
            { mime: 'video/mp4;codecs=h264', ext: 'mp4' },
            { mime: 'video/webm;codecs=h264', ext: 'webm' },
            { mime: 'video/webm;codecs=vp9', ext: 'webm' },
            { mime: 'video/webm', ext: 'webm' }
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type.mime)) {
                this.mimeType = type.mime;
                this.extension = type.ext;
                console.log(`Using MIME type: ${this.mimeType}`);
                break;
            }
        }

        const canvasStream = this.canvas.captureStream(60); // 60 FPS
        const audioStream = this.audioController.getAudioStream();

        // Combine audio and video streams
        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...audioStream.getAudioTracks()
        ]);

        const options = { mimeType: this.mimeType };

        try {
            this.mediaRecorder = new MediaRecorder(combinedStream, options);
        } catch (e) {
            console.error('Failed to create MediaRecorder with options:', options);
            alert('MP4 recording not supported by this browser. Falling back to WebM.');
            this.mediaRecorder = new MediaRecorder(combinedStream); // Fallback
            this.mimeType = 'video/webm';
            this.extension = 'webm';
        }
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            this.download();
            this.isRecording = false;
            // Remove event listener to avoid memory leaks or duplicate calls
            this.audioController.audioElement.removeEventListener('ended', this.handleAudioEnd);

            // Reset UI (hacky direct access or callback would be better)
            const btn = document.getElementById('record-btn');
            if (btn) {
                btn.classList.remove('recording');
                btn.innerHTML = '<span class="icon">🔴</span>';
            }
        };

        // Setup Audio
        this.audioController.pause();
        this.audioController.audioElement.currentTime = 0;

        // Define handler so we can remove it later
        this.handleAudioEnd = () => {
            this.stop();
        };

        this.audioController.audioElement.addEventListener('ended', this.handleAudioEnd);

        // Start Recording
        this.mediaRecorder.start();
        this.isRecording = true;
        console.log('Export started');

        // Start Playback
        this.audioController.play();
    }

    stop() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            console.log('Export stopped');
        }
    }

    download() {
        const blob = new Blob(this.recordedChunks, {
            type: this.mimeType
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        a.download = `spectroflow-export-${Date.now()}.${this.extension}`;
        a.click();

        window.URL.revokeObjectURL(url);
        this.recordedChunks = []; // Reset for next recording
    }
}
