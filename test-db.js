const { PrismaClient } = require('@prisma/client')

async function testDatabase() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test count query
    const count = await prisma.article.count()
    console.log(`✅ Article count: ${count}`)
    
    // Test creating a simple article
    const testArticle = await prisma.article.create({
      data: {
        keyword: 'test-keyword',
        location: 'test-location',
        html: '<p>Test content</p>',
        wordCount: 10,
        keywordDensity: '1.0%',
        metaTitle: 'Test Title',
        metaDescription: 'Test Description',
        focusKeywords: JSON.stringify(['test']),
        socialDescription: 'Test Social',
        searchIntent: 'informational',
        targetLength: 100,
        uniqueAngles: JSON.stringify(['test-angle']),
        targetKeyword: 'test-keyword',
        keywordMatches: 1,
        validationDensity: '1.0%',
        validationApplied: true,
        status: 'draft'
      }
    })
    console.log('✅ Test article created:', testArticle.id)
    
    // Clean up test article
    await prisma.article.delete({
      where: { id: testArticle.id }
    })
    console.log('✅ Test article deleted')
    
  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
