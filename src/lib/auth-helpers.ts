import type { UserRole } from "@prisma/client";

/**
 * Check if a role can access the admin panel.
 */
export function canAccessAdmin(role: UserRole): boolean {
  return role === "admin" || role === "superadmin" || role === "moderator";
}

/**
 * Check if a role can manage videos (edit/delete/publish).
 */
export function canManageVideos(role: UserRole): boolean {
  return role === "admin" || role === "superadmin" || role === "moderator";
}

/**
 * Check if a role can manage performers.
 */
export function canManagePerformers(role: UserRole): boolean {
  return role === "admin" || role === "superadmin";
}

/**
 * Check if a role can manage tags.
 */
export function canManageTags(role: UserRole): boolean {
  return role === "admin" || role === "superadmin";
}

/**
 * Check if a role can manage users.
 */
export function canManageUsers(role: UserRole): boolean {
  return role === "admin" || role === "superadmin";
}

/**
 * Check if a role can manage other admins (superadmin only).
 */
export function canManageAdmins(role: UserRole): boolean {
  return role === "superadmin";
}

/**
 * Check if a role is moderator or above.
 */
export function isModeratorOrAbove(role: UserRole): boolean {
  return role === "moderator" || role === "admin" || role === "superadmin";
}