"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { fetchAllAdminUsers, updateAdminCompany } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

type Props = {
  companyId: number;
  detail: Record<string, unknown> | null;
  canEdit: boolean;
  onSaved: () => void;
};

function userLabel(u: Record<string, unknown>) {
  const name = String(u.name ?? "");
  const email = String(u.email ?? "");
  return email ? `${name} (${email})` : name || `#${u.id}`;
}

export function CustomerReviewSection({ companyId, detail, canEdit, onSaved }: Props) {
  const t = useTranslations("AdminCustomers");
  const tc = useTranslations("AdminCommon");
  const [staff, setStaff] = useState<Record<string, unknown>[]>([]);
  const [salesPicId, setSalesPicId] = useState("");
  const [accountManagerId, setAccountManagerId] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchAllAdminUsers({ userType: "internal" }).then((rows) => {
      setStaff(rows);
    }).catch(() => setStaff([]));
  }, []);

  useEffect(() => {
    if (!detail) return;
    setSalesPicId(detail.sales_pic_id != null ? String(detail.sales_pic_id) : "");
    setAccountManagerId(detail.account_manager_id != null ? String(detail.account_manager_id) : "");
    setReviewNotes(String(detail.review_notes ?? ""));
  }, [detail]);

  const salesPic = detail?.sales_pic as Record<string, unknown> | undefined;
  const accountManager = detail?.account_manager as Record<string, unknown> | undefined;
  const reviewedBy = detail?.reviewed_by_user as Record<string, unknown> | undefined;
  const approvedByUser = detail?.approved_by_user as Record<string, unknown> | undefined;
  const approvedBy = approvedByUser ?? (String(detail?.status ?? "").toLowerCase() === "active" ? reviewedBy : undefined);

  const save = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      await updateAdminCompany(companyId, {
        sales_pic_id: salesPicId ? Number(salesPicId) : null,
        account_manager_id: accountManagerId ? Number(accountManagerId) : null,
        review_notes: reviewNotes.trim() || null,
      });
      toast.success(t("review.saved"));
      onSaved();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("review.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const staffOptions = staff.map((u) => ({
    value: String(u.id),
    label: userLabel(u),
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("review.salesPic")}</Label>
          {canEdit ? (
            <SearchableCombobox
              value={salesPicId}
              onChange={setSalesPicId}
              options={staffOptions}
              placeholder={t("review.selectSalesPic")}
              className="h-9"
            />
          ) : (
            <p className="text-sm">{salesPic ? userLabel(salesPic) : "—"}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("review.accountManager")}</Label>
          {canEdit ? (
            <SearchableCombobox
              value={accountManagerId}
              onChange={setAccountManagerId}
              options={staffOptions}
              placeholder={t("review.selectAccountManager")}
              className="h-9"
            />
          ) : (
            <p className="text-sm">{accountManager ? userLabel(accountManager) : "—"}</p>
          )}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>{t("review.reviewNotes")}</Label>
          {canEdit ? (
            <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={4} />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{reviewNotes || "—"}</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 text-sm md:grid-cols-2">
        <div>
          <span className="text-muted-foreground">{t("review.reviewedDate")}:</span>{" "}
          {detail?.reviewed_at ? String(detail.reviewed_at).slice(0, 10) : "—"}
        </div>
        <div>
          <span className="text-muted-foreground">{t("review.reviewedBy")}:</span>{" "}
          {reviewedBy ? userLabel(reviewedBy) : "—"}
        </div>
        <div>
          <span className="text-muted-foreground">{t("review.approvedDate")}:</span>{" "}
          {detail?.approved_at ? String(detail.approved_at).slice(0, 10) : "—"}
        </div>
        <div>
          <span className="text-muted-foreground">{t("review.approvedBy")}:</span>{" "}
          {approvedBy ? userLabel(approvedBy) : "—"}
        </div>
      </div>

      {canEdit ? (
        <Button size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? tc("actions.saving") : tc("actions.save")}
        </Button>
      ) : null}
    </div>
  );
}
