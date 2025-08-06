import { NextRequest, NextResponse } from 'next/server'
import { updateWorkflowStatus } from '../status/[trackingId]/route'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract additional headers
    const trackingIdHeader = request.headers.get('X-Tracking-ID')
    const processingTimeHeader = request.headers.get('X-Processing-Time')
    const engineVersionHeader = request.headers.get('X-Engine-Version')
    
    console.log('📨 Received callback with new format and headers:')
    console.log('  Headers:', {
      'X-Tracking-ID': trackingIdHeader,
      'X-Processing-Time': processingTimeHeader,
      'X-Engine-Version': engineVersionHeader
    })
    console.log('  Body:', JSON.stringify(body, null, 2))
    
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
    } = body
    
    if (!trackingId) {
      console.error('❌ Callback missing trackingId')
      return NextResponse.json(
        { success: false, error: 'Tracking ID is required' },
        { status: 400 }
      )
    }

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
    if (trackingIdHeader && trackingIdHeader !== trackingId) {
      console.warn('⚠️ Tracking ID mismatch between header and body:', { header: trackingIdHeader, body: trackingId })
    }
    
    if (processingTimeHeader && processingTimeSeconds && parseInt(processingTimeHeader) !== processingTimeSeconds) {
      console.warn('⚠️ Processing time mismatch between header and body:', { header: processingTimeHeader, body: processingTimeSeconds })
    }

    // Update the workflow status
    updateWorkflowStatus(
      trackingId,
      workflowStatus,
      workflowResult,
      workflowError
    )

    const logMessage = `Workflow ${trackingId} ${workflowStatus}${processingTimeSeconds ? ` in ${processingTimeSeconds}s` : ''}`
    console.log(`✅ ${logMessage}`)

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      received: {
        trackingId,
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
