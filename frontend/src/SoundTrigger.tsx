import React, { useEffect, useState, useRef, MouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import './SoundTrigger.css';

const SoundTrigger: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // State to track if sound should play
  const [isSimple, setIsSimple] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false); // State to track if timer is paused
  const [intervalMinutes, setIntervalMinutes] = useState<number>(5); // State for interval in minutes
  const [counter, setCounter] = useState(0);
  const [startTime, setStartTime] = useState('');
  const [nextAlertTime, setNextAlertTime] = useState<string>('');
  const lastTickRef = useRef<number>(0); // Reference to store the timestamp of the last tick
  
  // Draggable functionality states
  const [position, setPosition] = useState(() => {
    // Try to get saved position from localStorage
    const savedPosition = localStorage.getItem('soundTriggerPosition');
    return savedPosition ? JSON.parse(savedPosition) : { x: 20, y: 20 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(() => {
    // Try to get saved minimized state from localStorage
    const savedMinimized = localStorage.getItem('soundTriggerMinimized');
    return savedMinimized ? JSON.parse(savedMinimized) : false;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Function to play speech sound
    const playSound = () => {
      // Increment counter first
      const newCounter = counter + 1;
      setCounter(newCounter);



      // Create speech synthesis message
      let message = `Hi Achyut,  Interval ${newCounter} ended. Hi Achyut,  Interval ${newCounter} ended.`;
      if(isSimple){
        message =   `${newCounter}`
        
      }

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

  // Handle mouse down event to start dragging
  const handleMouseDown = (e: MouseEvent) => {
    if (containerRef.current) {
      setIsDragging(true);
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };
  
  // Handle touch start event for mobile devices
  const handleTouchStart = (e: ReactTouchEvent) => {
    if (containerRef.current && e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }
  };

  // Handle mouse move event for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      // Get container dimensions
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      
      // Calculate new position
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      // Keep component within viewport bounds
      newX = Math.max(0, Math.min(window.innerWidth - containerWidth, newX));
      newY = Math.max(0, Math.min(window.innerHeight - 40, newY));
      
      setPosition({
        x: newX,
        y: newY
      });
    }
  };

  // Handle mouse up event to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    // Save position to localStorage
    localStorage.setItem('soundTriggerPosition', JSON.stringify(position));
  };

  // Add and remove event listeners for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: globalThis.MouseEvent) => {
      if (isDragging && containerRef.current) {
        // Get container dimensions
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        
        // Calculate new position
        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;
        
        // Keep component within viewport bounds
        newX = Math.max(0, Math.min(window.innerWidth - containerWidth, newX));
        newY = Math.max(0, Math.min(window.innerHeight - 40, newY));
        
        setPosition({
          x: newX,
          y: newY
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      // Save position to localStorage when dragging stops
      localStorage.setItem('soundTriggerPosition', JSON.stringify(position));
    };
    
    // Touch event handlers for mobile devices
    const handleGlobalTouchMove = (e: globalThis.TouchEvent) => {
      if (isDragging && containerRef.current && e.touches.length === 1) {
        const touch = e.touches[0];
        
        // Get container dimensions
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        
        // Calculate new position
        let newX = touch.clientX - dragOffset.x;
        let newY = touch.clientY - dragOffset.y;
        
        // Keep component within viewport bounds
        newX = Math.max(0, Math.min(window.innerWidth - containerWidth, newX));
        newY = Math.max(0, Math.min(window.innerHeight - 40, newY));
        
        setPosition({
          x: newX,
          y: newY
        });
        
        // Prevent default to avoid scrolling while dragging
        e.preventDefault();
      }
    };

    const handleGlobalTouchEnd = (e: globalThis.TouchEvent) => {
      setIsDragging(false);
      // Save position to localStorage when dragging stops
      localStorage.setItem('soundTriggerPosition', JSON.stringify(position));
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
      document.addEventListener('touchcancel', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [isDragging, dragOffset, position]);
  
  // Handle window resize to keep component within viewport
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        
        // Adjust position if needed to stay within viewport
        let newX = Math.max(0, Math.min(window.innerWidth - containerWidth, position.x));
        let newY = Math.max(0, Math.min(window.innerHeight - 40, position.y));
        
        if (newX !== position.x || newY !== position.y) {
          const newPosition = { x: newX, y: newY };
          setPosition(newPosition);
          localStorage.setItem('soundTriggerPosition', JSON.stringify(newPosition));
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [position]);

  return (
    <div 
      className={`sound-trigger-container draggable ${isMinimized ? 'minimized' : ''}`}
      ref={containerRef}
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 1000
      }}
    >      
      <div 
        className="drag-handle" 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="drag-handle-icon">☰</div>
        <div className="drag-handle-title">{isMinimized ? `Voice Alert: ${counter}` : 'Voice Alert System'}</div>
        <div className="minimize-button" onClick={(e) => {
          e.stopPropagation();
          const newMinimizedState = !isMinimized;
          setIsMinimized(newMinimizedState);
          // Save minimized state to localStorage
          localStorage.setItem('soundTriggerMinimized', JSON.stringify(newMinimizedState));
        }}>
          {isMinimized ? '□' : '−'}
        </div>
      </div>
      {!isMinimized && (
        <div className="sound-trigger-header">
          <h1>Voice Alert System</h1>
          <p>Automated voice notifications at regular intervals</p>
        </div>
      )}

      {!isMinimized && (
        <>
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
              <button
                className="control-button"
                onClick={() => {
                  setIsSimple(!isSimple);
                }}
              >
                {isSimple ? 'Keep noisy' : 'Keep simple'}
              </button>
            </div>
          </div>
        </>
      )}
      
      {isMinimized && isPlaying && (
        <div className="minimized-info">
          <div className="minimized-counter">{counter}</div>
          <div className="minimized-next-time">{nextAlertTime}</div>
        </div>
      )}
    </div>
  );
};

export default SoundTrigger;
