'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import crypto from 'crypto';
import { generateUniqueSlug } from '@/lib/slug';

// ─── Slug uniqueness checker for articles ────────────────────────────────────
async function isArticleSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const found = await prisma.article.findUnique({ where: { slug } });
  if (!found) return false;
  if (excludeId && found.id === excludeId) return false;
  return true;
}

// Helper to hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function registerReporter(data: {
  email: string;
  fullName: string;
  mobile: string;
  bloodGroup?: string;
  state: string;
  district: string;
  poPs: string;
  block: string;
  fullAddress: string;
  aadhaarNumber?: string;
  aadhaarUrl?: string;
  panUrl?: string;
  voterIdUrl?: string;
  photoUrl?: string;
  educationUrl?: string;
  videoUrl?: string;
  password?: string;
}) {
  try {
    if (!data.email || !data.password || !data.fullName || !data.mobile) {
      return { success: false, message: 'All required fields must be filled.' };
    }

    // Check if email already exists
    const existing = await prisma.reporter.findUnique({
      where: { email: data.email }
    });

    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const hashedPassword = hashPassword(data.password);

    // Calculate next sequential reporterCode: TDA/yy/mm/xxxx
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    
    const count = await prisma.reporter.count();
    let nextSerial = count + 1;
    let reporterCode = `TDA/${yy}/${mm}/${String(nextSerial).padStart(4, '0')}`;
    
    // Ensure uniqueness in case of concurrent registrations or deletions
    let isUnique = false;
    while (!isUnique) {
      const dup = await prisma.reporter.findUnique({
        where: { reporterCode }
      });
      if (!dup) {
        isUnique = true;
      } else {
        nextSerial++;
        reporterCode = `TDA/${yy}/${mm}/${String(nextSerial).padStart(4, '0')}`;
      }
    }

    const reporter = await prisma.reporter.create({
      data: {
        reporterCode,
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        fullName: data.fullName.trim(),
        mobile: data.mobile.trim(),
        bloodGroup: data.bloodGroup || null,
        state: data.state,
        district: data.district,
        poPs: data.poPs.trim(),
        block: data.block.trim(),
        fullAddress: data.fullAddress.trim(),
        aadhaarNumber: data.aadhaarNumber?.trim() || null,
        aadhaarUrl: data.aadhaarUrl || null,
        panUrl: data.panUrl || null,
        voterIdUrl: data.voterIdUrl || null,
        photoUrl: data.photoUrl || null,
        educationUrl: data.educationUrl || null,
        videoUrl: data.videoUrl || null,
        status: 'Pending'
      }
    });

    revalidatePath('/admin/reporters');
    return { success: true, reporterId: reporter.id };
  } catch (error: any) {
    console.error('Error registering reporter:', error);
    return { success: false, message: error.message || 'Registration failed.' };
  }
}

export async function loginReporter(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false, message: 'Email and password are required.' };
    }

    const reporter = await prisma.reporter.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!reporter) {
      return { success: false, message: 'Invalid email or password.' };
    }

    const hashedInput = hashPassword(password);
    if (reporter.password !== hashedInput) {
      return { success: false, message: 'Invalid email or password.' };
    }

    // Dynamic on-the-fly backfill for older registered accounts
    if (!reporter.reporterCode) {
      const date = reporter.createdAt || new Date();
      const yy = String(date.getFullYear()).slice(-2);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      
      const count = await prisma.reporter.count({
        where: { reporterCode: { not: null } }
      });
      let nextSerial = count + 1;
      let reporterCode = `TDA/${yy}/${mm}/${String(nextSerial).padStart(4, '0')}`;
      
      let isUnique = false;
      while (!isUnique) {
        const dup = await prisma.reporter.findUnique({
          where: { reporterCode }
        });
        if (!dup) {
          isUnique = true;
        } else {
          nextSerial++;
          reporterCode = `TDA/${yy}/${mm}/${String(nextSerial).padStart(4, '0')}`;
        }
      }

      await prisma.reporter.update({
        where: { id: reporter.id },
        data: { reporterCode }
      });
      reporter.reporterCode = reporterCode;
    }

    // Return profile safely (excluding hashed password)
    const { password: _, ...safeReporter } = reporter;
    return { success: true, reporter: safeReporter };
  } catch (error: any) {
    console.error('Error logging in reporter:', error);
    return { success: false, message: error.message || 'Login failed.' };
  }
}

export async function getReporterById(id: string) {
  try {
    const reporter = await prisma.reporter.findUnique({
      where: { id }
    });
    if (!reporter) return null;

    // Dynamic on-the-fly backfill for older registered accounts
    if (!reporter.reporterCode) {
      const date = reporter.createdAt || new Date();
      const yy = String(date.getFullYear()).slice(-2);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      
      const count = await prisma.reporter.count({
        where: { reporterCode: { not: null } }
      });
      let nextSerial = count + 1;
      let reporterCode = `TDA/${yy}/${mm}/${String(nextSerial).padStart(4, '0')}`;
      
      let isUnique = false;
      while (!isUnique) {
        const dup = await prisma.reporter.findUnique({
          where: { reporterCode }
        });
        if (!dup) {
          isUnique = true;
        } else {
          nextSerial++;
          reporterCode = `TDA/${yy}/${mm}/${String(nextSerial).padStart(4, '0')}`;
        }
      }

      await prisma.reporter.update({
        where: { id: reporter.id },
        data: { reporterCode }
      });
      reporter.reporterCode = reporterCode;
    }

    const { password: _, ...safeReporter } = reporter;
    return safeReporter;
  } catch (error) {
    console.error('Error getting reporter:', error);
    return null;
  }
}

export async function getReportersList(status?: string) {
  try {
    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const reporters = await prisma.reporter.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    // Dynamic on-the-fly backfill for older registered accounts in list queries
    for (let i = 0; i < reporters.length; i++) {
      const rep = reporters[i];
      if (!rep.reporterCode) {
        const date = rep.createdAt || new Date();
        const yy = String(date.getFullYear()).slice(-2);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        
        const count = await prisma.reporter.count({
          where: { reporterCode: { not: null } }
        });
        let nextSerial = count + 1;
        let reporterCode = `TDA/${yy}/${mm}/${String(nextSerial).padStart(4, '0')}`;
        
        let isUnique = false;
        while (!isUnique) {
          const dup = await prisma.reporter.findUnique({
            where: { reporterCode }
          });
          if (!dup) {
            isUnique = true;
          } else {
            nextSerial++;
            reporterCode = `TDA/${yy}/${mm}/${String(nextSerial).padStart(4, '0')}`;
          }
        }

        await prisma.reporter.update({
          where: { id: rep.id },
          data: { reporterCode }
        });
        rep.reporterCode = reporterCode;
      }
    }

    // Exclude passwords
    return reporters.map(({ password, ...rest }) => rest);
  } catch (error) {
    console.error('Error fetching reporters list:', error);
    return [];
  }
}

export async function updateReporterStatus(
  id: string,
  status: 'Pending' | 'Approved' | 'Rejected' | 'Suspended',
  joiningLetterUrl?: string,
  rejectionReason?: string
) {
  try {
    const data: any = { status };
    if (status === 'Approved' && joiningLetterUrl) {
      data.joiningLetter = joiningLetterUrl;
      data.rejectionReason = null;
    } else if (status === 'Rejected' && rejectionReason) {
      data.rejectionReason = rejectionReason;
      data.joiningLetter = null;
    }

    await prisma.reporter.update({
      where: { id },
      data
    });

    revalidatePath('/admin/reporters');
    revalidatePath(`/reporter/dashboard`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating reporter status:', error);
    return { success: false, message: error.message || 'Failed to update status.' };
  }
}

export async function deleteReporter(id: string) {
  try {
    if (!id) {
      return { success: false, message: 'Reporter ID is required.' };
    }

    await prisma.reporter.delete({
      where: { id }
    });

    revalidatePath('/admin/reporters');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting reporter:', error);
    return { success: false, message: error.message || 'Failed to delete reporter.' };
  }
}

export async function getReporterStats(reporterId: string) {
  try {
    const [totalArticles, publishedArticles, pendingArticles, draftArticles, totalViewsAgg] = await Promise.all([
      prisma.article.count({ where: { reporterId } }),
      prisma.article.count({ where: { reporterId, status: 'Published' } }),
      prisma.article.count({ where: { reporterId, status: 'Pending' } }),
      prisma.article.count({ where: { reporterId, status: 'Draft' } }),
      prisma.article.aggregate({
        where: { reporterId, status: 'Published' },
        _sum: { views: true }
      })
    ]);

    return {
      totalArticles,
      publishedArticles,
      pendingArticles,
      draftArticles,
      totalViews: totalViewsAgg._sum.views || 0
    };
  } catch (error) {
    console.error('Error fetching reporter stats:', error);
    return { totalArticles: 0, publishedArticles: 0, pendingArticles: 0, draftArticles: 0, totalViews: 0 };
  }
}

export async function getReporterArticles(reporterId: string) {
  try {
    return await prisma.article.findMany({
      where: { reporterId },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching reporter articles:', error);
    return [];
  }
}

export async function submitReporterArticle(data: {
  title: string;
  categoryId: string;
  additionalCategoryIds?: string[];
  state: string;
  district: string;
  content: string;
  imageUrl?: string;
  reporterId: string;
  reporterName: string;
  status: 'Draft' | 'Pending';
}) {
  try {
    const slug = await generateUniqueSlug(data.title, (s) => isArticleSlugTaken(s));

    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug,
        categoryId: data.categoryId,
        ...(data.additionalCategoryIds && data.additionalCategoryIds.length > 0
          ? { additionalCategories: { connect: data.additionalCategoryIds.map((id) => ({ id })) } }
          : {}),
        state: data.state,
        district: data.district,
        content: data.content,
        imageUrl: data.imageUrl || null,
        reporter: data.reporterName,
        reporterId: data.reporterId,
        status: data.status,
        views: 0
      }
    });

    revalidatePath('/admin/news');
    revalidatePath('/admin/news-moderation');
    revalidatePath('/');
    return { success: true, articleId: article.id };
  } catch (error: any) {
    console.error('Error submitting reporter article:', error);
    return { success: false, message: error.message || 'Failed to submit article.' };
  }
}

export async function updateReporterArticle(
  articleId: string,
  reporterId: string,
  data: {
    title: string;
    categoryId: string;
    additionalCategoryIds?: string[];
    state: string;
    district: string;
    content: string;
    imageUrl?: string;
    status: 'Draft' | 'Pending';
  }
) {
  try {
    // Make sure the article belongs to the reporter
    const existing = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!existing || existing.reporterId !== reporterId) {
      return { success: false, message: 'Unauthorized or article not found.' };
    }

    const slug = await generateUniqueSlug(data.title, (s) => isArticleSlugTaken(s, articleId));

    const updateData: any = {
      title: data.title,
      slug,
      categoryId: data.categoryId,
      additionalCategories: {
        set: data.additionalCategoryIds?.map((id) => ({ id })) || []
      },
      state: data.state,
      district: data.district,
      content: data.content,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
      status: data.status
    };

    if (existing.status === 'Published') {
      const currentEditCount = existing.editCount || 0;
      if (currentEditCount >= 3) {
        return { success: false, message: 'You have reached the maximum limit of 3 edits for this published article.' };
      }
      updateData.editCount = currentEditCount + 1;
    }

    await prisma.article.update({
      where: { id: articleId },
      data: updateData
    });

    revalidatePath('/admin/news');
    revalidatePath('/admin/news-moderation');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating reporter article:', error);
    return { success: false, message: error.message || 'Failed to update article.' };
  }
}

export async function getPendingArticlesForModeration() {
  try {
    return await prisma.article.findMany({
      where: { status: 'Pending' },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return [];
  }
}

export async function moderateArticle(
  articleId: string,
  action: 'Approve' | 'Reject',
  comments?: string
) {
  try {
    const status = action === 'Approve' ? 'Published' : 'Draft';
    
    // We update status. If rejected, it returns to 'Draft' status for the reporter to edit and resubmit
    await prisma.article.update({
      where: { id: articleId },
      data: { status }
    });

    revalidatePath('/admin/news');
    revalidatePath('/admin/news-moderation');
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error moderating article:', error);
    return { success: false, message: error.message || 'Moderation failed.' };
  }
}

export async function updateReporterProfilePicture(reporterId: string, photoUrl: string) {
  try {
    if (!reporterId || !photoUrl) {
      return { success: false, message: 'Reporter ID and Photo URL are required.' };
    }

    await prisma.reporter.update({
      where: { id: reporterId },
      data: { photoUrl }
    });

    revalidatePath('/admin/reporters');
    revalidatePath(`/reporter/dashboard`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating reporter profile picture:', error);
    return { success: false, message: error.message || 'Failed to update profile picture.' };
  }
}

export async function verifyReporterByCode(code: string) {
  try {
    if (!code || !code.trim()) {
      return { success: false, message: 'Reporter ID is required.' };
    }

    const reporter = await prisma.reporter.findUnique({
      where: { reporterCode: code.trim() }
    });

    if (!reporter) {
      return { success: false, message: 'No reporter found with this ID.' };
    }

    // Return safe data only
    return {
      success: true,
      reporter: {
        id: reporter.id,
        reporterCode: reporter.reporterCode,
        fullName: reporter.fullName,
        photoUrl: reporter.photoUrl,
        district: reporter.district,
        state: reporter.state,
        status: reporter.status,
        createdAt: reporter.createdAt
      }
    };
  } catch (error: any) {
    console.error('Error verifying reporter:', error);
    return { success: false, message: error.message || 'An error occurred during verification.' };
  }
}

export async function getActiveReporterInBlock(block: string, district: string, state: string, excludeReporterId?: string) {
  try {
    if (!block || !district || !state) return null;
    const activeReporter = await prisma.reporter.findFirst({
      where: {
        block: block.trim(),
        district: district.trim(),
        state: state.trim(),
        status: 'Approved',
        ...(excludeReporterId ? { id: { not: excludeReporterId } } : {})
      },
      select: {
        id: true,
        fullName: true,
        reporterCode: true,
        email: true,
        mobile: true
      }
    });
    return activeReporter;
  } catch (error) {
    console.error('Error getting active reporter in block:', error);
    return null;
  }
}


