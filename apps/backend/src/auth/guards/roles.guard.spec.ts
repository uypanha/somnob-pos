import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '@somnob/shared';

describe('RolesGuard (RBAC & Privilege Escalation Prevention)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows access to endpoints with no role restrictions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockContext({ role: Role.CASHIER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows SUPER_ADMIN full access even if specific roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.BRANCH_MANAGER]);
    const context = createMockContext({ role: Role.SUPER_ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows user with matching role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.CASHIER, Role.BRANCH_MANAGER]);
    const context = createMockContext({ role: Role.CASHIER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('prevents privilege escalation: CASHIER accessing SUPER_ADMIN endpoint throws ForbiddenException', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.SUPER_ADMIN]);
    const context = createMockContext({ role: Role.CASHIER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('prevents privilege escalation: STOCK_CLERK accessing BRANCH_MANAGER endpoint throws ForbiddenException', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.BRANCH_MANAGER]);
    const context = createMockContext({ role: Role.STOCK_CLERK });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
