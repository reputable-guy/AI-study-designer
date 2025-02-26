import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { performLiteratureReview } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronDown, ChevronUp, Search, Info } from "lucide-react";
import { useTestMode } from "@/lib/TestModeContext";
import { getFallbackLiteratureReviews } from "@/lib/errorHandling";

interface StudyEvidence {
  id?: number;
  studyId?: number;
  title: string;
  authors: string;
  journal: string;
  year: number;
  sampleSize: number;
  effectSize: string;
  dosage: string;
  duration: string;
  evidenceGrade: "High" | "Moderate" | "Low";
  summary: string;
  details?: string;
  url?: string;
}

interface LiteratureReviewStepProps {
  studyId: number;
  refinedClaim: string;
  onNext: () => void;
  onBack: () => void;
}

export default function LiteratureReviewStep({
  studyId,
  refinedClaim,
  onNext,
  onBack
}: LiteratureReviewStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [studies, setStudies] = useState<StudyEvidence[]>([]);
  const [filteredStudies, setFilteredStudies] = useState<StudyEvidence[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStudyId, setExpandedStudyId] = useState<number | null>(null);
  const [aiQuery, setAiQuery] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All Studies");
  const { toast } = useToast();
  const { isTestMode } = useTestMode();
  
  useEffect(() => {
    const fetchLiteratureReviews = async () => {
      setIsLoading(true);
      try {
        // First try to get literature reviews from the API
        const response = await fetch(`/api/literature-reviews/study/${studyId}`);
        
        if (response.ok) {
          const reviews = await response.json();
          
          if (reviews && reviews.length > 0) {
            setStudies(reviews);
            setFilteredStudies(reviews);
            setIsLoading(false);
            return;
          }
        }
        
        // If no reviews found, generate new ones using OpenAI
        const generatedReviews = await performLiteratureReview(refinedClaim);
        
        setStudies(generatedReviews);
        setFilteredStudies(generatedReviews);
      } catch (error) {
        console.error("Error fetching literature reviews:", error);
        toast({
          title: "Error",
          description: "Failed to fetch literature reviews. Using fallback data.",
          variant: "destructive",
        });
        
        // Fallback data
        const fallbackStudies = [
          {
            id: 1,
            studyId: 1,
            title: "Effects of magnesium supplementation on sleep quality",
            authors: "Nielsen, FH. et al.",
            journal: "Journal of Sleep Research",
            year: 2018,
            sampleSize: 126,
            effectSize: "18.7% increase in REM",
            dosage: "320mg daily",
            duration: "8 weeks",
            evidenceGrade: "High" as const,
            summary: "Double-blind, placebo-controlled trial examining the effects of magnesium supplementation on sleep architecture in adults with mild insomnia.",
            details: "Significant improvements were observed in REM sleep duration, sleep efficiency, and subjective sleep quality. Key findings: Magnesium supplementation significantly increased REM sleep percentage compared to placebo (p<0.01). Secondary outcomes included reduced sleep onset latency and improved sleep efficiency."
          },
          {
            id: 2,
            studyId: 1,
            title: "Magnesium glycinate and sleep architecture: A wearable study",
            authors: "Johnson, KL. et al.",
            journal: "Sleep Medicine",
            year: 2020,
            sampleSize: 48,
            effectSize: "14.2% increase in REM",
            dosage: "300mg daily",
            duration: "4 weeks",
            evidenceGrade: "Moderate" as const,
            summary: "Study using consumer wearable devices to track sleep changes with magnesium supplementation."
          },
          {
            id: 3,
            studyId: 1,
            title: "Effects of mineral supplementation on sleep parameters",
            authors: "Tanaka, H. et al.",
            journal: "Sleep Science",
            year: 2019,
            sampleSize: 22,
            effectSize: "9.8% increase in REM",
            dosage: "250mg daily",
            duration: "3 weeks",
            evidenceGrade: "Low" as const,
            summary: "Small pilot study on the effects of various minerals on sleep."
          }
        ];
        
        setStudies(fallbackStudies);
        setFilteredStudies(fallbackStudies);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLiteratureReviews();
  }, [studyId, refinedClaim, toast]);
  
  useEffect(() => {
    // Filter studies based on search term
    if (searchTerm.trim() === "") {
      setFilteredStudies(studies);
      return;
    }
    
    const filtered = studies.filter(
      (study) =>
        study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        study.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
        study.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredStudies(filtered);
  }, [searchTerm, studies]);
  
  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    
    setIsAiProcessing(true);
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "AI Assistant",
        description: "I found 2 studies specifically measuring REM sleep in women over 40. The effect sizes were slightly higher in this demographic (20.3% vs. 18.7% overall increase).",
      });
      
      setAiQuery("");
    } catch (error) {
      console.error("Error processing AI query:", error);
      toast({
        title: "Error",
        description: "Failed to process your query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAiProcessing(false);
    }
  };
  
  const toggleStudyDetails = (id: number | undefined) => {
    if (id === undefined) return;
    console.log('Toggling study details for ID:', id, 'Current expanded ID:', expandedStudyId);
    setExpandedStudyId(expandedStudyId === id ? null : id);
  };
  
  const applyFilter = (filter: string) => {
    setActiveFilter(filter);
    
    if (filter === "All Studies") {
      setFilteredStudies(studies);
    } else if (filter === "Humans Only") {
      // For demo, just filter out the last study
      setFilteredStudies(studies.filter((_, index) => index !== studies.length - 1));
    } else if (filter === "High Evidence") {
      setFilteredStudies(studies.filter(s => s.evidenceGrade === "High"));
    }
  };
  
  const getEvidenceClass = (grade: string) => {
    switch (grade) {
      case "High":
        return "evidence-high";
      case "Moderate":
        return "evidence-moderate";
      case "Low":
        return "evidence-low";
      default:
        return "";
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex items-start mb-6">
        <div className="flex-grow">
          <h2 className="text-xl font-semibold">Literature Review</h2>
          <p className="text-neutral-500">We've analyzed scientific evidence related to your claim.</p>
        </div>
        <div className="flex-shrink-0">
          <span className="ai-badge text-xs font-medium text-white px-2 py-1 rounded-full">AI-Powered</span>
        </div>
      </div>

      {/* Selected claim display */}
      <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
        <h3 className="text-sm font-medium text-neutral-500 mb-2">Your selected claim:</h3>
        <p className="text-neutral-800 font-medium">{refinedClaim}</p>
      </div>

      {/* Search and filter controls */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-grow">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-neutral-400" />
              </span>
              <Input
                type="text"
                className="pl-10"
                placeholder="Search the literature..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
            <Button
              variant={activeFilter === "All Studies" ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap"
              onClick={() => applyFilter("All Studies")}
            >
              All Studies <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            <Button
              variant={activeFilter === "Humans Only" ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap"
              onClick={() => applyFilter("Humans Only")}
            >
              Humans Only <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            <Button
              variant={activeFilter === "High Evidence" ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap"
              onClick={() => applyFilter("High Evidence")}
            >
              High Evidence <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* AI Query Assistant */}
        <div className="mt-4 flex items-center border border-neutral-200 rounded-md p-2 bg-neutral-50">
          <div className="text-primary-500 mx-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <Input
            type="text"
            className="flex-grow border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Ask AI a question about the literature (e.g., 'Did any studies measure REM sleep in women?')"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiQuery()}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-500"
            onClick={handleAiQuery}
            disabled={isAiProcessing || !aiQuery.trim()}
          >
            {isAiProcessing ? "Processing..." : "Ask"}
          </Button>
        </div>
      </div>

      {/* Study cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white border border-neutral-100 rounded-lg shadow-sm animate-pulse">
              <div className="flex justify-between">
                <div className="h-6 bg-neutral-200 rounded w-2/3 mb-2"></div>
                <div className="h-6 bg-neutral-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="h-16 bg-neutral-200 rounded"></div>
                <div className="h-16 bg-neutral-200 rounded"></div>
                <div className="h-16 bg-neutral-200 rounded"></div>
                <div className="h-16 bg-neutral-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStudies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500">No studies found matching your search criteria.</p>
            </div>
          ) : (
            filteredStudies.map((study) => (
              <Card 
                key={study.id} 
                className={`${getEvidenceClass(study.evidenceGrade)} border-l-[3px] shadow-sm hover:shadow-md transition-shadow`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-neutral-800">{study.title}</h3>
                    <div 
                      className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                        study.evidenceGrade === "High" 
                          ? "bg-green-100 text-green-600" 
                          : study.evidenceGrade === "Moderate"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-red-100 text-red-600"
                      }`}
                    >
                      {study.evidenceGrade} Evidence
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">{study.authors} {study.journal} ({study.year})</p>
                  
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-neutral-50 p-2 rounded">
                      <p className="text-xs text-neutral-500">Sample Size</p>
                      <p className="text-sm font-medium">{study.sampleSize} participants</p>
                    </div>
                    <div className="bg-neutral-50 p-2 rounded">
                      <p className="text-xs text-neutral-500">Effect Size</p>
                      <p className="text-sm font-medium">{study.effectSize}</p>
                    </div>
                    <div className="bg-neutral-50 p-2 rounded">
                      <p className="text-xs text-neutral-500">Dosage</p>
                      <p className="text-sm font-medium">{study.dosage}</p>
                    </div>
                    <div className="bg-neutral-50 p-2 rounded">
                      <p className="text-xs text-neutral-500">Duration</p>
                      <p className="text-sm font-medium">{study.duration}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary-500 p-0 h-auto font-medium"
                      onClick={() => toggleStudyDetails(study.id || 0)}
                    >
                      {expandedStudyId === study.id ? "Hide details" : "Show details"}
                      {expandedStudyId === study.id ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </Button>
                    
                    {expandedStudyId === study.id && (
                      <div className="mt-3 text-sm text-neutral-600">
                        <p>{study.summary}</p>
                        {study.details && <p className="mt-2">{study.details}</p>}
                        {!study.details && <p className="mt-2">No additional details available for this study.</p>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
      
      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Back
        </Button>
        <Button onClick={onNext}>
          Continue to Outcome Selection
        </Button>
      </div>
    </div>
  );
}
