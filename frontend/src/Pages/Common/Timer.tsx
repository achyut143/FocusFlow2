import { Button } from '@mui/material';
import React, { useState, useEffect } from 'react';
interface Props{
    minutes:number
}

const Timer: React.FC<Props> = ({minutes}) => {
  const [timeLeft, setTimeLeft] = useState<number>(minutes * 60); // 30 minutes in seconds
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (!isActive && timeLeft !== 0 && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    setIsActive((prev) => !prev);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(30 * 60);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div>
      <h3>{formatTime(timeLeft)}</h3>
      <button onClick={toggleTimer}>
        {isActive ? 'Pause' : 'Start'}
      </button>
      {/* <Button variant='outlined' color='primary' size='small' onClick={resetTimer}>Reset</Button> */}
    </div>
  );
};

export default Timer;
