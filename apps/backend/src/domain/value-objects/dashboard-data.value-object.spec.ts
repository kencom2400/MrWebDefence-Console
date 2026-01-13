/**
 * DashboardData Value Object Test
 *
 * ダッシュボードデータの値オブジェクトのテスト
 */

import { DashboardData } from './dashboard-data.value-object';
import { UserRole } from '../entities/user-role.enum';

describe('DashboardData', () => {
  describe('create', () => {
    it('正常系: ダッシュボードデータを作成できる', () => {
      // Arrange & Act
      const dashboardData = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
      );

      // Assert
      expect(dashboardData.userId).toBe('test-user-id');
      expect(dashboardData.email).toBe('user@example.com');
      expect(dashboardData.role).toBe(UserRole.SERVICE_MEMBER);
      expect(dashboardData.mfaEnabled).toBe(false);
      expect(dashboardData.ipAllowListCount).toBe(0);
      expect(dashboardData.lastLoginAt).toBeNull();
      expect(dashboardData.loginAttemptCount).toBeNull();
    });

    it('正常系: オプショナルフィールドを含むダッシュボードデータを作成できる', () => {
      // Arrange & Act
      const dashboardData = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        true,
        2,
        new Date('2024-01-15T10:30:00Z'),
        new Date('2024-01-20T14:25:00Z'),
        15,
      );

      // Assert
      expect(dashboardData.userId).toBe('test-user-id');
      expect(dashboardData.email).toBe('user@example.com');
      expect(dashboardData.role).toBe(UserRole.SERVICE_MEMBER);
      expect(dashboardData.mfaEnabled).toBe(true);
      expect(dashboardData.ipAllowListCount).toBe(2);
      expect(dashboardData.lastLoginAt).toEqual(new Date('2024-01-20T14:25:00Z'));
      expect(dashboardData.loginAttemptCount).toBe(15);
    });

    it('異常系: userIdが空の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          '',
          'user@example.com',
          UserRole.SERVICE_MEMBER,
          false,
          0,
          new Date('2024-01-15T10:30:00Z'),
        );
      }).toThrow('User ID cannot be empty');
    });

    it('異常系: emailが空の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          'test-user-id',
          '',
          UserRole.SERVICE_MEMBER,
          false,
          0,
          new Date('2024-01-15T10:30:00Z'),
        );
      }).toThrow('Email cannot be empty');
    });

    it('異常系: emailの形式が不正な場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          'test-user-id',
          'invalid-email',
          UserRole.SERVICE_MEMBER,
          false,
          0,
          new Date('2024-01-15T10:30:00Z'),
        );
      }).toThrow('Email must be a valid email address');
    });

    it('異常系: ipAllowListCountが負の数の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          'test-user-id',
          'user@example.com',
          UserRole.SERVICE_MEMBER,
          false,
          -1,
          new Date('2024-01-15T10:30:00Z'),
        );
      }).toThrow('IP AllowList count must be 0 or greater');
    });

    it('異常系: loginAttemptCountが負の数の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          'test-user-id',
          'user@example.com',
          UserRole.SERVICE_MEMBER,
          false,
          0,
          new Date('2024-01-15T10:30:00Z'),
          null,
          -1,
        );
      }).toThrow('Login attempt count must be 0 or greater');
    });
  });

  describe('equals', () => {
    it('正常系: 同じ値のDashboardDataは等しいと判定される', () => {
      // Arrange
      const date = new Date('2024-01-15T10:30:00Z');
      const dashboardData1 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        date,
      );
      const dashboardData2 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        date,
      );

      // Act & Assert
      expect(dashboardData1.equals(dashboardData2)).toBe(true);
    });

    it('正常系: 異なる値のDashboardDataは等しくないと判定される', () => {
      // Arrange
      const dashboardData1 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
      );
      const dashboardData2 = DashboardData.create(
        'test-user-id-2',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
      );

      // Act & Assert
      expect(dashboardData1.equals(dashboardData2)).toBe(false);
    });

    it('正常系: lastLoginAtが異なる場合は等しくないと判定される', () => {
      // Arrange
      const dashboardData1 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
        new Date('2024-01-20T14:25:00Z'),
      );
      const dashboardData2 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
        null,
      );

      // Act & Assert
      expect(dashboardData1.equals(dashboardData2)).toBe(false);
    });
  });
});
 * DashboardData Value Object Test
 *
 * ダッシュボードデータの値オブジェクトのテスト
 */

import { DashboardData } from './dashboard-data.value-object';
import { UserRole } from '../entities/user-role.enum';

describe('DashboardData', () => {
  describe('create', () => {
    it('正常系: ダッシュボードデータを作成できる', () => {
      // Arrange & Act
      const dashboardData = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
      );

      // Assert
      expect(dashboardData.userId).toBe('test-user-id');
      expect(dashboardData.email).toBe('user@example.com');
      expect(dashboardData.role).toBe(UserRole.SERVICE_MEMBER);
      expect(dashboardData.mfaEnabled).toBe(false);
      expect(dashboardData.ipAllowListCount).toBe(0);
      expect(dashboardData.lastLoginAt).toBeNull();
      expect(dashboardData.loginAttemptCount).toBeNull();
    });

    it('正常系: オプショナルフィールドを含むダッシュボードデータを作成できる', () => {
      // Arrange & Act
      const dashboardData = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        true,
        2,
        new Date('2024-01-15T10:30:00Z'),
        new Date('2024-01-20T14:25:00Z'),
        15,
      );

      // Assert
      expect(dashboardData.userId).toBe('test-user-id');
      expect(dashboardData.email).toBe('user@example.com');
      expect(dashboardData.role).toBe(UserRole.SERVICE_MEMBER);
      expect(dashboardData.mfaEnabled).toBe(true);
      expect(dashboardData.ipAllowListCount).toBe(2);
      expect(dashboardData.lastLoginAt).toEqual(new Date('2024-01-20T14:25:00Z'));
      expect(dashboardData.loginAttemptCount).toBe(15);
    });

    it('異常系: userIdが空の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          '',
          'user@example.com',
          UserRole.SERVICE_MEMBER,
          false,
          0,
          new Date('2024-01-15T10:30:00Z'),
        );
      }).toThrow('User ID cannot be empty');
    });

    it('異常系: emailが空の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          'test-user-id',
          '',
          UserRole.SERVICE_MEMBER,
          false,
          0,
          new Date('2024-01-15T10:30:00Z'),
        );
      }).toThrow('Email cannot be empty');
    });

    it('異常系: emailの形式が不正な場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          'test-user-id',
          'invalid-email',
          UserRole.SERVICE_MEMBER,
          false,
          0,
          new Date('2024-01-15T10:30:00Z'),
        );
      }).toThrow('Email must be a valid email address');
    });

    it('異常系: ipAllowListCountが負の数の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          'test-user-id',
          'user@example.com',
          UserRole.SERVICE_MEMBER,
          false,
          -1,
          new Date('2024-01-15T10:30:00Z'),
        );
      }).toThrow('IP AllowList count must be 0 or greater');
    });

    it('異常系: loginAttemptCountが負の数の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          'test-user-id',
          'user@example.com',
          UserRole.SERVICE_MEMBER,
          false,
          0,
          new Date('2024-01-15T10:30:00Z'),
          null,
          -1,
        );
      }).toThrow('Login attempt count must be 0 or greater');
    });
  });

  describe('equals', () => {
    it('正常系: 同じ値のDashboardDataは等しいと判定される', () => {
      // Arrange
      const date = new Date('2024-01-15T10:30:00Z');
      const dashboardData1 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        date,
      );
      const dashboardData2 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        date,
      );

      // Act & Assert
      expect(dashboardData1.equals(dashboardData2)).toBe(true);
    });

    it('正常系: 異なる値のDashboardDataは等しくないと判定される', () => {
      // Arrange
      const dashboardData1 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
      );
      const dashboardData2 = DashboardData.create(
        'test-user-id-2',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
      );

      // Act & Assert
      expect(dashboardData1.equals(dashboardData2)).toBe(false);
    });

    it('正常系: lastLoginAtが異なる場合は等しくないと判定される', () => {
      // Arrange
      const dashboardData1 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
        new Date('2024-01-20T14:25:00Z'),
      );
      const dashboardData2 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
        null,
      );

      // Act & Assert
      expect(dashboardData1.equals(dashboardData2)).toBe(false);
    });
  });
});
 * DashboardData Value Object Test
 *
 * ダッシュボードデータの値オブジェクトのテスト
 */

import { DashboardData } from './dashboard-data.value-object';
import { UserRole } from '../entities/user-role.enum';

describe('DashboardData', () => {
  describe('create', () => {
    it('正常系: ダッシュボードデータを作成できる', () => {
      // Arrange & Act
      const dashboardData = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
      );

      // Assert
      expect(dashboardData.userId).toBe('test-user-id');
      expect(dashboardData.email).toBe('user@example.com');
      expect(dashboardData.role).toBe(UserRole.SERVICE_MEMBER);
      expect(dashboardData.mfaEnabled).toBe(false);
      expect(dashboardData.ipAllowListCount).toBe(0);
      expect(dashboardData.lastLoginAt).toBeNull();
      expect(dashboardData.loginAttemptCount).toBeNull();
    });

    it('正常系: オプショナルフィールドを含むダッシュボードデータを作成できる', () => {
      // Arrange & Act
      const dashboardData = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        true,
        2,
        new Date('2024-01-15T10:30:00Z'),
        new Date('2024-01-20T14:25:00Z'),
        15,
      );

      // Assert
      expect(dashboardData.userId).toBe('test-user-id');
      expect(dashboardData.email).toBe('user@example.com');
      expect(dashboardData.role).toBe(UserRole.SERVICE_MEMBER);
      expect(dashboardData.mfaEnabled).toBe(true);
      expect(dashboardData.ipAllowListCount).toBe(2);
      expect(dashboardData.lastLoginAt).toEqual(new Date('2024-01-20T14:25:00Z'));
      expect(dashboardData.loginAttemptCount).toBe(15);
    });

    it('異常系: userIdが空の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          '',
          'user@example.com',
          UserRole.SERVICE_MEMBER,
          false,
          0,
          new Date('2024-01-15T10:30:00Z'),
        );
      }).toThrow('User ID cannot be empty');
    });

    it('異常系: emailが空の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          'test-user-id',
          '',
          UserRole.SERVICE_MEMBER,
          false,
          0,
          new Date('2024-01-15T10:30:00Z'),
        );
      }).toThrow('Email cannot be empty');
    });

    it('異常系: emailの形式が不正な場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          'test-user-id',
          'invalid-email',
          UserRole.SERVICE_MEMBER,
          false,
          0,
          new Date('2024-01-15T10:30:00Z'),
        );
      }).toThrow('Email must be a valid email address');
    });

    it('異常系: ipAllowListCountが負の数の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          'test-user-id',
          'user@example.com',
          UserRole.SERVICE_MEMBER,
          false,
          -1,
          new Date('2024-01-15T10:30:00Z'),
        );
      }).toThrow('IP AllowList count must be 0 or greater');
    });

    it('異常系: loginAttemptCountが負の数の場合はエラーをスローする', () => {
      // Act & Assert
      expect(() => {
        DashboardData.create(
          'test-user-id',
          'user@example.com',
          UserRole.SERVICE_MEMBER,
          false,
          0,
          new Date('2024-01-15T10:30:00Z'),
          null,
          -1,
        );
      }).toThrow('Login attempt count must be 0 or greater');
    });
  });

  describe('equals', () => {
    it('正常系: 同じ値のDashboardDataは等しいと判定される', () => {
      // Arrange
      const date = new Date('2024-01-15T10:30:00Z');
      const dashboardData1 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        date,
      );
      const dashboardData2 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        date,
      );

      // Act & Assert
      expect(dashboardData1.equals(dashboardData2)).toBe(true);
    });

    it('正常系: 異なる値のDashboardDataは等しくないと判定される', () => {
      // Arrange
      const dashboardData1 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
      );
      const dashboardData2 = DashboardData.create(
        'test-user-id-2',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
      );

      // Act & Assert
      expect(dashboardData1.equals(dashboardData2)).toBe(false);
    });

    it('正常系: lastLoginAtが異なる場合は等しくないと判定される', () => {
      // Arrange
      const dashboardData1 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
        new Date('2024-01-20T14:25:00Z'),
      );
      const dashboardData2 = DashboardData.create(
        'test-user-id',
        'user@example.com',
        UserRole.SERVICE_MEMBER,
        false,
        0,
        new Date('2024-01-15T10:30:00Z'),
        null,
      );

      // Act & Assert
      expect(dashboardData1.equals(dashboardData2)).toBe(false);
    });
  });
});
