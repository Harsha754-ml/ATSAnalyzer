import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThreeBackground: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -50,
        pointerEvents: 'none',
        backgroundColor: isDark ? '#0d1117' : '#ffffff',
        transition: 'background-color 0.3s ease',
      }}
    />
  );
};

export default ThreeBackground;
