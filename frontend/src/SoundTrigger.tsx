import React, { useEffect, useState } from 'react';
import './SoundTrigger.css';

const SoundTrigger: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // State to track if sound should play
  const [intervalMinutes, setIntervalMinutes] = useState<number>(5); // State for interval in minutes
  const [counter, setCounter] = useState(0);
  const [startTime, setStartTime] = useState('');
  const [nextAlertTime, setNextAlertTime] = useState<string>('');

  useEffect(() => {
    // Function to play speech sound
    const playSound = () => {
      // Increment counter first
      const newCounter = counter + 1;
      setCounter(newCounter);

      // Create speech synthesis message
      const message = `Interval Number ${newCounter} ended. I repeat, Interval Number ${newCounter} ended`;

      // Use speech synthesis API
      const speech = new SpeechSynthesisUtterance(message);
      speech.rate = 1; // Normal speech rate
      speech.pitch = 1; // Normal pitch
      speech.volume = 1; // Full volume

      // Play the speech
      window.speechSynthesis.speak(speech);
    };

    // Set an interval to play the sound based on the specified minutes if isPlaying is true
    let intervalId: NodeJS.Timeout | undefined;
    if (isPlaying) {
      const intervalMilliseconds = intervalMinutes * 60000; // Convert minutes to milliseconds
      intervalId = setInterval(playSound, intervalMilliseconds);

      // Calculate and set the next alert time
      const now = new Date();
      const nextAlert = new Date(now.getTime() + intervalMilliseconds);
      setNextAlertTime(nextAlert.toLocaleTimeString());
    } else {
      setNextAlertTime('');
    }

    // Clean up the interval on component unmount or when isPlaying or intervalMinutes changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, intervalMinutes, counter]);

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
                if (newIsPlaying) {
                  const currentTime = new Date();
                  setStartTime(currentTime.toLocaleTimeString());
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
      </div>
    </div>
  );
};

export default SoundTrigger;
