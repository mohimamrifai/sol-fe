import type { AuthUser } from "./auth-api";

export function hasFeatureAccess(user: AuthUser | null | undefined, permission: string): boolean {
  if (!user) return false;
  if (user.roles?.includes("super_admin")) return true;

  const access = user.feature_access ?? [];
  if (access.includes(permission)) return true;

  if (permission.startsWith("view_")) {
    const suffix = permission.slice(5);
    for (const prefix of ["manage_", "edit_", "create_"]) {
      if (access.includes(`${prefix}${suffix}`)) return true;
    }
  }

  return false;
}
