'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { generateUniqueSlug } from '@/lib/slug';

// ─── Slug uniqueness checker ──────────────────────────────────────────────────
async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const found = await prisma.article.findUnique({ where: { slug } });
  if (!found) return false;
  if (excludeId && found.id === excludeId) return false;
  return true;
}

// ─── Backfill helper: assign slug to articles that don't have one ─────────────
// NOTE: Must be called sequentially (not via Promise.all) to avoid unique-slug race conditions.
async function backfillSlug(article: any): Promise<any> {
  if (article.slug) return article;
  try {
    const slug = await generateUniqueSlug(article.title, (s) => isSlugTaken(s, article.id));
    await prisma.article.update({ where: { id: article.id }, data: { slug } });
    return { ...article, slug };
  } catch {
    // If backfill fails (e.g. concurrent duplicate slug), still return the article intact
    return article;
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function getNewsArticles(filters?: {
  category?: string;
  status?: string;
  state?: string;
  district?: string;
  q?: string;
  limit?: number;
}) {
  try {
    const whereClause: any = {};
    if (filters?.category) whereClause.category = { name: filters.category };
    if (filters?.status) {
      if (filters.status === 'Published') {
        whereClause.status = { in: ['Published', 'Website Published', 'Print Published'] };
      } else {
        whereClause.status = filters.status;
      }
    }
    if (filters?.state) whereClause.state = filters.state;
    if (filters?.district) whereClause.district = filters.district;
    if (filters?.q) {
      whereClause.OR = [
        { title: { contains: filters.q } },
        { content: { contains: filters.q } }
      ];
    }

    const queryOptions: any = {
      where: whereClause,
      include: {
        category: true,
        additionalCategories: true,
        reporterRel: {
          select: {
            id: true,
            reporterCode: true,
            fullName: true,
            photoUrl: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    };

    if (filters?.limit) {
      queryOptions.take = filters.limit;
    }

    const articles = await prisma.article.findMany(queryOptions);

    // On-the-fly slug backfill — run SEQUENTIALLY to avoid unique-slug race conditions
    // OPTIMIZATION: Push synchronously if the article already has a slug
    const withSlugs: any[] = [];
    for (const article of articles) {
      if (article.slug) {
        withSlugs.push(article);
      } else {
        withSlugs.push(await backfillSlug(article));
      }
    }
    return withSlugs;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

export async function getArticleById(identifier: string) {
  try {
    // 1️⃣ Try finding by slug first (SEO-friendly URL)
    let article = await prisma.article.findUnique({
      where: { slug: identifier },
      include: {
        category: true,
        additionalCategories: true,
        reporterRel: {
          select: {
            id: true,
            reporterCode: true,
            fullName: true,
            photoUrl: true,
            status: true
          }
        }
      }
    });

    // 2️⃣ Fallback: try the raw CUID id (backward compatibility)
    if (!article) {
      article = await prisma.article.findUnique({
        where: { id: identifier },
        include: {
          category: true,
          additionalCategories: true,
          reporterRel: {
            select: {
              id: true,
              reporterCode: true,
              fullName: true,
              photoUrl: true,
              status: true
            }
          }
        }
      });
    }

    if (!article) return null;

    // Backfill slug if missing
    return await backfillSlug(article);
  } catch (error) {
    console.error('Error fetching exact article:', error);
    return null;
  }
}

export async function getDashboardStats() {
  try {
    const [totalArticles, totalViewsAgg, pendingApprovals, allReporters, articlesToday] =
      await Promise.all([
        prisma.article.count(),
        prisma.article.aggregate({ _sum: { views: true } }),
        prisma.article.count({
          where: {
            status: {
              in: ['Pending', 'Submitted', 'Under District Review', 'Under State Review', 'Under Company Review']
            }
          }
        }),
        prisma.article.findMany({ select: { reporter: true }, distinct: ['reporter'] }),
        prisma.article.count({
          where: {
            status: {
              in: ['Published', 'Website Published', 'Print Published']
            },
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        })
      ]);

    return {
      totalArticles,
      totalViews: totalViewsAgg._sum.views || 0,
      activeReporters: allReporters.length,
      pendingApprovals,
      todayPublished: articlesToday
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { totalArticles: 0, totalViews: 0, activeReporters: 0, pendingApprovals: 0, todayPublished: 0 };
  }
}

export async function addNewsArticle(data: {
  title: string;
  categoryId: string;
  additionalCategoryIds?: string[];
  state: string;
  district: string;
  reporter: string;
  content: string;
  imageUrl?: string;
  status: string;
  seoTitle?: string;
  seoDesc?: string;
  seoKeys?: string;
}) {
  try {
    const slug = await generateUniqueSlug(data.title, (s) => isSlugTaken(s));

    await prisma.article.create({
      data: {
        title: data.title,
        slug,
        categoryId: data.categoryId,
        ...(data.additionalCategoryIds && data.additionalCategoryIds.length > 0
          ? { additionalCategories: { connect: data.additionalCategoryIds.map((id) => ({ id })) } }
          : {}),
        state: data.state,
        district: data.district,
        reporter: data.reporter,
        content: data.content,
        imageUrl: data.imageUrl,
        status: data.status,
        seoTitle: data.seoTitle || null,
        seoDesc: data.seoDesc || null,
        seoKeys: data.seoKeys || null,
        views: 0
      }
    });

    revalidatePath('/admin/news');
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to create article', error);
    return { success: false, message: 'Failed to save the article to the database.' };
  }
}

export async function updateNewsArticle(
  id: string,
  data: {
    title: string;
    categoryId: string;
    additionalCategoryIds?: string[];
    state: string;
    district: string;
    reporter: string;
    content: string;
    imageUrl?: string;
    status: string;
    seoTitle?: string;
    seoDesc?: string;
    seoKeys?: string;
  }
) {
  try {
    // Regenerate slug when title changes
    const slug = await generateUniqueSlug(data.title, (s) => isSlugTaken(s, id));

    await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        categoryId: data.categoryId,
        additionalCategories: {
          set: data.additionalCategoryIds?.map((id) => ({ id })) || []
        },
        state: data.state,
        district: data.district,
        reporter: data.reporter,
        content: data.content,
        imageUrl: data.imageUrl,
        status: data.status,
        seoTitle: data.seoTitle || null,
        seoDesc: data.seoDesc || null,
        seoKeys: data.seoKeys || null
      }
    });

    revalidatePath('/admin/news');
    revalidatePath(`/admin/news/edit/${id}`);
    revalidatePath(`/news/${id}`);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update article', error);
    return { success: false, message: 'Failed to update the article.' };
  }
}

export async function incrementViews(id: string) {
  try {
    await prisma.article.update({
      where: { id },
      data: { views: { increment: 1 } }
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to increment views', error);
    return { success: false };
  }
}

export async function updateArticleStatus(id: string, newStatus: string) {
  try {
    await prisma.article.update({
      where: { id },
      data: { status: newStatus }
    });

    revalidatePath('/admin/news');
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to change status', error);
    return { success: false, message: 'Failed to update string.' };
  }
}

export async function deleteNewsArticle(id: string) {
  try {
    await prisma.article.delete({ where: { id } });

    revalidatePath('/admin/news');
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete article', error);
    return { success: false, message: 'Failed to delete data.' };
  }
}

export async function wipeAdminMockData() {
  try {
    await prisma.article.deleteMany({});

    revalidatePath('/admin');
    revalidatePath('/admin/news');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to wipe data', error);
    return { success: false };
  }
}
