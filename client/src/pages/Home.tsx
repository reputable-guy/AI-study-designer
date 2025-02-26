import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  Beaker, 
  FileText, 
  Users, 
  TrendingUp, 
  PlusCircle, 
  BarChart3
} from "lucide-react";

export default function Home() {
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
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Beaker className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-neutral-800 mb-2">No studies yet</h3>
      <p className="text-neutral-500 max-w-md mx-auto mb-6">
        Design your first IRB-ready clinical study in minutes with our AI-powered wizard.
      </p>
      <Link href="/study-designer">
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Your First Study
        </Button>
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
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Hero section */}
          <div className="mb-12 px-4 py-10 bg-white rounded-xl shadow-sm border border-neutral-100">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">
                AI-Driven Scientific Studies for Wellness Brands
              </h1>
              <p className="text-xl text-neutral-500 mb-8">
                Design IRB-ready, compliance-focused clinical studies for your wellness products in minutes.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/study-designer">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Beaker className="h-5 w-5 mr-2" />
                    Design a New Study
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <FileText className="h-5 w-5 mr-2" />
                  View Sample Study
                </Button>
              </div>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Beaker className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-neutral-800 mb-2">AI-Powered Design</h3>
                <p className="text-neutral-500 mb-4">
                  Our AI generates scientifically valid claims, recommends outcome measures, and suggests optimal study designs.
                </p>
                <Button variant="link" className="p-0 h-auto text-primary flex items-center">
                  Learn More <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-neutral-800 mb-2">IRB-Ready Protocols</h3>
                <p className="text-neutral-500 mb-4">
                  Generate complete study protocols that meet IRB submission requirements and comply with regulatory standards.
                </p>
                <Button variant="link" className="p-0 h-auto text-primary flex items-center">
                  Learn More <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-neutral-800 mb-2">Evidence-Based Results</h3>
                <p className="text-neutral-500 mb-4">
                  Create scientific evidence for your product claims with studies that follow rigorous methodologies.
                </p>
                <Button variant="link" className="p-0 h-auto text-primary flex items-center">
                  Learn More <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Studies section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-800">Your Studies</h2>
              <Link href="/study-designer">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Study
                </Button>
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
                      <Card key={study.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-4 md:mb-0">
                              <h3 className="font-medium text-lg text-neutral-800">{study.productName}</h3>
                              {study.refinedClaim ? (
                                <p className="text-sm text-neutral-600 mt-1">{study.refinedClaim}</p>
                              ) : (
                                <p className="text-sm text-neutral-400 italic mt-1">No claim defined yet</p>
                              )}
                              <div className="flex items-center mt-2">
                                <span className="text-xs text-neutral-500">Created {formatDate(study.createdAt)}</span>
                                <span className="mx-2 text-neutral-300">•</span>
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
                                <Button variant="outline" size="sm">
                                  {study.currentStep === 7 ? 'View Study' : 'Continue'}
                                </Button>
                              </Link>
                              {study.currentStep === 7 && (
                                <Button size="sm">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Export
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="draft">
                <div className="space-y-4">
                  {studies.filter(s => s.currentStep < 7).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-500">No draft studies found.</p>
                    </div>
                  ) : (
                    studies.filter(s => s.currentStep < 7).map((study) => (
                      <Card key={study.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-4 md:mb-0">
                              <h3 className="font-medium text-lg text-neutral-800">{study.productName}</h3>
                              {study.refinedClaim ? (
                                <p className="text-sm text-neutral-600 mt-1">{study.refinedClaim}</p>
                              ) : (
                                <p className="text-sm text-neutral-400 italic mt-1">No claim defined yet</p>
                              )}
                              <div className="flex items-center mt-2">
                                <span className="text-xs text-neutral-500">Created {formatDate(study.createdAt)}</span>
                                <span className="mx-2 text-neutral-300">•</span>
                                <span className="text-xs flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
                                  Step {study.currentStep}: {getStepName(study.currentStep)}
                                </span>
                              </div>
                            </div>
                            <Link href={`/study-designer/${study.id}`}>
                              <Button variant="outline" size="sm">
                                Continue
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="complete">
                <div className="space-y-4">
                  {studies.filter(s => s.currentStep === 7).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-500">No completed studies found.</p>
                    </div>
                  ) : (
                    studies.filter(s => s.currentStep === 7).map((study) => (
                      <Card key={study.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between">
                            <div className="mb-4 md:mb-0">
                              <h3 className="font-medium text-lg text-neutral-800">{study.productName}</h3>
                              <p className="text-sm text-neutral-600 mt-1">{study.refinedClaim}</p>
                              <div className="flex items-center mt-2">
                                <span className="text-xs text-neutral-500">Created {formatDate(study.createdAt)}</span>
                                <span className="mx-2 text-neutral-300">•</span>
                                <span className="text-xs flex items-center">
                                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                                  Complete
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Link href={`/study-designer/${study.id}`}>
                                <Button variant="outline" size="sm">
                                  View Study
                                </Button>
                              </Link>
                              <Button size="sm">
                                <FileText className="h-4 w-4 mr-2" />
                                Export
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* CTA section */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-8 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Execute Your Study?</h2>
              <p className="mb-6">
                Take your protocol from design to execution. Our platform handles participant recruitment, compliance tracking, and data analysis.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-neutral-100">
                  <Users className="h-5 w-5 mr-2" />
                  Recruit Participants
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Learn About Analysis
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
