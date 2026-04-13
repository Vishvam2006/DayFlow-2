import { logger } from '../../utils/logger.js';
import { hrmsApi } from './client.js';
import { config } from '../../config/index.js';

export type VerifiedEmployee = {
  id: string;
  employeeId: string;
  role: string;
  name: string;
  email: string;
  phoneNumber: string;
  department?: string;
  jobTitle?: string;
};

type VerifyEmployeeResponse = {
  success: boolean;
  verified: boolean;
  employee?: VerifiedEmployee;
  error?: string;
};

type EmployeeCacheEntry = {
  employee: VerifiedEmployee;
  expiresAt: number;
};

const employeeVerificationCache = new Map<string, EmployeeCacheEntry>();

export function normalizeWhatsAppJidToPhoneNumber(jid: string | undefined): string | null {
  if (!jid) return null;

  const jidUser = jid.split('@')[0]?.split(':')[0] ?? '';
  const digits = jidUser.replace(/\D/g, '');

  if (!digits) return null;

  return `+${digits}`;
}

export function getCachedEmployeeByPhoneNumber(phoneNumber: string): VerifiedEmployee | null {
  const cached = employeeVerificationCache.get(phoneNumber);

  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    employeeVerificationCache.delete(phoneNumber);
    return null;
  }

  return cached.employee;
}

export async function verifyEmployeeByPhoneNumber(
  phoneNumber: string,
): Promise<VerifiedEmployee | null> {
  const cachedEmployee = getCachedEmployeeByPhoneNumber(phoneNumber);

  if (cachedEmployee) {
    return cachedEmployee;
  }

  const response = await hrmsApi.post<VerifyEmployeeResponse>(
    '/api/bot/verify-employee',
    { phoneNumber },
    { validateStatus: (status) => status === 404 || (status >= 200 && status < 300) },
  );

  if (response.status === 404) {
    return null;
  }

  const data = response.data;

  if (!data.verified || !data.employee) {
    return null;
  }

  employeeVerificationCache.set(phoneNumber, {
    employee: data.employee,
    expiresAt: Date.now() + config.EMPLOYEE_VERIFY_CACHE_TTL_MS,
  });

  logger.info(
    {
      phoneNumber,
      employeeId: data.employee.employeeId,
      role: data.employee.role,
    },
    'Employee verified and cached',
  );

  return data.employee;
}
