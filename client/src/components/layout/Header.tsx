import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center">
              <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
                <path d="M6 12L10 16L18 8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="ml-2 text-lg font-semibold text-white">REPUTABLE</span>
            </a>
          </Link>
        </div>
        
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2 text-primary border border-border rounded-md px-3 py-1.5 text-sm font-medium hover:bg-secondary"
          >
            Export
          </Button>
          <div className="flex items-center cursor-pointer ml-4">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-medium">JD</div>
          </div>
        </div>
      </div>
    </header>
  );
}
