import React, { useState } from 'react';

const CounterApp = () => {
  // State to hold the counter value
  const [count, setCount] = useState(0);

  // Function to increment the counter
  const increment = () => {
    setCount(count + 1);
    
  };

  // Function to decrement the counter
  const decrement = () => {
    setCount(count - 1);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Simple Counter</h1>
      <h2>{count}</h2>
      <button onClick={increment} style={{ margin: '5px', padding: '10px' }}>
        Increment
      </button>
      <button onClick={decrement} style={{ margin: '5px', padding: '10px' }}>
        Decrement
      </button>
    </div>
  );
};

export default CounterApp;
