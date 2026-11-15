import React, { createContext, useContext, useState, useEffect } from 'react';

export type FontScale = 'normal' | 'large' | 'xlarge';

interface AccessibilityContextType {
  fontScale: FontScale;
  highContrast: boolean;
  setFontScale: (scale: FontScale) => void;
  toggleHighContrast: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontScale, setFontScale] = useState<FontScale>('normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('scale-normal', 'scale-large', 'scale-xlarge');
    root.classList.add(`scale-${fontScale}`);
  }, [fontScale]);

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const toggleHighContrast = () => setHighContrast((prev) => !prev);

  return (
    <AccessibilityContext.Provider
      value={{
        fontScale,
        highContrast,
        setFontScale,
        toggleHighContrast,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
};
