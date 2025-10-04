import React, { useState, useEffect } from 'react';
import './LoadingBar.css';

interface LoadingBarProps {
  isLoading: boolean;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      setProgress(30); // Start at 30%

      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90; // Stop at 90% until complete
          }
          return Math.min(prev + 10, 90);
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      // Complete the progress
      setProgress(100);
      
      // Hide after animation completes
      const timer = setTimeout(() => {
        setProgress(0);
        setIsVisible(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!isVisible) return null;

  return (
    <div className="loading-bar-container">
      <div 
        className="loading-bar" 
        style={{ 
          width: `${progress}%`,
          opacity: isVisible ? 1 : 0,
          transition: 'width 0.2s linear, opacity 0.3s'
        }}
      />
    </div>
  );
};

export default LoadingBar;