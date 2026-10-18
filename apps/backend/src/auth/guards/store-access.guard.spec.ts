import { ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StoreAccessGuard } from './store-access.guard';
import { Role } from '@somnob/shared';

describe('StoreAccessGuard (Multi-Branch Isolation)', () => {
  let guard: StoreAccessGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new StoreAccessGuard(reflector);
  });

  function createMockContext(user?: any, params: any = {}, body: any = {}): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user,
          params,
          body,
          query: {},
          headers: {},
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows access if route does not require store isolation', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createMockContext({ role: Role.CASHIER, storeIds: ['store-1'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows Super Admin to access any branch', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext(
      { role: Role.SUPER_ADMIN, storeIds: ['store-1'] },
      { storeId: 'store-99' }
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows staff to access their assigned branch', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext(
      { role: Role.CASHIER, storeIds: ['store-1', 'store-2'] },
      { storeId: 'store-1' }
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access if staff tries to operate in unassigned branch', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext(
      { role: Role.CASHIER, storeIds: ['store-1'] },
      { storeId: 'store-2' } // Attempting cross-branch operation
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws BadRequestException if storeId is missing from request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext(
      { role: Role.CASHIER, storeIds: ['store-1'] },
      {},
      {}
    );

    expect(() => guard.canActivate(context)).toThrow(BadRequestException);
  });
});
