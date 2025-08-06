import { NextRequest, NextResponse } from 'next/server'
import { initializeWorkflowStatus, updateWorkflowStatus } from './status/[trackingId]/route'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Generate a unique tracking ID for this request in the specified format
    const trackingId = `sce_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
    
    // Initialize status tracking
    initializeWorkflowStatus(trackingId)
    
    console.log(`🚀 Starting workflow with tracking ID: ${trackingId}`)
    
    // Initialize the status tracking
    initializeWorkflowStatus(trackingId)

    // Fire-and-forget approach: Start the workflow in the background
    // Don't await the result, return tracking ID immediately
    startWorkflowAsync(body, trackingId).catch(error => {
      console.error(`❌ Workflow ${trackingId} failed:`, error)
      updateWorkflowStatus(trackingId, 'failed', undefined, error.message)
    })
    
    // Return immediately with tracking ID
    return NextResponse.json({
      success: true,
      status: 'processing',
      trackingId: trackingId,
      message: 'Workflow started successfully. Use the tracking ID to check status.',
      estimatedTime: '2-3 minutes'
    })

  } catch (error) {
    console.error('Proxy setup error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start workflow' 
      },
      { status: 500 }
    )
  }
}

// Async function to handle the n8n workflow
async function startWorkflowAsync(body: any, trackingId: string) {
  try {
    console.log(`🔄 Connecting to n8n for workflow ${trackingId}...`)
    
    // Prepare the payload for n8n
    const n8nPayload = {
      documentUrl: body.documentUrl, // Ensure this field is explicitly passed
      trackingId: trackingId,
      callbackUrl: `http://srv926051.hstgr.cloud/api/n8n-proxy/callback`,
      // Include any other fields from the original request
      ...body
    }
    
    console.log(`📤 Sending to n8n for ${trackingId}:`, JSON.stringify(n8nPayload, null, 2))
    
    const n8nResponse = await fetch('https://n8n.srv926051.hstgr.cloud/webhook/input-webhook-sce', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': 'seo-dashboard-proxy',
        'X-Tracking-ID': trackingId,
        'User-Agent': 'SEOContentDashboard/1.0'
      },
      body: JSON.stringify(n8nPayload),
      // Extended timeout for the actual workflow
      signal: AbortSignal.timeout(300000) // 5 minutes
    })

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      console.error(`❌ n8n API Error for ${trackingId}:`, errorText)
      throw new Error(`n8n API Error ${n8nResponse.status}: ${errorText}`)
    }

    // Check if response has content before parsing JSON
    const responseText = await n8nResponse.text()
    console.log(`📄 n8n response for ${trackingId}:`, responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''))
    
    if (!responseText || responseText.trim() === '') {
      throw new Error('n8n returned empty response')
    }
    
    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error(`❌ Failed to parse n8n response for ${trackingId}:`, parseError)
      throw new Error(`Invalid JSON response from n8n: ${responseText.substring(0, 100)}`)
    }
    
    console.log(`✅ Workflow ${trackingId} completed successfully`)
    
    // Update status with the result
    updateWorkflowStatus(trackingId, 'completed', result)
    
  } catch (error) {
    console.error(`💥 Workflow ${trackingId} error:`, error)
    
    let errorMessage = 'Workflow execution failed'
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Workflow timed out after 5 minutes'
      } else if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Failed to connect to n8n service. Please ensure n8n is running on localhost:5678'
      } else {
        errorMessage = error.message
      }
    }
    
    updateWorkflowStatus(trackingId, 'failed', undefined, errorMessage)
    throw error
  }
}
