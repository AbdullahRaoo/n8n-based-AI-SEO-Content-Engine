import { NextRequest, NextResponse } from 'next/server'
import { saveArticle } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const articleData = await request.json()
    const savedArticle = await saveArticle(articleData)
    return NextResponse.json({ success: true, article: savedArticle })
  } catch (error) {
    console.error('Error saving article:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save article' },
      { status: 500 }
    )
  }
}
