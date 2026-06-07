import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { clearToken, getToken } from '../lib/auth';

interface SessionTimerProps {
  onLogout?: () => void;
  isTeacher?: boolean;
}

export function SessionTimer({ onLogout, isTeacher }: SessionTimerProps) {
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes in seconds
  const navigate = useNavigate();

  useEffect(() => {
    const adminToken = getToken();
    const teacherToken = sessionStorage.getItem('srms_teacher_token');
    
    if (!teacherToken && !isTeacher) return;
    if (adminToken && !isTeacher) return;

    const totalSeconds = 10 * 60;
    
    // Use an object/closure to track the latest expiration time without re-binding listeners
    let expirationTime = Date.now() + totalSeconds * 1000;
    
    const handleActivity = () => {
      expirationTime = Date.now() + totalSeconds * 1000;
    };

    const countdownInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(countdownInterval);
        sessionStorage.removeItem('srms_teacher_token');
        sessionStorage.removeItem('srms_teacher_id');
        clearToken();
        toast.error('Session expired due to inactivity.');
        if (onLogout) {
          onLogout();
        } else {
          navigate('/teacher-portal');
        }
      }
    }, 1000);

    const activityEvents = ['keydown', 'click', 'touchstart'];
    
    // Throttle the event listeners slightly to avoid excessive processing
    let throttleTimer: any = null;
    const throttledActivity = () => {
      if (throttleTimer) return;
      handleActivity();
      throttleTimer = setTimeout(() => { throttleTimer = null; }, 1000);
    };

    activityEvents.forEach(e => window.addEventListener(e, throttledActivity, { passive: true }));
    
    return () => {
      clearInterval(countdownInterval);
      if (throttleTimer) clearTimeout(throttleTimer);
      activityEvents.forEach(e => window.removeEventListener(e, throttledActivity));
    };
  }, [navigate, onLogout, isTeacher]);

  const teacherToken = sessionStorage.getItem('srms_teacher_token');
  if (!teacherToken && !isTeacher) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Change color to red if less than 60 seconds
  const isWarning = timeLeft <= 60;

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-lg backdrop-blur transition-colors ${isWarning ? 'bg-red-100 text-red-700 border-2 border-red-500 animate-pulse' : 'bg-slate-900/90 text-white border border-slate-700'}`}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
