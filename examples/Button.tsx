import React, { useState } from 'react';

export default function Button() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <h1>Counter Button Example</h1>
      <p>Click the button to increment the counter:</p>
      <button
        onClick={() => setCount((c) => c + 1)}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
      >
        Count: {count}
      </button>
    </div>
  );
}
