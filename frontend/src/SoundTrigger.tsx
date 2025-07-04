import React, { useEffect, useState, useRef } from 'react';
import './SoundTrigger.css';

const SoundTrigger: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // State to track if sound should play
  const [isPaused, setIsPaused] = useState<boolean>(false); // State to track if timer is paused
  const [intervalMinutes, setIntervalMinutes] = useState<number>(5); // State for interval in minutes
  const [counter, setCounter] = useState(0);
  const [startTime, setStartTime] = useState('');
  const [nextAlertTime, setNextAlertTime] = useState<string>('');
  const lastTickRef = useRef<number>(0); // Reference to store the timestamp of the last tick

  useEffect(() => {
    // Function to play speech sound
    const playSound = () => {
      // Increment counter first
      const newCounter = counter + 1;
      setCounter(newCounter);

      // Create speech synthesis message
      const message = `Hi Achyut,  Interval ${newCounter} ended. Hi Achyut,  Interval ${newCounter} ended.`;

      // Use speech synthesis API
      const speech = new SpeechSynthesisUtterance(message);
      speech.rate = 1; // Normal speech rate
      speech.pitch = 1; // Normal pitch
      speech.volume = 1; // Full volume

      // Play the speech
      window.speechSynthesis.speak(speech);
    };

    // Set an interval to check elapsed time and play sound if needed
    let intervalId: NodeJS.Timeout | undefined;
    if (isPlaying && !isPaused) {
      const intervalMilliseconds = intervalMinutes * 60000; // Convert minutes to milliseconds
      lastTickRef.current = Date.now(); // Store current time

      // Calculate and set the next alert time
      const now = new Date();
      const nextAlert = new Date(now.getTime() + intervalMilliseconds);
      setNextAlertTime(nextAlert.toLocaleTimeString());

      // Check actual elapsed time to handle sleep/suspend cases
      intervalId = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastTickRef.current;

        // If elapsed time is close to or exceeds the interval, trigger sound
        if (elapsed >= intervalMilliseconds) {
          playSound();
          lastTickRef.current = now; // Reset the timer

          // Update next alert time
          const nextAlert = new Date(now + intervalMilliseconds);
          setNextAlertTime(nextAlert.toLocaleTimeString());
        }
      }, 1000); // Check every second
    } else {
      if (!isPlaying) {
        setNextAlertTime('');
      }
    }

    // Clean up the interval on component unmount or when dependencies change
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, isPaused, intervalMinutes, counter]);

  return (
    <div className="sound-trigger-container">
      <div className="sound-trigger-header">
        <h1>Voice Alert System</h1>
        <p>Automated voice notifications at regular intervals</p>
      </div>

      <div className="counter-display">
        <h2>{counter}</h2>
        <p>Intervals Completed</p>
      </div>

      {isPlaying && (
        <div className="alert-info">
          <p>Voice announcement every <strong>{intervalMinutes} minutes</strong></p>
          <p className="time-display">
            Started at: {startTime}<br />
            Next alert: {nextAlertTime}
          </p>
        </div>
      )}

      <div className="controls">
        <div className="toggle-control">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isPlaying}
              onChange={() => {
                const newIsPlaying = !isPlaying;
                setIsPlaying(newIsPlaying);
                setIsPaused(false); // Reset pause state when toggling play/stop
                if (newIsPlaying) {
                  const currentTime = new Date();
                  setStartTime(currentTime.toLocaleTimeString());
                  lastTickRef.current = Date.now(); // Initialize the timer reference
                }
              }}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-label">{isPlaying ? 'Stop Alerts' : 'Start Alerts'}</span>
        </div>

        <div className="interval-control">
          <span className="interval-label">Interval Duration:</span>
          <input
            type="number"
            className="interval-input"
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(Math.max(1, Number(e.target.value)))}
            min="1"
          />
          <span className="interval-label">minutes</span>
        </div>

        <div className="button-controls">
          <button
            className="control-button"
            onClick={() => {
              setCounter(0);
              if (isPlaying && !isPaused) {
                lastTickRef.current = Date.now();
                const nextAlert = new Date(Date.now() + intervalMinutes * 60000);
                setNextAlertTime(nextAlert.toLocaleTimeString());
              }
            }}
          >
            Reset
          </button>

          {isPlaying && (
            <button
              className="control-button"
              onClick={() => {
                setIsPaused(!isPaused);
                if (isPaused) {
                  // Coming back to live - reset the timer reference
                  lastTickRef.current = Date.now();
                  const nextAlert = new Date(Date.now() + intervalMinutes * 60000);
                  setNextAlertTime(nextAlert.toLocaleTimeString());
                }
              }}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}

          {isPlaying && (
            <button
              className="control-button"
              onClick={() => {
                // Come back to live - reset the timer reference
                lastTickRef.current = Date.now();
                const nextAlert = new Date(Date.now() + intervalMinutes * 60000);
                setNextAlertTime(nextAlert.toLocaleTimeString());
              }}
            >
              Sync Timer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoundTrigger;
