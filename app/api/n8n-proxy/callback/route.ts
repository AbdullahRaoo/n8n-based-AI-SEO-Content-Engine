import { NextRequest, NextResponse } from 'next/server'
import { updateWorkflowStatus } from '../status/[trackingId]/route'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract additional headers
    const trackingIdHeader = request.headers.get('X-Tracking-ID')
    const processingTimeHeader = request.headers.get('X-Processing-Time')
    const engineVersionHeader = request.headers.get('X-Engine-Version')
    
    console.log('📨 Received callback:')
    console.log('  Headers:', {
      'X-Tracking-ID': trackingIdHeader,
      'X-Processing-Time': processingTimeHeader,
      'X-Engine-Version': engineVersionHeader
    })
    console.log('  Body:', JSON.stringify(body, null, 2))
    
    // Handle nested structure from n8n workflow
    // n8n might send: { result: { trackingId, status, ... } } or direct: { trackingId, status, ... }
    let callbackData = body
    
    // Check if data is nested under 'result' key
    if (body.result && typeof body.result === 'object') {
      console.log('🔍 Found nested result structure, extracting...')
      callbackData = body.result
    }
    
    const { 
      trackingId, 
      status, 
      result, 
      error, 
      processingTimeSeconds, 
      completedTime,
      startTime,
      originalRequest,
      metadata
    } = callbackData
    
    // Also try to get trackingId from URL query params as fallback
    const urlTrackingId = new URL(request.url).searchParams.get('trackingId')
    const finalTrackingId = trackingId || urlTrackingId
    
    if (!finalTrackingId) {
      console.error('❌ Callback missing trackingId in both body and URL params')
      console.error('   Body keys:', Object.keys(callbackData))
      console.error('   URL:', request.url)
      return NextResponse.json(
        { success: false, error: 'Tracking ID is required' },
        { status: 400 }
      )
    }

    console.log(`✅ Using tracking ID: ${finalTrackingId}`)

    // Handle the new callback format with status field
    let workflowStatus: 'completed' | 'failed' | 'processing'
    let workflowResult: any
    let workflowError: string | undefined

    if (status === 'completed') {
      console.log('✅ Workflow completed successfully')
      workflowStatus = 'completed'
      workflowResult = result
      workflowError = undefined
    } else if (status === 'failed') {
      console.log('❌ Workflow failed')
      workflowStatus = 'failed'
      workflowResult = undefined
      workflowError = error || 'Workflow failed'
    } else {
      // Fallback to legacy format
      console.log('🔄 Using legacy format fallback')
      const success = body.success
      workflowStatus = success ? 'completed' : 'failed'
      workflowResult = success ? result : undefined
      workflowError = success ? undefined : (error || 'Workflow failed')
    }

    // Log additional metadata if available
    if (metadata) {
      console.log('📊 Workflow metadata:', JSON.stringify(metadata, null, 2))
    }
    
    if (originalRequest) {
      console.log('📄 Original request:', JSON.stringify(originalRequest, null, 2))
    }
    
    // Validate header/body consistency
    if (trackingIdHeader && trackingIdHeader !== finalTrackingId) {
      console.warn('⚠️ Tracking ID mismatch between header and body:', { header: trackingIdHeader, body: finalTrackingId })
    }
    
    if (processingTimeHeader && processingTimeSeconds && parseInt(processingTimeHeader) !== processingTimeSeconds) {
      console.warn('⚠️ Processing time mismatch between header and body:', { header: processingTimeHeader, body: processingTimeSeconds })
    }

    // Update the workflow status
    updateWorkflowStatus(
      finalTrackingId,
      workflowStatus,
      workflowResult,
      workflowError
    )

    const logMessage = `Workflow ${finalTrackingId} ${workflowStatus}${processingTimeSeconds ? ` in ${processingTimeSeconds}s` : ''}`
    console.log(`✅ ${logMessage}`)

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      received: {
        trackingId: finalTrackingId,
        status: workflowStatus,
        processingTime: processingTimeSeconds,
        completedAt: completedTime,
        headers: {
          'X-Tracking-ID': trackingIdHeader,
          'X-Processing-Time': processingTimeHeader,
          'X-Engine-Version': engineVersionHeader
        }
      }
    })

  } catch (error) {
    console.error('❌ Callback processing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process callback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
