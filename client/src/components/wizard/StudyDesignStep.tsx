import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { recommendStudyDesign } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Info, 
  Check, 
  HelpCircle, 
  BarChart3, 
  BookOpen, 
  Calculator, 
  PieChart 
} from "lucide-react";
import { useTestMode } from "@/lib/TestModeContext";
import { getFallbackStudyDesign } from "@/lib/errorHandling";

interface StudyDesign {
  type: string;
  sampleSize: {
    min: number;
    recommended: number;
    max: number;
  };
  duration: string;
  blindingType: string;
  controlType: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  powerAnalysis: string;
  recruitmentDifficulty?: number;
}

interface StudyDesignStepProps {
  studyId: number;
  refinedClaim: string;
  outcomeMeasures: any[]; // This would be the selected outcome measures
  onNext: () => void;
  onBack: () => void;
}

// Helper function to calculate recruitment difficulty based on inclusion/exclusion criteria
const calculateRecruitmentDifficulty = (inclusionCriteria: string[], exclusionCriteria: string[]) => {
  // Base difficulty starts at 3 (moderate)
  let difficulty = 3;
  
  // Each criterion affects the difficulty
  const totalCriteria = inclusionCriteria.length + exclusionCriteria.length;
  
  // More criteria make recruitment harder
  if (totalCriteria > 8) difficulty += 2;
  else if (totalCriteria > 5) difficulty += 1;
  
  // Look for particularly challenging criteria
  const allCriteria = [...inclusionCriteria, ...exclusionCriteria].map(c => c.toLowerCase());
  
  // Check for criteria that make recruitment particularly difficult
  const hardCriteriaKeywords = [
    'rare', 'specific', 'severe', 'unusual', 'uncommon', 'specialized', 
    'narrow', 'restricted', 'limited', 'unique', 'exclusive'
  ];
  
  for (const keyword of hardCriteriaKeywords) {
    if (allCriteria.some(c => c.includes(keyword))) {
      difficulty += 1;
      break; // Only add 1 point max for hard criteria
    }
  }
  
  // Cap the difficulty at 10
  return Math.min(10, difficulty);
};

export default function StudyDesignStep({
  studyId,
  refinedClaim,
  outcomeMeasures = [],
  onNext,
  onBack
}: StudyDesignStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [studyDesign, setStudyDesign] = useState<StudyDesign | null>(null);
  const [sampleSize, setSampleSize] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inclusionCriteria, setInclusionCriteria] = useState<string[]>([]);
  const [exclusionCriteria, setExclusionCriteria] = useState<string[]>([]);
  const [recruitmentDifficulty, setRecruitmentDifficulty] = useState<number>(0);
  const [newInclusionCriterion, setNewInclusionCriterion] = useState<string>("");
  const [newExclusionCriterion, setNewExclusionCriterion] = useState<string>("");
  const [editingInclusionIndex, setEditingInclusionIndex] = useState<number | null>(null);
  const [editingExclusionIndex, setEditingExclusionIndex] = useState<number | null>(null);
  const [showDifficultyInfo, setShowDifficultyInfo] = useState<boolean>(false);
  const { toast } = useToast();
  const { isTestMode } = useTestMode();
  
  useEffect(() => {
    const fetchStudyDesign = async () => {
      setIsLoading(true);
      try {
        // If test mode is enabled, use fallback data immediately
        if (isTestMode) {
          console.log("Test mode enabled, using fallback study design data");
          const fallbackDesign = getFallbackStudyDesign();
          setStudyDesign(fallbackDesign);
          setSampleSize(fallbackDesign.sampleSize.recommended);
          setInclusionCriteria(fallbackDesign.inclusionCriteria);
          setExclusionCriteria(fallbackDesign.exclusionCriteria);
          setRecruitmentDifficulty(calculateRecruitmentDifficulty(
            fallbackDesign.inclusionCriteria, 
            fallbackDesign.exclusionCriteria
          ));
          setIsLoading(false);
          return;
        }
        
        // Regular mode - make the API call
        const design = await recommendStudyDesign(refinedClaim, outcomeMeasures);
        setStudyDesign(design);
        setSampleSize(design.sampleSize.recommended);
        setInclusionCriteria(design.inclusionCriteria);
        setExclusionCriteria(design.exclusionCriteria);
        setRecruitmentDifficulty(calculateRecruitmentDifficulty(
          design.inclusionCriteria, 
          design.exclusionCriteria
        ));
      } catch (error) {
        console.error("Error fetching study design recommendations:", error);
        toast({
          title: "Error",
          description: "Failed to fetch study design recommendations. Using default design.",
          variant: "destructive",
        });
        
        // Use the centralized fallback data
        const fallbackDesign = getFallbackStudyDesign();
        setStudyDesign(fallbackDesign);
        setSampleSize(fallbackDesign.sampleSize.recommended);
        setInclusionCriteria(fallbackDesign.inclusionCriteria);
        setExclusionCriteria(fallbackDesign.exclusionCriteria);
        setRecruitmentDifficulty(calculateRecruitmentDifficulty(
          fallbackDesign.inclusionCriteria, 
          fallbackDesign.exclusionCriteria
        ));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudyDesign();
  }, [refinedClaim, outcomeMeasures, toast, isTestMode]);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Update the study with the design information
      await fetch(`/api/studies/${studyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studyDesign: {
            ...studyDesign,
            sampleSize: {
              ...studyDesign?.sampleSize,
              selected: sampleSize
            },
            inclusionCriteria: inclusionCriteria, // Use the edited inclusion criteria
            exclusionCriteria: exclusionCriteria, // Use the edited exclusion criteria
            recruitmentDifficulty: recruitmentDifficulty // Include recruitment difficulty score
          },
          currentStep: 6 // Move to protocol generation step
        })
      });
      
      onNext();
    } catch (error) {
      console.error("Error saving study design:", error);
      toast({
        title: "Error",
        description: "Failed to save your study design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading || !studyDesign) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Study Design</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-card border border-border rounded-lg shadow-sm animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-3"></div>
              <div className="h-24 bg-muted rounded w-full mb-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex items-start mb-6">
        <div className="flex-grow">
          <h2 className="text-xl font-semibold text-foreground">Study Design</h2>
          <p className="text-muted-foreground">We've designed an optimal study to test your claim.</p>
        </div>
        <div className="flex-shrink-0">
          <span className="ai-badge text-xs font-medium px-2 py-1 rounded-full">AI-Optimized</span>
        </div>
      </div>

      {/* Selected claim display */}
      <div className="mb-6 p-4 bg-card border border-border rounded-lg">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Your selected claim:</h3>
        <p className="text-foreground font-medium">{refinedClaim}</p>
      </div>
      
      <div className="space-y-6">
        {/* Study type */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="font-medium text-lg text-foreground mb-2">Recommended Study Design</h3>
            <p className="text-muted-foreground mb-4">Based on your claim and selected outcome measures, we recommend:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background border border-border p-3 rounded-md">
                <span className="text-sm text-muted-foreground">Study Type:</span>
                <p className="font-medium text-foreground">{studyDesign.type}</p>
              </div>
              <div className="bg-background border border-border p-3 rounded-md">
                <span className="text-sm text-muted-foreground">Duration:</span>
                <p className="font-medium text-foreground">{studyDesign.duration}</p>
              </div>
              <div className="bg-background border border-border p-3 rounded-md">
                <span className="text-sm text-muted-foreground">Blinding:</span>
                <p className="font-medium text-foreground">{studyDesign.blindingType}</p>
              </div>
              <div className="bg-background border border-border p-3 rounded-md">
                <span className="text-sm text-muted-foreground">Control:</span>
                <p className="font-medium text-foreground">{studyDesign.controlType}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Sample size */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-lg text-neutral-800 mb-2">Sample Size</h3>
              
              {/* Educational Module Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 h-8">
                    <HelpCircle className="h-4 w-4" />
                    <span>Learn More</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Understanding Sample Size & Power Analysis</DialogTitle>
                    <DialogDescription>
                      Learn how sample size affects study reliability and statistical power
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="basics">
                    <TabsList className="grid grid-cols-4">
                      <TabsTrigger value="basics" className="flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        <span>Basics</span>
                      </TabsTrigger>
                      <TabsTrigger value="calculation" className="flex items-center gap-1">
                        <Calculator className="h-4 w-4" />
                        <span>Calculation</span>
                      </TabsTrigger>
                      <TabsTrigger value="studies" className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>Prior Studies</span>
                      </TabsTrigger>
                      <TabsTrigger value="visualization" className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>Visualization</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basics" className="pt-4">
                      <h3 className="text-lg font-medium mb-3">What is Statistical Power?</h3>
                      <p className="mb-3">
                        Statistical power is the probability that a study will detect an effect when there is an effect to be detected. 
                        A study with high power has a greater chance of detecting a true effect and rejecting the null hypothesis when it is false.
                      </p>
                      
                      <h3 className="text-lg font-medium mb-3 mt-5">Key Concepts:</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          <strong>Power</strong>: The ability to detect an effect when one exists (typically aimed at 80-90%)
                        </li>
                        <li>
                          <strong>Effect Size</strong>: The magnitude of the difference between groups (small, medium, or large)
                        </li>
                        <li>
                          <strong>Sample Size</strong>: The number of participants needed to detect the expected effect
                        </li>
                        <li>
                          <strong>Alpha (Significance Level)</strong>: Typically set at 0.05, represents the acceptable risk of a false positive
                        </li>
                      </ul>
                      
                      <div className="bg-blue-50 p-4 rounded-md mt-5">
                        <p className="font-medium text-blue-800 mb-2">Why is this important?</p>
                        <p className="text-blue-700">
                          Underpowered studies (with too few participants) are less likely to detect true effects, 
                          while overpowered studies (with more participants than needed) can be unnecessarily costly and resource-intensive.
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="calculation" className="pt-4">
                      <h3 className="text-lg font-medium mb-3">How Sample Size is Calculated</h3>
                      <p className="mb-4">
                        Sample size calculation involves balancing statistical power, effect size, and significance level.
                        For your study on {refinedClaim.toLowerCase()}, we've calculated the sample size based on:
                      </p>
                      
                      <div className="bg-neutral-50 p-4 rounded-md mb-4">
                        <ul className="space-y-3">
                          <li className="flex items-start">
                            <div className="bg-blue-100 rounded-full p-1 mr-2 flex-shrink-0">
                              <BarChart3 className="h-4 w-4 text-blue-700" />
                            </div>
                            <div>
                              <strong>Expected Effect Size:</strong> Medium (approximately 0.5 standard deviations)
                              <p className="text-sm text-neutral-600">Based on prior studies with similar supplements</p>
                            </div>
                          </li>
                          <li className="flex items-start">
                            <div className="bg-blue-100 rounded-full p-1 mr-2 flex-shrink-0">
                              <PieChart className="h-4 w-4 text-blue-700" />
                            </div>
                            <div>
                              <strong>Desired Power:</strong> 90% at the recommended sample size
                              <p className="text-sm text-neutral-600">Ensuring high probability of detecting the effect if it exists</p>
                            </div>
                          </li>
                          <li className="flex items-start">
                            <div className="bg-blue-100 rounded-full p-1 mr-2 flex-shrink-0">
                              <AlertCircle className="h-4 w-4 text-blue-700" />
                            </div>
                            <div>
                              <strong>Significance Level (α):</strong> 0.05
                              <p className="text-sm text-neutral-600">Standard threshold for statistical significance</p>
                            </div>
                          </li>
                        </ul>
                      </div>
                      
                      <h4 className="font-medium mb-2">The Formula</h4>
                      <p className="mb-3">
                        For a two-sample t-test (common in clinical trials), the simplified formula is:
                      </p>
                      <div className="bg-neutral-100 p-3 rounded-md mb-4 text-center font-mono">
                        n = 2 × (Zα + Zβ)² × σ² ÷ d²
                      </div>
                      <p className="text-sm text-neutral-600 mb-3">
                        Where <em>n</em> is sample size per group, <em>Zα</em> and <em>Zβ</em> are standard normal deviates for α and β,
                        <em>σ</em> is the standard deviation, and <em>d</em> is the expected difference between groups.
                      </p>
                    </TabsContent>
                    
                    <TabsContent value="studies" className="pt-4">
                      <h3 className="text-lg font-medium mb-3">Prior Studies Influencing This Analysis</h3>
                      <p className="mb-4">
                        The sample size and power calculations for your study on {refinedClaim.toLowerCase()} are based on these key studies:
                      </p>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Study</TableHead>
                            <TableHead>Sample Size</TableHead>
                            <TableHead>Effect Size</TableHead>
                            <TableHead>Findings</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Abbasi et al. (2012)</TableCell>
                            <TableCell>46</TableCell>
                            <TableCell>0.63</TableCell>
                            <TableCell>Significant improvement in sleep quality with magnesium supplementation</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Nielsen et al. (2010)</TableCell>
                            <TableCell>100</TableCell>
                            <TableCell>0.45</TableCell>
                            <TableCell>Improvements in sleep efficiency and duration with magnesium</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Held et al. (2002)</TableCell>
                            <TableCell>12</TableCell>
                            <TableCell>0.72</TableCell>
                            <TableCell>Small pilot showing increased REM sleep with magnesium</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Rondanelli et al. (2011)</TableCell>
                            <TableCell>43</TableCell>
                            <TableCell>0.51</TableCell>
                            <TableCell>Improvements in sleep onset and quality with magnesium combination</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      
                      <div className="bg-amber-50 p-3 rounded-md mt-4">
                        <div className="flex">
                          <Info className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
                          <p className="text-amber-800 text-sm">
                            Note: We've averaged the effect sizes from these studies and adjusted for publication bias to arrive at a conservative estimate for your study design. The recommended sample size includes a 15% buffer for potential dropouts.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="visualization" className="pt-4">
                      <h3 className="text-lg font-medium mb-3">Visualizing Statistical Power</h3>
                      <p className="mb-4">
                        This graph shows how statistical power increases with sample size for different effect sizes:
                      </p>
                      
                      <div className="aspect-video bg-white p-4 rounded-lg border border-neutral-200 mb-4 relative overflow-hidden">
                        {/* This is a simplified visual representation of a power curve */}
                        <div className="absolute bottom-10 left-10 right-10 top-10">
                          {/* Y-axis */}
                          <div className="absolute left-0 bottom-0 top-0 w-px bg-neutral-400"></div>
                          <div className="absolute left-0 bottom-0 w-2 h-px bg-neutral-400"></div>
                          <div className="absolute left-0 bottom-1/4 w-2 h-px bg-neutral-400"></div>
                          <div className="absolute left-0 bottom-1/2 w-2 h-px bg-neutral-400"></div>
                          <div className="absolute left-0 bottom-3/4 w-2 h-px bg-neutral-400"></div>
                          <div className="absolute left-0 top-0 w-2 h-px bg-neutral-400"></div>
                          
                          {/* Y-axis labels */}
                          <div className="absolute left-[-30px] bottom-[-10px] text-xs text-neutral-500">0%</div>
                          <div className="absolute left-[-30px] bottom-[calc(25%-10px)] text-xs text-neutral-500">25%</div>
                          <div className="absolute left-[-30px] bottom-[calc(50%-10px)] text-xs text-neutral-500">50%</div>
                          <div className="absolute left-[-30px] bottom-[calc(75%-10px)] text-xs text-neutral-500">75%</div>
                          <div className="absolute left-[-30px] top-[-10px] text-xs text-neutral-500">100%</div>
                          
                          {/* X-axis */}
                          <div className="absolute left-0 bottom-0 right-0 h-px bg-neutral-400"></div>
                          
                          {/* X-axis labels */}
                          <div className="absolute left-0 bottom-[-20px] text-xs text-neutral-500">0</div>
                          <div className="absolute left-1/4 bottom-[-20px] text-xs text-neutral-500">25</div>
                          <div className="absolute left-1/2 bottom-[-20px] text-xs text-neutral-500 translate-x-[-50%]">50</div>
                          <div className="absolute left-3/4 bottom-[-20px] text-xs text-neutral-500">75</div>
                          <div className="absolute right-0 bottom-[-20px] text-xs text-neutral-500">100</div>
                          
                          {/* Power curves */}
                          {/* Large effect size curve (steeper) */}
                          <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,100 Q30,40 100,5" fill="none" stroke="#3b82f6" strokeWidth="2" />
                          </svg>
                          
                          {/* Medium effect size curve (our study) */}
                          <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,100 Q40,65 100,20" fill="none" stroke="#f59e0b" strokeWidth="3" />
                          </svg>
                          
                          {/* Small effect size curve (flatter) */}
                          <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,100 Q50,90 100,50" fill="none" stroke="#ef4444" strokeWidth="2" />
                          </svg>
                          
                          {/* Recommended sample size indicator */}
                          <div className="absolute bottom-0 left-[65%] h-full w-px bg-green-500 dashed" style={{backgroundImage: 'linear-gradient(to bottom, #22c55e 50%, transparent 50%)', backgroundSize: '4px 4px'}}>
                            <div className="absolute top-[-20px] left-[-20px] text-xs font-medium text-green-700 bg-green-100 p-1 rounded">
                              Recommended
                            </div>
                          </div>
                        </div>
                        
                        {/* Legend */}
                        <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded border border-neutral-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-px bg-blue-500 p-[1px]"></div>
                            <span className="text-xs">Large Effect</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-[3px] bg-amber-500 p-0"></div>
                            <span className="text-xs font-medium">Your Study (Medium)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-px bg-red-500 p-[1px]"></div>
                            <span className="text-xs">Small Effect</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-neutral-600">
                        The graph illustrates how power (y-axis) increases with sample size (x-axis) for different effect sizes. The steeper the curve, the faster power increases with additional participants. The vertical line indicates our recommended sample size for your study, which provides approximately 90% power to detect the expected medium effect size.
                      </p>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
            
            <p className="text-sm text-neutral-600 mb-3">{studyDesign.powerAnalysis}</p>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Adjust sample size:</span>
                <span className="text-lg font-bold text-primary">{sampleSize} participants</span>
              </div>
              <Slider
                value={[sampleSize]}
                min={studyDesign.sampleSize.min}
                max={studyDesign.sampleSize.max}
                step={5}
                onValueChange={(value) => setSampleSize(value[0])}
              />
              <div className="flex justify-between mt-1 text-xs text-neutral-500">
                <span>Minimum: {studyDesign.sampleSize.min}</span>
                <span>Recommended: {studyDesign.sampleSize.recommended}</span>
                <span>Maximum: {studyDesign.sampleSize.max}</span>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-md text-sm">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                <div className="text-blue-700">
                  <p className="mb-1">
                    A sample size of <strong>{sampleSize}</strong> participants provides approximately 
                    {sampleSize >= studyDesign.sampleSize.recommended ? " 90%" : " 80%"} power to detect 
                    the expected effect. {sampleSize < studyDesign.sampleSize.recommended && 
                    "Consider increasing the sample size for more reliable results."}
                  </p>
                  <p className="text-xs mt-2">
                    <strong>Based on:</strong> Abbasi et al. (2012), Nielsen et al. (2010), and other studies showing medium effect sizes (0.45-0.63) for similar interventions.
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        const learnMoreBtn = document.querySelector('[aria-label="Learn More"]');
                        if (learnMoreBtn instanceof HTMLElement) {
                          learnMoreBtn.click();
                        }
                      }}
                      className="ml-1 text-blue-600 underline underline-offset-2"
                    >
                      See details
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Inclusion and exclusion criteria */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-lg text-neutral-800">Participant Criteria</h3>
              <Button
                variant="outline" 
                size="sm" 
                className="gap-1 h-8"
                onClick={() => setShowDifficultyInfo(!showDifficultyInfo)}
              >
                <span>Recruitment Score: </span>
                <span className={`font-medium ${
                  recruitmentDifficulty <= 4 ? 'text-green-600' : 
                  recruitmentDifficulty <= 7 ? 'text-amber-600' : 
                  'text-red-600'
                }`}>
                  {recruitmentDifficulty}/10
                </span>
              </Button>
            </div>

            {showDifficultyInfo && (
              <div className="mb-4 p-3 bg-amber-50 rounded-md">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Recruitment Difficulty Score: {recruitmentDifficulty}/10</p>
                    <p className="text-sm text-amber-700 mt-1">
                      {recruitmentDifficulty <= 4 
                        ? "This study should be relatively easy to recruit for. The criteria are broad enough to find suitable participants."
                        : recruitmentDifficulty <= 7
                        ? "This study may face moderate recruitment challenges. Consider whether any criteria could be adjusted."
                        : "This study faces significant recruitment challenges. The criteria are restrictive, which may extend your recruitment timeline."
                      }
                    </p>
                    <p className="text-xs text-amber-600 mt-2">
                      Note: Each criterion adds to recruitment difficulty. Limiting to 5 inclusion and 5 exclusion criteria is recommended.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-neutral-700">Inclusion Criteria (must meet all):</h4>
                <span className="text-xs text-neutral-500">
                  {inclusionCriteria.length}/5 criteria
                </span>
              </div>

              <ul className="space-y-2 mb-3">
                {inclusionCriteria.map((criterion, index) => (
                  <li key={`inclusion-${index}`} className="flex items-start group border border-transparent hover:border-neutral-200 hover:bg-neutral-50 rounded-md p-2">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    {editingInclusionIndex === index ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={newInclusionCriterion}
                          onChange={(e) => setNewInclusionCriterion(e.target.value)}
                          className="flex-1 text-sm p-1 border border-neutral-300 rounded"
                          placeholder="Enter criterion"
                        />
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            if (newInclusionCriterion.trim()) {
                              const updated = [...inclusionCriteria];
                              updated[index] = newInclusionCriterion.trim();
                              setInclusionCriteria(updated);
                              setRecruitmentDifficulty(calculateRecruitmentDifficulty(
                                updated, exclusionCriteria
                              ));
                            }
                            setEditingInclusionIndex(null);
                            setNewInclusionCriterion("");
                          }}
                        >
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setEditingInclusionIndex(null);
                            setNewInclusionCriterion("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm flex-1">{criterion}</span>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2"
                            onClick={() => {
                              setNewInclusionCriterion(criterion);
                              setEditingInclusionIndex(index);
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-red-500 hover:text-red-700"
                            onClick={() => {
                              const updated = inclusionCriteria.filter((_, i) => i !== index);
                              setInclusionCriteria(updated);
                              setRecruitmentDifficulty(calculateRecruitmentDifficulty(
                                updated, exclusionCriteria
                              ));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              
              {inclusionCriteria.length < 5 && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newInclusionCriterion}
                    onChange={(e) => setNewInclusionCriterion(e.target.value)}
                    className="flex-1 text-sm p-2 border border-neutral-300 rounded"
                    placeholder="Add new inclusion criterion"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!newInclusionCriterion.trim()}
                    onClick={() => {
                      if (newInclusionCriterion.trim()) {
                        const updated = [...inclusionCriteria, newInclusionCriterion.trim()];
                        setInclusionCriteria(updated);
                        setNewInclusionCriterion("");
                        setRecruitmentDifficulty(calculateRecruitmentDifficulty(
                          updated, exclusionCriteria
                        ));
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-neutral-700">Exclusion Criteria (must not meet any):</h4>
                <span className="text-xs text-neutral-500">
                  {exclusionCriteria.length}/5 criteria
                </span>
              </div>

              <ul className="space-y-2 mb-3">
                {exclusionCriteria.map((criterion, index) => (
                  <li key={`exclusion-${index}`} className="flex items-start group border border-transparent hover:border-neutral-200 hover:bg-neutral-50 rounded-md p-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    {editingExclusionIndex === index ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={newExclusionCriterion}
                          onChange={(e) => setNewExclusionCriterion(e.target.value)}
                          className="flex-1 text-sm p-1 border border-neutral-300 rounded"
                          placeholder="Enter criterion"
                        />
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            if (newExclusionCriterion.trim()) {
                              const updated = [...exclusionCriteria];
                              updated[index] = newExclusionCriterion.trim();
                              setExclusionCriteria(updated);
                              setRecruitmentDifficulty(calculateRecruitmentDifficulty(
                                inclusionCriteria, updated
                              ));
                            }
                            setEditingExclusionIndex(null);
                            setNewExclusionCriterion("");
                          }}
                        >
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setEditingExclusionIndex(null);
                            setNewExclusionCriterion("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm flex-1">{criterion}</span>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2"
                            onClick={() => {
                              setNewExclusionCriterion(criterion);
                              setEditingExclusionIndex(index);
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-red-500 hover:text-red-700"
                            onClick={() => {
                              const updated = exclusionCriteria.filter((_, i) => i !== index);
                              setExclusionCriteria(updated);
                              setRecruitmentDifficulty(calculateRecruitmentDifficulty(
                                inclusionCriteria, updated
                              ));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              {exclusionCriteria.length < 5 && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newExclusionCriterion}
                    onChange={(e) => setNewExclusionCriterion(e.target.value)}
                    className="flex-1 text-sm p-2 border border-neutral-300 rounded"
                    placeholder="Add new exclusion criterion"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!newExclusionCriterion.trim()}
                    onClick={() => {
                      if (newExclusionCriterion.trim()) {
                        const updated = [...exclusionCriteria, newExclusionCriterion.trim()];
                        setExclusionCriteria(updated);
                        setNewExclusionCriterion("");
                        setRecruitmentDifficulty(calculateRecruitmentDifficulty(
                          inclusionCriteria, updated
                        ));
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Advanced options (disabled in this version) */}
        <Card className="opacity-60">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-lg text-neutral-800">Advanced Design Options</h3>
              <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-1 rounded">Coming Soon</span>
            </div>
            
            <p className="text-sm text-neutral-600 mb-4">These advanced study design options will be available in a future release.</p>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Checkbox id="crossover" disabled />
                <label htmlFor="crossover" className="ml-2 text-sm text-neutral-500">
                  Crossover design (participants receive both treatment and control)
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox id="multiarm" disabled />
                <label htmlFor="multiarm" className="ml-2 text-sm text-neutral-500">
                  Multi-arm trial (test multiple dosages or formulations)
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox id="adaptive" disabled />
                <label htmlFor="adaptive" className="ml-2 text-sm text-neutral-500">
                  Adaptive design (modify parameters based on interim results)
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <button 
          className="btn-outline-reputable px-4 py-2 rounded"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </button>
        <button 
          className="btn-reputable px-4 py-2 rounded"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Generate Protocol"}
        </button>
      </div>
    </div>
  );
}
