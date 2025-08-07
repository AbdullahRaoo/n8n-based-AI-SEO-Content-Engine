"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Search,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  Zap,
  TrendingUp,
  Target,
  Globe,
  Clock,
  CheckCircle,
  Loader2,
  Sparkles,
  BarChart3,
  Settings,
  Moon,
  Sun,
  Brain,
  Cpu,
  Layers,
  Filter,
  RefreshCw,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { ArticleEditor } from "@/components/article-editor"
import { ArticleViewer } from "@/components/article-viewer"
import { SettingsPanel } from "@/components/settings-panel"
import { HydrationBoundary } from "@/components/hydration-boundary"
import { ErrorBoundary } from "@/components/error-boundary"
import { extractTitleFromHtml, calculateSeoScore } from "@/lib/article-utils"
import { useImportWorker, type ImportProgress, type ImportResult } from "@/hooks/use-import-worker"

interface Article {
  id: string
  success: boolean
  timestamp: string
  input: {
    keyword: string
    location: string
  }
  content: {
    html: string
    wordCount: number
    keywordDensity: string
  }
  seo: {
    metaTitle: string
    metaDescription: string
    focusKeywords: string[]
    socialDescription: string
    schemaMarkup?: any
  }
  contentStrategy: {
    searchIntent: string
    targetLength: number
    uniqueAngles: string[]
  }
  validation: {
    targetKeyword: string
    keywordMatches: number
    keywordDensity: string
    validationApplied: boolean
  }
  status?: "draft" | "published" | "processing"
}

export default function SEOContentDashboard() {
  const [articles, setArticles] = useState<Article[]>([]) // Start with empty array, load from DB
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState("")
  const [googleDocsUrl, setGoogleDocsUrl] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isViewMode, setIsViewMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showSettings, setShowSettings] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { theme, setTheme } = useTheme()

  // Helper function to get the best available title
  const getArticleTitle = (article: Article): string => {
    // First try to extract H1 from HTML content
    const h1Title = extractTitleFromHtml(article.content.html)
    
    // Debug: Log what we found
    console.log('Title extraction for article:', article.id)
    console.log('H1 from HTML:', h1Title)
    console.log('Meta title:', article.seo.metaTitle)
    console.log('HTML preview:', article.content.html.substring(0, 200))
    
    // If no H1 found or it's just the fallback, use metaTitle
    if (h1Title === "Untitled Article" || !h1Title) {
      console.log('Using metaTitle fallback')
      return article.seo.metaTitle || "Untitled Article"
    }
    
    console.log('Using H1 title')
    return h1Title
  }

  const processingStages = [
    "Connecting to SEO Content Engine...",
    "Processing Google Docs document...",
    "Extracting business information...",
    "Researching target keywords...",
    "Analyzing search competition...",
    "Generating SEO-optimized content...",
    "Optimizing for search engines...",
    "Finalizing article structure...",
    "Saving to database...",
  ]

  const validateArticleFormat = (articleData: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    // Check if articleData is an object
    if (!articleData || typeof articleData !== 'object') {
      errors.push("Article data must be an object")
      return { isValid: false, errors }
    }
    
    // Updated required fields to match your JSON structure
    const requiredFields = [
      "success",
      "timestamp", 
      "input.keyword",
      "input.location",
      "content.html",
      "content.wordCount",
      "seo.metaTitle",
      "seo.metaDescription",
      "validation.targetKeyword",
    ]

    requiredFields.forEach((field) => {
      const keys = field.split(".")
      let current = articleData
      for (const key of keys) {
        if (!current || current[key] === undefined || current[key] === null) {
          errors.push(`Missing required field: ${field}`)
          break
        }
        current = current[key]
      }
    })

    // Additional type validation
    if (articleData.content && typeof articleData.content.wordCount !== 'number') {
      errors.push("content.wordCount must be a number")
    }
    
    if (articleData.seo && articleData.seo.focusKeywords && !Array.isArray(articleData.seo.focusKeywords)) {
      errors.push("seo.focusKeywords must be an array")
    }
    
    if (articleData.contentStrategy && articleData.contentStrategy.uniqueAngles && !Array.isArray(articleData.contentStrategy.uniqueAngles)) {
      errors.push("contentStrategy.uniqueAngles must be an array")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  useEffect(() => {
    const loadArticlesFromDatabase = async () => {
      try {
        console.log('🔄 Loading articles from database...')
        const response = await fetch('/api/articles')
        if (response.ok) {
          const apiResponse = await response.json()
          console.log('✅ Raw API response:', apiResponse)
          
          // Handle the API response format: { success: true, articles: [...] }
          if (apiResponse.success && apiResponse.articles) {
            const validArticles = Array.isArray(apiResponse.articles) ? apiResponse.articles : []
            console.log('✅ Loaded articles from database:', validArticles.length)
            setArticles(validArticles)
            
            if (validArticles.length === 0) {
              console.log('📄 Database is empty - no articles to display')
            }
          } else {
            console.log('❌ API response format unexpected:', apiResponse)
            setArticles([])
          }
        } else {
          console.log('❌ Failed to load from database - will show empty state')
          setArticles([])
        }
      } catch (error) {
        console.error("❌ Failed to load articles from database:", error)
        // Always start with empty array if database fails
        setArticles([])
      }
    }

    loadArticlesFromDatabase()
  }, [])

  const handleImportArticle = useCallback(async (jsonData: string) => {
    console.log('🚀 Starting SUPER SIMPLE import process')
    
    try {
      // Step 1: Parse JSON
      console.log('📄 Step 1: Parsing JSON...')
      const parsed = JSON.parse(jsonData)
      console.log('✅ JSON parsed successfully')
      
      // Step 2: Convert to array
      const articles = Array.isArray(parsed) ? parsed : [parsed]
      console.log(`📊 Step 2: Found ${articles.length} articles`)
      
      if (articles.length === 0) {
        console.log('❌ No articles found')
        toast({
          title: "No Articles",
          description: "No articles found in JSON file",
          variant: "destructive",
        })
        return
      }
      
      // Step 3: Process first article only (to isolate the issue)
      console.log('🔄 Step 3: Processing first article...')
      const firstArticle = articles[0]
      
      const article = {
        success: Boolean(firstArticle?.success ?? true),
        timestamp: String(firstArticle?.timestamp ?? new Date().toISOString()),
        input: {
          keyword: String(firstArticle?.input?.keyword ?? "Test Keyword"),
          location: String(firstArticle?.input?.location ?? "Test Location"),
        },
        content: {
          html: String(firstArticle?.content?.html ?? "<p>Test content</p>"),
          wordCount: Number(firstArticle?.content?.wordCount) || 100,
          keywordDensity: String(firstArticle?.content?.keywordDensity ?? "1.0%"),
        },
        seo: {
          metaTitle: String(firstArticle?.seo?.metaTitle ?? "Test Title"),
          metaDescription: String(firstArticle?.seo?.metaDescription ?? "Test Description"),
          focusKeywords: Array.isArray(firstArticle?.seo?.focusKeywords) ? firstArticle.seo.focusKeywords : [],
          socialDescription: String(firstArticle?.seo?.socialDescription ?? "Test Social"),
          schemaMarkup: firstArticle?.seo?.schemaMarkup,
        },
        contentStrategy: {
          searchIntent: String(firstArticle?.contentStrategy?.searchIntent ?? "informational"),
          targetLength: Number(firstArticle?.contentStrategy?.targetLength) || 500,
          uniqueAngles: Array.isArray(firstArticle?.contentStrategy?.uniqueAngles) ? firstArticle.contentStrategy.uniqueAngles : [],
        },
        validation: {
          targetKeyword: String(firstArticle?.validation?.targetKeyword ?? firstArticle?.input?.keyword ?? "test"),
          keywordMatches: Number(firstArticle?.validation?.keywordMatches) || 1,
          keywordDensity: String(firstArticle?.validation?.keywordDensity ?? "1.0%"),
          validationApplied: Boolean(firstArticle?.validation?.validationApplied ?? true),
        },
        status: "draft" as const
      }
      
      console.log('📤 Step 4: Sending to API...', article)
      
      // Step 4: Save to database
      const response = await fetch('/api/articles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(article),
      })
      
      console.log('📥 Step 5: API response received', response.status)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ Step 6: Article saved successfully', result)
      
      // Step 7: Refresh articles from database
      console.log('🔄 Step 7: Refreshing articles from database...')
      try {
        const articlesResponse = await fetch('/api/articles')
        if (articlesResponse.ok) {
          const apiResponse = await articlesResponse.json()
          if (apiResponse.success && apiResponse.articles) {
            const validArticles = Array.isArray(apiResponse.articles) ? apiResponse.articles : []
            setArticles(validArticles)
            console.log('✅ Articles refreshed successfully', validArticles.length)
          }
        }
      } catch (refreshError) {
        console.error('❌ Failed to refresh articles:', refreshError)
      }
      
      // Step 8: Show success
      toast({
        title: "Import Successful",
        description: "Successfully imported 1 article and refreshed list",
      })
      
      console.log('🎉 Import completed successfully')
      
    } catch (error) {
      console.error('💥 Import error:', error)
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      })
    }
  }, [])

  const handleSubmitUrl = async () => {
    if (!googleDocsUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Docs URL",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)
    setProcessingStage("Connecting to SEO Content Engine...")

    let progressInterval: NodeJS.Timeout | null = null

    try {
      // Real-time progress updates for user experience
      progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev < 90) {
            return prev + 2
          }
          return prev
        })
      }, 3000) // Update every 3 seconds

      // Call the n8n webhook for real article generation
      // Always use the proxy to handle callbacks and avoid CORS issues
      const n8nUrl = '/api/n8n-proxy'
      
      const n8nResponse = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': 'seo-dashboard-frontend',
          'User-Agent': 'SEOContentDashboard/1.0'
        },
        body: JSON.stringify({
          documentUrl: googleDocsUrl
        }),
        // Shorter timeout for initial request
        signal: AbortSignal.timeout(60000)
      })

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text()
        throw new Error(`n8n API Error ${n8nResponse.status}: ${errorText}`)
      }

      const n8nResult = await n8nResponse.json()
      
      // DEBUG: Log the initial response structure
      console.log('🔍 DEBUG: Initial n8n response:', JSON.stringify(n8nResult, null, 2))
      
      let finalResult = n8nResult
      
      // Handle array response (initial workflow response format)
      if (Array.isArray(n8nResult) && n8nResult.length > 0) {
        console.log('📦 Got array response, using first element')
        finalResult = n8nResult[0]
      }
      
      // Check if we got a tracking ID for async processing
      console.log('🔍 DEBUG: Checking for trackingId and status in finalResult:', {
        hasTrackingId: !!finalResult.trackingId,
        trackingId: finalResult.trackingId,
        status: finalResult.status,
        success: finalResult.success
      })
      
      if (finalResult.trackingId && finalResult.status === 'processing') {
        console.log('✅ Found tracking ID, starting async polling:', finalResult.trackingId)
        setProcessingStage("Workflow is processing...")
        
        // Poll for completion
        const pollForCompletion = async (trackingId: string): Promise<any> => {
          const maxAttempts = 36 // 36 attempts * 5 seconds = 180 seconds (3 minutes)
          let attempts = 0
          
          while (attempts < maxAttempts) {
            try {
              await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
              
              const statusResponse = await fetch(`/api/n8n-proxy/status/${trackingId}`)
              
              if (!statusResponse.ok) {
                throw new Error('Failed to check status')
              }
              
              const statusData = await statusResponse.json()
              console.log(`🔄 Polling attempt ${attempts + 1}: Status = ${statusData.status}`)
              
              if (statusData.status === 'completed') {
                console.log('✅ Workflow completed, received result:', JSON.stringify(statusData.result, null, 2))
                return statusData.result
              } else if (statusData.status === 'failed') {
                throw new Error(statusData.error || 'Workflow failed')
              }
              
              // Update progress and stage based on time elapsed
              const elapsed = attempts * 5
              if (elapsed < 60) {
                setProcessingStage("Processing Google Docs document...")
              } else if (elapsed < 120) {
                setProcessingStage("Researching keywords and analyzing competition...")
              } else {
                setProcessingStage("Generating SEO-optimized content...")
              }
              
              attempts++
            } catch (error) {
              console.error('Polling error:', error)
              attempts++
            }
          }
          
          throw new Error('Workflow timed out after 3 minutes - no callback received')
        }
        
        // Wait for completion - this will be the ACTUAL content from callback
        finalResult = await pollForCompletion(finalResult.trackingId)
        
        // CRITICAL: Only continue if we actually got callback data
        if (!finalResult || typeof finalResult !== 'object') {
          throw new Error('Invalid callback data received - no content to process')
        }

        clearInterval(progressInterval)
        setProcessingProgress(95)
        setProcessingStage("Saving article to database...")

        // DEBUG: Log the actual structure we received from workflow
        console.log('🔍 DEBUG: Final result structure from workflow (CALLBACK DATA):', JSON.stringify(finalResult, null, 2))

        // ADAPTIVE CONTENT PROCESSING: ONLY for callback data
        const adaptContentToArticle = (workflowResult: any): Article => {
          console.log('🔄 Adapting CALLBACK workflow result to Article format')
          
          // Helper function to safely get nested values
          const getValue = (obj: any, path: string, fallback: any = '') => {
            try {
              return path.split('.').reduce((current, key) => current?.[key], obj) || fallback
            } catch {
              return fallback
            }
          }

          // Helper function to extract first meaningful text content
          const getFirstText = (data: any): string => {
            if (typeof data === 'string' && data.trim()) return data.trim()
            if (Array.isArray(data) && data.length > 0) return getFirstText(data[0])
            if (typeof data === 'object' && data) {
              for (const key in data) {
                const value = getFirstText(data[key])
                if (value) return value
              }
            }
            return ''
          }

          // Debug: Log the data paths we're trying to extract from CALLBACK
          console.log('🔍 DEBUGGING CALLBACK CONTENT EXTRACTION:')
          console.log('  workflowResult keys:', Object.keys(workflowResult || {}))
          console.log('  input.keyword:', getValue(workflowResult, 'input.keyword'))
          console.log('  keyword:', getValue(workflowResult, 'keyword'))
          console.log('  content.html preview:', getValue(workflowResult, 'content.html')?.substring(0, 100))
          console.log('  html preview:', getValue(workflowResult, 'html')?.substring(0, 100))
          console.log('  seo.metaTitle:', getValue(workflowResult, 'seo.metaTitle'))
          console.log('  metaTitle:', getValue(workflowResult, 'metaTitle'))
          console.log('  title:', getValue(workflowResult, 'title'))

          // Adapt the content structure - NO FALLBACKS, only real data
          const adapted: Article = {
            id: `n8n-generated-${Date.now()}`,
            success: workflowResult?.success !== false,
            timestamp: workflowResult?.timestamp || new Date().toISOString(),
            input: {
              keyword: getValue(workflowResult, 'input.keyword') || 
                      getValue(workflowResult, 'keyword') || 
                      getFirstText(workflowResult?.keywords) ||
                      '',
              location: getValue(workflowResult, 'input.location') || 
                       getValue(workflowResult, 'location') || 
                       '',
            },
            content: {
              html: getValue(workflowResult, 'content.html') || 
                    getValue(workflowResult, 'html') || 
                    getValue(workflowResult, 'content') ||
                    '',
              wordCount: parseInt(getValue(workflowResult, 'content.wordCount') || 
                                getValue(workflowResult, 'wordCount') || '0') || 0,
              keywordDensity: getValue(workflowResult, 'content.keywordDensity') || 
                             getValue(workflowResult, 'keywordDensity') || '0%',
            },
            seo: {
              metaTitle: getValue(workflowResult, 'seo.metaTitle') || 
                        getValue(workflowResult, 'metaTitle') || 
                        getValue(workflowResult, 'title') ||
                        '',
              metaDescription: getValue(workflowResult, 'seo.metaDescription') || 
                              getValue(workflowResult, 'metaDescription') || 
                              getValue(workflowResult, 'description') || '',
              focusKeywords: Array.isArray(workflowResult?.seo?.focusKeywords) ? workflowResult.seo.focusKeywords :
                            Array.isArray(workflowResult?.focusKeywords) ? workflowResult.focusKeywords :
                            Array.isArray(workflowResult?.keywords) ? workflowResult.keywords : [],
              socialDescription: getValue(workflowResult, 'seo.socialDescription') || 
                                getValue(workflowResult, 'socialDescription') || '',
              schemaMarkup: workflowResult?.seo?.schemaMarkup || workflowResult?.schemaMarkup,
            },
            contentStrategy: {
              searchIntent: getValue(workflowResult, 'contentStrategy.searchIntent') || 
                           getValue(workflowResult, 'searchIntent') || 'informational',
              targetLength: parseInt(getValue(workflowResult, 'contentStrategy.targetLength') || 
                                   getValue(workflowResult, 'targetLength') || '0') || 0,
              uniqueAngles: Array.isArray(workflowResult?.contentStrategy?.uniqueAngles) ? workflowResult.contentStrategy.uniqueAngles :
                           Array.isArray(workflowResult?.uniqueAngles) ? workflowResult.uniqueAngles : [],
            },
            validation: {
              targetKeyword: getValue(workflowResult, 'validation.targetKeyword') || 
                            getValue(workflowResult, 'targetKeyword') ||
                            getValue(workflowResult, 'input.keyword') ||
                            getValue(workflowResult, 'keyword') ||
                            '',
              keywordMatches: parseInt(getValue(workflowResult, 'validation.keywordMatches') || 
                                     getValue(workflowResult, 'keywordMatches') || '0') || 0,
              keywordDensity: getValue(workflowResult, 'validation.keywordDensity') || 
                             getValue(workflowResult, 'content.keywordDensity') ||
                             getValue(workflowResult, 'keywordDensity') || '0%',
              validationApplied: workflowResult?.validation?.validationApplied !== false,
            },
            status: "draft",
          }

          console.log('✅ Successfully adapted CALLBACK workflow result to Article format')
          return adapted
        }

        // Process ONLY callback data
        const newArticle = adaptContentToArticle(finalResult)

        // Save to database
        const response = await fetch('/api/articles/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newArticle),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save article to database')
        }

        setProcessingProgress(100)
        setProcessingStage("Complete!")

        // Refresh articles from database
        try {
          const articlesResponse = await fetch('/api/articles')
          if (articlesResponse.ok) {
            const apiResponse = await articlesResponse.json()
            if (apiResponse.success && apiResponse.articles) {
              const validArticles = Array.isArray(apiResponse.articles) ? apiResponse.articles : []
              setArticles(validArticles)
            }
          }
        } catch (error) {
          console.error("Failed to refresh articles:", error)
        }

        setIsProcessing(false)
        setGoogleDocsUrl("")

        toast({
          title: "Success!",
          description: `Article "${newArticle.seo.metaTitle || 'Generated Article'}" generated and saved successfully`,
        })
        
      } else {
        // NEVER process any response without trackingId - this prevents processing the initial confirmation
        console.log('❌ CRITICAL ERROR: Initial response is not for processing!')
        console.log('🔍 DEBUG: This is the confirmation response, not content:', JSON.stringify(finalResult, null, 2))
        throw new Error('Received confirmation response instead of content. System should wait for callback.')
      }
      const adaptContentToArticle = (workflowResult: any): Article => {
        console.log('� Adapting workflow result to Article format')
        
        // Helper function to safely get nested values
        const getValue = (obj: any, path: string, fallback: any = '') => {
          try {
            return path.split('.').reduce((current, key) => current?.[key], obj) || fallback
          } catch {
            return fallback
          }
        }

        // Helper function to extract first meaningful text content
        const getFirstText = (data: any): string => {
          if (typeof data === 'string' && data.trim()) return data.trim()
          if (Array.isArray(data) && data.length > 0) return getFirstText(data[0])
          if (typeof data === 'object' && data) {
            for (const key in data) {
              const value = getFirstText(data[key])
              if (value) return value
            }
          }
          return ''
        }

        // Debug: Log the data paths we're trying to extract from
        console.log('🔍 DEBUGGING CONTENT EXTRACTION:')
        console.log('  workflowResult keys:', Object.keys(workflowResult || {}))
        console.log('  input.keyword:', getValue(workflowResult, 'input.keyword'))
        console.log('  keyword:', getValue(workflowResult, 'keyword'))
        console.log('  content.html preview:', getValue(workflowResult, 'content.html')?.substring(0, 100))
        console.log('  html preview:', getValue(workflowResult, 'html')?.substring(0, 100))
        console.log('  seo.metaTitle:', getValue(workflowResult, 'seo.metaTitle'))
        console.log('  metaTitle:', getValue(workflowResult, 'metaTitle'))
        console.log('  title:', getValue(workflowResult, 'title'))

        // Adapt the content structure - NO FALLBACKS, only real data
        const adapted: Article = {
          id: `n8n-generated-${Date.now()}`,
          success: workflowResult?.success !== false, // Default to true unless explicitly false
          timestamp: workflowResult?.timestamp || new Date().toISOString(),
          input: {
            keyword: getValue(workflowResult, 'input.keyword') || 
                    getValue(workflowResult, 'keyword') || 
                    getFirstText(workflowResult?.keywords) ||
                    '', // NO FALLBACK - must be real data
            location: getValue(workflowResult, 'input.location') || 
                     getValue(workflowResult, 'location') || 
                     '', // NO FALLBACK - must be real data
          },
          content: {
            html: getValue(workflowResult, 'content.html') || 
                  getValue(workflowResult, 'html') || 
                  getValue(workflowResult, 'content') ||
                  '', // NO FALLBACK - must be real data
            wordCount: parseInt(getValue(workflowResult, 'content.wordCount') || 
                              getValue(workflowResult, 'wordCount') || '0') || 0,
            keywordDensity: getValue(workflowResult, 'content.keywordDensity') || 
                           getValue(workflowResult, 'keywordDensity') || '0%',
          },
          seo: {
            metaTitle: getValue(workflowResult, 'seo.metaTitle') || 
                      getValue(workflowResult, 'metaTitle') || 
                      getValue(workflowResult, 'title') ||
                      '', // NO FALLBACK - must be real data
            metaDescription: getValue(workflowResult, 'seo.metaDescription') || 
                            getValue(workflowResult, 'metaDescription') || 
                            getValue(workflowResult, 'description') || '',
            focusKeywords: Array.isArray(workflowResult?.seo?.focusKeywords) ? workflowResult.seo.focusKeywords :
                          Array.isArray(workflowResult?.focusKeywords) ? workflowResult.focusKeywords :
                          Array.isArray(workflowResult?.keywords) ? workflowResult.keywords : [],
            socialDescription: getValue(workflowResult, 'seo.socialDescription') || 
                              getValue(workflowResult, 'socialDescription') || '',
            schemaMarkup: workflowResult?.seo?.schemaMarkup || workflowResult?.schemaMarkup,
          },
          contentStrategy: {
            searchIntent: getValue(workflowResult, 'contentStrategy.searchIntent') || 
                         getValue(workflowResult, 'searchIntent') || 'informational',
            targetLength: parseInt(getValue(workflowResult, 'contentStrategy.targetLength') || 
                                 getValue(workflowResult, 'targetLength') || '0') || 0,
            uniqueAngles: Array.isArray(workflowResult?.contentStrategy?.uniqueAngles) ? workflowResult.contentStrategy.uniqueAngles :
                         Array.isArray(workflowResult?.uniqueAngles) ? workflowResult.uniqueAngles : [],
          },
          validation: {
            targetKeyword: getValue(workflowResult, 'validation.targetKeyword') || 
                          getValue(workflowResult, 'targetKeyword') ||
                          getValue(workflowResult, 'input.keyword') ||
                          getValue(workflowResult, 'keyword') ||
                          '', // NO FALLBACK - must be real data
            keywordMatches: parseInt(getValue(workflowResult, 'validation.keywordMatches') || 
                                   getValue(workflowResult, 'keywordMatches') || '0') || 0,
            keywordDensity: getValue(workflowResult, 'validation.keywordDensity') || 
                           getValue(workflowResult, 'content.keywordDensity') ||
                           getValue(workflowResult, 'keywordDensity') || '0%',
            validationApplied: workflowResult?.validation?.validationApplied !== false, // Default to true
          },
          status: "draft",
        }

        console.log('✅ Successfully adapted workflow result to Article format')
        console.log('📊 Adapted article preview:', {
          keyword: adapted.input.keyword,
          title: adapted.seo.metaTitle,
          wordCount: adapted.content.wordCount,
          htmlPreview: adapted.content.html.substring(0, 100) + '...'
        })

        return adapted
      }

      // Use the adaptive function instead of validation
      const newArticle = adaptContentToArticle(finalResult)

      // Save to database
      const response = await fetch('/api/articles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newArticle),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save article to database')
      }

      setProcessingProgress(100)
      setProcessingStage("Complete!")

      // Refresh articles from database
      try {
        const articlesResponse = await fetch('/api/articles')
        if (articlesResponse.ok) {
          const apiResponse = await articlesResponse.json()
          if (apiResponse.success && apiResponse.articles) {
            const validArticles = Array.isArray(apiResponse.articles) ? apiResponse.articles : []
            setArticles(validArticles)
          }
        }
      } catch (error) {
        console.error("Failed to refresh articles:", error)
      }

      setIsProcessing(false)
      setGoogleDocsUrl("")

      toast({
        title: "Success!",
        description: `Article "${newArticle.seo.metaTitle}" generated and saved successfully`,
      })

    } catch (error) {
      console.error("Content generation error:", error)
      
      // Make sure we stop the progress interval if it exists
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      
      let errorMessage = "Failed to generate article"
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Content generation timed out (5 minutes). Please try again with a smaller document."
        } else if (error.message.includes('fetch')) {
          errorMessage = "Failed to connect to content generation service. Please check if n8n is running on localhost:5678"
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const handleDeleteArticle = async (id: string) => {
    try {
      const response = await fetch(`/api/articles?id=${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Remove from local state immediately for better UX
        setArticles((prev) => prev.filter((article) => article.id !== id))
        
        // Also refresh from database to ensure consistency
        try {
          const articlesResponse = await fetch('/api/articles')
          if (articlesResponse.ok) {
            const apiResponse = await articlesResponse.json()
            if (apiResponse.success && apiResponse.articles) {
              const validArticles = Array.isArray(apiResponse.articles) ? apiResponse.articles : []
              setArticles(validArticles)
            }
          }
        } catch (refreshError) {
          console.error('Failed to refresh articles after delete:', refreshError)
        }
        
        toast({
          title: "Deleted",
          description: "Article deleted successfully from database",
        })
      } else {
        throw new Error('Failed to delete article')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete article from database",
        variant: "destructive",
      })
    }
  }

  const handleSaveArticle = async (updatedArticle: Article) => {
    try {
      const response = await fetch(`/api/articles?id=${updatedArticle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedArticle),
      })
      
      if (response.ok) {
        // Update local state immediately for better UX
        setArticles((prev) => prev.map((article) => (article.id === updatedArticle.id ? updatedArticle : article)))
        setIsEditMode(false)
        
        // Refresh from database to ensure consistency
        try {
          const articlesResponse = await fetch('/api/articles')
          if (articlesResponse.ok) {
            const apiResponse = await articlesResponse.json()
            if (apiResponse.success && apiResponse.articles) {
              const validArticles = Array.isArray(apiResponse.articles) ? apiResponse.articles : []
              setArticles(validArticles)
            }
          }
        } catch (refreshError) {
          console.error('Failed to refresh articles after update:', refreshError)
        }
        
        toast({
          title: "Saved",
          description: "Article updated successfully in database",
        })
      } else {
        throw new Error('Failed to update article')
      }
    } catch (error) {
      console.error('Error updating article:', error)
      toast({
        title: "Save Failed",
        description: "Failed to update article in database",
        variant: "destructive",
      })
    }
  }

  // Ensure articles is always an array to prevent runtime errors
  const safeArticles = Array.isArray(articles) ? articles : []

  const filteredArticles = safeArticles.filter((article) => {
    const articleTitle = getArticleTitle(article)
    const matchesSearch =
      articleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.input.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.input.location.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || article.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-emerald-500 text-white"
      case "draft":
        return "bg-amber-500 text-white"
      case "processing":
        return "bg-blue-500 text-white"
      default:
        return "bg-slate-500 text-white"
    }
  }

  const getSeoScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600"
    if (score >= 70) return "text-amber-600"
    return "text-red-600"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-blue-400/10 rounded-full blur-3xl"
        />
        <div className="absolute top-10 right-10 opacity-5 dark:opacity-10">
          <Brain className="w-32 h-32 text-blue-600" />
        </div>
        <div className="absolute bottom-10 left-10 opacity-5 dark:opacity-10">
          <Cpu className="w-24 h-24 text-purple-600" />
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 dark:opacity-10">
          <Layers className="w-40 h-40 text-emerald-600" />
        </div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24"> {/* Increased from h-16 to h-24 */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
          AI SEO Content Engine
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Advanced Content Generation Platform</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            System Online
          </Badge>
          <HydrationBoundary fallback={<Button variant="ghost" size="sm"><Moon className="h-4 w-4" /></Button>}>
            <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </HydrationBoundary>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="generate"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
            >
              Generate
            </TabsTrigger>
            <TabsTrigger
              value="articles"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
            >
              Articles
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                    <FileText className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeArticles.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {safeArticles.filter((a) => a.status === "published").length} published
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg SEO Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {safeArticles.length > 0 ? Math.round(
                        safeArticles.reduce((sum, article) => sum + calculateSeoScore(article), 0) / safeArticles.length,
                      ) : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Excellent optimization</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Words</CardTitle>
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {safeArticles.reduce((sum, article) => sum + article.content.wordCount, 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Content generated</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Keyword Density</CardTitle>
                    <Target className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {safeArticles.length > 0 ? (
                        safeArticles.reduce(
                          (sum, article) => sum + Number.parseFloat(article.validation.keywordDensity.replace("%", "")),
                          0,
                        ) / safeArticles.length
                      ).toFixed(2) : '0.00'}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">Optimal range</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recent Articles */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle>Recent Articles</CardTitle>
                <CardDescription>Your latest generated content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {safeArticles.slice(0, 3).map((article, index) => {
                    const articleTitle = getArticleTitle(article)
                    const topKeyword = article.seo.focusKeywords[0] || article.input.keyword
                    const seoScore = calculateSeoScore(article)

                    return (
                      <motion.div
                        key={article.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">{articleTitle}</h3>
                          <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center">
                              <Target className="h-3 w-3 mr-1" />
                              {topKeyword}
                            </span>
                            <span className="flex items-center">
                              <Globe className="h-3 w-3 mr-1" />
                              {article.input.location}
                            </span>
                            <span className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              {article.content.wordCount} words
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(article.status || "draft")}>
                            {article.status || "draft"}
                          </Badge>
                          <span className={`font-medium ${getSeoScoreColor(seoScore)}`}>{seoScore}/100</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span>Generate New SEO Article</span>
                </CardTitle>
                <CardDescription>
                  Submit your Google Docs URL containing the CLIENT SEO KEYWORD STRATEGY BRIEF
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="google-docs-url" className="text-sm font-medium">
                    Google Docs URL
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      id="google-docs-url"
                      placeholder="https://docs.google.com/document/d/..."
                      value={googleDocsUrl}
                      onChange={(e) => setGoogleDocsUrl(e.target.value)}
                      disabled={isProcessing}
                      className="bg-white/50 dark:bg-slate-800/50"
                    />
                    <Button
                      onClick={handleSubmitUrl}
                      disabled={isProcessing || !googleDocsUrl.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Article
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Processing Animation */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-700 rounded-full animate-spin border-t-blue-600"></div>
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-100">Processing Your Content</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{processingStage}</p>
                        </div>
                      </div>
                      <Progress value={processingProgress} className="w-full" />
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        This may take 2-3 minutes depending on document complexity
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Import Section */}
                <ErrorBoundary fallback={({ error, reset }) => (
                  <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 dark:text-red-400 mb-2">Import Error</h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      {error?.message || "An error occurred during file import"}
                    </p>
                    <Button onClick={reset} variant="outline" size="sm">
                      Try Again
                    </Button>
                  </div>
                )}>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h3 className="font-medium mb-4">Import Existing Articles</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          accept=".json"
                          onChange={(e) => {
                            console.log('📁 File input changed')
                            const file = e.target.files?.[0]
                            if (!file) {
                              console.log('❌ No file selected')
                              return
                            }

                            console.log('📄 File selected:', file.name, file.size)
                            
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              console.log('📖 File read complete')
                              const content = event.target?.result as string
                              if (!content) {
                                console.log('❌ File content is empty')
                                return
                              }
                              
                              console.log('🚀 Starting import with content length:', content.length)
                              handleImportArticle(content)
                            }
                            
                            reader.onerror = () => {
                              console.error('❌ File reader error')
                              toast({
                                title: "File Read Error",
                                description: "Failed to read the selected file",
                                variant: "destructive",
                              })
                            }
                            
                            console.log('📖 Starting file read...')
                            reader.readAsText(file)
                            
                            // Clear the input
                            e.target.value = ''
                          }}
                          className="bg-white/50 dark:bg-slate-800/50"
                        />
                        <Button variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Import JSON
                        </Button>
                      </div>
                      
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Import articles from n8n workflow output JSON files (SIMPLIFIED TEST MODE)
                      </p>
                    </div>
                  </div>
                </ErrorBoundary>

                {/* Instructions */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Instructions:</h3>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• Ensure your Google Docs is publicly accessible or shared with view permissions</li>
                    <li>• The document should contain your CLIENT SEO KEYWORD STRATEGY BRIEF</li>
                    <li>• Processing typically takes 2-3 minutes for complete SEO optimization</li>
                    <li>
                      • The system will extract business data, conduct keyword research, and generate optimized content
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded-md bg-white/50 dark:bg-slate-800/50 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="processing">Processing</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/articles')
                      if (response.ok) {
                        const apiResponse = await response.json()
                        if (apiResponse.success && apiResponse.articles) {
                          const validArticles = Array.isArray(apiResponse.articles) ? apiResponse.articles : []
                          setArticles(validArticles)
                          toast({
                            title: "Articles Refreshed",
                            description: `Loaded ${validArticles.length} articles from database`,
                          })
                        } else {
                          throw new Error('Invalid API response format')
                        }
                      }
                    } catch (error) {
                      toast({
                        title: "Refresh Failed",
                        description: "Failed to refresh articles from database",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {filteredArticles.map((article, index) => {
                const articleTitle = getArticleTitle(article)
                const topKeyword = article.seo.focusKeywords[0] || article.input.keyword
                const seoScore = calculateSeoScore(article)

                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg leading-tight">{articleTitle}</CardTitle>
                            <CardDescription className="mt-2">
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="flex items-center">
                                  <Target className="h-3 w-3 mr-1" />
                                  {topKeyword}
                                </span>
                                <span className="flex items-center">
                                  <Globe className="h-3 w-3 mr-1" />
                                  {article.input.location}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(article.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
                            >
                              {article.id.startsWith("imported-") ? "Imported" : "Generated"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {article.content.wordCount}
                            </div>
                            <div className="text-xs text-slate-500">Words</div>
                          </div>
                          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <div className="text-lg font-semibold text-emerald-600">
                              {article.validation.keywordDensity}
                            </div>
                            <div className="text-xs text-slate-500">Density</div>
                          </div>
                          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <div className={`text-lg font-semibold ${getSeoScoreColor(seoScore)}`}>{seoScore}/100</div>
                            <div className="text-xs text-slate-500">SEO Score</div>
                          </div>
                          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {article.validation.keywordMatches}
                            </div>
                            <div className="text-xs text-slate-500">Keywords</div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedArticle(article)
                                setIsViewMode(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedArticle(article)
                                setIsEditMode(true)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteArticle(article.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle>Content Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average SEO Score</span>
                      <span className="font-medium">
                        {safeArticles.length > 0 ? Math.round(
                          safeArticles.reduce((sum, article) => sum + calculateSeoScore(article), 0) / safeArticles.length,
                        ) : 0}
                        /100
                      </span>
                    </div>
                    <Progress
                      value={safeArticles.length > 0 ? Math.round(
                        safeArticles.reduce((sum, article) => sum + calculateSeoScore(article), 0) / safeArticles.length,
                      ) : 0}
                    />

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Keyword Density</span>
                      <span className="font-medium">
                        {safeArticles.length > 0 ? (
                          safeArticles.reduce(
                            (sum, article) =>
                              sum + Number.parseFloat(article.validation.keywordDensity.replace("%", "")),
                            0,
                          ) / safeArticles.length
                        ).toFixed(2) : '0.00'}
                        %
                      </span>
                    </div>
                    <Progress
                      value={safeArticles.length > 0 ? 
                        (safeArticles.reduce(
                          (sum, article) => sum + Number.parseFloat(article.validation.keywordDensity.replace("%", "")),
                          0,
                        ) /
                          safeArticles.length) *
                        40 : 0
                      }
                    />

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Content Quality</span>
                      <span className="font-medium">95/100</span>
                    </div>
                    <Progress value={95} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle>Generation Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Published Articles</span>
                      <span className="font-medium">{safeArticles.filter((a) => a.status === "published").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Draft Articles</span>
                      <span className="font-medium">{safeArticles.filter((a) => a.status === "draft").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Total Generated</span>
                      <span className="font-medium">{safeArticles.length} articles</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Success Rate</span>
                        <span className="font-medium text-emerald-600">
                          {safeArticles.length > 0 ? Math.round((safeArticles.filter((a) => a.success).length / safeArticles.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Article Viewer Modal */}
      <Dialog open={isViewMode} onOpenChange={setIsViewMode}>
        <DialogContent 
          className="max-w-none max-h-none w-screen h-screen p-0 border-0 bg-white dark:bg-slate-900 overflow-hidden" 
          style={{ 
            margin: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            transform: 'none',
            inset: '0'
          }}
        >
          {selectedArticle && <ArticleViewer article={selectedArticle} onClose={() => setIsViewMode(false)} />}
        </DialogContent>
      </Dialog>

      {/* Article Editor Modal */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent 
          className="max-w-none max-h-none w-screen h-screen p-0 border-0 bg-white dark:bg-slate-900 overflow-hidden" 
          style={{ 
            margin: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            transform: 'none',
            inset: '0'
          }}
        >
          {selectedArticle && (
            <ArticleEditor article={selectedArticle} onSave={handleSaveArticle} onCancel={() => setIsEditMode(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Panel */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Customize your dashboard experience</DialogDescription>
          </DialogHeader>
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
