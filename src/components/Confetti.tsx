
import { useState, useEffect } from 'react';
import ReactConfetti from 'react-confetti';

interface ConfettiProps {
  active: boolean;
  duration?: number; // durée en ms
}

const Confetti = ({ active, duration = 5000 }: ConfettiProps) => {
  const [isActive, setIsActive] = useState(active);
  const [windowDimension, setWindowDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    setIsActive(active);
    
    if (active && duration) {
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimension({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isActive ? (
    <ReactConfetti
      width={windowDimension.width}
      height={windowDimension.height}
      recycle={false}
      numberOfPieces={300}
      colors={['#FF87A1', '#3CE7F0', '#EFD8FF', '#231955']}
    />
  ) : null;
};

export default Confetti;
