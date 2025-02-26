import { useState, useEffect } from "react";
import { useParams } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProgressIndicator from "@/components/wizard/ProgressIndicator";
import QuickStartStep from "@/components/wizard/QuickStartStep";
import ClaimRefinementStep from "@/components/wizard/ClaimRefinementStepNew";
import LiteratureReviewStep from "@/components/wizard/LiteratureReviewStep";
import OutcomeSelectionStep from "@/components/wizard/OutcomeSelectionStep";
import StudyDesignStep from "@/components/wizard/StudyDesignStep";
import ProtocolGenerationStep from "@/components/wizard/ProtocolGenerationStep";
import ExportStep from "@/components/wizard/ExportStep";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function StudyDesigner() {
  const { id } = useParams();
  const studyId = id ? parseInt(id) : null;
  const { toast } = useToast();
  
  // Define a type for our study data
  interface StudyDataType {
    id: number | null;
    userId: number;
    productName: string;
    originalClaim: string;
    websiteUrl?: string;
    ingredients?: string;
    refinedClaim: string | null;
    currentStep: number;
    outcomeMeasures: any[] | null;
    studyDesign: any | null;
    protocol: any | null;
  }

  const [currentStep, setCurrentStep] = useState(1);
  const [studyData, setStudyData] = useState<StudyDataType>({
    id: studyId, // Use the studyId from params if available
    userId: 1, // Assume user is logged in with ID 1
    productName: "",
    originalClaim: "",
    websiteUrl: "",
    ingredients: "",
    refinedClaim: null,
    currentStep: 1,
    outcomeMeasures: null,
    studyDesign: null,
    protocol: null
  });
  
  // Fetch study data if ID is provided
  const { data: fetchedStudy, isLoading, error } = useQuery({
    queryKey: [`/api/studies/${studyId}`],
    enabled: !!studyId,
  });
  
  useEffect(() => {
    if (fetchedStudy) {
      setStudyData(fetchedStudy);
      setCurrentStep(fetchedStudy.currentStep);
    }
  }, [fetchedStudy]);
  
  const stepNames = [
    "Input",
    "Refine",
    "Evidence",
    "Outcomes",
    "Design",
    "Protocol",
    "Export"
  ];

  const handleQuickStartNext = (data: any) => {
    // Ensure we're using the ID returned from the backend
    setStudyData((prev: StudyDataType) => ({
      ...prev,
      ...data,
      id: data.id || studyId || prev.id
    }));
    
    // Move to the next step
    setCurrentStep(2);
  };
  
  const handleClaimRefinementNext = (refinedClaim: string) => {
    setStudyData((prev: StudyDataType) => ({
      ...prev,
      refinedClaim
    }));
    setCurrentStep(3);
  };
  
  const handleLiteratureReviewNext = () => {
    setCurrentStep(4);
  };
  
  const handleOutcomeSelectionNext = () => {
    setCurrentStep(5);
  };
  
  const handleStudyDesignNext = () => {
    setCurrentStep(6);
  };
  
  const handleProtocolNext = (protocol: any) => {
    setStudyData((prev: StudyDataType) => ({
      ...prev,
      protocol
    }));
    setCurrentStep(7);
  };
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <QuickStartStep
            onNext={handleQuickStartNext}
            defaultValues={{
              productName: studyData.productName,
              originalClaim: studyData.originalClaim,
              websiteUrl: studyData.websiteUrl,
              ingredients: studyData.ingredients
            }}
          />
        );
      case 2:
        return (
          <ClaimRefinementStep
            studyId={studyData.id}
            originalClaim={studyData.originalClaim}
            websiteUrl={studyData.websiteUrl}
            ingredients={studyData.ingredients}
            onNext={handleClaimRefinementNext}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <LiteratureReviewStep
            studyId={studyData.id}
            refinedClaim={studyData.refinedClaim}
            onNext={handleLiteratureReviewNext}
            onBack={() => setCurrentStep(2)}
          />
        );
      case 4:
        return (
          <OutcomeSelectionStep
            studyId={studyData.id}
            refinedClaim={studyData.refinedClaim}
            onNext={handleOutcomeSelectionNext}
            onBack={() => setCurrentStep(3)}
          />
        );
      case 5:
        return (
          <StudyDesignStep
            studyId={studyData.id}
            refinedClaim={studyData.refinedClaim}
            outcomeMeasures={studyData.outcomeMeasures || []}
            onNext={handleStudyDesignNext}
            onBack={() => setCurrentStep(4)}
          />
        );
      case 6:
        return (
          <ProtocolGenerationStep
            studyId={studyData.id}
            refinedClaim={studyData.refinedClaim}
            studyDesign={studyData.studyDesign}
            outcomeMeasures={studyData.outcomeMeasures || []}
            onNext={handleProtocolNext}
            onBack={() => setCurrentStep(5)}
          />
        );
      case 7:
        return (
          <ExportStep
            studyId={studyData.id}
            protocol={studyData.protocol}
            onBack={() => setCurrentStep(6)}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };
  
  if (studyId && isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Loading study...</h2>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (studyId && error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-red-600 mb-4">Error Loading Study</h2>
              <p className="text-neutral-600 mb-4">
                We couldn't load the requested study. It may have been deleted or you may not have permission to view it.
              </p>
              <p className="text-sm text-neutral-500">
                Error details: {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">
          {/* Page title and description */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-neutral-800">AI-Driven Study Designer</h1>
            <p className="mt-2 text-neutral-500 max-w-2xl mx-auto">
              Design IRB-ready, compliance-focused clinical studies for your wellness products in minutes.
            </p>
          </div>
          
          {/* Progress indicator */}
          <ProgressIndicator 
            currentStep={currentStep} 
            totalSteps={7} 
            stepNames={stepNames}
          />
          
          {/* Wizard content container */}
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden">
            {/* Step tabs - visible on larger screens */}
            <div className="hidden md:flex border-b border-neutral-100">
              {stepNames.map((step, index) => (
                <button 
                  key={index}
                  className={`px-4 py-3 text-sm font-medium ${
                    index + 1 === currentStep 
                      ? 'border-b-2 border-primary text-primary' 
                      : index + 1 < currentStep
                        ? 'text-neutral-500'
                        : 'text-neutral-400'
                  }`}
                >
                  {index + 1}. {step}
                </button>
              ))}
            </div>
            
            {/* Current step content */}
            {renderCurrentStep()}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
