import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Share2, 
  Mail, 
  Copy, 
  FileSpreadsheet, 
  FileJson, 
  Check,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

interface ExportStepProps {
  studyId: number;
  protocol: any;
  onBack: () => void;
}

export default function ExportStep({
  studyId,
  protocol,
  onBack
}: ExportStepProps) {
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [exportLoading, setExportLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  
  const handleExport = () => {
    setExportLoading(true);
    
    // Simulate export delay
    setTimeout(() => {
      toast({
        title: "Success",
        description: `Protocol successfully exported as ${selectedFormat.toUpperCase()}`,
      });
      setExportLoading(false);
    }, 1500);
  };
  
  const handleCopyLink = () => {
    // In a real app, this would generate and copy a shareable link
    setCopied(true);
    navigator.clipboard.writeText(`https://reputable.io/shared-protocol/${studyId}`);
    
    toast({
      title: "Link copied",
      description: "Shareable link copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleEmailSend = () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    
    setEmailSent(true);
    
    toast({
      title: "Email sent",
      description: `Protocol has been sent to ${email}`,
    });
    
    setTimeout(() => setEmailSent(false), 2000);
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Export Protocol</h2>
        <p className="text-muted-foreground">Your study design is complete. Export or share your protocol.</p>
      </div>
      
      <Tabs defaultValue="export" className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="share">Share</TabsTrigger>
          <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
        </TabsList>
        
        <TabsContent value="export" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-foreground mb-4">Export Format</h3>
              
              <RadioGroup 
                value={selectedFormat} 
                onValueChange={setSelectedFormat}
                className="mb-6"
              >
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      <RadioGroupItem value="pdf" id="pdf" />
                    </div>
                    <div>
                      <Label 
                        htmlFor="pdf"
                        className="text-base font-medium text-foreground cursor-pointer flex items-center"
                      >
                        <FileText className="h-5 w-5 mr-2 text-primary" />
                        PDF Document (IRB Submission Format)
                      </Label>
                      <p className="text-sm text-muted-foreground ml-7">Complete protocol with all sections formatted for IRB submission</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      <RadioGroupItem value="docx" id="docx" />
                    </div>
                    <div>
                      <Label 
                        htmlFor="docx"
                        className="text-base font-medium text-foreground cursor-pointer flex items-center"
                      >
                        <FileText className="h-5 w-5 mr-2 text-blue-400" />
                        Word Document (Editable)
                      </Label>
                      <p className="text-sm text-muted-foreground ml-7">Editable format for further customization</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      <RadioGroupItem value="xlsx" id="xlsx" />
                    </div>
                    <div>
                      <Label 
                        htmlFor="xlsx"
                        className="text-base font-medium text-foreground cursor-pointer flex items-center"
                      >
                        <FileSpreadsheet className="h-5 w-5 mr-2 text-green-400" />
                        Excel Spreadsheet (Data Collection Template)
                      </Label>
                      <p className="text-sm text-muted-foreground ml-7">Includes data collection fields for your study outcomes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      <RadioGroupItem value="json" id="json" />
                    </div>
                    <div>
                      <Label 
                        htmlFor="json"
                        className="text-base font-medium text-foreground cursor-pointer flex items-center"
                      >
                        <FileJson className="h-5 w-5 mr-2 text-amber-400" />
                        JSON (API Format)
                      </Label>
                      <p className="text-sm text-muted-foreground ml-7">Raw data format for integration with other systems</p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
              
              <button 
                className="btn-primary-reputable px-4 py-2 rounded flex items-center gap-2 w-full md:w-auto"
                onClick={handleExport}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  "Generating file..."
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export {selectedFormat.toUpperCase()}
                  </>
                )}
              </button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="share" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-foreground mb-4">Share Protocol</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Generate shareable link</h4>
                  <div className="flex">
                    <Input 
                      readOnly 
                      value={`https://reputable.io/shared-protocol/${studyId}`} 
                      className="rounded-r-none bg-background border-border text-foreground"
                    />
                    <button 
                      className="rounded-l-none btn-outline-reputable px-3 py-1 border border-l-0 border-border flex items-center"
                      onClick={handleCopyLink}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Anyone with this link can view (but not edit) your protocol
                  </p>
                </div>
                
                <Separator className="bg-border" />
                
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Email protocol</h4>
                  <div className="flex mb-2">
                    <Input 
                      type="email"
                      placeholder="colleague@example.com" 
                      className="rounded-r-none bg-background border-border text-foreground"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <button 
                      className="rounded-l-none btn-primary-reputable px-3 py-1 flex items-center"
                      onClick={handleEmailSend}
                    >
                      {emailSent ? <Check className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 rounded-full ai-badge bubble-pulse flex items-center justify-center mr-2">
                      <Share2 className="h-3 w-3 text-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recipients can view and comment on your protocol
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="next-steps" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-foreground mb-4">Next Steps with Reputable</h3>
              
              <div className="space-y-6">
                <div className="p-4 border border-primary/20 bg-primary/10 rounded-lg">
                  <h4 className="font-medium flex items-center text-primary mb-2">
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Run your study with Reputable
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Take your protocol from design to execution. Our platform handles participant recruitment, compliance tracking, data collection, and analysis.
                  </p>
                  <button className="btn-primary-reputable px-4 py-2 rounded">
                    Get Started with Study Execution
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 border border-border rounded-lg bg-background/60">
                    <h4 className="text-sm font-medium text-foreground mb-1">Recruit Participants</h4>
                    <p className="text-xs text-muted-foreground">
                      Access our diverse participant pool or bring your own customers
                    </p>
                  </div>
                  
                  <div className="p-3 border border-border rounded-lg bg-background/60">
                    <h4 className="text-sm font-medium text-foreground mb-1">Track Compliance</h4>
                    <p className="text-xs text-muted-foreground">
                      Automated tools to ensure protocol adherence and data quality
                    </p>
                  </div>
                  
                  <div className="p-3 border border-border rounded-lg bg-background/60">
                    <h4 className="text-sm font-medium text-foreground mb-1">Analyze Results</h4>
                    <p className="text-xs text-muted-foreground">
                      Statistical analysis and visualization of your study outcomes
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <Link href="/">
                    <button className="btn-outline-reputable px-4 py-2 rounded">
                      Return to Dashboard
                    </button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <button 
          className="btn-outline-reputable px-4 py-2 rounded flex items-center gap-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <Link href="/">
          <button className="btn-primary-reputable px-4 py-2 rounded flex items-center gap-2">
            Finish
            <Check className="h-4 w-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}
