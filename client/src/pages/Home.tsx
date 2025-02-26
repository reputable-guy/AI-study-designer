import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTestMode } from "@/lib/TestModeContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Users, 
  PlusCircle, 
  BarChart3,
  FlaskConical,
  Moon,
  Activity,
  Clock
} from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  const { isTestMode, setTestMode } = useTestMode();
  const [studies, setStudies] = useState([
    {
      id: 1,
      productName: "MagSleep Premium",
      refinedClaim: "Daily consumption of 300mg magnesium bisglycinate increases REM sleep duration by 15-20%",
      currentStep: 7,
      createdAt: "2023-10-15T14:30:00Z"
    },
    {
      id: 2,
      productName: "Focus Blend",
      refinedClaim: null,
      currentStep: 1,
      createdAt: "2023-10-18T09:15:00Z"
    }
  ]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  const getStepName = (step: number) => {
    const steps = [
      "Input", "Refine", "Evidence", "Outcomes", 
      "Design", "Protocol", "Export"
    ];
    return steps[step - 1] || "Unknown";
  };
  
  // Handle toggling test mode
  const handleTestModeToggle = (checked: boolean) => {
    setTestMode(checked);
    
    // Force reload to apply the changes throughout the app
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Hero section */}
          <div className="mb-12">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Studies
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Design and manage your clinical studies for wellness products
              </p>
              <div className="flex flex-row justify-start gap-4">
                <Link href="/study-designer">
                  <Button size="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Experiment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Key metrics */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-card hover:bg-card/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">Average HRV</span>
                  <div className="flex items-center">
                    <span className="text-primary text-2xl font-medium mr-2">4.4%</span>
                    <span className="text-amber-500 text-xs">↓</span>
                  </div>
                  <div className="w-full h-1 bg-secondary mt-2 relative">
                    <div className="absolute h-full w-2/5 bg-amber-500"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card hover:bg-card/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">Time Awake</span>
                  <div className="flex items-center">
                    <span className="text-primary text-2xl font-medium mr-2">4.18%</span>
                    <span className="text-amber-500 text-xs">↓</span>
                  </div>
                  <div className="w-full h-1 bg-secondary mt-2 relative">
                    <div className="absolute h-full w-2/5 bg-amber-500"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card hover:bg-card/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">REM Sleep</span>
                  <div className="flex items-center">
                    <span className="text-primary text-2xl font-medium mr-2">1.64%</span>
                    <span className="text-primary text-xs">↑</span>
                  </div>
                  <div className="w-full h-1 bg-secondary mt-2 relative">
                    <div className="absolute h-full w-1/4 bg-primary"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card hover:bg-card/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">Lowest Heart Rate</span>
                  <div className="flex items-center">
                    <span className="text-primary text-2xl font-medium mr-2">0.87%</span>
                    <span className="text-primary text-xs">↑</span>
                  </div>
                  <div className="w-full h-1 bg-secondary mt-2 relative">
                    <div className="absolute h-full w-1/6 bg-primary"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card hover:bg-card/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">Deep Sleep</span>
                  <div className="flex items-center">
                    <span className="text-primary text-2xl font-medium mr-2">0.69%</span>
                    <span className="text-primary text-xs">↑</span>
                  </div>
                  <div className="w-full h-1 bg-secondary mt-2 relative">
                    <div className="absolute h-full w-1/6 bg-primary"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Studies section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Active</h2>
              <Link href="/study-designer">
                <Button variant="outline" className="border-primary text-primary hover:bg-card hover:text-primary">
                  MANAGE
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {studies.map((study, index) => (
                <Card key={study.id} className="bg-card hover:bg-card/80 transition-colors border-0">
                  <CardContent className="p-4">
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between">
                        <div className="mb-2">
                          {index === 0 && (
                            <div className="flex items-center mb-1">
                              <Moon className="h-4 w-4 text-primary mr-1" />
                              <span className="text-sm text-foreground font-medium">
                                {study.productName}
                              </span>
                            </div>
                          )}
                          {index === 1 && (
                            <div className="flex items-center mb-1">
                              <Moon className="h-4 w-4 text-primary mr-1" />
                              <span className="text-sm text-foreground font-medium">
                                S-Sleep Supplement
                              </span>
                            </div>
                          )}
                          {index === 0 && (
                            <div className="inline-block text-xs px-2 py-0.5 bg-primary/30 text-primary rounded-full">
                              Live
                            </div>
                          )}
                          {index === 1 && (
                            <div className="inline-block text-xs px-2 py-0.5 bg-primary/30 text-primary rounded-full">
                              Live
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="inline-flex items-center">
                            <div className="flex -space-x-2">
                              <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white font-medium border border-card">JP</div>
                              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white font-medium border border-card">PO</div>
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white font-medium border border-card">DM</div>
                            </div>
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-center">
                        <Button 
                          variant="outline" 
                          className="border-primary text-primary hover:bg-card hover:text-primary w-full"
                        >
                          MANAGE
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="bg-card hover:bg-card/80 transition-colors border-0">
                <CardContent className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between">
                      <div className="mb-2">
                        <div className="flex items-center mb-1">
                          <Activity className="h-4 w-4 text-muted-foreground mr-1" />
                          <span className="text-sm text-muted-foreground font-medium">
                            ShiftWave
                          </span>
                        </div>
                        <div className="inline-block text-xs px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">
                          Draft
                        </div>
                      </div>
                      <div>
                        <span className="inline-flex items-center">
                          <div className="flex -space-x-2">
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-medium border border-card">JP</div>
                            <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] text-white font-medium border border-card">MO</div>
                          </div>
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-center">
                      <Button 
                        variant="outline" 
                        className="border-primary text-primary hover:bg-card hover:text-primary w-full"
                      >
                        MANAGE
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* CTA section */}
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-8 text-primary-foreground mt-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Execute Your Study?</h2>
              <p className="mb-6">
                Take your protocol from design to execution. Our platform handles participant recruitment, compliance tracking, and data analysis.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="secondary" size="default" className="bg-card text-foreground hover:bg-card/90">
                  <Users className="h-4 w-4 mr-2" />
                  Recruit Participants
                </Button>
                <Button variant="outline" size="default" className="border-card/70 text-foreground hover:bg-card/30">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Learn About Analysis
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Developer Test Mode Toggle */}
      <div className="fixed bottom-4 right-4 bg-card p-2 rounded-lg shadow-md border border-border flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <Switch 
            id="test-mode" 
            checked={isTestMode} 
            onCheckedChange={handleTestModeToggle}
          />
          <Label htmlFor="test-mode" className="text-xs flex items-center text-foreground">
            <FlaskConical className="h-4 w-4 mr-1 text-primary" />
            Test Mode
          </Label>
        </div>
        {isTestMode && (
          <span className="bg-primary/20 text-primary text-xs rounded px-1 py-0.5">ON</span>
        )}
      </div>
    </div>
  );
}
