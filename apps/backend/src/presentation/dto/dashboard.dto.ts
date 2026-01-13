/**
 * Dashboard DTOs
 *
 * ダッシュボード関連のDTO定義
 */

export class DashboardDto {
  public readonly userId: string;
  public readonly email: string;
  public readonly role: string;
  public readonly mfaEnabled: boolean;
  public readonly ipAllowListCount: number;
  public readonly accountCreatedAt: string;
  public readonly lastLoginAt: string | null;
  public readonly loginAttemptCount: number | null;

  constructor(
    userId: string,
    email: string,
    role: string,
    mfaEnabled: boolean,
    ipAllowListCount: number,
    accountCreatedAt: string,
    lastLoginAt: string | null,
    loginAttemptCount: number | null,
  ) {
    this.userId = userId;
    this.email = email;
    this.role = role;
    this.mfaEnabled = mfaEnabled;
    this.ipAllowListCount = ipAllowListCount;
    this.accountCreatedAt = accountCreatedAt;
    this.lastLoginAt = lastLoginAt;
    this.loginAttemptCount = loginAttemptCount;
  }
}

