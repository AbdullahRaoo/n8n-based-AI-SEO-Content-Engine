import { prisma } from "./db"

export interface ArticleData {
  id?: string
  success: boolean
  timestamp: string
  input: {
    keyword: string
    location: string
  }
  content: {
    html: string
    wordCount: number
    keywordDensity: string
  }
  seo: {
    metaTitle: string
    metaDescription: string
    focusKeywords: string[]
    socialDescription: string
    schemaMarkup?: any
  }
  contentStrategy: {
    searchIntent: string
    targetLength: number
    uniqueAngles: string[]
  }
  validation: {
    targetKeyword: string
    keywordMatches: number
    keywordDensity: string
    validationApplied: boolean
  }
  status?: "draft" | "published" | "processing"
}

export async function saveArticle(articleData: ArticleData) {
  try {
    const article = await prisma.article.create({
      data: {
        success: articleData.success,
        timestamp: new Date(articleData.timestamp),
        keyword: articleData.input.keyword,
        location: articleData.input.location,
        html: articleData.content.html,
        wordCount: articleData.content.wordCount,
        keywordDensity: articleData.content.keywordDensity,
        metaTitle: articleData.seo.metaTitle,
        metaDescription: articleData.seo.metaDescription,
        focusKeywords: JSON.stringify(articleData.seo.focusKeywords),
        socialDescription: articleData.seo.socialDescription,
        schemaMarkup: articleData.seo.schemaMarkup ? JSON.stringify(articleData.seo.schemaMarkup) : null,
        searchIntent: articleData.contentStrategy.searchIntent,
        targetLength: articleData.contentStrategy.targetLength,
        uniqueAngles: JSON.stringify(articleData.contentStrategy.uniqueAngles),
        targetKeyword: articleData.validation.targetKeyword,
        keywordMatches: articleData.validation.keywordMatches,
        validationDensity: articleData.validation.keywordDensity,
        validationApplied: articleData.validation.validationApplied,
        status: articleData.status || "draft",
      },
    })
    return article
  } catch (error) {
    console.error("Error saving article:", error)
    throw error
  }
}

export async function getAllArticles() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    })

    return articles.map((article) => ({
      id: article.id,
      success: article.success,
      timestamp: article.timestamp.toISOString(),
      input: {
        keyword: article.keyword,
        location: article.location,
      },
      content: {
        html: article.html,
        wordCount: article.wordCount,
        keywordDensity: article.keywordDensity,
      },
      seo: {
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        focusKeywords: JSON.parse(article.focusKeywords),
        socialDescription: article.socialDescription,
        schemaMarkup: article.schemaMarkup ? JSON.parse(article.schemaMarkup) : null,
      },
      contentStrategy: {
        searchIntent: article.searchIntent,
        targetLength: article.targetLength,
        uniqueAngles: JSON.parse(article.uniqueAngles),
      },
      validation: {
        targetKeyword: article.targetKeyword,
        keywordMatches: article.keywordMatches,
        keywordDensity: article.validationDensity,
        validationApplied: article.validationApplied,
      },
      status: article.status as "draft" | "published" | "processing",
    }))
  } catch (error) {
    console.error("Error fetching articles:", error)
    throw error
  }
}

export async function updateArticle(id: string, articleData: Partial<ArticleData>) {
  try {
    const updateData: any = {}

    if (articleData.input) {
      updateData.keyword = articleData.input.keyword
      updateData.location = articleData.input.location
    }

    if (articleData.content) {
      updateData.html = articleData.content.html
      updateData.wordCount = articleData.content.wordCount
      updateData.keywordDensity = articleData.content.keywordDensity
    }

    if (articleData.seo) {
      updateData.metaTitle = articleData.seo.metaTitle
      updateData.metaDescription = articleData.seo.metaDescription
      updateData.focusKeywords = JSON.stringify(articleData.seo.focusKeywords)
      updateData.socialDescription = articleData.seo.socialDescription
      if (articleData.seo.schemaMarkup) {
        updateData.schemaMarkup = JSON.stringify(articleData.seo.schemaMarkup)
      }
    }

    if (articleData.status) {
      updateData.status = articleData.status
    }

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
    })

    return article
  } catch (error) {
    console.error("Error updating article:", error)
    throw error
  }
}

export async function deleteArticle(id: string) {
  try {
    await prisma.article.delete({
      where: { id },
    })
  } catch (error) {
    console.error("Error deleting article:", error)
    throw error
  }
}
