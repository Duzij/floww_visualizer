export const VISUALIZER_CONFIG = {
    fftSize: 1024,
    smoothingTimeConstant: 0.29,
    minDecibels: -90,
    maxDecibels: -10,
    intensity: 2,
    waves: [
        {
            name: 'Bass',
            range: [20, 100],
            color: 'rgba(0, 168, 150, 0.5)', // Teal
            amplitudeFactor: 0.8,
            phaseShift: 0
        },
        {
            name: 'Low Mids',
            range: [100, 500],
            color: 'rgba(0, 128, 128, 0.5)', // Dark Cyan
            amplitudeFactor: 1.0,
            phaseShift: 1
        },
        {
            name: 'Mids',
            range: [500, 2000],
            color: 'rgba(50, 80, 180, 0.5)', // Deep Blue
            amplitudeFactor: 0.8,
            phaseShift: 2
        },
        {
            name: 'High Mids',
            range: [2000, 6000],
            color: 'rgba(120, 40, 140, 0.5)', // Purple
            amplitudeFactor: 1.2,
            phaseShift: 3
        },
        {
            name: 'Highs',
            range: [6000, 20000],
            color: 'rgba(180, 20, 80, 0.5)', // Magenta
            amplitudeFactor: 1.2,
            phaseShift: 4
        }
    ]
};
