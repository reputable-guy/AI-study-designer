import { Link } from "wouter";
import { useState, useEffect } from "react";

export default function Header() {
  const [mounted, setMounted] = useState(false);

  // Only execute after component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center">
              {/* Reputable logo - hexagon shape */}
              <svg width="32" height="32" viewBox="0 0 302 348" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-foreground">
                <path d="M151 0L0 87V261L151 348L302 261V87L151 0ZM273.033 242.669L151 311.704L28.967 242.669V105.331L151 36.296L273.033 105.331V242.669Z" fill="currentColor"/>
                <path d="M101.321 112.38L151 84.085L200.679 112.38L200.679 235.62L151 263.915L101.321 235.62L101.321 112.38Z" fill="currentColor"/>
                <path d="M151 36.296L273.033 105.331V242.669L151 311.704V263.915L200.679 235.62V112.38L151 84.085V36.296Z" fill="currentColor" fillOpacity="0.5"/>
                <path d="M28.967 242.669L151 311.704V263.915L101.321 235.62L101.321 112.38L151 84.085V36.296L28.967 105.331V242.669Z" fill="currentColor" fillOpacity="0.75"/>
              </svg>
              <span className="ml-2 text-xl font-bold tracking-wide text-foreground">REPUTABLE</span>
            </a>
          </Link>
        </div>
        
        <div className="flex items-center">
          <button className="mr-4 text-muted-foreground hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="flex items-center cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">JD</div>
            <span className="ml-2 hidden md:block text-foreground">John Doe</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
