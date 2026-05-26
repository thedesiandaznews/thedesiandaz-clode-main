'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';

function generateCode(str: string): string {
  if (!str) return 'XX';
  const code = str.toUpperCase().replace(/[AEIOU\s\W]/g, '').slice(0, 3);
  return code.length > 0 ? code : str.toUpperCase().slice(0, 3).padEnd(2, 'X');
}

export async function registerContributor(data: any) {
  try {
    const existingUser = await prisma.contributor.findUnique({
      where: { mobile: data.mobile }
    });

    if (existingUser) {
      return { success: false, message: 'A contributor with this mobile number is already registered.' };
    }

    const stateCode = generateCode(data.state);
    const distCode = generateCode(data.district);
    const blockCode = generateCode(data.block);

    const count = await prisma.contributor.count({
      where: { state: data.state, district: data.district, block: data.block }
    });
    
    const serial = String(count + 1).padStart(3, '0');
    const generatedId = `TDA/NEWS/IN/${stateCode}/${distCode}/${blockCode}/${serial}`;

    const contributor = await prisma.contributor.create({
      data: {
        contributorId: generatedId,
        fullName: data.fullName,
        mobile: data.mobile,
        password: data.password, // Plain text for now, but should be hashed in a real app
        selfieUrl: data.selfieUrl,
        state: data.state,
        district: data.district,
        block: data.block,
        area: data.area,
        locationLat: data.locationLat ? parseFloat(data.locationLat) : null,
        locationLng: data.locationLng ? parseFloat(data.locationLng) : null,
        status: 'Active',
        points: 0,
        trustScore: 50,
        rank: 'Beginner'
      }
    });

    return { success: true, contributorId: contributor.id, generatedId };
  } catch (error) {
    console.error('Contributor Registration Error:', error);
    return { success: false, message: 'Registration failed. Please try again.' };
  }
}

export async function loginContributor(mobile: string, password: string) {
  try {
    const contributor = await prisma.contributor.findUnique({
      where: { mobile }
    });

    if (!contributor) {
      return { success: false, message: 'No contributor found with this mobile number.' };
    }

    if (contributor.password !== password) {
      return { success: false, message: 'Incorrect password.' };
    }

    return { success: true, contributor };
  } catch (error) {
    console.error('Contributor Login Error:', error);
    return { success: false, message: 'Login failed. Please try again.' };
  }
}

export async function getContributorById(id: string) {
  try {
    const contributor = await prisma.contributor.findUnique({
      where: { id }
    });
    return { success: true, contributor };
  } catch (error) {
    console.error('Error fetching contributor:', error);
    return { success: false, message: 'Failed to fetch profile.' };
  }
}

export async function getLeaderboard() {
  try {
    const leaderboard = await prisma.contributor.findMany({
      where: { status: 'Active' },
      orderBy: { points: 'desc' },
      take: 10,
      select: { id: true, contributorId: true, district: true, points: true, rank: true, selfieUrl: true }
    });
    return { success: true, leaderboard };
  } catch (error) {
    console.error('Leaderboard Error:', error);
    return { success: false, leaderboard: [] };
  }
}

export async function submitIncidentReport(data: any) {
  try {
    const submission = await prisma.submission.create({
      data: {
        contributorId: data.contributorId,
        title: data.title,
        description: data.description,
        category: data.category,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        mediaUrls: data.mediaUrls ? JSON.stringify(data.mediaUrls) : null,
        isGroundAlert: data.isGroundAlert || false,
        status: 'Pending'
      }
    });
    
    // Add 2 points just for submitting
    await prisma.contributor.update({
      where: { id: data.contributorId },
      data: { points: { increment: 2 } }
    });

    revalidatePath('/anonymous/dashboard');
    revalidatePath('/admin/submissions');
    
    return { success: true, submissionId: submission.id };
  } catch (error) {
    console.error('Incident Submission Error:', error);
    return { success: false, message: 'Failed to submit the report.' };
  }
}

export async function getContributorSubmissions(contributorId: string) {
  try {
    const submissions = await prisma.submission.findMany({
      where: { contributorId },
      include: {
        _count: {
          select: { messages: { where: { isRead: false, sender: 'Admin' } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, submissions };
  } catch (error) {
    console.error('Get Submissions Error:', error);
    return { success: false, submissions: [] };
  }
}

// ADMIN ACTIONS
export async function getAllSubmissions() {
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        contributor: {
          select: { contributorId: true, points: true, rank: true, district: true, state: true, block: true, trustScore: true }
        },
        _count: {
          select: { messages: { where: { isRead: false, sender: 'Contributor' } } }
        }
      }
    });
    return { success: true, submissions };
  } catch (error) {
    console.error('Admin Submissions Error:', error);
    return { success: false, submissions: [] };
  }
}

export async function updateSubmissionStatus(id: string, status: string, adminNotes?: string) {
  try {
    const submission = await prisma.submission.update({
      where: { id },
      data: { status, adminNotes }
    });
    
    // Reward points for approval
    if (status === 'Approved') {
      await prisma.contributor.update({
        where: { id: submission.contributorId },
        data: { points: { increment: 10 }, trustScore: { increment: 5 } }
      });
    } else if (status === 'Rejected') {
      await prisma.contributor.update({
        where: { id: submission.contributorId },
        data: { trustScore: { decrement: 2 } }
      });
    }

    revalidatePath('/admin/submissions');
    return { success: true };
  } catch (error) {
    console.error('Update Submission Status Error:', error);
    return { success: false, message: 'Failed to update submission status.' };
  }
}

export async function getAllContributors() {
  try {
    // DO NOT SELECT fullName or mobile to keep PII fully secure from Admin Panel queries
    const contributors = await prisma.contributor.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        contributorId: true,
        state: true,
        district: true,
        block: true,
        area: true,
        status: true,
        points: true,
        trustScore: true,
        rank: true,
        createdAt: true,
        selfieUrl: true,
        locationLat: true,
        locationLng: true
      }
    });
    return { success: true, contributors };
  } catch (error) {
    console.error('Admin Contributors Error:', error);
    return { success: false, contributors: [] };
  }
}

export async function updateContributorStatus(id: string, status: string) {
  try {
    await prisma.contributor.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/admin/anonymous');
    return { success: true };
  } catch (error) {
    console.error('Update Contributor Status Error:', error);
    return { success: false, message: 'Failed to update status.' };
  }
}

export async function deleteSubmission(id: string) {
  try {
    await prisma.submission.delete({
      where: { id }
    });
    revalidatePath('/admin/submissions');
    return { success: true };
  } catch (error) {
    console.error('Delete Submission Error:', error);
    return { success: false, message: 'Failed to delete submission.' };
  }
}

export async function getSubmissionMessages(submissionId: string) {
  try {
    const messages = await prisma.submissionMessage.findMany({
      where: { submissionId },
      orderBy: { createdAt: 'asc' }
    });
    return { success: true, messages };
  } catch (error) {
    console.error('Get Messages Error:', error);
    return { success: false, messages: [] };
  }
}

export async function addSubmissionMessage(submissionId: string, sender: string, message: string) {
  try {
    const newMessage = await prisma.submissionMessage.create({
      data: {
        submissionId,
        sender,
        message
      }
    });
    
    // Auto-update status to In progress if Admin replies, or Verification if Contributor replies
    if (sender === 'Admin') {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'In progress' }
      });
    } else {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'Verification' }
      });
    }

    revalidatePath('/admin/submissions');
    revalidatePath('/anonymous/dashboard');
    return { success: true, message: newMessage };
  } catch (error) {
    console.error('Add Message Error:', error);
    return { success: false, message: 'Failed to send message.' };
  }
}

export async function markMessagesAsRead(submissionId: string, role: string) {
  try {
    const senderToMark = role === 'Admin' ? 'Contributor' : 'Admin';
    await prisma.submissionMessage.updateMany({
      where: { submissionId, sender: senderToMark, isRead: false },
      data: { isRead: true }
    });
    revalidatePath('/admin/submissions');
    revalidatePath('/anonymous/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Mark as Read Error:', error);
    return { success: false };
  }
}
