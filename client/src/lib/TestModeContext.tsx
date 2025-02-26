import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the context type
interface TestModeContextType {
  isTestMode: boolean;
}

// Create the context with default value
const TestModeContext = createContext<TestModeContextType>({ isTestMode: false });

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
  
  return (
    <TestModeContext.Provider value={{ isTestMode }}>
      {children}
    </TestModeContext.Provider>
  );
};