# SEO Content Engine - Frontend Integration Guide

## 🎯 Overview

This guide provides complete instructions for integrating with the **AI-Powered SEO Content Engine** webhook API. The system generates complete SEO-optimized articles with metadata based on business document input.

---

## 📡 API Endpoint

**Webhook URL:** `http://localhost:5678/webhook/input-webhook-sce`  
**Method:** `POST`  
**Content-Type:** `application/json`  
**Timeout Recommended:** 5 minutes (300 seconds)

---

## 🔐 Authentication & Headers

### Required Headers
```javascript
{
  "Content-Type": "application/json",
  "Content-Length": "[calculated automatically]"
}
```

### Optional Security Headers
```javascript
{
  "X-API-Key": "your-api-key",        // Optional API key
  "X-Client-ID": "your-client-id",    // Optional client identifier
  "User-Agent": "YourApp/1.0"         // Recommended for tracking
}
```

---

## 📤 Request Format

### Input Data Structure
Send a JSON object with one of these input methods:

#### Method 1: Google Doc URL (Recommended)
```javascript
{
  "documentUrl": "https://docs.google.com/document/d/[DOCUMENT_ID]/edit"
}
```

#### Method 2: Direct Document Content
```javascript
{
  "documentContent": "Your business document content as plain text..."
}
```

#### Method 3: Structured Business Data (Legacy)
```javascript
{
  "keyword": "target SEO keyword",
  "location": "United States",
  "onboarding": {
    "businessAndValueProp": {
      "elevatorPitch": "Brief business description"
    },
    "idealAudience": {
      "perfectCustomerProfile": "Target audience description"
    },
    "coreSolutions": {
      "flagshipProducts": ["Product 1", "Product 2"]
    },
    "successStories": {
      "caseStudies": ["Success story 1"]
    },
    "brandVoice": {
      "tonePersonality": ["Professional", "Trustworthy"]
    }
  }
}
```

---

## 📥 Response Format

### Success Response Structure
```javascript
{
  "success": true,
  "timestamp": "2025-07-29T22:26:25.271Z",
  "input": {
    "keyword": "SEO for addiction treatment centers",
    "location": "United States"
  },
  "content": {
    "html": "<h1>Article Title</h1><p>Full SEO-optimized article content...</p>",
    "wordCount": 1396,
    "keywordDensity": "2.22%"
  },
  "seo": {
    "metaTitle": "Optimized Title | Brand",
    "metaDescription": "Compelling meta description...",
    "focusKeywords": [
      "primary keyword",
      "secondary keyword 1",
      "secondary keyword 2"
    ],
    "socialDescription": "Social media optimized description...",
    "schemaMarkup": {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Article headline",
      "description": "Article description",
      "keywords": "keyword1, keyword2, keyword3",
      "wordCount": 1396,
      "datePublished": "2025-07-29T22:26:25.271Z",
      "dateModified": "2025-07-29T22:26:25.271Z",
      "author": {
        "@type": "Organization"
      }
    }
  },
  "contentStrategy": {
    "searchIntent": "informational/commercial",
    "targetLength": 1500,
    "uniqueAngles": [
      "Unique angle 1",
      "Unique angle 2"
    ]
  },
  "validation": {
    "targetKeyword": "primary keyword",
    "keywordMatches": 34,
    "keywordDensity": "2.44%",
    "validationApplied": true
  }
}
```

### Error Response Structure
```javascript
{
  "success": false,
  "error": "INPUT_VALIDATION_FAILED",
  "message": "Request validation failed",
  "errors": [
    "Must provide either CLIENT SEO KEYWORD STRATEGY BRIEF (documentUrl/documentContent) or structured onboarding data"
  ],
  "warnings": [],
  "requestId": "req_1753826264638_5qnfg3ilz",
  "timestamp": "2025-07-29T21:57:44.638Z",
  "processingTime": 0
}
```

---

## 💻 Implementation Examples

### JavaScript/Node.js Example
```javascript
async function generateSEOContent(documentUrl) {
  const API_ENDPOINT = 'http://localhost:5678/webhook/input-webhook-sce';
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': 'your-frontend-app',
        'User-Agent': 'YourApp/1.0'
      },
      body: JSON.stringify({
        documentUrl: documentUrl
      }),
      // Important: Set timeout for long-running workflow
      signal: AbortSignal.timeout(300000) // 5 minutes
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        article: result.content.html,
        metadata: result.seo,
        keyword: result.input.keyword,
        wordCount: result.content.wordCount,
        keywordDensity: result.content.keywordDensity
      };
    } else {
      return {
        success: false,
        error: result.error,
        message: result.message,
        errors: result.errors
      };
    }
    
  } catch (error) {
    console.error('SEO Content Generation Error:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: error.message
    };
  }
}

// Usage Example
async function handleDocumentSubmission() {
  const documentUrl = document.getElementById('documentUrl').value;
  
  // Show loading state
  showLoadingSpinner('Generating SEO content... This may take 2-3 minutes.');
  
  const result = await generateSEOContent(documentUrl);
  
  hideLoadingSpinner();
  
  if (result.success) {
    // Display the generated content
    document.getElementById('articleContent').innerHTML = result.article;
    document.getElementById('metaTitle').value = result.metadata.metaTitle;
    document.getElementById('metaDescription').value = result.metadata.metaDescription;
    
    console.log('Content generated successfully!');
    console.log('Keyword:', result.keyword);
    console.log('Word Count:', result.wordCount);
    console.log('Keyword Density:', result.keywordDensity);
  } else {
    // Handle errors
    showErrorMessage(result.message || 'Failed to generate content');
    console.error('Generation failed:', result.errors);
  }
}
```

### React/Next.js Example
```javascript
import { useState } from 'react';

export default function SEOContentGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generateContent = async (documentUrl) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5678/webhook/input-webhook-sce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': 'react-frontend'
        },
        body: JSON.stringify({ documentUrl }),
        signal: AbortSignal.timeout(300000) // 5 minutes
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'Content generation failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isLoading && (
        <div className="loading">
          <p>Generating SEO content... This may take 2-3 minutes.</p>
          <div className="spinner"></div>
        </div>
      )}
      
      {error && (
        <div className="error">
          <p>Error: {error}</p>
        </div>
      )}
      
      {result && (
        <div className="results">
          <h2>Generated Content</h2>
          <div>
            <strong>Keyword:</strong> {result.input.keyword}
          </div>
          <div>
            <strong>Word Count:</strong> {result.content.wordCount}
          </div>
          <div>
            <strong>Keyword Density:</strong> {result.content.keywordDensity}
          </div>
          
          <h3>SEO Metadata</h3>
          <div>
            <strong>Title:</strong> {result.seo.metaTitle}
          </div>
          <div>
            <strong>Description:</strong> {result.seo.metaDescription}
          </div>
          
          <h3>Article Content</h3>
          <div dangerouslySetInnerHTML={{ __html: result.content.html }} />
        </div>
      )}
    </div>
  );
}
```

### Python Example
```python
import requests
import json
import time

def generate_seo_content(document_url):
    """Generate SEO content from document URL"""
    
    api_endpoint = 'http://localhost:5678/webhook/input-webhook-sce'
    
    payload = {
        'documentUrl': document_url
    }
    
    headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'python-client',
        'User-Agent': 'PythonApp/1.0'
    }
    
    try:
        # Make request with 5-minute timeout
        response = requests.post(
            api_endpoint, 
            json=payload, 
            headers=headers,
            timeout=300  # 5 minutes
        )
        
        response.raise_for_status()
        result = response.json()
        
        if result.get('success'):
            return {
                'success': True,
                'article_html': result['content']['html'],
                'meta_title': result['seo']['metaTitle'],
                'meta_description': result['seo']['metaDescription'],
                'keyword': result['input']['keyword'],
                'word_count': result['content']['wordCount'],
                'keyword_density': result['content']['keywordDensity'],
                'focus_keywords': result['seo']['focusKeywords'],
                'schema_markup': result['seo']['schemaMarkup']
            }
        else:
            return {
                'success': False,
                'error': result.get('error'),
                'message': result.get('message'),
                'errors': result.get('errors', [])
            }
            
    except requests.exceptions.Timeout:
        return {
            'success': False,
            'error': 'TIMEOUT',
            'message': 'Request timed out after 5 minutes'
        }
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'error': 'NETWORK_ERROR',
            'message': str(e)
        }
    except json.JSONDecodeError:
        return {
            'success': False,
            'error': 'INVALID_RESPONSE',
            'message': 'Invalid JSON response from server'
        }

# Usage example
if __name__ == "__main__":
    document_url = "https://docs.google.com/document/d/YOUR_DOCUMENT_ID/edit"
    
    print("Starting SEO content generation...")
    result = generate_seo_content(document_url)
    
    if result['success']:
        print(f"✅ Content generated successfully!")
        print(f"Keyword: {result['keyword']}")
        print(f"Word Count: {result['word_count']}")
        print(f"Keyword Density: {result['keyword_density']}")
        print(f"Meta Title: {result['meta_title']}")
        
        # Save article to file
        with open('generated_article.html', 'w', encoding='utf-8') as f:
            f.write(result['article_html'])
        print("Article saved to generated_article.html")
        
    else:
        print(f"❌ Generation failed: {result['message']}")
        if result.get('errors'):
            for error in result['errors']:
                print(f"  - {error}")
```

---

## ⏱️ Processing Time & UX Considerations

### Expected Processing Times
- **Document Processing**: 30-60 seconds
- **SERP Analysis**: 15-30 seconds  
- **Content Generation**: 60-90 seconds
- **SEO Optimization**: 15-30 seconds
- **Total Time**: **2-3 minutes average**

### Recommended UX Patterns

#### 1. Progress Indicators
```javascript
// Show processing stages to user
const stages = [
  "Analyzing document...",
  "Researching keywords...",
  "Generating content...",
  "Optimizing SEO...",
  "Finalizing..."
];

let currentStage = 0;
const progressInterval = setInterval(() => {
  if (currentStage < stages.length - 1) {
    currentStage++;
    updateProgressMessage(stages[currentStage]);
  }
}, 30000); // Update every 30 seconds
```

#### 2. Timeout Handling
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ... other options
  });
  clearTimeout(timeoutId);
} catch (error) {
  if (error.name === 'AbortError') {
    showError('Content generation timed out. Please try again.');
  }
}
```

#### 3. Error Recovery
```javascript
async function generateWithRetry(documentUrl, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateSEOContent(documentUrl);
      if (result.success) return result;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
        continue;
      }
      return result;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
```

---

## 🛠️ Testing & Debugging

### Test Document URLs
Use these Google Docs for testing:

**Test Document 1 (General Business):**
```
https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
```

**Test Document 2 (Healthcare Focus):**
```
https://docs.google.com/document/d/1KZtPCYWeBgj0_F55QwEkK60SG_Rs-4h-83SZu5GTv2Q/edit
```

### Debug Checklist
- ✅ Verify webhook URL is correct
- ✅ Check Content-Type header is set
- ✅ Ensure timeout is at least 5 minutes
- ✅ Validate Google Doc URL format
- ✅ Check for CORS issues (if browser-based)
- ✅ Monitor network requests in DevTools
- ✅ Log response status and headers

### Common Error Codes
| Error Code | Meaning | Solution |
|------------|---------|----------|
| `INPUT_VALIDATION_FAILED` | Invalid input format | Check request body structure |
| `NETWORK_ERROR` | Connection failed | Check webhook URL and network |
| `TIMEOUT` | Processing took too long | Increase timeout or retry |
| `404` | Webhook not found | Verify webhook path is correct |
| `500` | Server error | Check n8n workflow status |

---

## 🔒 Security Considerations

### Data Privacy
- Document URLs are processed but not permanently stored
- Generated content is returned immediately
- No client data is retained after processing

### Rate Limiting
- Current limit: 100 requests per hour per client
- Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- Implement client-side rate limiting to avoid hitting limits

### CORS Policy
The webhook includes these CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Client-ID
```

---

## 📊 Response Data Usage

### Article Content
```javascript
// Extract and use the generated article
const articleHTML = result.content.html;
const wordCount = result.content.wordCount;
const keywordDensity = result.content.keywordDensity;

// Insert into your CMS or editor
document.getElementById('editor').innerHTML = articleHTML;
```

### SEO Metadata
```javascript
// Use SEO metadata for your CMS
const seo = result.seo;

// Set page meta tags
document.querySelector('meta[name="description"]').content = seo.metaDescription;
document.title = seo.metaTitle;

// Use focus keywords for tagging
const keywords = seo.focusKeywords;
```

### Schema Markup
```javascript
// Add schema markup to page
const schema = result.seo.schemaMarkup;
const scriptTag = document.createElement('script');
scriptTag.type = 'application/ld+json';
scriptTag.textContent = JSON.stringify(schema);
document.head.appendChild(scriptTag);
```

---

## 🚀 Production Deployment

### Environment Setup
```javascript
const API_CONFIG = {
  development: 'http://localhost:5678/webhook/input-webhook-sce',
  staging: 'https://staging-api.yourdomain.com/webhook/input-webhook-sce',
  production: 'https://api.yourdomain.com/webhook/input-webhook-sce'
};

const API_ENDPOINT = API_CONFIG[process.env.NODE_ENV] || API_CONFIG.development;
```

### Monitoring & Logging
```javascript
// Log all API interactions
function logAPICall(endpoint, payload, response, duration) {
  console.log('SEO API Call:', {
    endpoint,
    timestamp: new Date().toISOString(),
    payloadSize: JSON.stringify(payload).length,
    responseSize: JSON.stringify(response).length,
    duration: duration + 'ms',
    success: response.success
  });
}
```

---

## 📞 Support & Troubleshooting

### Quick Diagnostics
1. **Test connection**: Try a simple ping to the webhook
2. **Validate input**: Ensure document URL is accessible
3. **Check logs**: Monitor browser DevTools Network tab
4. **Verify format**: Confirm request/response JSON structure

### Common Solutions
- **Empty response**: Increase timeout, workflow is processing
- **404 error**: Check webhook path spelling
- **Validation error**: Verify input data structure
- **Timeout**: Normal for complex documents, implement retry logic

### Performance Tips
- Cache successful responses when appropriate
- Implement request queuing for multiple documents
- Show progress indicators for better UX
- Use WebSockets for real-time status updates (future enhancement)

---

**Integration Complete!** Your frontend can now generate high-quality, SEO-optimized content automatically. 🎉
