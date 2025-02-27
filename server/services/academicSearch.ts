import { z } from "zod";

// Schema for the study evidence we want to extract from papers
const StudyEvidenceSchema = z.object({
  title: z.string(),
  authors: z.string(),
  journal: z.string(),
  year: z.number(),
  sampleSize: z.number(),
  effectSize: z.string(),
  dosage: z.string(),
  duration: z.string(),
  evidenceGrade: z.enum(["High", "Moderate", "Low"]),
  summary: z.string(),
  details: z.string().optional(),
  url: z.string().optional(),
});

export type StudyEvidence = z.infer<typeof StudyEvidenceSchema>;

// Base interface for academic search providers
interface AcademicSearchProvider {
  search(query: string, options?: any): Promise<StudyEvidence[]>;
}

// Semantic Scholar API Implementation
class SemanticScholarProvider implements AcademicSearchProvider {
  private baseUrl = 'https://api.semanticscholar.org/graph/v1';
  private apiKey: string | null = null;
  
  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }
  
  async search(query: string, options: { limit?: number, fields?: string[] } = {}): Promise<StudyEvidence[]> {
    try {
      // Default fields to retrieve
      const fields = options.fields || [
        'title', 'authors', 'venue', 'year', 'abstract', 
        'url', 'citations.count', 'citationCount', 'tldr'
      ];
      
      const limit = options.limit || 10;
      
      // Prepare the API URL
      const encodedQuery = encodeURIComponent(query);
      const fieldsParam = fields.join(',');
      const url = `${this.baseUrl}/paper/search?query=${encodedQuery}&limit=${limit}&fields=${fieldsParam}`;
      
      // Setup headers (includes API key if available)
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };
      
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }
      
      // Make the API request
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Process and transform the response to our study evidence format
      const results = data.data || [];
      
      // Return empty array if no results
      if (!results.length) {
        return [];
      }
      
      // Transform Semantic Scholar data to our StudyEvidence format
      const transformedResults: StudyEvidence[] = [];
      
      for (const paper of results) {
        try {
          // Skip papers without required fields
          if (!paper.title || !paper.year) continue;
          
          // Create author string
          const authorNames = (paper.authors || [])
            .map((author: any) => author.name)
            .filter(Boolean);
          
          const authorsText = authorNames.length > 0 
            ? authorNames.join(', ') 
            : 'Unknown authors';
          
          // Extract citation count as an indicator of evidence quality
          const citationCount = paper.citationCount || 0;
          
          // Set evidence grade based on citation count
          // This is a simple heuristic and could be improved
          let evidenceGrade: "High" | "Moderate" | "Low" = "Low";
          if (citationCount > 100) {
            evidenceGrade = "High";
          } else if (citationCount > 30) {
            evidenceGrade = "Moderate";
          }
          
          // Create summary from abstract or tldr
          const summary = paper.tldr?.text || paper.abstract || "No abstract available";
          
          // Create StudyEvidence object from the paper data
          const studyEvidence: StudyEvidence = {
            title: paper.title,
            authors: authorsText,
            journal: paper.venue || 'Unknown Journal',
            year: parseInt(paper.year),
            sampleSize: 0, // Not available directly from Semantic Scholar
            effectSize: 'Not reported', // Not available directly from Semantic Scholar
            dosage: 'Not reported', // Not available directly from Semantic Scholar
            duration: 'Not reported', // Not available directly from Semantic Scholar
            evidenceGrade,
            summary: summary.substring(0, 300) + (summary.length > 300 ? '...' : ''),
            details: paper.abstract || '',
            url: paper.url
          };
          
          transformedResults.push(studyEvidence);
        } catch (err) {
          console.error("Error processing paper:", err);
          // Skip this paper and continue
          continue;
        }
      }
      
      return transformedResults;
    } catch (error) {
      console.error("Semantic Scholar search failed:", error);
      return [];
    }
  }
}

// PubMed API Implementation
class PubMedProvider implements AcademicSearchProvider {
  private eUtilsBaseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  private apiKey: string | null = null;
  
  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }
  
  // Helper method to create URL with API key if available
  private buildUrl(baseUrl: string, params: Record<string, string>) {
    const url = new URL(baseUrl);
    
    // Add standard params
    url.searchParams.append('db', 'pubmed');
    url.searchParams.append('retmode', 'json');
    
    // Add custom params
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }
    
    // Add API key if available
    if (this.apiKey) {
      url.searchParams.append('api_key', this.apiKey);
    }
    
    return url.toString();
  }
  
  async search(query: string, options: { limit?: number } = {}): Promise<StudyEvidence[]> {
    try {
      const limit = options.limit || 10;
      
      // Step 1: Search for IDs
      const searchUrl = this.buildUrl(`${this.eUtilsBaseUrl}/esearch.fcgi`, {
        term: query,
        retmax: limit.toString(),
        sort: 'relevance'
      });
      
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        throw new Error(`PubMed search API error: ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json();
      const ids = searchData.esearchresult?.idlist || [];
      
      if (ids.length === 0) {
        return [];
      }
      
      // Step 2: Fetch details for those IDs
      const fetchUrl = this.buildUrl(`${this.eUtilsBaseUrl}/efetch.fcgi`, {
        id: ids.join(','),
        retmax: ids.length.toString()
      });
      
      const fetchResponse = await fetch(fetchUrl);
      
      if (!fetchResponse.ok) {
        throw new Error(`PubMed fetch API error: ${fetchResponse.status}`);
      }
      
      // PubMed returns XML by default, parse it to extract the data we need
      const text = await fetchResponse.text();
      
      // Use regex to extract key information (this is simplified - in production would use a proper XML parser)
      const studies: StudyEvidence[] = [];
      
      // Parse articles
      const articleMatches = text.match(/<PubmedArticle>[\s\S]+?<\/PubmedArticle>/g) || [];
      
      for (const articleXml of articleMatches) {
        try {
          // Extract title
          const titleMatch = articleXml.match(/<ArticleTitle>([\s\S]+?)<\/ArticleTitle>/);
          const title = titleMatch ? this.cleanXmlString(titleMatch[1]) : 'Unknown Title';
          
          // Extract journal
          const journalMatch = articleXml.match(/<Title>([\s\S]+?)<\/Title>/);
          const journal = journalMatch ? this.cleanXmlString(journalMatch[1]) : 'Unknown Journal';
          
          // Extract year
          const yearMatch = articleXml.match(/<Year>(\\d+)<\/Year>/);
          const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
          
          // Extract authors
          const authorMatches = articleXml.match(/<LastName>([\s\S]+?)<\/LastName>[\s\S]+?<ForeName>([\s\S]+?)<\/ForeName>/g) || [];
          let authors = 'Unknown Authors';
          
          if (authorMatches.length > 0) {
            const authorNames = authorMatches.map(authorMatch => {
              const lastNameMatch = authorMatch.match(/<LastName>([\s\S]+?)<\/LastName>/);
              const foreNameMatch = authorMatch.match(/<ForeName>([\s\S]+?)<\/ForeName>/);
              
              const lastName = lastNameMatch ? this.cleanXmlString(lastNameMatch[1]) : '';
              const foreName = foreNameMatch ? this.cleanXmlString(foreNameMatch[1]) : '';
              
              return `${lastName}${foreName ? ', ' + foreName : ''}`;
            });
            
            authors = authorNames.join('; ');
          }
          
          // Extract abstract
          const abstractMatch = articleXml.match(/<AbstractText[^>]*>([\s\S]+?)<\/AbstractText>/);
          const abstractText = abstractMatch ? this.cleanXmlString(abstractMatch[1]) : 'No abstract available';
          
          // Look for study type indicators in the abstract
          let evidenceGrade: "High" | "Moderate" | "Low" = "Low";
          const abstractLower = abstractText.toLowerCase();
          
          if (
            abstractLower.includes('randomized') || 
            abstractLower.includes('double-blind') || 
            abstractLower.includes('placebo-controlled') ||
            abstractLower.includes('meta-analysis') ||
            abstractLower.includes('systematic review')
          ) {
            evidenceGrade = "High";
          } else if (
            abstractLower.includes('cohort') || 
            abstractLower.includes('case-control') ||
            abstractLower.includes('prospective') ||
            abstractLower.includes('controlled trial')
          ) {
            evidenceGrade = "Moderate";
          }
          
          // Extract PMID for URL
          const pmidMatch = articleXml.match(/<PMID[^>]*>(\\d+)<\/PMID>/);
          const pmid = pmidMatch ? pmidMatch[1] : '';
          const url = pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : undefined;
          
          // Create study evidence object
          const studyEvidence: StudyEvidence = {
            title,
            authors,
            journal,
            year,
            sampleSize: 0, // Hard to extract reliably with regex
            dosage: 'Not reported', // Hard to extract reliably with regex
            duration: 'Not reported', // Hard to extract reliably with regex
            effectSize: 'Not reported', // Hard to extract reliably with regex
            evidenceGrade,
            summary: abstractText.substring(0, 300) + (abstractText.length > 300 ? '...' : ''),
            details: abstractText,
            url
          };
          
          studies.push(studyEvidence);
        } catch (err) {
          console.error("Error processing PubMed article:", err);
          // Skip this article and continue
          continue;
        }
      }
      
      return studies;
    } catch (error) {
      console.error("PubMed search failed:", error);
      return [];
    }
  }
  
  private cleanXmlString(str: string): string {
    return str
      .replace(/<[^>]+>/g, '') // Remove XML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();
  }
}

// Main Academic Search Service that combines multiple providers
export class AcademicSearchService {
  private providers: AcademicSearchProvider[] = [];
  
  constructor() {
    // Initialize with available providers
    // The order matters - will try providers in this order
    this.providers.push(new SemanticScholarProvider(process.env.SEMANTIC_SCHOLAR_API_KEY));
    this.providers.push(new PubMedProvider(process.env.PUBMED_API_KEY));
  }
  
  // Helper to generate a search query from a claim
  private generateSearchQuery(claim: string): string {
    // Extract key terms from the claim
    const lowercaseClaim = claim.toLowerCase();
    
    // Look for common supplement names
    const supplements = [
      'magnesium', 'zinc', 'vitamin d', 'vitamin c', 'melatonin', 
      'iron', 'calcium', 'omega-3', 'fish oil', 'probiotics'
    ];
    
    // Look for common health outcomes
    const outcomes = [
      'sleep', 'rem', 'insomnia', 'fatigue', 'energy', 
      'cognitive', 'mood', 'anxiety', 'depression', 'performance'
    ];
    
    // Find which supplements and outcomes are mentioned in the claim
    const mentionedSupplements = supplements.filter(s => lowercaseClaim.includes(s));
    const mentionedOutcomes = outcomes.filter(o => lowercaseClaim.includes(o));
    
    // If we found both a supplement and outcome, use them for the search
    if (mentionedSupplements.length > 0 && mentionedOutcomes.length > 0) {
      return `${mentionedSupplements.join(' ')} ${mentionedOutcomes.join(' ')} clinical study`;
    }
    
    // Otherwise, do some basic cleanup of the claim to make it more search-friendly
    return claim
      .replace(/our product/gi, '')
      .replace(/may|might|could/gi, '')
      .replace(/daily consumption of/gi, '')
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .trim() + ' clinical study';
  }
  
  // Attempt to extract study characteristics using OpenAI
  private async extractStudyCharacteristics(
    papers: StudyEvidence[], 
    claim: string
  ): Promise<StudyEvidence[]> {
    // Skip if no OpenAI API key or no papers
    if (!process.env.OPENAI_API_KEY || papers.length === 0) {
      return papers;
    }
    
    try {
      // Import OpenAI (dynamically to avoid errors when key is not available)
      const OpenAI = await import('openai');
      const openai = new OpenAI.default({ apiKey: process.env.OPENAI_API_KEY });
      
      // Prepare the enhanced papers array
      const enhancedPapers: StudyEvidence[] = [];
      
      // Process each paper to extract more structured information
      for (const paper of papers) {
        try {
          // For papers with longer abstracts, we can try to extract more details
          if (paper.details && paper.details.length > 100) {
            const response = await openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
              messages: [
                {
                  role: "system",
                  content: `You are a research assistant specializing in clinical studies. 
                  Your task is to extract specific details from study abstracts. 
                  If you cannot find a specific piece of information, respond with "Not reported" for that field.
                  
                  The abstract is related to this claim: "${claim}"
                  
                  Extract these fields:
                  1. Sample size (just the number)
                  2. Dosage used in the study (e.g., "300mg daily")
                  3. Study duration (e.g., "8 weeks")
                  4. Effect size (a brief description of the main finding's magnitude)
                  5. Study type (RCT, meta-analysis, observational, etc.)
                  
                  Return as a JSON object with these exact keys: sampleSize (number), dosage (string), duration (string), effectSize (string), studyType (string)`
                },
                {
                  role: "user",
                  content: paper.details
                }
              ],
              response_format: { type: "json_object" },
              temperature: 0.2
            });
            
            // Parse the extracted information
            const content = response.choices[0].message.content || "{}";
            const extractedInfo = JSON.parse(content);
            
            // Update the paper with the extracted information
            const enhancedPaper: StudyEvidence = {
              ...paper,
              sampleSize: extractedInfo.sampleSize && !isNaN(parseInt(extractedInfo.sampleSize)) 
                ? parseInt(extractedInfo.sampleSize) 
                : 0,
              dosage: extractedInfo.dosage || 'Not reported',
              duration: extractedInfo.duration || 'Not reported',
              effectSize: extractedInfo.effectSize || 'Not reported',
              // Adjust evidence grade based on study type if available
              evidenceGrade: this.determineEvidenceGrade(extractedInfo.studyType, paper.evidenceGrade)
            };
            
            enhancedPapers.push(enhancedPaper);
          } else {
            // If we don't have enough detail, just use the original paper
            enhancedPapers.push(paper);
          }
        } catch (err) {
          console.error("Error enhancing paper with OpenAI:", err);
          // If enhancement fails, use the original paper
          enhancedPapers.push(paper);
        }
      }
      
      return enhancedPapers;
    } catch (error) {
      console.error("Failed to enhance papers with OpenAI:", error);
      // Return original papers if enhancement fails
      return papers;
    }
  }
  
  // Helper to determine evidence grade based on study type
  private determineEvidenceGrade(
    studyType: string | undefined, 
    defaultGrade: "High" | "Moderate" | "Low"
  ): "High" | "Moderate" | "Low" {
    if (!studyType) return defaultGrade;
    
    const studyTypeLower = studyType.toLowerCase();
    
    if (
      studyTypeLower.includes('meta-analysis') || 
      studyTypeLower.includes('systematic review') ||
      studyTypeLower.includes('randomized controlled trial') ||
      studyTypeLower.includes('rct')
    ) {
      return "High";
    } else if (
      studyTypeLower.includes('cohort') ||
      studyTypeLower.includes('case-control') ||
      studyTypeLower.includes('controlled trial')
    ) {
      return "Moderate";
    }
    
    return defaultGrade;
  }
  
  // Main search method that tries all providers and returns combined results
  async searchLiterature(claim: string, options: { limit?: number } = {}): Promise<StudyEvidence[]> {
    const searchQuery = this.generateSearchQuery(claim);
    console.log(`Searching academic literature for: "${searchQuery}"`);
    
    const limit = options.limit || 10;
    let allResults: StudyEvidence[] = [];
    
    // Try each provider in sequence until we get results
    for (const provider of this.providers) {
      try {
        const results = await provider.search(searchQuery, { limit });
        
        if (results.length > 0) {
          console.log(`Found ${results.length} results from provider ${provider.constructor.name}`);
          allResults = allResults.concat(results);
          
          // If we have enough results, stop querying additional providers
          if (allResults.length >= limit) {
            break;
          }
        }
      } catch (error) {
        console.error(`Error with provider ${provider.constructor.name}:`, error);
        // Continue with next provider on error
      }
    }
    
    // If we have results, enhance them with study characteristics
    if (allResults.length > 0) {
      // Limit to top results
      allResults = allResults.slice(0, limit);
      
      // Try to extract more detailed characteristics
      allResults = await this.extractStudyCharacteristics(allResults, claim);
      
      // Sort by evidence grade (highest first)
      allResults.sort((a, b) => {
        const gradeOrder = { "High": 3, "Moderate": 2, "Low": 1 };
        return gradeOrder[b.evidenceGrade] - gradeOrder[a.evidenceGrade];
      });
    }
    
    return allResults;
  }
}

// Export a singleton instance
export const academicSearchService = new AcademicSearchService();