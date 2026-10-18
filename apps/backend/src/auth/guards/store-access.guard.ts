import { CanActivate, ExecutionContext, Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@somnob/shared';
import { REQUIRE_STORE_KEY } from '../decorators/require-store.decorator';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class StoreAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireStore = this.reflector.getAllAndOverride<boolean>(REQUIRE_STORE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireStore) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new ForbiddenException('User context is missing');
    }

    // Super Admin has authority across all stores in the business
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // Extract storeId from params, body, query, or headers
    const storeId =
      request.params?.storeId ||
      request.body?.storeId ||
      request.query?.storeId ||
      request.headers?.['x-store-id'];

    if (!storeId) {
      throw new BadRequestException('Target storeId is required for this operation');
    }

    const hasStoreAccess = user.storeIds && user.storeIds.includes(storeId);

    if (!hasStoreAccess) {
      throw new ForbiddenException(
        `Access denied. You do not have permission to perform actions in store branch: ${storeId}`
      );
    }

    return true;
  }
}
