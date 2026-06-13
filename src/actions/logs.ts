'use server';

import prisma from '@/lib/db';

export async function logActivity(data: {
  userId: string;
  userEmail: string;
  userName: string;
  role: string;
  action: string;
  ipAddress: string;
  remarks?: string;
}) {
  try {
    const log = await prisma.activityLog.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        role: data.role,
        action: data.action,
        ipAddress: data.ipAddress,
        remarks: data.remarks || null,
      },
    });
    return { success: true, log };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false, error };
  }
}

export async function getActivityLogs(limit = 100) {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return { success: true, logs };
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return { success: false, logs: [] };
  }
}
