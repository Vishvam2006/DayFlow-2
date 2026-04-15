import { afterEach, describe, expect, test, vi } from "vitest";
import {
  getEmailEnvIssues,
  warnIfEmailEnvInvalid,
} from "../../../services/email/emailService.js";

describe("Email service configuration helpers", () => {
  const originalEnv = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
  };

  afterEach(() => {
    process.env.RESEND_API_KEY = originalEnv.RESEND_API_KEY;
    process.env.EMAIL_FROM = originalEnv.EMAIL_FROM;
    vi.restoreAllMocks();
  });

  test("reports missing email env vars", () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;

    expect(getEmailEnvIssues()).toEqual([
      "Missing RESEND_API_KEY",
      "Missing EMAIL_FROM",
    ]);
  });

  test("returns no issues when required email env vars are present", () => {
    process.env.RESEND_API_KEY = "re_test_123";
    process.env.EMAIL_FROM = "DayFlow <noreply@example.com>";

    expect(getEmailEnvIssues()).toEqual([]);
  });

  test("logs a startup warning when email delivery is not configured", () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    warnIfEmailEnvInvalid();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Email delivery is not fully configured"),
    );
  });
});
