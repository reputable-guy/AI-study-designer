import fetch from 'node-fetch';
import { DOMParser } from 'xmldom';
import { z } from 'zod';

// Define the schema for study evidence
export const StudyEvidenceSchema = z.object({
  id: z.number().optional(),
  studyId: z.number().optional(),
  title: z.string(),
  authors: z.string(),
  journal: z.string(),
  year: z.number(),
  sampleSize: z.number(),
  effectSize: z.string(),
  dosage: z.string(),
  duration: z.string(),
  evidenceGrade: z.enum(['High', 'Moderate', 'Low']),
  summary: z.string(),
  details: z.string().optional(),
  url: z.string().url().optional()
});

export type StudyEvidence = z.infer<typeof StudyEvidenceSchema>;

/**
 * Interface for academic search providers
 */
interface AcademicSearchProvider {
  search(query: string, options?: any): Promise<StudyEvidence[]>;
}

/**
 * Semantic Scholar API implementation
 * https://api.semanticscholar.org/
 */
class SemanticScholarProvider implements AcademicSearchProvider {
  private baseUrl = 'https://api.semanticscholar.org/graph/v1';
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  async search(query: string, options: { limit?: number, fields?: string[] } = {}): Promise<StudyEvidence[]> {
    try {
      const limit = options.limit || 5;
      const fields = options.fields || ['title', 'authors', 'venue', 'year', 'url', 'abstract', 'citationCount'];
      
      // Build the query URL
      const url = `${this.baseUrl}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fields.join(',')}`;
      
      // Prepare headers with API key if available
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }
      
      // Make the request
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as any;
      
      // Transform the data into our standard format
      const results: StudyEvidence[] = [];
      
      if (data.data && Array.isArray(data.data)) {
        for (const paper of data.data) {
          // Extract author names in format "First Author et al."
          let authorText = "Unknown authors";
          if (paper.authors && paper.authors.length > 0) {
            const firstAuthor = paper.authors[0]?.name || "Unknown";
            authorText = paper.authors.length > 1 ? `${firstAuthor} et al.` : firstAuthor;
          }
          
          // Create a study evidence object
          const studyEvidence: StudyEvidence = {
            title: paper.title || "Untitled study",
            authors: authorText,
            journal: paper.venue || "Unknown journal",
            year: paper.year || new Date().getFullYear(),
            sampleSize: 0, // Not available from API directly
            effectSize: "Not specified", // Not available from API directly
            dosage: "Not specified", // Not available from API directly 
            duration: "Not specified", // Not available from API directly
            evidenceGrade: "Moderate", // Default grade
            summary: paper.abstract || "No abstract available",
            url: paper.url || undefined
          };
          
          results.push(studyEvidence);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error searching Semantic Scholar:', error);
      return [];
    }
  }
}

/**
 * PubMed API implementation using E-utilities
 * https://www.ncbi.nlm.nih.gov/books/NBK25500/
 */
class PubMedProvider implements AcademicSearchProvider {
  private eUtilsBaseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  private buildUrl(baseUrl: string, params: Record<string, string>) {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
    
    if (this.apiKey) {
      url.searchParams.append('api_key', this.apiKey);
    }
    
    return url.toString();
  }

  async search(query: string, options: { limit?: number } = {}): Promise<StudyEvidence[]> {
    try {
      const limit = options.limit || 5;
      
      // Step 1: Search PubMed for IDs
      const searchUrl = this.buildUrl(`${this.eUtilsBaseUrl}/esearch.fcgi`, {
        db: 'pubmed',
        term: query,
        retmode: 'json',
        retmax: limit.toString(),
        sort: 'relevance'
      });
      
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`PubMed search error: ${searchResponse.status} ${searchResponse.statusText}`);
      }
      
      const searchData = await searchResponse.json() as any;
      const pmids = searchData?.esearchresult?.idlist || [];
      
      if (pmids.length === 0) {
        return [];
      }
      
      // Step 2: Fetch details for these IDs
      const fetchUrl = this.buildUrl(`${this.eUtilsBaseUrl}/efetch.fcgi`, {
        db: 'pubmed',
        id: pmids.join(','),
        retmode: 'xml'
      });
      
      const fetchResponse = await fetch(fetchUrl);
      if (!fetchResponse.ok) {
        throw new Error(`PubMed fetch error: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }
      
      const xmlText = await fetchResponse.text();
      // @ts-ignore
      const parser = new DOMParser();
      // @ts-ignore
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Parse the XML
      const articles = xmlDoc.getElementsByTagName('PubmedArticle');
      const results: StudyEvidence[] = [];
      
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        
        // Extract article title
        const titleElements = article.getElementsByTagName('ArticleTitle');
        const title = titleElements.length > 0 ? this.cleanXmlString(titleElements[0].textContent || '') : 'Untitled';
        
        // Extract journal name
        const journalElements = article.getElementsByTagName('Journal');
        const journalTitleElements = journalElements.length > 0 ? 
          journalElements[0].getElementsByTagName('Title') : [];
        const journal = journalTitleElements.length > 0 ? 
          this.cleanXmlString(journalTitleElements[0].textContent || '') : 'Unknown journal';
        
        // Extract year
        const yearElements = article.getElementsByTagName('Year');
        let year = new Date().getFullYear();
        if (yearElements.length > 0 && yearElements[0].textContent) {
          const yearText = yearElements[0].textContent;
          const yearNum = parseInt(yearText, 10);
          if (!isNaN(yearNum)) {
            year = yearNum;
          }
        }
        
        // Extract authors
        const authorElements = article.getElementsByTagName('Author');
        let authorText = 'Unknown authors';
        if (authorElements.length > 0) {
          const firstAuthor = authorElements[0];
          const lastNameElements = firstAuthor.getElementsByTagName('LastName');
          const lastName = lastNameElements.length > 0 ? 
            this.cleanXmlString(lastNameElements[0].textContent || '') : 'Unknown';
          
          authorText = authorElements.length > 1 ? `${lastName} et al.` : lastName;
        }
        
        // Extract abstract
        const abstractElements = article.getElementsByTagName('AbstractText');
        let abstract = 'No abstract available';
        if (abstractElements.length > 0) {
          abstract = '';
          for (let j = 0; j < abstractElements.length; j++) {
            abstract += this.cleanXmlString(abstractElements[j].textContent || '');
            if (j < abstractElements.length - 1) abstract += ' ';
          }
        }
        
        // Get the PubMed URL
        const pmid = pmids[i];
        const url = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
        
        // Create a study evidence object
        const studyEvidence: StudyEvidence = {
          title,
          authors: authorText,
          journal,
          year,
          sampleSize: 0, // Not available from API directly
          effectSize: "Not specified", // Not available from API directly
          dosage: "Not specified", // Not available from API directly
          duration: "Not specified", // Not available from API directly
          evidenceGrade: "Moderate", // Default grade
          summary: abstract,
          url
        };
        
        results.push(studyEvidence);
      }
      
      return results;
    } catch (error) {
      console.error('Error searching PubMed:', error);
      return [];
    }
  }

  private cleanXmlString(str: string): string {
    return str.replace(/\s+/g, ' ').trim();
  }
}

/**
 * Main service class that coordinates different academic search providers
 */
export class AcademicSearchService {
  private providers: AcademicSearchProvider[] = [];

  constructor() {
    // Initialize providers based on available API keys
    if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
      this.providers.push(new SemanticScholarProvider(process.env.SEMANTIC_SCHOLAR_API_KEY));
    } else {
      // Add without API key for rate-limited access
      this.providers.push(new SemanticScholarProvider());
    }
    
    if (process.env.PUBMED_API_KEY) {
      this.providers.push(new PubMedProvider(process.env.PUBMED_API_KEY));
    } else {
      // Add without API key for rate-limited access
      this.providers.push(new PubMedProvider());
    }
  }

  private generateSearchQuery(claim: string): string {
    // Extract key terms from the claim to build a more effective search query
    const claimWords = claim.toLowerCase().split(/\s+/);
    
    // Filter out common words that don't add search value
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
      'at', 'from', 'by', 'for', 'with', 'about', 'against', 'between',
      'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'to', 'of', 'in', 'on', 'than', 'over', 'under', 'again', 'further',
      'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
      'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don',
      'should', 'now', 'effects', 'effect', 'affects', 'affect', 'impact'
    ]);
    
    // Keep only meaningful terms
    const searchTerms = claimWords.filter(word => {
      // Keep words that are longer than 3 characters and not in stop words
      return word.length > 3 && !stopWords.has(word);
    });
    
    // Join with AND to make a more specific search
    return searchTerms.slice(0, 5).join(' AND ');
  }

  private async extractStudyCharacteristics(
    rawPapers: StudyEvidence[]
  ): Promise<StudyEvidence[]> {
    // If no OpenAI API key, just return the raw papers
    if (!process.env.OPENAI_API_KEY || rawPapers.length === 0) {
      return rawPapers;
    }
    
    try {
      // Import OpenAI only when needed
      const OpenAI = await import('openai');
      const openai = new OpenAI.default({ apiKey: process.env.OPENAI_API_KEY });
      
      // Format the papers for the prompt
      const papersText = rawPapers
        .map((paper, index) => {
          return `Paper ${index + 1}:
Title: ${paper.title}
Authors: ${paper.authors}
Journal: ${paper.journal}
Year: ${paper.year}
Abstract: ${paper.summary}`;
        })
        .join('\n\n');
      
      // Use OpenAI to extract more characteristics
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: `You are a research analyst specializing in health studies. Extract key study characteristics from these papers.
            
            For each paper:
            1. Estimate the sample size based on typical studies of this type
            2. Identify any reported effect sizes or main findings
            3. Note any dosage information if applicable
            4. Estimate study duration
            5. Assign an evidence grade (High, Moderate, or Low) based on journal quality, sample size, and study design
            6. Write a concise 1-2 sentence summary focusing on methodology
            7. Write 2-3 sentences of additional details about methods and findings
            
            Return your analysis as a JSON array where each element has:
            {
              "paperIndex": number (1-based),
              "sampleSize": number (estimate if not provided),
              "effectSize": string,
              "dosage": string,
              "duration": string,
              "evidenceGrade": "High"|"Moderate"|"Low",
              "summary": string,
              "details": string
            }`
          },
          {
            role: "user",
            content: papersText
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5
      });
      
      // Parse the OpenAI response
      const content = response.choices[0].message.content || "{}";
      const analysisData = JSON.parse(content);
      
      // Ensure we have an array of analyses
      let analyses = [];
      if (Array.isArray(analysisData)) {
        analyses = analysisData;
      } else if (analysisData.papers && Array.isArray(analysisData.papers)) {
        analyses = analysisData.papers;
      } else if (analysisData.analyses && Array.isArray(analysisData.analyses)) {
        analyses = analysisData.analyses;
      } else if (analysisData.results && Array.isArray(analysisData.results)) {
        analyses = analysisData.results;
      }
      
      // Enhance the original papers with the analysis
      const enhancedPapers = rawPapers.map((paper, index) => {
        // Find the corresponding analysis, accounting for 0-based vs 1-based indexing
        const analysis = analyses.find((a: any) => 
          a.paperIndex === index + 1 || 
          a.index === index + 1 || 
          a.paperIndex === index || 
          a.index === index
        );
        
        if (analysis) {
          const enhancedPaper: StudyEvidence = {
            ...paper,
            sampleSize: analysis.sampleSize || 0,
            effectSize: analysis.effectSize || "Not specified",
            dosage: analysis.dosage || "Not specified",
            duration: analysis.duration || "Not specified",
            evidenceGrade: this.determineEvidenceGrade(analysis.evidenceGrade),
            summary: analysis.summary || paper.summary,
            details: analysis.details || undefined
          };
          return enhancedPaper;
        }
        
        return paper;
      });
      
      return enhancedPapers;
    } catch (error) {
      console.error('Error enhancing papers with OpenAI:', error);
      return rawPapers;
    }
  }

  private determineEvidenceGrade(
    grade?: string
  ): "High" | "Moderate" | "Low" {
    if (!grade) return "Moderate";
    
    const normalizedGrade = grade.toLowerCase();
    
    if (normalizedGrade.includes('high')) return "High";
    if (normalizedGrade.includes('low')) return "Low";
    
    return "Moderate";
  }

  async searchLiterature(claim: string, options: { limit?: number } = {}): Promise<StudyEvidence[]> {
    // Generate a search query from the claim
    const searchQuery = this.generateSearchQuery(claim);
    console.log(`Generated search query: "${searchQuery}" from claim: "${claim.substring(0, 50)}..."`);
    
    // Collect results from all providers
    const searchPromises = this.providers.map(provider => 
      provider.search(searchQuery, options)
    );
    
    const searchResults = await Promise.all(searchPromises);
    
    // Flatten and deduplicate results
    let allResults: StudyEvidence[] = [];
    for (const results of searchResults) {
      allResults = [...allResults, ...results];
    }
    
    // Deduplicate by title (simple approach)
    const seenTitles = new Set<string>();
    const uniqueResults: StudyEvidence[] = [];
    
    for (const paper of allResults) {
      const normalizedTitle = paper.title.toLowerCase().trim();
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueResults.push(paper);
      }
    }
    
    // Limit to requested number
    const limitedResults = uniqueResults.slice(0, options.limit || 5);
    
    // Extract more characteristics using OpenAI if available
    const enhancedResults = await this.extractStudyCharacteristics(limitedResults);
    
    return enhancedResults;
  }
}

// Singleton instance of the service
export const academicSearchService = new AcademicSearchService();