import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint to simulate the n8n workflow behavior
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentUrl, trackingId } = body
    
    console.log('Test endpoint received request:', { documentUrl, trackingId })
    
    // Simulate immediate response with tracking ID
    return NextResponse.json({
      success: true,
      status: 'processing',
      trackingId: trackingId || `test_${Date.now()}`,
      message: 'Test workflow started',
      estimatedTime: '2-3 minutes'
    })
    
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test endpoint error' 
      },
      { status: 500 }
    )
  }
}
