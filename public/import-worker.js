// Import worker to handle file processing safely
self.onmessage = async function(e) {
  const { type, data } = e.data

  if (type === 'IMPORT_ARTICLES') {
    try {
      // Parse JSON safely
      let parsed
      try {
        parsed = JSON.parse(data.jsonContent)
      } catch (parseError) {
        self.postMessage({
          type: 'ERROR',
          error: `JSON Parse Error: ${parseError.message}`
        })
        return
      }

      const articles = Array.isArray(parsed) ? parsed : [parsed]
      
      if (articles.length === 0) {
        self.postMessage({
          type: 'ERROR',
          error: 'No articles found in JSON file'
        })
        return
      }

      const results = []
      const errors = []

      for (let i = 0; i < articles.length; i++) {
        const item = articles[i]
        
        try {
          // Basic validation
          if (!item || typeof item !== 'object') {
            throw new Error('Invalid article data')
          }

          // Transform data
          const article = {
            id: `imported-${Date.now()}-${i}`,
            success: Boolean(item?.success ?? true),
            timestamp: String(item?.timestamp ?? new Date().toISOString()),
            input: {
              keyword: String(item?.input?.keyword ?? "Unknown Keyword"),
              location: String(item?.input?.location ?? "Unknown Location"),
            },
            content: {
              html: String(item?.content?.html ?? "<p>No content available</p>"),
              wordCount: Number(item?.content?.wordCount) || 0,
              keywordDensity: String(item?.content?.keywordDensity ?? "0.00%"),
            },
            seo: {
              metaTitle: String(item?.seo?.metaTitle ?? "Untitled Article"),
              metaDescription: String(item?.seo?.metaDescription ?? "No description available"),
              focusKeywords: Array.isArray(item?.seo?.focusKeywords) ? item.seo.focusKeywords.map(String) : [],
              socialDescription: String(item?.seo?.socialDescription ?? ""),
              schemaMarkup: item?.seo?.schemaMarkup,
            },
            contentStrategy: {
              searchIntent: String(item?.contentStrategy?.searchIntent ?? "informational"),
              targetLength: Number(item?.contentStrategy?.targetLength) || 0,
              uniqueAngles: Array.isArray(item?.contentStrategy?.uniqueAngles) ? item.contentStrategy.uniqueAngles.map(String) : [],
            },
            validation: {
              targetKeyword: String(item?.validation?.targetKeyword ?? item?.input?.keyword ?? "Unknown"),
              keywordMatches: Number(item?.validation?.keywordMatches) || 0,
              keywordDensity: String(item?.validation?.keywordDensity ?? "0.00%"),
              validationApplied: Boolean(item?.validation?.validationApplied),
            },
            status: "draft",
          }

          // Save to database
          const response = await fetch('/api/articles/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(article),
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`API Error: ${response.status} - ${errorText}`)
          }

          const result = await response.json()
          results.push(result)

          // Report progress
          self.postMessage({
            type: 'PROGRESS',
            progress: {
              current: i + 1,
              total: articles.length,
              article: article.input.keyword
            }
          })

        } catch (error) {
          errors.push(`Article ${i + 1}: ${error.message}`)
        }
      }

      // Send final result
      self.postMessage({
        type: 'COMPLETE',
        result: {
          success: results.length,
          errors: errors,
          total: articles.length
        }
      })

    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        error: error.message
      })
    }
  }
}
