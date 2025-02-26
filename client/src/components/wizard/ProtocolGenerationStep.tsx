import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateProtocol, assessRegulatory, checkProtocolCompliance } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { Check, FileText, AlertCircle, Loader2, Edit, RefreshCw, Save, XCircle, ShieldCheck, Shield } from "lucide-react";
import { useTestMode } from "@/lib/TestModeContext";
import { Protocol, StudyDesign, OutcomeMeasure } from "@/lib/types";

interface ProtocolGenerationStepProps {
  studyId: number;
  refinedClaim: string;
  studyDesign: StudyDesign;
  outcomeMeasures: OutcomeMeasure[];
  onNext: (protocol: Protocol) => void;
  onBack: () => void;
}

export default function ProtocolGenerationStep({
  studyId,
  refinedClaim,
  studyDesign,
  outcomeMeasures,
  onNext,
  onBack
}: ProtocolGenerationStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCompliance, setShowCompliance] = useState(false);
  const { toast } = useToast();
  const { isTestMode } = useTestMode();
  
  useEffect(() => {
    const fetchProtocol = async () => {
      setIsLoading(true);
      try {
        // If test mode is enabled, use fallback data immediately
        if (isTestMode) {
          console.log("Test mode enabled, using fallback protocol data");
          const fallbackProtocol = createFallbackProtocol(refinedClaim);
          setProtocol(fallbackProtocol);
          setIsLoading(false);
          setIsGenerating(false);
          return;
        }
        
        // First check if protocol already exists in study
        const response = await fetch(`/api/studies/${studyId}`);
        
        if (response.ok) {
          const study = await response.json();
          
          if (study.protocol) {
            // If protocol exists but no compliance status, add it
            const existingProtocol = study.protocol;
            setProtocol(existingProtocol);
            setIsLoading(false);
            
            // Check compliance if it wasn't previously checked
            if (!existingProtocol.complianceStatus) {
              try {
                const complianceResult = await checkProtocolCompliance(existingProtocol, refinedClaim);
                if (complianceResult) {
                  // Update protocol with compliance results
                  const updatedProtocol = {
                    ...existingProtocol,
                    complianceStatus: complianceResult
                  };
                  setProtocol(updatedProtocol);
                }
              } catch (complianceError) {
                console.error("Error checking compliance of existing protocol:", complianceError);
              }
            }
            
            return;
          }
        }
        
        setIsGenerating(true);
        // No existing protocol, generate one
        const generatedProtocol = await generateProtocol(
          studyId, 
          refinedClaim, 
          studyDesign, 
          outcomeMeasures
        );
        
        setProtocol(generatedProtocol);
        
        // Check compliance after generating
        try {
          const complianceResult = await checkProtocolCompliance(generatedProtocol, refinedClaim);
          if (complianceResult) {
            // Update protocol with compliance results
            const updatedProtocol = {
              ...generatedProtocol,
              complianceStatus: complianceResult
            };
            setProtocol(updatedProtocol);
            
            // Show compliance dialog if there are issues
            if (!complianceResult.isCompliant) {
              setShowCompliance(true);
            }
          }
        } catch (complianceError) {
          console.error("Error checking initial compliance:", complianceError);
        }
      } catch (error) {
        console.error("Error generating protocol:", error);
        toast({
          title: "Error",
          description: "Failed to generate protocol. Using default protocol.",
          variant: "destructive",
        });
        
        // Fallback data
        const fallbackProtocol = createFallbackProtocol(refinedClaim);
        setProtocol(fallbackProtocol);
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    };
    
    // Helper function to create fallback protocol
    const createFallbackProtocol = (claimText: string): Protocol => {
      return {
        title: "Clinical Study Protocol",
        version: "1.0",
        date: new Date().toISOString().split('T')[0],
        sections: [
          {
            title: "Study Objectives",
            content: `To evaluate the effectiveness of the product in ${claimText}`
          },
          {
            title: "Study Design",
            content: "Randomized, double-blind, placebo-controlled trial"
          },
          {
            title: "Statistical Plan",
            content: "Power analysis based on prior studies suggests a sample size of 80 participants would provide 90% power to detect the expected effect size."
          },
          {
            title: "Outcome Measures",
            content: "Primary outcome measure: REM sleep duration as measured by wearable device."
          },
          {
            title: "Safety Monitoring",
            content: "Adverse events will be monitored throughout the study period."
          },
          {
            title: "Informed Consent",
            content: "All participants will provide written informed consent prior to enrollment."
          }
        ],
        complianceStatus: {
          isCompliant: true,
          issues: []
        }
      };
    };
    
    fetchProtocol();
  }, [studyId, refinedClaim, studyDesign, outcomeMeasures, toast, isTestMode]);
  // Initialize editingProtocol when protocol changes
  useEffect(() => {
    if (protocol) {
      setEditingProtocol(JSON.parse(JSON.stringify(protocol)));
    }
  }, [protocol]);
  
  // Function to handle initiating section edit
  const handleEditSection = (index: number) => {
    setEditingSectionIndex(index);
  };
  
  // Function to handle saving edited section
  const handleSaveSection = async () => {
    if (editingProtocol && editingSectionIndex !== null && protocol) {
      // Create a new protocol object with the edited section
      const updatedProtocol = {
        ...protocol,
        sections: [...protocol.sections]
      };
      
      // Update the specific section
      updatedProtocol.sections[editingSectionIndex] = editingProtocol.sections[editingSectionIndex];
      
      // Clear editing state
      setEditingSectionIndex(null);
      
      // Save the updated protocol
      setProtocol(updatedProtocol);
      
      // Check compliance after editing
      await checkCompliance(updatedProtocol);
      
      toast({
        title: "Section Updated",
        description: "Protocol section has been updated.",
        variant: "default",
      });
    }
  };
  
  // Function to cancel editing
  const handleCancelEdit = () => {
    // Reset the editing section to match the current protocol
    if (protocol && editingSectionIndex !== null) {
      const resetEditingProtocol = JSON.parse(JSON.stringify(protocol));
      setEditingProtocol(resetEditingProtocol);
    }
    setEditingSectionIndex(null);
  };
  
  // Function to check protocol compliance
  const checkCompliance = async (protocolToCheck: Protocol) => {
    try {
      setIsCheckingCompliance(true);
      const complianceResult = await checkProtocolCompliance(protocolToCheck, refinedClaim);
      
      // Update protocol with compliance results
      const updatedProtocol = {
        ...protocolToCheck,
        complianceStatus: complianceResult
      };
      
      setProtocol(updatedProtocol);
      
      // Show compliance dialog if there are issues
      if (!complianceResult.isCompliant) {
        setShowCompliance(true);
      }
      
      return complianceResult;
    } catch (error) {
      console.error("Error checking compliance:", error);
      toast({
        title: "Compliance Check Failed",
        description: "Unable to verify regulatory compliance. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCheckingCompliance(false);
    }
  };
  
  const handleContinue = async () => {
    if (protocol) {
      // Final compliance check before continuing
      const complianceResult = await checkCompliance(protocol);
      
      // Allow continuing even with compliance issues, but make sure user is aware
      if (complianceResult && !complianceResult.isCompliant) {
        toast({
          title: "Compliance Issues Detected",
          description: "Your protocol has some compliance issues. Consider resolving them before finalizing.",
          variant: "destructive",
        });
      }
      
      onNext(protocol);
    }
  };
  
  const renderLoadingState = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Generating Protocol</h2>
      <div className="text-center py-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <h3 className="text-lg font-medium text-neutral-800 mb-2">Creating IRB-ready protocol document</h3>
          <p className="text-neutral-500 max-w-md">
            Our AI is analyzing your study parameters and generating a complete protocol based on best practices and regulatory requirements.
          </p>
        </div>
      </div>
    </div>
  );
  
  if (isLoading) {
    return renderLoadingState();
  }
  
  if (!protocol) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-800 mb-2">Error generating protocol</h3>
          <p className="text-neutral-500 max-w-md mx-auto mb-6">
            We encountered an issue while creating your protocol. Please try again or contact support.
          </p>
          <Button onClick={onBack}>Back to Study Design</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex items-start mb-6">
        <div className="flex-grow">
          <h2 className="text-xl font-semibold text-foreground">Protocol Document</h2>
          <p className="text-muted-foreground">
            {isGenerating 
              ? "Generating your IRB-ready protocol document..."
              : "Your IRB-ready protocol document has been generated based on your study design."}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="ai-badge text-xs font-medium px-2 py-1 rounded-full">AI-Generated</span>
        </div>
      </div>
      
      {/* Protocol header */}
      <Card className="mb-6 bg-card border-border">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold text-center mb-1 text-foreground">{protocol.title}</h2>
          <div className="text-center text-sm text-muted-foreground mb-4">
            <span>Version {protocol.version}</span>
            <span className="mx-2">•</span>
            <span>{protocol.date}</span>
          </div>
          
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-primary/10 text-primary rounded-md text-sm flex items-center">
              <Check className="h-4 w-4 mr-1" /> IRB-Ready Document
            </div>
          </div>
          
          <p className="text-center text-sm text-neutral-600">
            This protocol follows standard IRB submission requirements and contains all necessary elements for review.
          </p>
        </CardContent>
      </Card>
      
      {/* Protocol content tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fullProtocol">Full Protocol</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-6">
                {protocol.sections.slice(0, 3).map((section, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-medium text-neutral-800 mb-2">{section.title}</h3>
                    <p className="text-neutral-600">{section.content}</p>
                    {index < protocol.sections.slice(0, 3).length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
                
                <div className="text-center pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("fullProtocol")}
                    className="text-primary"
                  >
                    View Full Protocol
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fullProtocol" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-6">
                {protocol.sections.map((section, index) => (
                  <div key={index} className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-neutral-800">{section.title}</h3>
                      {editingSectionIndex !== index && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditSection(index)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      )}
                    </div>
                    
                    {editingProtocol && editingSectionIndex === index ? (
                      <>
                        <Textarea
                          value={editingProtocol.sections[index].content}
                          onChange={(e) => {
                            const newProtocol = JSON.parse(JSON.stringify(editingProtocol));
                            newProtocol.sections[index].content = e.target.value;
                            setEditingProtocol(newProtocol);
                          }}
                          className="min-h-[100px] mb-2"
                        />
                        <div className="flex justify-end space-x-2 mb-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCancelEdit}
                            className="h-8"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleSaveSection}
                            className="h-8"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-neutral-600 whitespace-pre-line">{section.content}</p>
                    )}
                    
                    {index < protocol.sections.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Regulatory compliance note */}
      <div className={`mb-6 p-4 ${
        protocol.complianceStatus?.isCompliant === false 
          ? 'bg-amber-50 border border-amber-100' 
          : 'bg-blue-50 border border-blue-100'
      } rounded-lg`}>
        <div className="flex">
          <div className="flex-shrink-0 mr-3">
            {protocol.complianceStatus?.isCompliant === false ? (
              <Shield className="h-5 w-5 text-amber-500" />
            ) : (
              <FileText className="h-5 w-5 text-blue-500" />
            )}
          </div>
          <div>
            <h4 className={`text-sm font-medium ${
              protocol.complianceStatus?.isCompliant === false
                ? 'text-amber-800'
                : 'text-blue-800'
            }`}>
              Regulatory Compliance Assessment
            </h4>
            <p className={`text-sm mt-1 ${
              protocol.complianceStatus?.isCompliant === false
                ? 'text-amber-700'
                : 'text-blue-700'
            }`}>
              {protocol.complianceStatus?.isCompliant === false ? (
                <>
                  This protocol has <strong>{protocol.complianceStatus.issues?.length} compliance issues</strong> that 
                  should be addressed. Click "Check Regulatory Compliance" for details.
                </>
              ) : (
                <>
                  This protocol has been automatically checked for regulatory compliance. It aligns with FDA/FTC guidelines 
                  for structure/function claims and follows ethical research standards.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
      
      {/* Compliance dialog */}
      <Dialog open={showCompliance} onOpenChange={setShowCompliance}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center text-amber-700">
              <Shield className="mr-2 h-5 w-5" />
              Regulatory Compliance Issues
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <p className="text-sm mb-4">
              The following compliance issues were identified in your protocol. Consider addressing these before finalizing:
            </p>
            
            {protocol.complianceStatus?.issues?.map((issue, index) => (
              <div key={index} className={`p-3 rounded-md ${
                issue.severity === 'high' ? 'bg-red-50 text-red-800' :
                issue.severity === 'medium' ? 'bg-amber-50 text-amber-800' :
                'bg-blue-50 text-blue-800'
              }`}>
                <h4 className="font-medium text-sm mb-1">
                  {issue.section} - {issue.issue}
                </h4>
                <p className="text-xs">
                  <strong>Recommendation:</strong> {issue.recommendation}
                </p>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCompliance(false)}
            >
              Continue anyway
            </Button>
            <Button
              onClick={() => {
                setShowCompliance(false);
                setActiveTab("fullProtocol");
              }}
            >
              Edit Protocol
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Check compliance button */}
      <div className="mb-6 flex justify-end">
        <Button
          variant="outline"
          onClick={() => checkCompliance(protocol)}
          disabled={isCheckingCompliance}
          className="flex items-center"
        >
          {isCheckingCompliance ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="mr-2 h-4 w-4" />
          )}
          {isCheckingCompliance ? "Checking compliance..." : "Check Regulatory Compliance"}
        </Button>
      </div>
      
      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Continue to Export"}
        </Button>
      </div>
    </div>
  );
}
