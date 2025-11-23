import './style.css';
import { AudioController } from './audio.js';
import { Visualizer } from './visualizer.js';
import { Recorder } from './recorder.js';
import { VISUALIZER_CONFIG } from './config.js';

const audioController = new AudioController();
const canvas = document.getElementById('visualizer-canvas');
const visualizer = new Visualizer(canvas, audioController);
const recorder = new Recorder(canvas, audioController);

// UI Elements
const fileInput = document.getElementById('audio-upload');
const fileNameDisplay = document.getElementById('file-name');
const playPauseBtn = document.getElementById('play-pause-btn');
const volumeSlider = document.getElementById('volume-slider');
const muteBtn = document.getElementById('mute-btn');
const intensitySlider = document.getElementById('intensity-slider');
const timelineSlider = document.getElementById('timeline-slider');
const currentTimeLabel = document.getElementById('current-time');
const totalDurationLabel = document.getElementById('total-duration');

// Event Listeners
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    fileNameDisplay.textContent = file.name;
    playPauseBtn.disabled = true; // Disable while loading

    await audioController.loadFile(file);

    playPauseBtn.disabled = false;
    volumeSlider.disabled = false;
    muteBtn.disabled = false;
    timelineSlider.disabled = false;

    // Auto play on load (optional, but good UX here)
    // audioController.play(); 
    // updatePlayPauseIcon(true);
  }
});

// Timeline Logic
audioController.audioElement.addEventListener('timeupdate', () => {
  const currentTime = audioController.audioElement.currentTime;
  const duration = audioController.audioElement.duration;

  if (!isNaN(duration)) {
    timelineSlider.max = duration;
    timelineSlider.value = currentTime;

    currentTimeLabel.textContent = formatTime(currentTime);
    totalDurationLabel.textContent = formatTime(duration);
  }
});

timelineSlider.addEventListener('input', (e) => {
  const time = parseFloat(e.target.value);
  audioController.audioElement.currentTime = time;
});

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

playPauseBtn.addEventListener('click', () => {
  const isPlaying = audioController.togglePlay();
  updatePlayPauseIcon(isPlaying);
});

volumeSlider.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  audioController.setVolume(value);
});

muteBtn.addEventListener('click', () => {
  const isMuted = audioController.toggleMute();
  updateMuteIcon(isMuted);
  if (isMuted) {
    volumeSlider.value = 0;
  } else {
    volumeSlider.value = audioController.gainNode.gain.value;
  }
});

intensitySlider.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  visualizer.setIntensity(value);
});

function updatePlayPauseIcon(isPlaying) {
  playPauseBtn.innerHTML = isPlaying ? '<span class="icon">⏸</span>' : '<span class="icon">▶</span>';
}

function updateMuteIcon(isMuted) {
  muteBtn.innerHTML = isMuted ? '<span class="icon">🔇</span>' : '<span class="icon">🔊</span>';
}

const controlsOverlay = document.getElementById('controls-overlay');
const toggleBtn = document.getElementById('toggle-controls-btn');
const recordBtn = document.getElementById('record-btn');
const colorPickersContainer = document.getElementById('color-pickers-container');

// Record Button
recordBtn.addEventListener('click', () => {
  if (recorder.isRecording) {
    // Optional: Allow cancelling? Or just ignore clicks?
    // For now, let's allow stopping manually if user wants to abort
    recorder.stop();
    recordBtn.classList.remove('recording');
    recordBtn.innerHTML = '<span class="icon">🔴</span>';
  } else {
    recorder.exportFullVideo();
    recordBtn.classList.add('recording');
    recordBtn.innerHTML = '<span class="icon">⏳</span>'; // Hourglass or stop square
  }
});

// Toggle Controls
toggleBtn.addEventListener('click', () => {
  controlsOverlay.classList.toggle('hidden');
  const isHidden = controlsOverlay.classList.contains('hidden');
  toggleBtn.innerHTML = isHidden ? '<span class="icon">⚙️</span>' : '<span class="icon">👁️</span>';
});

// Initialize Color Pickers
VISUALIZER_CONFIG.waves.forEach((wave, index) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'color-picker-wrapper';
  wrapper.style.backgroundColor = wave.color;

  const input = document.createElement('input');
  input.type = 'color';
  // Convert rgba to hex for input value (approximate)
  // This is a bit tricky since we use rgba strings in config.
  // For simplicity, we'll just let the user pick a new color and it will become solid hex
  // Or we can try to parse it. Let's just default to a safe color or try to parse.
  input.value = rgbaToHex(wave.color);

  input.addEventListener('input', (e) => {
    const hexColor = e.target.value;
    // Convert back to rgba with opacity for consistency with blending
    const rgbaColor = hexToRgba(hexColor, 0.5);

    VISUALIZER_CONFIG.waves[index].color = rgbaColor;
    wrapper.style.backgroundColor = rgbaColor;
  });

  wrapper.appendChild(input);
  colorPickersContainer.appendChild(wrapper);
});

// Helper functions for color conversion
function rgbaToHex(rgba) {
  const parts = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!parts) return '#ffffff';
  const r = parseInt(parts[1]).toString(16).padStart(2, '0');
  const g = parseInt(parts[2]).toString(16).padStart(2, '0');
  const b = parseInt(parts[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

console.log('SpectroFlow initialized');
