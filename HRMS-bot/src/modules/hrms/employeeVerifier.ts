import { logger } from '../../utils/logger.js';
import { hrmsApi, isRetryableHrmsError } from './client.js';
import { config } from '../../config/index.js';

export type VerifiedEmployee = {
  id: string;
  empId: string;
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

  const request = () =>
    hrmsApi.post<VerifyEmployeeResponse>(
      '/api/bot/verify-employee',
      { phoneNumber },
      { validateStatus: (status) => status === 404 || (status >= 200 && status < 300) },
    );

  let response;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      response = await request();
      break;
    } catch (error) {
      if (!isRetryableHrmsError(error) || attempt === 2) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }

  if (!response) {
    throw new Error('Employee verification did not return a response.');
  }

  if (response.status === 404) {
    return null;
  }

  const data = response.data;

  if (!data.verified || !data.employee) {
    return null;
  }

  const employee: VerifiedEmployee = {
    ...data.employee,
    empId: data.employee.empId || data.employee.employeeId,
    employeeId: data.employee.employeeId || data.employee.empId,
  };

  employeeVerificationCache.set(phoneNumber, {
    employee,
    expiresAt: Date.now() + config.EMPLOYEE_VERIFY_CACHE_TTL_MS,
  });

  logger.info(
    {
      phoneNumber,
      employeeId: employee.employeeId,
      role: employee.role,
    },
    'Employee verified and cached',
  );

  return employee;
}
