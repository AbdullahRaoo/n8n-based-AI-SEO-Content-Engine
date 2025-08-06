import { NextRequest, NextResponse } from 'next/server'

// In-memory store for tracking workflow status
// In production, you might want to use Redis or a database
const workflowStatus = new Map<string, {
  status: 'processing' | 'completed' | 'failed'
  result?: any
  error?: string
  startTime: number
  lastUpdated: number
}>()

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  try {
    const trackingId = params.trackingId
    
    if (!trackingId) {
      return NextResponse.json(
        { success: false, error: 'Tracking ID is required' },
        { status: 400 }
      )
    }

    // Check if we have status in our store
    const status = workflowStatus.get(trackingId)
    
    if (status) {
      // Clean up completed/failed entries older than 1 hour
      if (status.status !== 'processing' && Date.now() - status.lastUpdated > 3600000) {
        workflowStatus.delete(trackingId)
        return NextResponse.json({
          success: false,
          error: 'Tracking ID expired'
        }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        trackingId,
        status: status.status,
        result: status.result,
        error: status.error,
        processingTime: Date.now() - status.startTime
      })
    }

    // If not in our store, try to query n8n directly (if it supports status queries)
    // This is a fallback mechanism
    try {
      const n8nStatusResponse = await fetch(`http://localhost:5678/webhook/status/${trackingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': 'seo-dashboard-proxy',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout for status check
      })

      if (n8nStatusResponse.ok) {
        const statusResult = await n8nStatusResponse.json()
        return NextResponse.json({
          success: true,
          trackingId,
          ...statusResult
        })
      }
    } catch (error) {
      // n8n status endpoint might not exist, continue with default response
      console.log('n8n status endpoint not available:', error)
    }

    // Default response if tracking ID not found
    return NextResponse.json({
      success: false,
      error: 'Tracking ID not found or workflow status unknown'
    }, { status: 404 })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check workflow status' 
      },
      { status: 500 }
    )
  }
}

// Helper function to update status (can be called from callback)
export function updateWorkflowStatus(
  trackingId: string, 
  status: 'processing' | 'completed' | 'failed',
  result?: any,
  error?: string
) {
  const existing = workflowStatus.get(trackingId)
  workflowStatus.set(trackingId, {
    status,
    result,
    error,
    startTime: existing?.startTime || Date.now(),
    lastUpdated: Date.now()
  })
}

// Initialize status as processing
export function initializeWorkflowStatus(trackingId: string) {
  workflowStatus.set(trackingId, {
    status: 'processing',
    startTime: Date.now(),
    lastUpdated: Date.now()
  })
}
