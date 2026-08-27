"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CustomerLoc } from "@/hooks/use-booking-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { getAllProvinces, getCitiesForProvince, getDistrictsForCity } from "@/lib/id-regions";
import { SearchableCombobox } from "@/components/searchable-combobox";

interface PartyProps {
  kind: "shipper" | "consignee";
  customerLocations: CustomerLoc[];
  locationId: string;
  setLocationId: (v: string) => void;
  destinationType?: "customer_location" | "external";
  setDestinationType?: (v: "customer_location" | "external") => void;
  showDeliveryNotes?: boolean;
  company: string;
  setCompany: (v: string) => void;
  picName: string;
  setPicName: (v: string) => void;
  picEmail: string;
  setPicEmail: (v: string) => void;
  picMobile: string;
  setPicMobile: (v: string) => void;
  setPhone: (v: string) => void;
  provinceId: string;
  setProvinceId: (v: string) => void;
  cityId: string;
  setCityId: (v: string) => void;
  districtId: string;
  setDistrictId: (v: string) => void;
  postalCode: string;
  setPostalCode: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  deliveryNotes?: string;
  setDeliveryNotes?: (v: string) => void;
  renderFieldError: (field: string) => string | null;
}

export function PartyInfoSection({
  kind,
  customerLocations,
  locationId,
  setLocationId,
  destinationType,
  setDestinationType,
  showDeliveryNotes,
  company,
  setCompany,
  picName,
  setPicName,
  picEmail,
  setPicEmail,
  picMobile,
  setPicMobile,
  setPhone,
  provinceId,
  setProvinceId,
  cityId,
  setCityId,
  districtId,
  setDistrictId,
  postalCode,
  setPostalCode,
  address,
  setAddress,
  deliveryNotes,
  setDeliveryNotes,
  renderFieldError,
}: PartyProps) {
  const tForm = useTranslations("Bookings.create.form");

  const isShipper = kind === "shipper";
  const prefix = isShipper ? "shipper" : "consignee";

  const locationOptions = useMemo(
    () =>
      customerLocations.map((loc) => ({
        value: String(loc.id),
        label: loc.name,
      })),
    [customerLocations]
  );

  const [provinceOptions, setProvinceOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [cityOptions, setCityOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [districtOptions, setDistrictOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const provinces = await getAllProvinces();
      if (!active) return;
      setProvinceOptions(provinces.map((p) => ({ value: String(p.id), label: p.name })));
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!provinceId) {
        setCityOptions([]);
        return;
      }
      const rows = await getCitiesForProvince(Number(provinceId));
      if (!active) return;
      setCityOptions(rows.map((c) => ({ value: String(c.id), label: c.name })));
    })();
    return () => {
      active = false;
    };
  }, [provinceId]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!cityId) {
        setDistrictOptions([]);
        return;
      }
      const rows = await getDistrictsForCity(Number(cityId));
      if (!active) return;
      setDistrictOptions(rows.map((d) => ({ value: String(d.id), label: d.name })));
    })();
    return () => {
      active = false;
    };
  }, [cityId]);

  useEffect(() => {
    if (!locationId) return;
    const loc = customerLocations.find((l) => String(l.id) === locationId);
    if (!loc) return;

    const shouldAutofill = isShipper || destinationType === "customer_location";
    if (!shouldAutofill) return;

    setCompany(loc.name);
    if (loc.address) setAddress(loc.address);
    const mobile = loc.pic_mobile || loc.phone || "";
    if (mobile) {
      setPhone(mobile);
      setPicMobile(mobile);
    }
    if (loc.pic_name) setPicName(loc.pic_name);
    if (loc.pic_email) setPicEmail(loc.pic_email);
    if (loc.postal_code) setPostalCode(loc.postal_code);

    let active = true;
    (async () => {
      if (!loc.province) return;
      const provinces = await getAllProvinces();
      const province = provinces.find((p) => p.name.toLowerCase() === loc.province!.toLowerCase());
      if (!province || !active) return;
      setProvinceId(String(province.id));

      if (!loc.city) return;
      const cities = await getCitiesForProvince(province.id);
      const city = cities.find((c) => c.name.toLowerCase() === loc.city!.toLowerCase());
      if (!city || !active) return;
      setCityId(String(city.id));

      if (!loc.district) return;
      const districts = await getDistrictsForCity(city.id);
      const district = districts.find((d) => d.name.toLowerCase() === loc.district!.toLowerCase());
      if (district && active) setDistrictId(String(district.id));
    })();

    return () => {
      active = false;
    };
  }, [
    locationId,
    customerLocations,
    destinationType,
    isShipper,
    setAddress,
    setCompany,
    setPhone,
    setPicMobile,
    setPicName,
    setPicEmail,
    setPostalCode,
    setProvinceId,
    setCityId,
    setDistrictId,
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isShipper ? tForm("shipperSectionTitle") : tForm("consigneeSectionTitle")}</CardTitle>
        <CardDescription>{isShipper ? tForm("shipperSubtitle") : tForm("consigneeSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isShipper && setDestinationType ? (
          <div className="space-y-2">
            <Label>
              {tForm("consigneeTypeLabel")} <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={destinationType}
              onValueChange={(v) => setDestinationType(v as "customer_location" | "external")}
              className="grid gap-3 sm:grid-cols-2"
            >
              <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-sm">
                <RadioGroupItem value="customer_location" />
                <span>{tForm("consigneeTypeCustomerLocation")}</span>
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-sm">
                <RadioGroupItem value="external" />
                <span>{tForm("consigneeTypeExternal")}</span>
              </label>
            </RadioGroup>
          </div>
        ) : null}

        {isShipper || destinationType === "customer_location" ? (
          <div className="space-y-1">
            <Label>
              {tForm("customerLocationLabel")} <span className="text-red-500">*</span>
            </Label>
            <Combobox
              items={locationOptions}
              value={locationOptions.find((x) => x.value === locationId) ?? null}
              onValueChange={(next) => setLocationId(next?.value ?? "")}
            >
              <ComboboxInput
                className={cn("w-full", renderFieldError(`${prefix}_location_id`) && "[&_input]:border-red-500")}
                placeholder={tForm("customerLocationPlaceholder")}
              />
              <ComboboxContent>
                <ComboboxEmpty>{tForm("comboboxEmpty")}</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {renderFieldError(`${prefix}_location_id`) && (
              <p className="text-[11px] font-medium text-red-500">{renderFieldError(`${prefix}_location_id`)}</p>
            )}
          </div>
        ) : null}

        <div className="space-y-1">
          <Label>
            {isShipper ? tForm("shipperCompanyLabel") : tForm("consigneeCompanyLabel")}{" "}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            readOnly={isShipper}
            className={cn(renderFieldError(`${prefix}_name`) && "border-red-500 ring-2 ring-red-500/20")}
          />
          {renderFieldError(`${prefix}_name`) && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError(`${prefix}_name`)}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>
              {tForm("picNameLabel")} <span className="text-red-500">*</span>
            </Label>
            <Input value={picName} onChange={(e) => setPicName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{tForm("picEmailLabel")}</Label>
            <Input value={picEmail} onChange={(e) => setPicEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>
              {tForm("picMobileLabel")} <span className="text-red-500">*</span>
            </Label>
            <Input
              value={picMobile}
              onChange={(e) => {
                setPicMobile(e.target.value);
                setPhone(e.target.value);
              }}
              className={cn(renderFieldError(`${prefix}_phone`) && "border-red-500 ring-2 ring-red-500/20")}
            />
            {renderFieldError(`${prefix}_phone`) && (
              <p className="text-[11px] font-medium text-red-500">{renderFieldError(`${prefix}_phone`)}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label>
            {tForm("countryLabel")} <span className="text-red-500">*</span>
          </Label>
          <Input value="Indonesia" readOnly />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>
              {tForm("provinceLabel")} <span className="text-red-500">*</span>
            </Label>
            <Combobox
              items={provinceOptions}
              value={provinceOptions.find((x) => x.value === provinceId) ?? null}
              onValueChange={(next) => {
                setProvinceId(next?.value ?? "");
                setCityId("");
                setDistrictId("");
              }}
            >
              <ComboboxInput className="w-full" placeholder={tForm("provincePlaceholder")} />
              <ComboboxContent>
                <ComboboxEmpty>{tForm("comboboxEmpty")}</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="space-y-1">
            <Label>
              {tForm("cityLabel")} <span className="text-red-500">*</span>
            </Label>
            <Combobox
              items={cityOptions}
              value={cityOptions.find((x) => x.value === cityId) ?? null}
              onValueChange={(next) => {
                setCityId(next?.value ?? "");
                setDistrictId("");
              }}
            >
              <ComboboxInput className="w-full" placeholder={tForm("cityPlaceholder")} />
              <ComboboxContent>
                <ComboboxEmpty>{tForm("comboboxEmpty")}</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="space-y-1">
            <Label>
              {tForm("districtLabel")} <span className="text-red-500">*</span>
            </Label>
            <Combobox
              items={districtOptions}
              value={districtOptions.find((x) => x.value === districtId) ?? null}
              onValueChange={(next) => setDistrictId(next?.value ?? "")}
            >
              <ComboboxInput className="w-full" placeholder={tForm("districtPlaceholder")} />
              <ComboboxContent>
                <ComboboxEmpty>{tForm("comboboxEmpty")}</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="space-y-1">
            <Label>{tForm("postalCodeLabel")}</Label>
            <SearchableCombobox
              value={postalCode}
              onChange={setPostalCode}
              options={[]}
              placeholder={tForm("postalCodePlaceholder")}
              searchPlaceholder={tForm("postalCodeSearch")}
              emptyMessage={tForm("postalCodeEmpty")}
              allowFreeInput
              aria-label={tForm("postalCodeLabel")}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label>
            {tForm("addressLabel")} <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={isShipper ? tForm("addressPlaceholderShipper") : tForm("addressPlaceholderConsignee")}
            rows={3}
            className={cn(renderFieldError(`${prefix}_address`) && "border-red-500 ring-2 ring-red-500/20")}
            required
          />
          {renderFieldError(`${prefix}_address`) && (
            <p className="text-[11px] font-medium text-red-500">{renderFieldError(`${prefix}_address`)}</p>
          )}
        </div>

        {!isShipper && showDeliveryNotes && setDeliveryNotes ? (
          <div className="space-y-1">
            <Label>{tForm("deliveryNotesLabel")}</Label>
            <Textarea
              value={deliveryNotes ?? ""}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
              placeholder={tForm("deliveryNotesPlaceholder")}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
