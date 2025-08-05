"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Download, Target, Globe, Clock, BarChart3, TrendingUp, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { extractTitleFromHtml, cleanAndEnhanceContent, calculateSeoScore } from "@/lib/article-utils"

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

interface ArticleViewerProps {
  article: Article
  onClose: () => void
}

export function ArticleViewer({ article, onClose }: ArticleViewerProps) {
  const [activeTab, setActiveTab] = useState("content")

  const articleTitle = extractTitleFromHtml(article.content.html)
  const topKeyword = article.seo.focusKeywords[0] || article.input.keyword
  const seoScore = calculateSeoScore(article)

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    })
  }

  const exportArticle = () => {
    const dataStr = JSON.stringify(article, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `article-${article.id}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()

    toast({
      title: "Exported!",
      description: "Article exported as JSON file",
    })
  }

  return (
    <div className="article-viewer-container w-full h-screen flex flex-col relative overflow-hidden">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header - Similar to your HTML template */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-12">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">{articleTitle}</h1>
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Target className="h-3 w-3 mr-1" />
                {topKeyword}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Globe className="h-3 w-3 mr-1" />
                {article.input.location}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(article.timestamp).toLocaleDateString()}
              </Badge>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" size="sm" onClick={exportArticle}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="secondary" size="sm" onClick={() => copyToClipboard(article.content.html, "HTML content")}>
              <Copy className="h-4 w-4 mr-2" />
              Copy HTML
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
          <TabsTrigger value="content">Article Content</TabsTrigger>
          <TabsTrigger value="metrics">Content Metrics</TabsTrigger>
          <TabsTrigger value="seo">SEO Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="article-content-scrollable flex-1 h-full mt-0 p-0">
          {/* Blog Post Content with Enhanced Typography - Direct content without duplicate title */}
          <div className="bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 min-h-screen">
            <div className="max-w-4xl mx-auto px-6 py-16">
              <article
                className="prose-custom text-slate-700 dark:text-slate-300 leading-relaxed"
                style={{
                  fontSize: '18px',
                  lineHeight: '1.75',
                  color: '#374151'
                }}
                dangerouslySetInnerHTML={{
                  __html: cleanAndEnhanceContent(article.content.html),
                }}
              />
            </div>
          </div>

          {/* Article Footer with Better Styling */}
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-t border-slate-200 dark:border-slate-700">
            <div className="max-w-4xl mx-auto px-6 py-12">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 rounded-full px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{article.content.wordCount}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">words</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 rounded-full px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
                    <BarChart3 className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{seoScore}/100</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">SEO</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" size="sm" onClick={exportArticle} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(article.content.html, "HTML content")}
                    className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy HTML
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="flex-1 mt-0 overflow-auto">
          <div className="h-full overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{article.content.wordCount}</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Total Words</div>
                </div>
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <Target className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-emerald-600">{article.validation.keywordMatches}</div>
                  <div className="text-sm text-emerald-700 dark:text-emerald-300">Keyword Matches</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{article.validation.keywordDensity}</div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Keyword Density</div>
                </div>
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <TrendingUp className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-amber-600">{seoScore}/100</div>
                  <div className="text-sm text-amber-700 dark:text-amber-300">SEO Score</div>
                </div>
              </div>

              {/* Content Strategy */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Content Strategy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Search Intent</label>
                    <Badge variant="outline" className="text-sm">
                      {article.contentStrategy.searchIntent}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Target Length</label>
                    <span className="text-lg font-semibold">{article.contentStrategy.targetLength} words</span>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Unique Angles</label>
                  <div className="space-y-2">
                    {article.contentStrategy.uniqueAngles.map((angle, index) => (
                      <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-sm">{angle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Validation Status */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Validation Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Content Validation</span>
                    <Badge variant={article.validation.validationApplied ? "default" : "secondary"}>
                      {article.validation.validationApplied ? "Applied" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Generation Success</span>
                    <Badge variant={article.success ? "default" : "destructive"}>
                      {article.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Target Keyword</span>
                    <span className="font-medium text-sm">{article.validation.targetKeyword}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="flex-1 mt-0 overflow-auto">
          <div className="h-full overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* SEO Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm text-muted-foreground">Meta Title</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(article.seo.metaTitle, "Meta title")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm mb-2">{article.seo.metaTitle}</p>
                    <div className="text-xs text-muted-foreground">{article.seo.metaTitle.length}/60 characters</div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm text-muted-foreground">Meta Description</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(article.seo.metaDescription, "Meta description")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm mb-2">{article.seo.metaDescription}</p>
                    <div className="text-xs text-muted-foreground">
                      {article.seo.metaDescription.length}/160 characters
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Focus Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {article.seo.focusKeywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Social Description</h3>
                    <p className="text-sm">{article.seo.socialDescription}</p>
                  </div>
                </div>
              </div>

              {/* Schema Markup */}
              {article.seo.schemaMarkup && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-sm text-muted-foreground">Schema Markup</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(JSON.stringify(article.seo.schemaMarkup, null, 2), "Schema markup")
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <pre className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded overflow-x-auto">
                    {JSON.stringify(article.seo.schemaMarkup, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
