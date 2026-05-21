import { useState, useEffect } from "react";
import { createAdminCompany, updateAdminCompany } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { toast } from "sonner";
import type { CompanyDialogMode, Row } from "../types";
import type { AdminCustomerCapabilities } from "@/lib/admin-customer-capabilities";

export function useCompanyForm(
  mode: CompanyDialogMode,
  companyId: number | null,
  capabilities: AdminCustomerCapabilities,
  onSaved: () => void,
  onOpenChange: (open: boolean) => void,
  initialData: Row | null
) {
  const [name, setName] = useState("");
  const [npwp, setNpwp] = useState("");
  const [nib, setNib] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingCycle, setBillingCycle] = useState("end_of_month");
  const [paymentType, setPaymentType] = useState<"prepaid" | "postpaid">("postpaid");
  const [postpaidTermDays, setPostpaidTermDays] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(String(initialData.name ?? ""));
      setNpwp(String(initialData.npwp ?? ""));
      setNib(String(initialData.nib ?? ""));
      setAddress(String(initialData.address ?? ""));
      setCity(String(initialData.city ?? ""));
      setProvince(String(initialData.province ?? ""));
      setPostalCode(String(initialData.postal_code ?? ""));
      setContactPerson(String(initialData.contact_person ?? ""));
      setEmail(String(initialData.email ?? ""));
      setPhone(String(initialData.phone ?? ""));
      setBillingCycle(String(initialData.billing_cycle || "end_of_month"));
      setPaymentType(
        (String(initialData.payment_type ?? "postpaid") === "prepaid" ? "prepaid" : "postpaid")
      );
      setPostpaidTermDays(
        initialData.postpaid_term_days != null ? String(initialData.postpaid_term_days) : ""
      );
    } else if (mode === "create") {
      setName("");
      setNpwp("");
      setNib("");
      setAddress("");
      setCity("");
      setProvince("");
      setPostalCode("");
      setContactPerson("");
      setEmail("");
      setPhone("");
      setBillingCycle("end_of_month");
      setPaymentType("postpaid");
      setPostpaidTermDays("");
    }
  }, [initialData, mode]);

  const saveCompany = async () => {
    if (mode === "create" && !capabilities.canCreateCustomer) return;
    if (mode === "detail" && !capabilities.canEditCompanyData) return;
    
    setSaving(true);
    setError(null);
    try {
      const cleanedPhone = phone.trim();
      if (cleanedPhone && !/^(0|62)\d+$/.test(cleanedPhone)) {
        throw new Error("Format telepon harus diawali 0 atau 62 tanpa tanda +.");
      }


      const body: Record<string, unknown> = {
        name: name.trim(),
        npwp: npwp.trim() || null,
        nib: nib.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
        postal_code: postalCode.trim() || null,
        contact_person: contactPerson.trim() || null,
        email: email.trim() || null,
        phone: cleanedPhone || null,
        billing_cycle: billingCycle,
        payment_type: paymentType,
        postpaid_term_days:
          paymentType === "postpaid" && postpaidTermDays.trim() !== ""
            ? Number(postpaidTermDays.trim())
            : null,
      };

      if (mode === "create") {
        body.status = "active";
        await createAdminCompany(body);
        toast.success("Customer berhasil ditambahkan.");
        onSaved();
        onOpenChange(false);
      } else if (mode === "detail" && companyId != null) {
        await updateAdminCompany(companyId, body);
        toast.success("Data customer diperbarui.");
        onSaved();
      }
    } catch (e) {
      const msg = e instanceof ApiError && e.status === 422
          ? firstLaravelError(e.body) ?? e.message
          : e instanceof Error ? e.message : "Gagal menyimpan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const isReadOnly = (mode === "detail" && !capabilities.canEditCompanyData) ||
                     (mode === "create" && !capabilities.canCreateCustomer);

  return {
    fields: {
      name,
      npwp,
      nib,
      address,
      city,
      province,
      postalCode,
      contactPerson,
      email,
      phone,
      billingCycle,
      paymentType,
      postpaidTermDays,
    },
    setters: {
      setName,
      setNpwp,
      setNib,
      setAddress,
      setCity,
      setProvince,
      setPostalCode,
      setContactPerson,
      setEmail,
      setPhone,
      setBillingCycle,
      setPaymentType,
      setPostpaidTermDays,
    },
    saving,
    error,
    setError,
    saveCompany,
    isReadOnly
  };
}
