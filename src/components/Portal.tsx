import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      setMounted(false);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return mounted
    ? createPortal(children, document.getElementById('modal-root') as HTMLElement)
    : null;
};

export default Portal;