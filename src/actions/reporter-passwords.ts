'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { promises as fs } from 'fs';
import path from 'path';
import { getSiteSettings } from '@/actions/settings';
import { encryptPassword, decryptPassword, hashPassword } from '@/lib/crypto';

const AUDIT_LOG_PATH = path.join(process.cwd(), 'audit.log');
const LAST_LOGINS_PATH = path.join(process.cwd(), 'last_logins.json');

// Helper to verify if the requester is the Super Admin
async function checkIsSuperAdmin(adminUsername: string): Promise<boolean> {
  const settings = await getSiteSettings();
  const activeAdminId = settings.adminId || 'ThedesiandazNews';
  return adminUsername === activeAdminId;
}

// Helper to log password view or reset activity
export async function logAuditActivity(adminName: string, correspondentName: string, action: string) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    adminName,
    correspondentName,
    action
  };
  const logLine = JSON.stringify(logEntry) + '\n';
  try {
    await fs.appendFile(AUDIT_LOG_PATH, logLine, 'utf8');
  } catch (e) {
    console.error('Failed to write audit log:', e);
  }
}

// Fetch the mapping of reporterId to last login info
export async function getLastLoginsMap(): Promise<Record<string, { lastLoginAt: string; ip: string }>> {
  try {
    const data = await fs.readFile(LAST_LOGINS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

// Update the last login entry for a correspondent
export async function saveLastLogin(reporterId: string, ip: string) {
  try {
    const map = await getLastLoginsMap();
    map[reporterId] = {
      lastLoginAt: new Date().toISOString(),
      ip: ip || '127.0.0.1'
    };
    await fs.writeFile(LAST_LOGINS_PATH, JSON.stringify(map, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save last login:', e);
  }
}

// Server action: Verify Super Admin Credentials
export async function verifySuperAdminCredentials(adminId: string, passwordPlain: string) {
  try {
    const settings = await getSiteSettings();
    const dbId = settings.adminId || 'ThedesiandazNews';
    const dbPassword = settings.adminPassword || 'Thedesiandaz@3820';

    if (adminId === dbId && passwordPlain === dbPassword) {
      return { success: true };
    }
    return { success: false, message: 'Invalid Admin ID or Password.' };
  } catch (error: any) {
    console.error('Super Admin verification failed:', error);
    return { success: false, message: 'Internal server error.' };
  }
}

// Server action: Get Correspondents List with Hashed/Decrypted Passwords
export async function getCorrespondentsPasswordsList(adminUsername: string) {
  const isSuper = await checkIsSuperAdmin(adminUsername);
  if (!isSuper) {
    throw new Error('Unauthorized access to password list.');
  }

  try {
    const reporters = await prisma.reporter.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const loginsMap = await getLastLoginsMap();

    return reporters.map(r => {
      let plainPassword = null;
      let isReversible = false;

      if (r.password && r.password.includes(':')) {
        try {
          plainPassword = decryptPassword(r.password);
          isReversible = true;
        } catch (e) {
          // Decryption failed
          plainPassword = null;
        }
      }

      const loginInfo = loginsMap[r.id] || null;

      return {
        id: r.id,
        fullName: r.fullName,
        email: r.email,
        mobile: r.mobile,
        reporterCode: r.reporterCode || 'Pending Code',
        status: r.status,
        isReversible,
        passwordPreview: plainPassword, // Decrypted if reversible, otherwise null (requires reset)
        lastLogin: loginInfo ? `${new Date(loginInfo.lastLoginAt).toLocaleString('hi-IN')} (${loginInfo.ip})` : 'कभी नहीं (Never)'
      };
    });
  } catch (error: any) {
    console.error('Failed to load password list:', error);
    return [];
  }
}

// Server action: Log viewed password action
export async function logPasswordViewAction(adminName: string, correspondentName: string, action: string) {
  const isSuper = await checkIsSuperAdmin(adminName);
  if (!isSuper) {
    throw new Error('Unauthorized');
  }
  await logAuditActivity(adminName, correspondentName, action);
  return { success: true };
}

// Server action: Reset password
export async function resetCorrespondentPasswordAction(adminName: string, reporterId: string, newPasswordPlain: string) {
  const isSuper = await checkIsSuperAdmin(adminName);
  if (!isSuper) {
    throw new Error('Unauthorized');
  }

  try {
    const correspondent = await prisma.reporter.findUnique({
      where: { id: reporterId }
    });

    if (!correspondent) {
      return { success: false, message: 'Correspondent not found.' };
    }

    const encrypted = encryptPassword(newPasswordPlain);

    await prisma.reporter.update({
      where: { id: reporterId },
      data: { password: encrypted }
    });

    // Log the reset activity
    await logAuditActivity(
      adminName,
      correspondent.fullName,
      `Reset password to: "${newPasswordPlain}"`
    );

    revalidatePath('/admin/reporters');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to reset password:', error);
    return { success: false, message: error.message || 'Failed to reset password.' };
  }
}

// Server action: Get audit logs
export async function getAuditLogsAction(adminName: string) {
  const isSuper = await checkIsSuperAdmin(adminName);
  if (!isSuper) {
    throw new Error('Unauthorized');
  }

  try {
    const data = await fs.readFile(AUDIT_LOG_PATH, 'utf8');
    return data
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line))
      .reverse(); // Newest logs first
  } catch (e) {
    return [];
  }
}
