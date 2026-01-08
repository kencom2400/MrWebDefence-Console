import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../domain/entities/user-role.enum';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  const createMockContext = (user?: any) => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should return true if route is public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true); // IS_PUBLIC_KEY
      const context = createMockContext();
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException if no roles defined and not public (Fail Safe)', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined) // IS_PUBLIC_KEY
        .mockReturnValueOnce(undefined); // ROLES_KEY
      const context = createMockContext();
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is not present', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined) // IS_PUBLIC_KEY
        .mockReturnValueOnce([UserRole.SERVICE_MEMBER]); // ROLES_KEY
      const context = createMockContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user role is missing', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined) // IS_PUBLIC_KEY
        .mockReturnValueOnce([UserRole.SERVICE_MEMBER]); // ROLES_KEY
      const context = createMockContext({});
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user does not have required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined) // IS_PUBLIC_KEY
        .mockReturnValueOnce([UserRole.SERVICE_ADMIN]); // ROLES_KEY
      const context = createMockContext({ role: UserRole.SERVICE_MEMBER });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should return true if user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined) // IS_PUBLIC_KEY
        .mockReturnValueOnce([UserRole.SERVICE_MEMBER]); // ROLES_KEY
      const context = createMockContext({ role: UserRole.SERVICE_MEMBER });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true if user has one of required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined) // IS_PUBLIC_KEY
        .mockReturnValueOnce([UserRole.SERVICE_ADMIN, UserRole.SERVICE_MEMBER]); // ROLES_KEY
      const context = createMockContext({ role: UserRole.SERVICE_MEMBER });
      expect(guard.canActivate(context)).toBe(true);
    });
  });
});

