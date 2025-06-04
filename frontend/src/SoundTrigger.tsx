import React, { useEffect, useState } from 'react';

const SoundTrigger: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // State to track if sound should play
  const [intervalMinutes, setIntervalMinutes] = useState<number>(5); // State for interval in minutes
  const [counter, setCounter] = useState(0)
  const [StartTime, setStartTime] = useState('')

  useEffect(() => {
    // Function to play speech sound
    const playSound = () => {
      // Increment counter first
      const newCounter = counter + 1;
      setCounter(newCounter);
      
      // Create speech synthesis message
      const message = `Interval Number ${newCounter} ended for ${intervalMinutes} minutes`;
      
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
    }

    // Clean up the interval on component unmount or when isPlaying or intervalMinutes changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, intervalMinutes, counter]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Voice Alert</h1>
      <h3>Interval Number {counter}</h3>
      <p>A voice announcement will be made every {isPlaying ? intervalMinutes : 0} minutes when enabled.</p>
      <p>{isPlaying && StartTime}</p>
      
      <label>
        <input
          type="checkbox"
          checked={isPlaying}
          onChange={() => {setIsPlaying(!isPlaying)
            const currentTime = new Date();
        setStartTime(currentTime.toLocaleTimeString());
          }

          } // Toggle the isPlaying state
        />
        {isPlaying ? ' Stop Playing' : ' Start Playing'}
      </label>
      
      <div style={{ marginTop: '20px' }}>
        <label>
          Set Interval (minutes):
          <input
            type="number"
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(Number(e.target.value))} // Update intervalMinutes state
            min="1" // Minimum value of 1 minute
            style={{ marginLeft: '10px', width: '50px' }}
          />
        </label>
      </div>
    </div>
  );
};

export default SoundTrigger;
