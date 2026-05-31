'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Fetch all messages for a specific reporter chat
export async function getReporterMessages(reporterId: string) {
  try {
    if (!reporterId) return [];

    return await prisma.reporterMessage.findMany({
      where: { reporterId },
      orderBy: { createdAt: 'asc' }
    });
  } catch (error) {
    console.error('Error fetching reporter messages:', error);
    return [];
  }
}

// Send a new message in the reporter chat
export async function sendReporterMessage(reporterId: string, sender: 'Admin' | 'Reporter', message: string) {
  try {
    if (!reporterId || !message.trim()) {
      return { success: false, error: 'Missing reporter ID or message content' };
    }

    const newMessage = await prisma.reporterMessage.create({
      data: {
        reporterId,
        sender,
        message: message.trim(),
        isRead: false
      }
    });

    revalidatePath('/admin/reporters');
    revalidatePath('/reporter/dashboard');
    return { success: true, message: newMessage };
  } catch (error: any) {
    console.error('Error sending reporter message:', error);
    return { success: false, error: error.message || 'Failed to send message' };
  }
}

// Mark all messages as read in the chat
export async function markReporterMessagesAsRead(reporterId: string, viewer: 'Admin' | 'Reporter') {
  try {
    if (!reporterId) return { success: false };

    // If Admin is viewing, mark all Reporter messages as read
    // If Reporter is viewing, mark all Admin messages as read
    const targetSender = viewer === 'Admin' ? 'Reporter' : 'Admin';

    await prisma.reporterMessage.updateMany({
      where: {
        reporterId,
        sender: targetSender,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    revalidatePath('/admin/reporters');
    revalidatePath('/reporter/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false };
  }
}

// Get count of unread messages for a specific reporter or for admin
export async function getUnreadMessageCount(reporterId: string, viewer: 'Admin' | 'Reporter') {
  try {
    const targetSender = viewer === 'Admin' ? 'Reporter' : 'Admin';
    
    return await prisma.reporterMessage.count({
      where: {
        reporterId,
        sender: targetSender,
        isRead: false
      }
    });
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
}
