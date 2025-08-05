import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward the request to n8n webhook
    const n8nResponse = await fetch('https://n8n.srv926051.hstgr.cloud/webhook/input-webhook-sce', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': 'seo-dashboard-proxy',
        'User-Agent': 'SEOContentDashboard/1.0'
      },
      body: JSON.stringify(body),
      // 5 minute timeout
      signal: AbortSignal.timeout(300000)
    })

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      console.error('n8n API Error:', errorText)
      return NextResponse.json(
        { 
          success: false, 
          error: `n8n API Error ${n8nResponse.status}: ${errorText}` 
        },
        { status: n8nResponse.status }
      )
    }

    const result = await n8nResponse.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Proxy error:', error)
    
    let errorMessage = 'Internal server error'
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout (5 minutes)'
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Failed to connect to n8n service. Please ensure n8n is running on localhost:5678'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    )
  }
}
