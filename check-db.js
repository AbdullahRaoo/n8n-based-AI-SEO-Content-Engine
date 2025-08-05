const { PrismaClient } = require('@prisma/client')

async function checkDatabase() {
  const prisma = new PrismaClient()
  
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('📊 Database articles:', articles.length)
    
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.keyword} - "${article.metaTitle}"`)
      console.log(`   Location: ${article.location}`)
      console.log(`   Words: ${article.wordCount}`)
      console.log(`   Created: ${article.createdAt}`)
      console.log('---')
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
