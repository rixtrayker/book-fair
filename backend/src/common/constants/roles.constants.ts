export enum UserRole {
  CUSTOMER = 'customer',
  COLLECTOR = 'collector',
  SUPER_ADMIN = 'super_admin',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 3,
  [UserRole.COLLECTOR]: 2,
  [UserRole.CUSTOMER]: 1,
};

export function hasHigherOrEqualRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
