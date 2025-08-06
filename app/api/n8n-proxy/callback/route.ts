import { NextRequest, NextResponse } from 'next/server'
import { updateWorkflowStatus } from '../status/[trackingId]/route'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingId, success, result, error } = body
    
    if (!trackingId) {
      return NextResponse.json(
        { success: false, error: 'Tracking ID is required' },
        { status: 400 }
      )
    }

    // Update the workflow status
    updateWorkflowStatus(
      trackingId,
      success ? 'completed' : 'failed',
      result,
      error
    )

    console.log(`Workflow ${trackingId} ${success ? 'completed' : 'failed'}`)

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully'
    })

  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process callback' 
      },
      { status: 500 }
    )
  }
}
