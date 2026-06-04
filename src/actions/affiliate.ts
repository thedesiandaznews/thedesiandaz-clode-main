/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import crypto from 'crypto';

// Helper to hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ─── AFFILIATE REGISTRATION ──────────────────────────────────────────────────
export async function registerAffiliatePartner(data: any) {
  try {
    if (!data.email || !data.password || !data.fullName || !data.mobile) {
      return { success: false, message: 'All required fields must be filled.' };
    }

    // Check if email already exists
    const existing = await prisma.affiliate.findUnique({
      where: { email: data.email.toLowerCase().trim() }
    });

    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const hashedPassword = hashPassword(data.password);

    // Generate unique affiliate code: TDA1001, TDA1002, etc.
    const count = await prisma.affiliate.count();
    let nextSerial = 1001 + count;
    let affiliateCode = `TDA${nextSerial}`;

    // Ensure uniqueness
    let isUnique = false;
    while (!isUnique) {
      const dup = await prisma.affiliate.findUnique({
        where: { affiliateCode }
      });
      if (!dup) {
        isUnique = true;
      } else {
        nextSerial++;
        affiliateCode = `TDA${nextSerial}`;
      }
    }

    const affiliate = await prisma.affiliate.create({
      data: {
        affiliateCode,
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        fullName: data.fullName.trim(),
        mobile: data.mobile.trim(),
        dob: data.dob,
        address: data.address.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        pinCode: data.pinCode.trim(),
        aadhaarNumber: data.aadhaarNumber?.trim() || null,
        panNumber: data.panNumber?.trim() || null,
        bankHolderName: data.bankHolderName?.trim() || null,
        bankAccountNumber: data.bankAccountNumber?.trim() || null,
        ifscCode: data.ifscCode?.trim() || null,
        upiId: data.upiId?.trim() || null,
        photoUrl: data.photoUrl || null,
        status: 'Pending',
        termsAccepted: true
      }
    });

    // Save initial digital agreement
    await prisma.affiliateAgreement.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null
      }
    });

    return { success: true, affiliateId: affiliate.id, affiliateCode };
  } catch (error: any) {
    console.error('Error registering affiliate:', error);
    return { success: false, message: error.message || 'Registration failed.' };
  }
}

// ─── AFFILIATE LOGIN ─────────────────────────────────────────────────────────
export async function loginAffiliatePartner(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false, message: 'Email and password are required.' };
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!affiliate) {
      return { success: false, message: 'Invalid email or password.' };
    }

    const hashedInput = hashPassword(password);
    if (affiliate.password !== hashedInput) {
      return { success: false, message: 'Invalid email or password.' };
    }

    const { password: _, ...safeAffiliate } = affiliate;
    return { success: true, affiliate: safeAffiliate };
  } catch (error: any) {
    console.error('Error logging in affiliate:', error);
    return { success: false, message: error.message || 'Login failed.' };
  }
}

// ─── GET AFFILIATE STATS ─────────────────────────────────────────────────────
export async function getAffiliateDashboardData(affiliateId: string) {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        clicks: true,
        leads: true,
        sales: {
          orderBy: { createdAt: 'desc' }
        },
        transactions: {
          orderBy: { createdAt: 'desc' }
        },
        payouts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!affiliate) return null;

    const totalClicks = affiliate.clicks.length;
    const totalLeads = affiliate.leads.length;
    const totalSales = affiliate.sales.filter(s => s.paymentStatus === 'Paid').length;
    
    // Revenue calculations
    const totalRevenueGenerated = affiliate.sales
      .filter(s => s.paymentStatus === 'Paid')
      .reduce((sum, s) => sum + s.totalPaid, 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthSales = affiliate.sales.filter(s => {
      const d = new Date(s.createdAt);
      return s.paymentStatus === 'Paid' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const currentMonthRevenue = currentMonthSales.reduce((sum, s) => sum + s.totalPaid, 0);
    const currentMonthBaseValue = currentMonthSales.reduce((sum, s) => sum + s.baseValue, 0);

    // Commissions
    const pendingCommission = affiliate.sales
      .filter(s => s.commissionStatus === 'Pending')
      .reduce((sum, s) => sum + s.commissionEarned, 0);

    const approvedCommission = affiliate.sales
      .filter(s => s.commissionStatus === 'Approved')
      .reduce((sum, s) => sum + s.commissionEarned, 0);

    const paidCommission = affiliate.sales
      .filter(s => s.commissionStatus === 'Paid')
      .reduce((sum, s) => sum + s.commissionEarned, 0);

    // Wallet transaction calculations
    // Credits: Approved or Paid
    // Debits: Paid Payouts
    const walletCredits = affiliate.transactions
      .filter(t => t.type === 'Credit' && (t.status === 'Approved' || t.status === 'Paid'))
      .reduce((sum, t) => sum + t.amount, 0);

    const walletDebits = affiliate.transactions
      .filter(t => (t.type === 'Debit' || t.type === 'Reversal') && t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);

    const walletBalance = Math.max(0, walletCredits - walletDebits);

    const totalLifetimeEarnings = approvedCommission + paidCommission;

    // Slabs logic
    // 0 - 100k: 15%
    // 100k - 200k: 18%
    // 200k - 500k: 20%
    // Above 500k: 25% (or read from config setting)
    let currentSlab = '15%';
    let nextSlab = '18%';
    let remainingTarget = 100000 - currentMonthBaseValue;
    let slabPercent = 15;

    if (currentMonthBaseValue > 500000) {
      currentSlab = '25%';
      nextSlab = 'Max Achieved';
      remainingTarget = 0;
      slabPercent = 25;
    } else if (currentMonthBaseValue > 200000) {
      currentSlab = '20%';
      nextSlab = '25%';
      remainingTarget = 500000 - currentMonthBaseValue;
      slabPercent = 20;
    } else if (currentMonthBaseValue > 100000) {
      currentSlab = '18%';
      nextSlab = '20%';
      remainingTarget = 200000 - currentMonthBaseValue;
      slabPercent = 18;
    }

    return {
      affiliateCode: affiliate.affiliateCode,
      fullName: affiliate.fullName,
      status: affiliate.status,
      kycVerified: affiliate.kycVerified,
      totalClicks,
      totalLeads,
      totalSales,
      totalRevenueGenerated,
      currentMonthRevenue,
      currentMonthBaseValue,
      pendingCommission,
      approvedCommission,
      paidCommission,
      walletBalance,
      totalLifetimeEarnings,
      currentSlab,
      nextSlab,
      remainingTarget: Math.max(0, remainingTarget),
      slabPercent,
      salesList: affiliate.sales,
      transactions: affiliate.transactions,
      payouts: affiliate.payouts
    };
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    return null;
  }
}

// ─── REFERRAL CLICK TRACKING ─────────────────────────────────────────────────
export async function trackReferralClick(affiliateCode: string, referrer: string | null, targetUrl: string | null, ip: string | null, ua: string | null) {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { affiliateCode: affiliateCode.toUpperCase().trim() }
    });

    if (!affiliate) return { success: false, message: 'Invalid affiliate code.' };

    await prisma.referralClick.create({
      data: {
        affiliateId: affiliate.id,
        referrer: referrer || 'Direct',
        targetUrl: targetUrl || '/',
        ipAddress: ip,
        userAgent: ua
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking referral click:', error);
    return { success: false };
  }
}

// ─── REFERRAL LEAD TRACKING ──────────────────────────────────────────────────
export async function trackReferralLead(affiliateCode: string, data: { name: string; email: string; phone: string; service?: string }) {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { affiliateCode: affiliateCode.toUpperCase().trim() }
    });

    if (!affiliate) return { success: false, message: 'Invalid affiliate code.' };

    await prisma.referralLead.create({
      data: {
        affiliateId: affiliate.id,
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        serviceName: data.service || 'B2B Advertising'
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking referral lead:', error);
    return { success: false };
  }
}

// ─── REFERRAL SALE TRACKING ──────────────────────────────────────────────────
export async function trackReferralSale(affiliateCode: string, data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageName: string;
  totalPaid: number;
  transactionId?: string;
  referralSource?: string;
}) {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { affiliateCode: affiliateCode.toUpperCase().trim() }
    });

    if (!affiliate) return { success: false, message: 'Invalid affiliate code.' };

    // Anti-fraud: Prevent self-referrals
    if (affiliate.email === data.customerEmail.toLowerCase().trim() || affiliate.mobile === data.customerPhone.trim()) {
      console.warn('Fraud Detected: Self Referral purchase attempted', affiliate.email);
      // Log suspicious activity or just return error
      return { success: false, message: 'Self referral is not allowed.' };
    }

    // GST Exclusion Rule calculation:
    // Base amount is paid amount / 1.18 (assuming 18% GST)
    const baseValue = Number((data.totalPaid / 1.18).toFixed(2));
    const gstAmount = Number((data.totalPaid - baseValue).toFixed(2));

    // Determine default commission rate (15% for starting slab)
    const commissionRate = 0.15;
    const commissionEarned = Number((baseValue * commissionRate).toFixed(2));

    // Create the Sale
    const sale = await prisma.referralSale.create({
      data: {
        affiliateId: affiliate.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail.toLowerCase().trim(),
        customerPhone: data.customerPhone.trim(),
        packageName: data.packageName,
        baseValue,
        gstAmount,
        totalPaid: data.totalPaid,
        paymentStatus: 'Paid',
        transactionId: data.transactionId || null,
        referralSource: data.referralSource || 'Direct',
        commissionRate,
        commissionEarned,
        commissionStatus: 'Pending'
      }
    });

    // Create a pending wallet transaction
    await prisma.walletTransaction.create({
      data: {
        affiliateId: affiliate.id,
        amount: commissionEarned,
        type: 'Credit',
        status: 'Pending',
        description: `Commission from sales to ${data.customerName} (${data.packageName})`,
        saleId: sale.id
      }
    });

    // Dynamically recalculate monthly commissions to apply slab upgrades automatically
    const now = new Date();
    await recalculateMonthlyCommissions(affiliate.id, now.getMonth(), now.getFullYear());

    return { success: true, saleId: sale.id };
  } catch (error: any) {
    console.error('Error tracking referral sale:', error);
    return { success: false, message: error.message || 'Error tracking sale.' };
  }
}

// ─── RECALCULATE MONTHLY COMMISSION SLABS (DYNAMIC SLAB APPLIED TO ENTIRE MONTH) ───────────
export async function recalculateMonthlyCommissions(affiliateId: string, month: number, year: number) {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    // Get all paid sales of this affiliate in this calendar month
    const sales = await prisma.referralSale.findMany({
      where: {
        affiliateId,
        paymentStatus: 'Paid',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    if (sales.length === 0) return;

    // Calculate total base sales value
    const totalBaseSales = sales.reduce((sum, s) => sum + s.baseValue, 0);

    // Determine matching slab rate
    let slabRate = 0.15; // 15% standard
    if (totalBaseSales > 500000) {
      slabRate = 0.25; // 25% Configurable max
    } else if (totalBaseSales > 200000) {
      slabRate = 0.20; // 20%
    } else if (totalBaseSales > 100000) {
      slabRate = 0.18; // 18%
    }

    // Update each sale and its associated pending wallet transaction with the new slab rate
    for (const sale of sales) {
      // Re-calculate commission
      const commissionEarned = Number((sale.baseValue * slabRate).toFixed(2));

      await prisma.referralSale.update({
        where: { id: sale.id },
        data: {
          commissionRate: slabRate,
          commissionEarned
        }
      });

      // Update the pending wallet transaction associated with this sale
      const txn = await prisma.walletTransaction.findFirst({
        where: { saleId: sale.id, type: 'Credit' }
      });

      if (txn) {
        await prisma.walletTransaction.update({
          where: { id: txn.id },
          data: {
            amount: commissionEarned
          }
        });
      }
    }
  } catch (error) {
    console.error('Error recalculating monthly commissions:', error);
  }
}

// ─── REFUND / CANCELLATION COMMISSION REVERSAL ──────────────────────────────
export async function refundReferralSale(saleId: string) {
  try {
    const sale = await prisma.referralSale.findUnique({
      where: { id: saleId }
    });

    if (!sale) return { success: false, message: 'Sale not found.' };

    // Update sale status to Refunded
    await prisma.referralSale.update({
      where: { id: saleId },
      data: {
        paymentStatus: 'Refunded',
        commissionStatus: 'Reversed'
      }
    });

    // Create a Reversal transaction in the wallet
    await prisma.walletTransaction.create({
      data: {
        affiliateId: sale.affiliateId,
        amount: sale.commissionEarned,
        type: 'Reversal',
        status: 'Paid', // Instantly processed/deducted from balance
        description: `Commission reversed due to refund/cancellation of ${sale.customerName}'s purchase`,
        saleId: sale.id
      }
    });

    // Re-verify slab percentages for the month of sale
    const saleDate = new Date(sale.createdAt);
    await recalculateMonthlyCommissions(sale.affiliateId, saleDate.getMonth(), saleDate.getFullYear());

    return { success: true };
  } catch (error: any) {
    console.error('Error reversing commission:', error);
    return { success: false, message: error.message };
  }
}

// ─── DIGITAL AGREEMENT LOGGING ───────────────────────────────────────────────
export async function saveAgreementAcceptance(affiliateId: string, ip: string | null, ua: string | null) {
  try {
    await prisma.affiliateAgreement.create({
      data: {
        affiliateId,
        ipAddress: ip,
        userAgent: ua
      }
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving agreement acceptance:', error);
    return { success: false };
  }
}

// ─── ADMIN: GET ALL PARTNERS ────────────────────────────────────────────────
export async function getAffiliatesForAdmin() {
  try {
    const affiliates = await prisma.affiliate.findMany({
      include: {
        clicks: true,
        leads: true,
        sales: true,
        transactions: true,
        payouts: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return affiliates.map(aff => {
      // Calculate dynamic wallet balances
      const credits = aff.transactions
        .filter(t => t.type === 'Credit' && (t.status === 'Approved' || t.status === 'Paid'))
        .reduce((sum, t) => sum + t.amount, 0);

      const debits = aff.transactions
        .filter(t => (t.type === 'Debit' || t.type === 'Reversal') && t.status === 'Paid')
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = Math.max(0, credits - debits);

      return {
        id: aff.id,
        affiliateCode: aff.affiliateCode,
        fullName: aff.fullName,
        email: aff.email,
        mobile: aff.mobile,
        dob: aff.dob,
        address: `${aff.address}, ${aff.city}, ${aff.state} - ${aff.pinCode}`,
        kycVerified: aff.kycVerified,
        status: aff.status,
        clicks: aff.clicks.length,
        leads: aff.leads.length,
        sales: aff.sales.filter(s => s.paymentStatus === 'Paid').length,
        walletBalance: balance,
        lifetimeEarnings: aff.sales.filter(s => s.commissionStatus === 'Approved' || s.commissionStatus === 'Paid').reduce((sum, s) => sum + s.commissionEarned, 0),
        payouts: aff.payouts,
        bankDetails: {
          holder: aff.bankHolderName,
          account: aff.bankAccountNumber,
          ifsc: aff.ifscCode,
          upi: aff.upiId
        },
        photoUrl: aff.photoUrl,
        pan: aff.panNumber,
        aadhaar: aff.aadhaarNumber
      };
    });
  } catch (error) {
    console.error('Error listing affiliates for admin:', error);
    return [];
  }
}

// ─── ADMIN: APPROVE / REJECT AFFILIATE ───────────────────────────────────────
export async function updateAffiliateStatus(id: string, status: string) {
  try {
    await prisma.affiliate.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/admin/affiliates');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating status:', error);
    return { success: false, message: error.message };
  }
}

// ─── ADMIN: VERIFY KYC ───────────────────────────────────────────────────────
export async function updateAffiliateKYC(id: string, verified: boolean) {
  try {
    await prisma.affiliate.update({
      where: { id },
      data: { kycVerified: verified }
    });
    revalidatePath('/admin/affiliates');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating KYC verified:', error);
    return { success: false, message: error.message };
  }
}

// ─── ADMIN: RELEASE MONTHLY PAYOUT ───────────────────────────────────────────
export async function releasePayout(data: {
  affiliateId: string;
  amount: number;
  referenceNumber: string;
  paymentMethod: string;
}) {
  try {
    if (!data.affiliateId || !data.amount || !data.referenceNumber) {
      return { success: false, message: 'All payout fields are required.' };
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: data.affiliateId },
      include: {
        transactions: true,
        sales: true
      }
    });

    if (!affiliate) return { success: false, message: 'Affiliate not found.' };

    // Verify wallet balance is sufficient
    const credits = affiliate.transactions
      .filter(t => t.type === 'Credit' && (t.status === 'Approved' || t.status === 'Paid'))
      .reduce((sum, t) => sum + t.amount, 0);

    const debits = affiliate.transactions
      .filter(t => (t.type === 'Debit' || t.type === 'Reversal') && t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);

    const walletBalance = credits - debits;

    if (data.amount > walletBalance) {
      return { success: false, message: `Insufficient wallet balance. Available: ₹${walletBalance}` };
    }

    // Create the payout entry
    const payout = await prisma.payout.create({
      data: {
        affiliateId: data.affiliateId,
        amount: data.amount,
        referenceNumber: data.referenceNumber,
        paymentMethod: data.paymentMethod,
        status: 'Paid'
      }
    });

    // Create a debit transaction to reduce wallet balance
    await prisma.walletTransaction.create({
      data: {
        affiliateId: data.affiliateId,
        amount: data.amount,
        type: 'Debit',
        status: 'Paid',
        description: `Payout released with ref: ${data.referenceNumber}`,
        payoutId: payout.id
      }
    });

    // Bulk approve/pay commissions from Pending/Approved to Paid for sales recorded
    // Mark sales commissions as Paid in database
    await prisma.referralSale.updateMany({
      where: {
        affiliateId: data.affiliateId,
        commissionStatus: { in: ['Pending', 'Approved'] }
      },
      data: {
        commissionStatus: 'Paid'
      }
    });

    // Update wallet credit transactions status to Paid
    await prisma.walletTransaction.updateMany({
      where: {
        affiliateId: data.affiliateId,
        type: 'Credit',
        status: 'Approved'
      },
      data: {
        status: 'Paid'
      }
    });

    revalidatePath('/admin/affiliates');
    return { success: true };
  } catch (error: any) {
    console.error('Error releasing payout:', error);
    return { success: false, message: error.message };
  }
}

// ─── ADMIN: APPROVE BULK COMMISSIONS ──────────────────────────────────────────
export async function approveAffiliateCommissions(affiliateId: string) {
  try {
    // Approve all pending sales commission
    await prisma.referralSale.updateMany({
      where: {
        affiliateId,
        commissionStatus: 'Pending'
      },
      data: {
        commissionStatus: 'Approved'
      }
    });

    // Approve wallet transaction logs
    await prisma.walletTransaction.updateMany({
      where: {
        affiliateId,
        type: 'Credit',
        status: 'Pending'
      },
      data: {
        status: 'Approved'
      }
    });

    revalidatePath('/admin/affiliates');
    return { success: true };
  } catch (error: any) {
    console.error('Error approving commissions:', error);
    return { success: false, message: error.message };
  }
}

// ─── MARKETING MATERIALS ─────────────────────────────────────────────────────
export async function uploadMarketingMaterial(data: { title: string; type: string; fileUrl: string; description?: string }) {
  try {
    await prisma.marketingMaterial.create({
      data: {
        title: data.title,
        type: data.type,
        fileUrl: data.fileUrl,
        description: data.description || null
      }
    });
    revalidatePath('/admin/affiliates');
    return { success: true };
  } catch (error: any) {
    console.error('Error uploading marketing material:', error);
    return { success: false, message: error.message };
  }
}

export async function getMarketingMaterials() {
  try {
    return await prisma.marketingMaterial.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error getting marketing materials:', error);
    return [];
  }
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
export async function getAffiliateLeaderboard() {
  try {
    const affiliates = await prisma.affiliate.findMany({
      include: {
        sales: {
          where: { paymentStatus: 'Paid' }
        }
      }
    });

    const leaderboard = affiliates.map(aff => {
      const totalSalesValue = aff.sales.reduce((sum, s) => sum + s.baseValue, 0);
      return {
        id: aff.id,
        fullName: aff.fullName,
        affiliateCode: aff.affiliateCode,
        salesCount: aff.sales.length,
        totalSalesValue
      };
    });

    // Sort by sales value
    return leaderboard.sort((a, b) => b.totalSalesValue - a.totalSalesValue).slice(0, 10);
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return [];
  }
}
