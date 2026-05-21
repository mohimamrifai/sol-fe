/**
 * Hak akses UI untuk Customer Management (admin internal).
 * Backend `EnsureUserIsAdmin` mengizinkan super_admin | operations | finance | sales;
 * di sini kita membedakan aksi bisnis per role.
 */
export type AdminCustomerCapabilities = {
  /** Tombol "Tambah Customer" & simpan form create */
  canCreateCustomer: boolean;
  /** Ubah data perusahaan (PUT company) */
  canEditCompanyData: boolean;
  /** Hapus perusahaan */
  canDeleteCompany: boolean;
  /** Setujui / tolak registrasi (pending) */
  canApproveReject: boolean;
  /** Cabang: tambah / edit / hapus */
  canManageBranches: boolean;
  /** Diskon: tambah / edit / hapus */
  canManageDiscounts: boolean;
};

function has(roles: string[], role: string): boolean {
  return roles.includes(role);
}

export function getAdminCustomerCapabilities(roles: string[]): AdminCustomerCapabilities {
  return {
    canCreateCustomer: has(roles, "super_admin") || has(roles, "sales") || has(roles, "operations"),
    canEditCompanyData:
      has(roles, "super_admin") ||
      has(roles, "sales") ||
      has(roles, "operations") ||
      has(roles, "finance"),
    canDeleteCompany: has(roles, "super_admin"),
    canApproveReject: has(roles, "super_admin") || has(roles, "operations"),
    canManageBranches:
      has(roles, "super_admin") || has(roles, "operations") || has(roles, "sales"),
    canManageDiscounts:
      has(roles, "super_admin") || has(roles, "finance") || has(roles, "sales"),
  };
}
