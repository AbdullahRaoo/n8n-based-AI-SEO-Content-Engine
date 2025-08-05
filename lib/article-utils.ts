export function extractTitleFromHtml(html: string): string {
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
  if (h1Match) {
    // Remove HTML tags from the title
    return h1Match[1].replace(/<[^>]*>/g, "").trim()
  }
  return "Untitled Article"
}

export function getContentWithoutTitle(html: string): string {
  // Remove the first h1 tag for editing to prevent duplication
  return html.replace(/<h1[^>]*>.*?<\/h1>/i, "").trim()
}

export function calculateSeoScore(article: any): number {
  let score = 0

  // Keyword density (30 points)
  const density = Number.parseFloat(article.validation.keywordDensity.replace("%", ""))
  if (density >= 1.8 && density <= 2.5) score += 30
  else if (density >= 1.5 && density <= 3.0) score += 20
  else score += 10

  // Word count (25 points)
  if (article.content.wordCount >= 1400) score += 25
  else if (article.content.wordCount >= 1000) score += 20
  else score += 10

  // Meta optimization (25 points)
  if (article.seo.metaTitle && article.seo.metaDescription) score += 25
  else score += 15

  // Content quality (20 points)
  if (article.content.html.includes("<h1>") && article.content.html.includes("<h2>")) score += 20
  else score += 10

  return Math.min(score, 100)
}

export function cleanAndEnhanceContent(html: string): string {
  // Clean up markdown code blocks and formatting issues
  html = html
    .replace(/```html\s*([\s\S]*?)```/gi, "$1")
    .replace(/```([\s\S]*?)```/gi, "$1")
    .replace(/—/g, ", ")
    .replace(/–/g, " to ")
    .replace(/\s+,\s+/g, ", ")
    .replace(/\s+\.\s+/g, ". ")
    .replace(/\s+/g, " ")

  // Remove empty code blocks and placeholders
  html = html
    .replace(/```html\s*```/gi, "")
    .replace(/```\s*```/gi, "")
    .replace(/<div><\/div>/gi, "")

  // Enhance special elements with beautiful styling (matching your template design)
  html = html
    // Pro Tip boxes with gradient and icons
    .replace(
      /<div><strong>Pro Tip:<\/strong>(.*?)<\/div>/gi,
      '<div class="tip-box"><div class="flex items-start"><div class="flex-shrink-0"><svg class="w-5 h-5 text-emerald-600 mt-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg></div><div class="ml-3"><p class="text-emerald-800 font-medium"><strong>💡 Pro Tip:</strong> $1</p></div></div></div>',
    )

    // Quick Takeaway boxes with blue theme
    .replace(
      /<div><strong>Quick Takeaway:<\/strong>(.*?)<\/div>/gi,
      '<div class="quick-answer-box"><div class="flex items-start"><div class="flex-shrink-0"><svg class="w-5 h-5 text-blue-600 mt-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></div><div class="ml-3"><p class="text-blue-800 font-medium"><strong>🎯 Quick Takeaway:</strong> $1</p></div></div></div>',
    )

    // Did You Know boxes with amber theme
    .replace(
      /<div><strong>Did You Know\?<\/strong>(.*?)<\/div>/gi,
      '<div class="info-box"><div class="flex items-start"><div class="flex-shrink-0"><svg class="w-5 h-5 text-amber-600 mt-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></div><div class="ml-3"><p class="text-amber-800 font-medium"><strong>💡 Did You Know?</strong> $1</p></div></div></div>',
    )

    // Handle comparison tables and other placeholders with more elegant styling
    .replace(
      /\[COMPARISON_TABLE\]/gi, 
      '<div class="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-6 my-8"><div class="flex items-center mb-4"><svg class="w-6 h-6 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg><h3 class="text-red-800 font-semibold text-lg">Missing Comparison Table</h3></div><p class="text-red-700">⚠️ The content engine should generate an actual HTML table here instead of a placeholder. This would typically include detailed comparisons with proper styling.</p></div>'
    )

    .replace(
      /\[DECISION_FLOWCHART\]/gi, 
      '<div class="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6 my-8"><div class="flex items-center mb-4"><svg class="w-6 h-6 text-orange-600 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg><h3 class="text-orange-800 font-semibold text-lg">Missing Decision Flowchart</h3></div><p class="text-orange-700">⚠️ The engine should generate step-by-step decision guidance with visual flow elements instead of a placeholder.</p></div>'
    )

    .replace(
      /\[INFOGRAPHIC:[^\]]*\]/gi, 
      '<div class="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 my-8"><div class="flex items-center mb-4"><svg class="w-6 h-6 text-purple-600 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg><h3 class="text-purple-800 font-semibold text-lg">Missing Infographic Content</h3></div><p class="text-purple-700">⚠️ The engine should generate detailed visual explanatory content here instead of a placeholder.</p></div>'
    )

  // Clean up any remaining issues
  html = html
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return html
}
