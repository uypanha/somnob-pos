import { SetMetadata } from '@nestjs/common';

export const REQUIRE_STORE_KEY = 'requireStore';
export const RequireStore = () => SetMetadata(REQUIRE_STORE_KEY, true);
