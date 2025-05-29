import React, { useEffect, useState } from 'react';

const SoundTrigger: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // State to track if sound should play
  const [intervalMinutes, setIntervalMinutes] = useState<number>(5); // State for interval in minutes
  const [counter , setCounter] = useState(0)
  const [StartTime,setStartTime] = useState('')
  const sound = new Audio('/sounds/gardens.mp3'); // Replace with your sound file path

  useEffect(() => {
    // Function to play the sound
    const playSound = () => {
      sound.play().then(() => {
        setCounter(counter + 1)
        // Set a timeout to stop the audio after 2 seconds
        setTimeout(() => {
          if (sound) {
            sound.pause();
            sound.currentTime = 0;
          }
        }, 2000);
      })
      .catch((err) => console.error("Error playing sound:", err));
     
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
  }, [isPlaying, intervalMinutes, sound]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Sound Trigger</h1>
      <h3>Interval Number {counter}</h3>
      <p>A sound will play every {isPlaying ? intervalMinutes : 0} minutes when enabled.</p>
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
