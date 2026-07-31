'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import crypto from 'crypto';
import { generateUniqueSlug } from '@/lib/slug';
import { uploadFileAction } from './upload';
import { encryptPassword, decryptPassword, hashPassword } from '@/lib/crypto';
import { saveLastLogin } from './reporter-passwords';
import { headers } from 'next/headers';

// ─── Slug uniqueness checker for articles ────────────────────────────────────
async function isArticleSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const found = await prisma.article.findUnique({ where: { slug } });
  if (!found) return false;
  if (excludeId && found.id === excludeId) return false;
  return true;
}

export async function registerReporter(data: {
  email: string;
  fullName: string;
  fatherHusbandName?: string;
  mobile: string;
  bloodGroup?: string;
  state: string;
  district: string;
  poPs: string;
  block: string;
  fullAddress: string;
  aadhaarNumber?: string;
  aadhaarUrl?: string;
  aadhaarBackUrl?: string;
  panUrl?: string;
  voterIdUrl?: string;
  photoUrl?: string;
  educationUrl?: string;
  videoUrl?: string;
  password?: string;
  // new optional fields
  role?: string;
  signatureUrl?: string;
  addressProofUrl?: string;
  experienceUrl?: string;
  policeVerificationUrl?: string;
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

    const encryptedPassword = encryptPassword(data.password);

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
        password: encryptedPassword,
        fullName: data.fullName.trim(),
        fatherHusbandName: data.fatherHusbandName?.trim() || null,
        mobile: data.mobile.trim(),
        bloodGroup: data.bloodGroup || null,
        state: data.state,
        district: data.district,
        poPs: data.poPs.trim(),
        block: data.block.trim(),
        fullAddress: data.fullAddress.trim(),
        aadhaarNumber: data.aadhaarNumber?.trim() || null,
        aadhaarUrl: data.aadhaarUrl || null,
        aadhaarBackUrl: data.aadhaarBackUrl || null,
        panUrl: data.panUrl || null,
        voterIdUrl: data.voterIdUrl || null,
        photoUrl: data.photoUrl || null,
        educationUrl: data.educationUrl || null,
        videoUrl: data.videoUrl || null,
        status: 'Pending',
        // New role and KYC fields
        role: data.role || 'BLOCK_CORRESPONDENT',
        signatureUrl: data.signatureUrl || null,
        addressProofUrl: data.addressProofUrl || null,
        experienceUrl: data.experienceUrl || null,
        policeVerificationUrl: data.policeVerificationUrl || null,
      }
    });

    // Create a notification for KYC Submission
    try {
      const { createNotification } = await import('./notifications');
      await createNotification(
        reporter.id,
        'KYC Application Submitted',
        `Your KYC application for ${data.role || 'BLOCK_CORRESPONDENT'} is pending admin review.`
      );
    } catch (notifErr) {
      console.warn('Failed to send notification on register:', notifErr);
    }

    // Log KYC Submission
    try {
      const { logActivity } = await import('./logs');
      await logActivity({
        userId: reporter.id,
        userEmail: reporter.email,
        userName: reporter.fullName,
        role: reporter.role,
        action: 'KYC Submission',
        ipAddress: '127.0.0.1',
        remarks: 'New correspondent registered and KYC documents submitted.'
      });
    } catch (logErr) {
      console.warn('Failed to log activity on register:', logErr);
    }

    revalidatePath('/admin/reporters');
    revalidatePath('/admin/correspondents');
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

    let isCorrect = false;
    if (reporter.password && reporter.password.includes(':')) {
      try {
        const decrypted = decryptPassword(reporter.password);
        isCorrect = (decrypted === password);
      } catch (e) {
        isCorrect = false;
      }
    } else {
      const hashedInput = hashPassword(password);
      isCorrect = (reporter.password === hashedInput);
    }

    if (!isCorrect) {
      return { success: false, message: 'Invalid email or password.' };
    }

    // Resolve client IP address dynamically
    let ipAddress = '127.0.0.1';
    try {
      const clientHeaders = await headers();
      ipAddress = clientHeaders.get('x-forwarded-for') || clientHeaders.get('x-real-ip') || '127.0.0.1';
      if (ipAddress.includes(',')) {
        ipAddress = ipAddress.split(',')[0].trim();
      }
    } catch (e) {
      console.warn('Could not resolve client headers:', e);
    }

    // Save dynamic last login timestamp & IP
    await saveLastLogin(reporter.id, ipAddress);

    // Log Login activity
    try {
      const { logActivity } = await import('./logs');
      await logActivity({
        userId: reporter.id,
        userEmail: reporter.email,
        userName: reporter.fullName,
        role: reporter.role || 'BLOCK_CORRESPONDENT',
        action: 'Login',
        ipAddress,
        remarks: `User logged in from IP ${ipAddress}`
      });
    } catch (logErr) {
      console.warn('Failed to log login activity:', logErr);
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
      select: {
        id: true,
        reporterCode: true,
        email: true,
        fullName: true,
        fatherHusbandName: true,
        mobile: true,
        bloodGroup: true,
        state: true,
        district: true,
        poPs: true,
        block: true,
        fullAddress: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
        photoUrl: true,
        aadhaarNumber: true,
        role: true
      },
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

    // Exclude password (if returned, though select excludes it, keep map for safety/compatibility)
    return reporters.map(({ ...rest }) => rest);
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
    const reporter = await prisma.reporter.findUnique({ where: { id } });
    if (!reporter) {
      return { success: false, message: 'Reporter not found.' };
    }

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

    // Handle notifications and logging
    try {
      const { createNotification } = await import('./notifications');
      const { logActivity } = await import('./logs');

      if (status === 'Approved') {
        // Log KYC Approval
        await logActivity({
          userId: reporter.id,
          userEmail: reporter.email,
          userName: reporter.fullName,
          role: reporter.role,
          action: 'KYC Approval',
          ipAddress: '127.0.0.1',
          remarks: `KYC approved by admin. Role: ${reporter.role}`
        });

        // Send Notifications
        await createNotification(
          reporter.id,
          'KYC Approved',
          `Congratulations! Your KYC for the role of ${reporter.role} has been approved.`
        );
        await createNotification(
          reporter.id,
          'Appointment Generated',
          'Your official appointment letter has been signed and is ready for download.'
        );
        await createNotification(
          reporter.id,
          'ID Card Generated',
          'Your official Desi Andaz identity card has been generated and is ready for download.'
        );
      } else if (status === 'Rejected') {
        // Log KYC Rejection
        await logActivity({
          userId: reporter.id,
          userEmail: reporter.email,
          userName: reporter.fullName,
          role: reporter.role,
          action: 'KYC Rejection',
          ipAddress: '127.0.0.1',
          remarks: `KYC rejected by admin. Reason: ${rejectionReason}`
        });

        // Send Notification
        await createNotification(
          reporter.id,
          'KYC Rejected',
          `Your KYC application has been rejected. Reason: ${rejectionReason || 'Documents incorrect'}`
        );
      }
    } catch (notifErr) {
      console.warn('Failed to log or notify status update:', notifErr);
    }

    revalidatePath('/admin/reporters');
    revalidatePath('/admin/correspondents');
    revalidatePath(`/reporter/dashboard`);
    revalidatePath(`/correspondent/dashboard`);
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
    revalidatePath('/admin/correspondents');
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
    const articles = await prisma.article.findMany({
      where: { reporterId },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    return articles.map(art => ({
      ...art,
      imageUrl: art.imageUrl && art.imageUrl.startsWith('data:')
        ? `/api/news/image?id=${art.id}`
        : art.imageUrl
    }));
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
  status: 'Draft' | 'Submitted' | 'Pending';
}) {
  try {
    const slug = await generateUniqueSlug(data.title, (s) => isArticleSlugTaken(s));

    const finalStatus = data.status === 'Pending' ? 'Submitted' : data.status;

    const cleanContent = data.content ? data.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').substring(0, 160).trim() : '';

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
        status: finalStatus,
        seoDesc: cleanContent || null,
        views: 0
      }
    });

    // Log News Submission activity
    if (finalStatus === 'Submitted') {
      try {
        const reporter = await prisma.reporter.findUnique({ where: { id: data.reporterId } });
        const { logActivity } = await import('./logs');
        await logActivity({
          userId: data.reporterId,
          userEmail: reporter?.email || '',
          userName: data.reporterName,
          role: reporter?.role || 'BLOCK_CORRESPONDENT',
          action: 'News Submission',
          ipAddress: '127.0.0.1',
          remarks: `Submitted news article: "${data.title}"`
        });
      } catch (logErr) {
        console.warn('Failed to log news submission:', logErr);
      }
    }

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
    status: 'Draft' | 'Submitted' | 'Pending' | 'Correction Requested';
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

    const finalStatus = data.status === 'Pending' ? 'Submitted' : data.status;

    const cleanContent = data.content ? data.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').substring(0, 160).trim() : '';

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
      status: finalStatus,
      seoDesc: cleanContent || null
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

    if (finalStatus === 'Submitted') {
      try {
        const reporter = await prisma.reporter.findUnique({ where: { id: reporterId } });
        const { logActivity } = await import('./logs');
        await logActivity({
          userId: reporterId,
          userEmail: reporter?.email || '',
          userName: reporter?.fullName || '',
          role: reporter?.role || 'BLOCK_CORRESPONDENT',
          action: 'News Submission',
          ipAddress: '127.0.0.1',
          remarks: `Updated and submitted news article: "${data.title}"`
        });
      } catch (logErr) {
        console.warn('Failed to log news update/submission:', logErr);
      }
    }

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
    const articles = await prisma.article.findMany({
      where: {
        status: {
          in: ['Pending', 'Submitted', 'District Approved', 'State Approved']
        }
      },
      include: {
        category: true,
        reporterRel: {
          select: {
            reporterCode: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return articles.map(art => ({
      ...art,
      imageUrl: art.imageUrl && art.imageUrl.startsWith('data:')
        ? `/api/news/image?id=${art.id}`
        : art.imageUrl
    }));
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return [];
  }
}

export async function moderateArticle(
  articleId: string,
  action: 'Approve' | 'Reject' | 'RequestCorrection',
  comments?: string,
  moderatorRole?: string,
  moderatorId?: string
) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { reporterRel: true }
    });

    if (!article) {
      return { success: false, message: 'Article not found.' };
    }

    const role = moderatorRole || 'SUPER_ADMIN';
    let status = '';

    if (action === 'Approve') {
      if (role === 'DISTRICT_CORRESPONDENT') {
        status = 'District Approved';
      } else if (role === 'STATE_CORRESPONDENT') {
        status = 'State Approved';
      } else {
        status = 'Website Published';
      }
    } else if (action === 'Reject') {
      if (role === 'DISTRICT_CORRESPONDENT') {
        status = 'District Rejected';
      } else if (role === 'STATE_CORRESPONDENT') {
        status = 'State Rejected';
      } else {
        status = 'Draft';
      }
    } else if (action === 'RequestCorrection') {
      status = 'Correction Requested';
    }

    const updateData: any = { status };
    if (comments) {
      updateData.remarks = comments;
    }

    // Website Live Automation
    if (status === 'Website Published') {
      updateData.publishTimestamp = new Date();
      // Generate Schema Markup dynamically on approval and store it
      const articleUrl = `https://www.thedesiandaz.com/news/${article.slug || article.id}`;
      const newsArticleSchema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": articleUrl
        },
        "headline": article.title,
        "description": article.seoDesc || article.content.replace(/<[^>]*>/g, '').substring(0, 160).trim(),
        "image": article.imageUrl ? [article.imageUrl] : ["https://www.thedesiandaz.com/logo.png"],
        "datePublished": new Date().toISOString(),
        "dateModified": new Date().toISOString(),
        "author": {
          "@type": "Person",
          "name": article.reporter || "संवाददाता"
        },
        "publisher": {
          "@type": "NewsMediaOrganization",
          "name": "The Desi Andaz Media Network",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.thedesiandaz.com/logo.png"
          }
        }
      };
      updateData.schemaMarkup = JSON.stringify(newsArticleSchema);
    }

    await prisma.article.update({
      where: { id: articleId },
      data: updateData
    });

    // Logging & Notifications
    try {
      const { createNotification } = await import('./notifications');
      const { logActivity } = await import('./logs');

      // 1. Log Activity
      let logAction = 'News Review';
      if (action === 'Approve') logAction = 'News Approval';
      else if (action === 'Reject') logAction = 'News Rejection';
      else if (action === 'RequestCorrection') logAction = 'Correction Requested';

      await logActivity({
        userId: moderatorId || 'SYSTEM',
        userEmail: 'admin@thedesiandaz.com',
        userName: `Moderator (${role})`,
        role: role,
        action: logAction,
        ipAddress: '127.0.0.1',
        remarks: `Article ID: ${articleId}. Status changed to: ${status}. Comments: ${comments || 'None'}`
      });

      // 2. Send Notifications
      if (article.reporterId) {
        if (action === 'Approve') {
          await createNotification(
            article.reporterId,
            'News Approved',
            `Your report "${article.title.substring(0, 30)}..." has been approved at the ${role} level.`
          );
          if (status === 'Website Published') {
            await createNotification(
              article.reporterId,
              'Website Published',
              `Your report "${article.title.substring(0, 30)}..." is now LIVE on the website.`
            );
          }
        } else if (action === 'Reject') {
          await createNotification(
            article.reporterId,
            'News Rejected',
            `Your report "${article.title.substring(0, 30)}..." has been rejected. Comments: ${comments || 'No remarks'}`
          );
        } else if (action === 'RequestCorrection') {
          await createNotification(
            article.reporterId,
            'Correction Requested',
            `Correction requested for "${article.title.substring(0, 30)}...". Please review remarks: ${comments || ''}`
          );
        }
      }
    } catch (logErr) {
      console.warn('Failed to log or notify moderation step:', logErr);
    }

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
    revalidatePath('/admin/correspondents');
    revalidatePath(`/reporter/dashboard`);
    revalidatePath(`/correspondent/dashboard`);
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

export async function approveReporterWithLetterAction(formData: FormData) {
  try {
    const reporterId = formData.get('reporterId') as string;
    if (!reporterId) {
      return { success: false, message: 'Reporter ID is required.' };
    }

    const uploadRes = await uploadFileAction(formData);
    if (!uploadRes.success || !uploadRes.url) {
      return { success: false, message: uploadRes.message || 'Failed to upload joining letter' };
    }

    const res = await updateReporterStatus(reporterId, 'Approved', uploadRes.url);
    if (!res.success) {
      return { success: false, message: res.message || 'Failed to update reporter status' };
    }

    return { success: true, url: uploadRes.url };
  } catch (error: any) {
    console.error('Error in approveReporterWithLetterAction:', error);
    return { success: false, message: error.message || 'Operation failed.' };
  }
}

export async function getCorrespondentsForHierarchy(filters: {
  role?: string;
  state?: string;
  district?: string;
  status?: string;
}) {
  try {
    const where: any = {};
    if (filters.role) where.role = filters.role;
    if (filters.state) where.state = filters.state;
    if (filters.district) where.district = filters.district;
    if (filters.status) where.status = filters.status;

    return await prisma.reporter.findMany({
      where,
      select: {
        id: true,
        reporterCode: true,
        fullName: true,
        email: true,
        mobile: true,
        role: true,
        state: true,
        district: true,
        block: true,
        status: true,
        photoUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching correspondents for hierarchy:', error);
    return [];
  }
}

export async function getArticlesForModeration(
  role: string,
  state: string,
  district?: string
) {
  try {
    const where: any = {};
    if (role === 'DISTRICT_CORRESPONDENT') {
      where.status = 'Submitted';
      where.state = state;
      if (district) where.district = district;
    } else if (role === 'STATE_CORRESPONDENT') {
      where.status = 'District Approved';
      where.state = state;
    } else {
      where.status = { in: ['Submitted', 'District Approved', 'State Approved', 'Pending'] };
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        category: true,
        additionalCategories: true,
        reporterRel: {
          select: {
            fullName: true,
            reporterCode: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return articles.map(art => ({
      ...art,
      imageUrl: art.imageUrl && art.imageUrl.startsWith('data:')
        ? `/api/news/image?id=${art.id}`
        : art.imageUrl
    }));
  } catch (error) {
    console.error('Error fetching articles for moderation:', error);
    return [];
  }
}

export async function updateReporterRoleAction(id: string, role: string) {
  try {
    const reporter = await prisma.reporter.findUnique({ where: { id } });
    if (!reporter) {
      return { success: false, message: 'Reporter not found.' };
    }

    const updated = await prisma.reporter.update({
      where: { id },
      data: { role }
    });

    // Handle audit log
    try {
      const { logActivity } = await import('./logs');
      await logActivity({
        userId: id,
        userEmail: reporter.email,
        userName: reporter.fullName,
        role: role,
        action: 'Role Promotion/Change',
        ipAddress: '127.0.0.1',
        remarks: `Role updated from ${reporter.role} to ${role} by admin.`
      });
    } catch (e) {
      console.error('Failed to log role update activity:', e);
    }

    revalidatePath('/admin/reporters');
    return { success: true, reporter: updated };
  } catch (error: any) {
    console.error('Error updating reporter role:', error);
    return { success: false, message: error.message || 'Failed to update role.' };
  }
}



