import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTestMode } from "@/lib/TestModeContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ArrowRight, 
  Beaker, 
  FileText, 
  Users, 
  TrendingUp, 
  PlusCircle, 
  BarChart3,
  FlaskConical
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
  
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
        <Beaker className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">No studies yet</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Design your first IRB-ready clinical study in minutes with our AI-powered wizard.
      </p>
      <Link href="/study-designer">
        <button className="btn-reputable px-4 py-2 rounded flex items-center justify-center mx-auto">
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Your First Study
        </button>
      </Link>
    </div>
  );
  
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
          <div className="mb-12 px-4 py-10 bg-card rounded-xl shadow-sm border border-border">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                AI-Driven Scientific Studies for Wellness Brands
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Design IRB-ready, compliance-focused clinical studies for your wellness products in minutes.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/study-designer">
                  <button className="btn-reputable w-full sm:w-auto px-6 py-3 flex items-center justify-center text-base font-medium rounded">
                    <Beaker className="h-5 w-5 mr-2" />
                    Design a New Study
                  </button>
                </Link>
                <button className="btn-outline-reputable w-full sm:w-auto px-6 py-3 flex items-center justify-center text-base font-medium rounded">
                  <FileText className="h-5 w-5 mr-2" />
                  View Sample Study
                </button>
              </div>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-reputable">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Beaker className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">AI-Powered Design</h3>
                <p className="text-muted-foreground mb-4">
                  Our AI generates scientifically valid claims, recommends outcome measures, and suggests optimal study designs.
                </p>
                <button className="p-0 h-auto text-primary flex items-center hover:brightness-110">
                  Learn More <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
            
            <div className="card-reputable">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">IRB-Ready Protocols</h3>
                <p className="text-muted-foreground mb-4">
                  Generate complete study protocols that meet IRB submission requirements and comply with regulatory standards.
                </p>
                <button className="p-0 h-auto text-primary flex items-center hover:brightness-110">
                  Learn More <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
            
            <div className="card-reputable">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Evidence-Based Results</h3>
                <p className="text-muted-foreground mb-4">
                  Create scientific evidence for your product claims with studies that follow rigorous methodologies.
                </p>
                <button className="p-0 h-auto text-primary flex items-center hover:brightness-110">
                  Learn More <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Studies section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Your Studies</h2>
              <Link href="/study-designer">
                <button className="btn-reputable flex items-center px-3 py-2 rounded text-sm font-medium">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Study
                </button>
              </Link>
            </div>
            
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Studies</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
                <TabsTrigger value="complete">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {studies.length === 0 ? (
                  renderEmptyState()
                ) : (
                  <div className="space-y-4">
                    {studies.map((study) => (
                      <div key={study.id} className="card-reputable hover:border-primary/50 transition-all">
                        <div className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-4 md:mb-0">
                              <h3 className="font-medium text-lg text-foreground">{study.productName}</h3>
                              {study.refinedClaim ? (
                                <p className="text-sm text-muted-foreground mt-1">{study.refinedClaim}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground/60 italic mt-1">No claim defined yet</p>
                              )}
                              <div className="flex items-center mt-2">
                                <span className="text-xs text-muted-foreground">Created {formatDate(study.createdAt)}</span>
                                <span className="mx-2 text-muted-foreground/50">•</span>
                                <span className="text-xs flex items-center">
                                  <span className={`w-2 h-2 rounded-full mr-1 ${
                                    study.currentStep === 7 ? 'bg-green-500' : 'bg-amber-500'
                                  }`}></span>
                                  {study.currentStep === 7 ? 'Complete' : `Step ${study.currentStep}: ${getStepName(study.currentStep)}`}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Link href={`/study-designer/${study.id}`}>
                                <button className="btn-outline-reputable px-3 py-1.5 rounded text-sm">
                                  {study.currentStep === 7 ? 'View Study' : 'Continue'}
                                </button>
                              </Link>
                              {study.currentStep === 7 && (
                                <button className="btn-reputable px-3 py-1.5 rounded text-sm flex items-center">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Export
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="draft">
                <div className="space-y-4">
                  {studies.filter(s => s.currentStep < 7).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No draft studies found.</p>
                    </div>
                  ) : (
                    studies.filter(s => s.currentStep < 7).map((study) => (
                      <div key={study.id} className="card-reputable hover:border-primary/50 transition-all">
                        <div className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-4 md:mb-0">
                              <h3 className="font-medium text-lg text-foreground">{study.productName}</h3>
                              {study.refinedClaim ? (
                                <p className="text-sm text-muted-foreground mt-1">{study.refinedClaim}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground/60 italic mt-1">No claim defined yet</p>
                              )}
                              <div className="flex items-center mt-2">
                                <span className="text-xs text-muted-foreground">Created {formatDate(study.createdAt)}</span>
                                <span className="mx-2 text-muted-foreground/50">•</span>
                                <span className="text-xs flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
                                  Step {study.currentStep}: {getStepName(study.currentStep)}
                                </span>
                              </div>
                            </div>
                            <Link href={`/study-designer/${study.id}`}>
                              <button className="btn-outline-reputable px-3 py-1.5 rounded text-sm">
                                Continue
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="complete">
                <div className="space-y-4">
                  {studies.filter(s => s.currentStep === 7).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No completed studies found.</p>
                    </div>
                  ) : (
                    studies.filter(s => s.currentStep === 7).map((study) => (
                      <div key={study.id} className="card-reputable hover:border-primary/50 transition-all">
                        <div className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-4 md:mb-0">
                              <h3 className="font-medium text-lg text-foreground">{study.productName}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{study.refinedClaim}</p>
                              <div className="flex items-center mt-2">
                                <span className="text-xs text-muted-foreground">Created {formatDate(study.createdAt)}</span>
                                <span className="mx-2 text-muted-foreground/50">•</span>
                                <span className="text-xs flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                                  Complete
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Link href={`/study-designer/${study.id}`}>
                                <button className="btn-outline-reputable px-3 py-1.5 rounded text-sm">
                                  View Study
                                </button>
                              </Link>
                              <button className="btn-reputable px-3 py-1.5 rounded text-sm flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                Export
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* CTA section */}
          <div className="bg-primary rounded-xl p-8 text-primary-foreground">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Execute Your Study?</h2>
              <p className="mb-6">
                Take your protocol from design to execution. Our platform handles participant recruitment, compliance tracking, and data analysis.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button className="bg-background text-foreground hover:bg-muted px-6 py-3 rounded flex items-center justify-center text-base font-medium">
                  <Users className="h-5 w-5 mr-2" />
                  Recruit Participants
                </button>
                <button className="border border-background text-background hover:bg-primary/90 px-6 py-3 rounded flex items-center justify-center text-base font-medium">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Learn About Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Developer Test Mode Toggle */}
      <div className="fixed bottom-4 right-4 bg-background p-2 rounded-lg shadow-md border border-border flex items-center space-x-2">
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
