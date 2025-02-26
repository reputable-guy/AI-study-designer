import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const quickStartSchema = z.object({
  productName: z.string().optional(),
  originalClaim: z.string().min(10, "Please provide a more detailed description of your claim"),
  websiteUrl: z.string().url("Please enter a valid URL").or(z.string().length(0)).optional(),
  ingredients: z.string().optional(),
  id: z.number().optional() // Add id field to schema
});

type QuickStartFormValues = z.infer<typeof quickStartSchema>;

interface QuickStartStepProps {
  onNext: (data: QuickStartFormValues) => void;
  defaultValues?: Partial<QuickStartFormValues>;
}

export default function QuickStartStep({ onNext, defaultValues = {} }: QuickStartStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<QuickStartFormValues>({
    resolver: zodResolver(quickStartSchema),
    defaultValues: {
      productName: defaultValues.productName || "",
      originalClaim: defaultValues.originalClaim || "",
      websiteUrl: defaultValues.websiteUrl || "",
      ingredients: defaultValues.ingredients || "",
    },
  });
  
  const onSubmit = async (data: QuickStartFormValues) => {
    setIsSubmitting(true);
    try {
      // Create the study in the backend
      const response = await apiRequest("POST", "/api/studies", {
        userId: 1, // Assume user is logged in with ID 1
        productName: data.productName,
        originalClaim: data.originalClaim,
        websiteUrl: data.websiteUrl,
        ingredients: data.ingredients,
      });
      
      // Extract the study data with ID
      const studyData = await response.json();
      
      // Pass both the form data and the newly created study ID
      onNext({
        ...data,
        id: studyData.id
      });
    } catch (error) {
      console.error("Error creating study:", error);
      toast({
        title: "Error",
        description: "Failed to create your study. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Tell us about your product</h2>
      <p className="text-neutral-500 mb-6">We'll use this information to help you design a scientific study that supports your product claims.</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="productName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name <span className="text-neutral-400">(optional)</span></FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Example: MagSleep Premium" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="originalClaim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Briefly describe your product and its main claim</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Example: Our magnesium supplement helps improve sleep quality." 
                    rows={3} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="websiteUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website URL <span className="text-neutral-400">(optional)</span></FormLabel>
                <FormControl>
                  <Input 
                    type="url"
                    placeholder="https://yourcompany.com" 
                    {...field} 
                  />
                </FormControl>
                <p className="text-xs text-neutral-400 mt-1">We'll analyze your website to better understand your product.</p>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="ingredients"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Active ingredients <span className="text-neutral-400">(optional)</span></FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Example: Magnesium bisglycinate (300mg), Zinc (15mg), Vitamin B6 (2mg)" 
                    rows={2} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full md:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Continue"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
