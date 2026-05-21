"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { Badge } from "@/components/ui/badge";
import { customerStatusBadgeClass, customerStatusLabelFromApi } from "@/lib/customer-status";
import type { AdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { cn } from "@/lib/utils";
import type { CompanyDialogMode } from "./company-admin-dialog/types";
import { CompanyMainFields } from "./company-admin-dialog/company-main-fields";
import { CompanyRelatedSections } from "./company-admin-dialog/company-related-sections";
import { BranchDialog } from "./company-admin-dialog/branch-dialog";
import { DiscountDialog } from "./company-admin-dialog/discount-dialog";
import { RejectDialog } from "./company-admin-dialog/reject-dialog";
import { useCompanyAdminDialog } from "./company-admin-dialog/use-company-admin-dialog";

export function CompanyAdminDialog({
  open,
  onOpenChange,
  mode,
  companyId,
  onSaved,
  capabilities,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CompanyDialogMode;
  companyId: number | null;
  onSaved: () => void;
  capabilities: AdminCustomerCapabilities;
}) {
  const vm = useCompanyAdminDialog({
    open,
    mode,
    companyId,
    onSaved,
    onOpenChange,
    capabilities,
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader className={cn(mode === "create" && DIALOG_CREATE_HEADER_CLASS)}>
            <DialogTitle>{mode === "create" ? "Tambah customer" : "Detail customer"}</DialogTitle>
            <DialogDescription>Data perusahaan B2B.</DialogDescription>
          </DialogHeader>

          {vm.error ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{vm.error}</p>
          ) : null}

          {mode === "detail" && vm.loading ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : (
            <div className="grid gap-4 pb-2 md:grid-cols-2">
              {mode === "detail" && vm.detail ? (
                <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                  <Badge variant="outline" className={customerStatusBadgeClass(vm.st)}>
                    {customerStatusLabelFromApi(vm.st)}
                  </Badge>
                  {capabilities.canApproveReject && vm.st === "pending" ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void vm.approveCompany()}
                      >
                        Setujui
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          vm.setRejectReason("");
                          vm.setRejectOpen(true);
                        }}
                      >
                        Tolak
                      </Button>
                    </>
                  ) : null}
                </div>
              ) : null}

              <CompanyMainFields
                mode={mode}
                readOnly={vm.companyFieldsReadOnly}
                name={vm.name}
                npwp={vm.npwp}
                nib={vm.nib}
                billingCycle={vm.billingCycle}
                paymentType={vm.paymentType}
                postpaidTermDays={vm.postpaidTermDays}
                address={vm.address}
                city={vm.city}
                province={vm.province}
                postalCode={vm.postalCode}
                contactPerson={vm.contactPerson}
                email={vm.email}
                phone={vm.phone}
                onNameChange={vm.setName}
                onNpwpChange={vm.setNpwp}
                onNibChange={vm.setNib}
                onBillingCycleChange={vm.setBillingCycle}
                onPaymentTypeChange={vm.setPaymentType}
                onPostpaidTermDaysChange={vm.setPostpaidTermDays}
                onAddressChange={vm.setAddress}
                onCityChange={vm.setCity}
                onProvinceChange={vm.setProvince}
                onPostalCodeChange={(v) => vm.setPostalCode(v.replace(/\D/g, ""))}
                onContactPersonChange={vm.setContactPerson}
                onEmailChange={vm.setEmail}
                onPhoneChange={(v) => vm.setPhone(v.replace(/\D/g, ""))}
              />

              {mode === "detail" && vm.detail ? (
                <CompanyRelatedSections
                  capabilities={capabilities}
                  branches={vm.branches}
                  discounts={vm.discounts}
                  onAddBranch={() => vm.openBranch()}
                  onEditBranch={vm.openBranch}
                  onDeleteBranch={vm.setDeleteBranch}
                  onAddDiscount={() => vm.openDisc()}
                  onEditDiscount={vm.openDisc}
                  onDeleteDiscount={vm.setDeleteDisc}
                />
              ) : null}
            </div>
          )}

          <DialogFooter className="sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={vm.saving}>
              Tutup
            </Button>
            {(mode === "create" ? capabilities.canCreateCustomer : capabilities.canEditCompanyData) ? (
              <Button type="button" onClick={() => void vm.saveCompany()} disabled={vm.saving || !vm.name.trim()}>
                {vm.saving ? "Menyimpan…" : "Simpan"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BranchDialog
        open={vm.branchOpen}
        onOpenChange={vm.setBranchOpen}
        branchEdit={vm.branchEdit}
        bName={vm.bName}
        bAddr={vm.bAddr}
        bCity={vm.bCity}
        bPhone={vm.bPhone}
        bPic={vm.bPic}
        bActive={vm.bActive}
        savingBranch={vm.savingBranch}
        setBName={vm.setBName}
        setBAddr={vm.setBAddr}
        setBCity={vm.setBCity}
        setBPhone={vm.setBPhone}
        setBPic={vm.setBPic}
        setBActive={vm.setBActive}
        onSave={() => void vm.saveBranch()}
      />

      <DiscountDialog
        open={vm.discOpen}
        onOpenChange={vm.setDiscOpen}
        discEdit={vm.discEdit}
        dVsId={vm.dVsId}
        dType={vm.dType}
        dVal={vm.dVal}
        dFrom={vm.dFrom}
        dTo={vm.dTo}
        dActive={vm.dActive}
        savingDisc={vm.savingDisc}
        vendorServiceOptions={vm.vendorServiceOptions}
        setDVsId={vm.setDVsId}
        setDType={vm.setDType}
        setDVal={vm.setDVal}
        setDFrom={vm.setDFrom}
        setDTo={vm.setDTo}
        setDActive={vm.setDActive}
        onSave={() => void vm.saveDisc()}
      />

      <RejectDialog
        open={vm.rejectOpen}
        onOpenChange={vm.setRejectOpen}
        rejectReason={vm.rejectReason}
        setRejectReason={vm.setRejectReason}
        rejectSaving={vm.rejectSaving}
        onSubmit={() => void vm.submitReject()}
      />

      <ConfirmDeleteDialog
        open={vm.deleteBranch != null}
        onOpenChange={(o) => !o && vm.setDeleteBranch(null)}
        title="Hapus cabang?"
        description="Yakin hapus cabang ini?"
        loading={vm.delLoading}
        onConfirm={vm.handleDeleteBranch}
      />

      <ConfirmDeleteDialog
        open={vm.deleteDisc != null}
        onOpenChange={(o) => !o && vm.setDeleteDisc(null)}
        title="Hapus diskon?"
        description="Yakin hapus diskon ini?"
        loading={vm.delLoading}
        onConfirm={vm.handleDeleteDisc}
      />
    </>
  );
}
