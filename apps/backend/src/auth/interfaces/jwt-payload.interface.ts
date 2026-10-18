import { Role } from '@somnob/shared';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  fullName: string;
  role: Role;
  businessId: string;
  storeIds: string[]; // Stores user is authorized to operate in
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  businessId: string;
  storeIds: string[];
}
