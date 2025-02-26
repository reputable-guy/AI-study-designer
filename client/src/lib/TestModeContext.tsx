import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the context type
interface TestModeContextType {
  isTestMode: boolean;
  setTestMode: (value: boolean) => void;
}

// Create the context with default value
const TestModeContext = createContext<TestModeContextType>({
  isTestMode: false,
  setTestMode: () => {} // Default empty function
});

// Custom hook to use the context
export const useTestMode = () => useContext(TestModeContext);

// Provider component
interface TestModeProviderProps {
  children: ReactNode;
}

export const TestModeProvider: React.FC<TestModeProviderProps> = ({ children }) => {
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  
  // Check localStorage on component mount
  useEffect(() => {
    const storedValue = localStorage.getItem('useTestMode');
    setIsTestMode(storedValue === 'true');
  }, []);
  
  // Handle setting test mode
  const setTestMode = (value: boolean) => {
    setIsTestMode(value);
    localStorage.setItem('useTestMode', value ? 'true' : 'false');
  };

  return (
    <TestModeContext.Provider value={{ isTestMode, setTestMode }}>
      {children}
    </TestModeContext.Provider>
  );
};