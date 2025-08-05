"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { 
  Save, 
  Eye, 
  Type, 
  Target, 
  Globe, 
  FileText, 
  Clock, 
  BarChart3,
  Edit3,
  Copy,
  Download,
  X
} from "lucide-react"
import { extractTitleFromHtml, cleanAndEnhanceContent, calculateSeoScore, getContentWithoutTitle } from "@/lib/article-utils"

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

interface ArticleEditorProps {
  article: Article
  onSave: (article: Article) => void
  onCancel: () => void
}

export function ArticleEditor({ article, onSave, onCancel }: ArticleEditorProps) {
  const [editedArticle, setEditedArticle] = useState<Article>(article)
  const [isPreviewMode, setIsPreviewMode] = useState(true)
  const [activeTab, setActiveTab] = useState("content")
  const [showEditHint, setShowEditHint] = useState(false)
  const [contentKey, setContentKey] = useState(0) // Force re-render only when needed
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [editableTitle, setEditableTitle] = useState(extractTitleFromHtml(article.content.html))
  const editorRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  // Get article details for display
  const topKeyword = editedArticle.seo.focusKeywords[0] || editedArticle.input.keyword
  const seoScore = calculateSeoScore(editedArticle)

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const exportArticle = () => {
    const dataStr = JSON.stringify(editedArticle, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `${articleTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleContentChange = (html: string) => {
    // Calculate word count
    const textContent = html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    const wordCount = textContent.split(" ").filter((word) => word.length > 0).length

    // Calculate keyword density
    const keyword = editedArticle.input.keyword.toLowerCase()
    const keywordMatches = (textContent.toLowerCase().match(new RegExp(`\\b${keyword}\\b`, "g")) || []).length
    const keywordDensity = wordCount > 0 ? ((keywordMatches / wordCount) * 100).toFixed(2) + "%" : "0.00%"

    setEditedArticle((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        html,
        wordCount,
        keywordDensity,
      },
      validation: {
        ...prev.validation,
        keywordMatches,
        keywordDensity,
      },
    }))
  }

  const handleSave = () => {
    onSave(editedArticle)
  }

  const toggleEditMode = () => {
    if (isPreviewMode && editorRef.current && titleRef.current) {
      // Switch to edit mode - show raw content without title to prevent duplication
      const contentWithoutTitle = getContentWithoutTitle(editedArticle.content.html)
      editorRef.current.innerHTML = contentWithoutTitle
      editorRef.current.contentEditable = "true"
      editorRef.current.focus()
      
      // Make title editable too
      titleRef.current.contentEditable = "true"
      titleRef.current.style.outline = "2px solid #3b82f6"
      titleRef.current.style.backgroundColor = "rgba(59, 130, 246, 0.05)"
      titleRef.current.style.borderRadius = "8px"
      titleRef.current.style.padding = "16px"
      
      setShowEditHint(true)
      
      // Add visual indicators for edit mode
      editorRef.current.style.outline = "2px solid #3b82f6"
      editorRef.current.style.backgroundColor = "rgba(59, 130, 246, 0.05)"
      editorRef.current.style.borderRadius = "8px"
      editorRef.current.style.padding = "16px"
      
    } else if (editorRef.current && titleRef.current) {
      // Switch to preview mode - show enhanced content
      editorRef.current.contentEditable = "false"
      titleRef.current.contentEditable = "false"
      setShowEditHint(false)
      
      // Remove visual indicators
      editorRef.current.style.outline = "none"
      editorRef.current.style.backgroundColor = "transparent"
      editorRef.current.style.padding = "0"
      
      titleRef.current.style.outline = "none"
      titleRef.current.style.backgroundColor = "transparent"
      titleRef.current.style.padding = "0"
      
      // Show enhanced content with title
      editorRef.current.innerHTML = getContentWithoutTitle(cleanAndEnhanceContent(editedArticle.content.html))
    }
    setIsPreviewMode(!isPreviewMode)
  }

  const saveEditChanges = () => {
    if (editorRef.current && titleRef.current && !isPreviewMode) {
      const currentContent = editorRef.current.innerHTML
      const currentTitle = titleRef.current.textContent || editableTitle
      
      // Update editable title state
      setEditableTitle(currentTitle)
      
      // Create full content with updated title
      const fullContent = `<h1>${currentTitle}</h1>${currentContent}`
      
      // Update the article state with edited content
      const textContent = currentContent
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
      const wordCount = textContent.split(" ").filter((word) => word.length > 0).length

      const keyword = editedArticle.input.keyword.toLowerCase()
      const keywordMatches = (textContent.toLowerCase().match(new RegExp(`\\b${keyword}\\b`, "g")) || []).length
      const keywordDensity = wordCount > 0 ? ((keywordMatches / wordCount) * 100).toFixed(2) + "%" : "0.00%"

      setEditedArticle((prev) => ({
        ...prev,
        content: {
          ...prev.content,
          html: fullContent,
          wordCount,
          keywordDensity,
        },
        validation: {
          ...prev.validation,
          keywordMatches,
          keywordDensity,
        },
      }))
      
      setHasUnsavedChanges(false)
      
      toast({
        title: "Changes Saved",
        description: "Your content changes have been saved locally",
      })
      
      // Switch back to preview mode after saving
      toggleEditMode()
    }
  }

  // Initialize content when component mounts or mode changes
  useEffect(() => {
    if (editorRef.current) {
      if (isPreviewMode) {
        editorRef.current.innerHTML = getContentWithoutTitle(cleanAndEnhanceContent(editedArticle.content.html))
        editorRef.current.contentEditable = "false"
      }
    }
  }, [contentKey, editedArticle.content.html]) // Re-render when content actually changes

  useEffect(() => {
    if (editorRef.current && titleRef.current && !isPreviewMode) {
      const handleInput = () => {
        if (editorRef.current) {
          // Store cursor position before state update
          const selection = window.getSelection()
          const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
          
          // Update content state without modifying DOM
          const currentContent = editorRef.current.innerHTML
          
          // Calculate word count and keyword density for real-time updates
          const textContent = currentContent
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
          const wordCount = textContent.split(" ").filter((word) => word.length > 0).length

          const keyword = editedArticle.input.keyword.toLowerCase()
          const keywordMatches = (textContent.toLowerCase().match(new RegExp(`\\b${keyword}\\b`, "g")) || []).length
          const keywordDensity = wordCount > 0 ? ((keywordMatches / wordCount) * 100).toFixed(2) + "%" : "0.00%"

          // Mark as having unsaved changes
          setHasUnsavedChanges(true)

          // Update state without triggering re-render of editor content
          setEditedArticle((prev) => ({
            ...prev,
            content: {
              ...prev.content,
              wordCount,
              keywordDensity,
            },
            validation: {
              ...prev.validation,
              keywordMatches,
              keywordDensity,
            },
          }))
        }
      }

      const handleTitleInput = () => {
        if (titleRef.current) {
          const newTitle = titleRef.current.textContent || ""
          setEditableTitle(newTitle)
          setHasUnsavedChanges(true)
        }
      }

      editorRef.current.addEventListener("input", handleInput)
      titleRef.current.addEventListener("input", handleTitleInput)
      
      return () => {
        if (editorRef.current) {
          editorRef.current.removeEventListener("input", handleInput)
        }
        if (titleRef.current) {
          titleRef.current.removeEventListener("input", handleTitleInput)
        }
      }
    }
  }, [isPreviewMode, editedArticle.input.keyword])

  return (
    <div className="article-viewer-container w-full h-screen flex flex-col relative overflow-hidden">
      {/* Close Button */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Header - Similar to ArticleViewer but with Editor indication */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-6 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-12">
            <div className="flex items-center space-x-3 mb-2">
              <Edit3 className="h-6 w-6" />
              <span className="text-lg font-semibold">Article Editor</span>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {isPreviewMode ? "Preview Mode" : "Edit Mode"}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">{editableTitle}</h1>
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Target className="h-3 w-3 mr-1" />
                {topKeyword}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Globe className="h-3 w-3 mr-1" />
                {editedArticle.input.location}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(editedArticle.timestamp).toLocaleDateString()}
              </Badge>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={toggleEditMode}
              className={isPreviewMode ? "bg-white/20 hover:bg-white/30" : "bg-blue-500 hover:bg-blue-600"}
            >
              {isPreviewMode ? (
                <>
                  <Type className="h-4 w-4 mr-2" />
                  Edit Content
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </>
              )}
            </Button>
            {!isPreviewMode && hasUnsavedChanges && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={saveEditChanges}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={exportArticle}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="secondary" size="sm" onClick={() => copyToClipboard(editedArticle.content.html, "HTML content")}>
              <Copy className="h-4 w-4 mr-2" />
              Copy HTML
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Mode Hint */}
      {showEditHint && !isPreviewMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-3 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Edit3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Edit Mode Active:</strong> Click on the title or content to edit. {hasUnsavedChanges && (
                  <span className="text-orange-600 font-medium">● Unsaved changes</span>
                )}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={saveEditChanges}
                  className="text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditHint(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
          <TabsTrigger value="content">Article Content</TabsTrigger>
          <TabsTrigger value="seo">SEO Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="article-content-scrollable flex-1 h-full mt-0 p-0">
          {/* Blog Post Content with Enhanced Typography */}
          <div className="bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 min-h-screen">
            <div className="max-w-4xl mx-auto px-6 py-16">
              {/* Article Title */}
              <h1 
                ref={titleRef}
                className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-8 text-center"
                suppressContentEditableWarning={true}
              >
                {editableTitle}
              </h1>
              
              {/* Article Content */}
              <article
                ref={editorRef}
                className="prose-custom text-slate-700 dark:text-slate-300 leading-relaxed"
                style={{
                  fontSize: '18px',
                  lineHeight: '1.75',
                  color: '#374151',
                  minHeight: isPreviewMode ? "auto" : "500px",
                }}
                suppressContentEditableWarning={true}
              >
                {/* Content is handled via ref and innerHTML to avoid cursor jumping */}
              </article>
            </div>
          </div>

          {/* Article Footer with Better Styling */}
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-t border-slate-200 dark:border-slate-700">
            <div className="max-w-4xl mx-auto px-6 py-12">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 rounded-full px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{editedArticle.content.wordCount}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">words</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 rounded-full px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
                    <BarChart3 className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{seoScore}/100</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">SEO</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={onCancel} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="article-content-scrollable flex-1 h-full mt-0 p-0">
          {/* SEO Settings Header */}
          <div className="bg-gradient-to-br from-emerald-50 via-blue-50/50 to-indigo-50 dark:from-emerald-900/20 dark:via-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="max-w-5xl mx-auto px-6 py-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-4">
                  SEO Settings & Optimization
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Fine-tune your article's search engine optimization settings for maximum visibility
                </p>
              </div>
            </div>
          </div>

          {/* SEO Settings Content */}
          <div className="bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 min-h-screen">
            <div className="max-w-5xl mx-auto px-6 py-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Meta Information */}
                <div className="space-y-8">
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-blue-600" />
                      Meta Information
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="meta-title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Meta Title
                        </Label>
                        <Input
                          id="meta-title"
                          value={editedArticle.seo.metaTitle}
                          onChange={(e) =>
                            setEditedArticle((prev) => ({
                              ...prev,
                              seo: { ...prev.seo, metaTitle: e.target.value },
                            }))
                          }
                          className="mt-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          placeholder="Optimized title for search engines..."
                        />
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {editedArticle.seo.metaTitle.length}/60 characters
                          </p>
                          <div className={`text-xs px-2 py-1 rounded ${
                            editedArticle.seo.metaTitle.length <= 60 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {editedArticle.seo.metaTitle.length <= 60 ? 'Good Length' : 'Too Long'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="meta-description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Meta Description
                        </Label>
                        <Textarea
                          id="meta-description"
                          value={editedArticle.seo.metaDescription}
                          onChange={(e) =>
                            setEditedArticle((prev) => ({
                              ...prev,
                              seo: { ...prev.seo, metaDescription: e.target.value },
                            }))
                          }
                          className="mt-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          rows={3}
                          placeholder="Compelling description that appears in search results..."
                        />
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {editedArticle.seo.metaDescription.length}/160 characters
                          </p>
                          <div className={`text-xs px-2 py-1 rounded ${
                            editedArticle.seo.metaDescription.length <= 160 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {editedArticle.seo.metaDescription.length <= 160 ? 'Good Length' : 'Too Long'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="social-description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Social Media Description
                        </Label>
                        <Textarea
                          id="social-description"
                          value={editedArticle.seo.socialDescription}
                          onChange={(e) =>
                            setEditedArticle((prev) => ({
                              ...prev,
                              seo: { ...prev.seo, socialDescription: e.target.value },
                            }))
                          }
                          className="mt-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          rows={2}
                          placeholder="Description for social media shares..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Keywords and Strategy */}
                <div className="space-y-8">
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-emerald-600" />
                      Keywords & Strategy
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Keyword</Label>
                          <div className="flex items-center space-x-2 mt-2">
                            <Target className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-slate-900 dark:text-slate-100">{editedArticle.input.keyword}</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Location</Label>
                          <div className="flex items-center space-x-2 mt-2">
                            <Globe className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-slate-900 dark:text-slate-100">{editedArticle.input.location}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Focus Keywords</Label>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {editedArticle.seo.focusKeywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Search Intent</Label>
                        <Badge className="mt-2" variant="outline">
                          {editedArticle.contentStrategy.searchIntent}
                        </Badge>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">SEO Score</Label>
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{seoScore}/100</span>
                            <Badge variant={seoScore >= 90 ? "default" : seoScore >= 70 ? "secondary" : "destructive"}>
                              {seoScore >= 90 ? "Excellent" : seoScore >= 70 ? "Good" : "Needs Improvement"}
                            </Badge>
                          </div>
                          <Progress value={seoScore} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="article-content-scrollable flex-1 h-full mt-0 p-0">
          {/* Analytics Header */}
          <div className="bg-gradient-to-br from-purple-50 via-blue-50/50 to-indigo-50 dark:from-purple-900/20 dark:via-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="max-w-5xl mx-auto px-6 py-12">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-4">
                  Content Analytics & Metrics
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Detailed insights and performance metrics for your article content
                </p>
              </div>
            </div>
          </div>

          {/* Analytics Content */}
          <div className="bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 min-h-screen">
            <div className="max-w-5xl mx-auto px-6 py-16">
              
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{editedArticle.content.wordCount}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Words</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Target: {editedArticle.contentStrategy.targetLength}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">{editedArticle.validation.keywordDensity}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Keyword Density</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Optimal: 1-3%
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{editedArticle.validation.keywordMatches}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Keyword Matches</div>
                  <div className="text-xs text-slate-500 mt-1">
                    In content
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
                  <div className="text-3xl font-bold text-amber-600 mb-2">{seoScore}/100</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">SEO Score</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Overall rating
                  </div>
                </div>
              </div>

              {/* Content Strategy */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 mb-8">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Content Strategy Angles
                </h3>
                <div className="grid gap-4">
                  {editedArticle.contentStrategy.uniqueAngles.map((angle, index) => (
                    <div key={index} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border-l-4 border-purple-500">
                      <p className="text-slate-700 dark:text-slate-300">{angle}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Status */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                  Validation & Quality
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-slate-700 dark:text-slate-300">Validation Applied</span>
                    <Badge variant={editedArticle.validation.validationApplied ? "default" : "secondary"}>
                      {editedArticle.validation.validationApplied ? "✓ Validated" : "⚠ Not Validated"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-slate-700 dark:text-slate-300">Article Status</span>
                    <Badge variant="outline">
                      {editedArticle.status || "draft"}
                    </Badge>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
