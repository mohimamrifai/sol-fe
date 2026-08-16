"use client";

import * as React from "react";
import {
  Controller,
  useFormContext,
  useWatch,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchableCombobox } from "@/components/searchable-combobox";
import {
  getAllProvinces,
  getCitiesForProvince,
  getDistrictsForCity,
} from "@/lib/id-regions";
import {
  getStatesForCountry,
  getCitiesForCountryState,
} from "@/lib/world-regions";
import { getAllCountries, DEFAULT_COUNTRY } from "@/lib/countries";

interface AddressFieldsProps {
  namePrefix?: string;
  required?: boolean;
  readOnly?: boolean;
}

const labelCls = "text-xs font-semibold uppercase tracking-wider text-zinc-500";
const fieldErrCls = "text-xs text-red-500";
const readonlyInputCls = "h-10 bg-zinc-50 text-zinc-500";

export function AddressFields({ namePrefix = "", required = true, readOnly = false }: AddressFieldsProps) {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext();

  const fieldPath = (key: string): FieldPath<FieldValues> => {
    const name = namePrefix ? `${namePrefix}.${key}` : key;
    return name as unknown as FieldPath<FieldValues>;
  };

  const countryField = fieldPath("country");
  const provinceField = fieldPath("province");
  const cityField = fieldPath("city");
  const districtField = fieldPath("district");
  const postalField = fieldPath("postal_code");
  const addressField = fieldPath("address");

  const errs = errors as FieldErrors<FieldValues>;
  const getFieldErr = (key: string): { message?: string } | undefined => {
    if (namePrefix) {
      return ((errs as Record<string, FieldErrors<FieldValues>>)[namePrefix] as Record<string, { message?: string }> | undefined)?.[key];
    }
    return (errs as Record<string, { message?: string }>)[key];
  };
  const countryErr = getFieldErr("country");
  const provinceErr = getFieldErr("province");
  const cityErr = getFieldErr("city");
  const addressErr = getFieldErr("address");

  const country = useWatch({ control, name: countryField }) ?? "";
  const province = useWatch({ control, name: provinceField }) ?? "";
  const city = useWatch({ control, name: cityField }) ?? "";

  const isIndonesia = country === DEFAULT_COUNTRY;
  const [provinceOptions, setProvinceOptions] = React.useState<Array<{ value: string; label: string }>>([]);
  const [cityOptions, setCityOptions] = React.useState<Array<{ value: string; label: string }>>([]);
  const [districtOptions, setDistrictOptions] = React.useState<Array<{ value: string; label: string }>>([]);
  const [loadingProvince, setLoadingProvince] = React.useState(false);
  const [loadingCity, setLoadingCity] = React.useState(false);
  const [loadingDistrict, setLoadingDistrict] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (!country) {
      setProvinceOptions([]);
      return;
    }
    if (isIndonesia) {
      setLoadingProvince(true);
      getAllProvinces()
        .then((list) => {
          if (!cancelled) setProvinceOptions(list.map((p) => ({ value: p.name, label: p.name })));
        })
        .finally(() => !cancelled && setLoadingProvince(false));
    } else {
      const list = getStatesForCountry(country);
      if (!cancelled) setProvinceOptions(list.map((s) => ({ value: s.name, label: s.name })));
    }
    return () => {
      cancelled = true;
    };
  }, [country, isIndonesia]);

  React.useEffect(() => {
    let cancelled = false;
    if (!country || !province) {
      setCityOptions([]);
      return;
    }
    if (isIndonesia) {
      setLoadingCity(true);
      getAllProvinces()
        .then(async (provinces) => {
          if (cancelled) return;
          const found = provinces.find((p) => p.name === province);
          if (!found) {
            setCityOptions([]);
            return;
          }
          const cities = await getCitiesForProvince(found.id);
          if (!cancelled) setCityOptions(cities.map((c) => ({ value: c.name, label: c.name })));
        })
        .finally(() => !cancelled && setLoadingCity(false));
    } else {
      const list = getCitiesForCountryState(country, province);
      if (!cancelled) setCityOptions(list.map((c) => ({ value: c.name, label: c.name })));
    }
    return () => {
      cancelled = true;
    };
  }, [country, province, isIndonesia]);

  React.useEffect(() => {
    let cancelled = false;
    if (!isIndonesia) {
      setDistrictOptions([]);
      return;
    }
    if (!province || !city) {
      setDistrictOptions([]);
      return;
    }
    setLoadingDistrict(true);
    (async () => {
      const provinces = await getAllProvinces();
      if (cancelled) return;
      const prov = provinces.find((p) => p.name === province);
      if (!prov) {
        setDistrictOptions([]);
        return;
      }
      const cities = await getCitiesForProvince(prov.id);
      if (cancelled) return;
      const cty = cities.find((c) => c.name === city);
      if (!cty) {
        setDistrictOptions([]);
        return;
      }
      const districts = await getDistrictsForCity(cty.id);
      if (!cancelled) setDistrictOptions(districts.map((d) => ({ value: d.name, label: d.name })));
    })().finally(() => !cancelled && setLoadingDistrict(false));
    return () => {
      cancelled = true;
    };
  }, [isIndonesia, province, city]);

  React.useEffect(() => {
    if (readOnly) return;
    setValue(cityField, "", { shouldValidate: false });
    setValue(districtField, "", { shouldValidate: false });
  }, [country, setValue, cityField, districtField, readOnly]);
  React.useEffect(() => {
    if (readOnly) return;
    setValue(cityField, "", { shouldValidate: false });
    setValue(districtField, "", { shouldValidate: false });
  }, [province, setValue, cityField, districtField, readOnly]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={labelCls}>
            Country {required && <span className="text-red-500">*</span>}
          </label>
          <Controller
            control={control}
            name={countryField}
            render={({ field }) => (
              <SearchableCombobox
                value={field.value ?? ""}
                onChange={field.onChange}
                options={getAllCountries().map((c: { code: string; name: string }) => ({ value: c.name, label: c.name }))}
                placeholder="Select country"
                searchPlaceholder="Search country"
                invalid={!!countryErr}
                disabled={readOnly}
              />
            )}
          />
          {countryErr?.message && (
            <p className={fieldErrCls}>{countryErr.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>
            {isIndonesia ? "Province" : "State"}{" "}
            {required && <span className="text-red-500">*</span>}
          </label>
          <Controller
            control={control}
            name={provinceField}
            render={({ field }) => (
              <SearchableCombobox
                value={field.value ?? ""}
                onChange={field.onChange}
                options={provinceOptions}
                placeholder={country ? "Select province" : "Select country first"}
                searchPlaceholder="Search province"
                loading={loadingProvince}
                disabled={readOnly || !country || loadingProvince}
                invalid={!!provinceErr}
              />
            )}
          />
          {provinceErr?.message && (
            <p className={fieldErrCls}>{provinceErr.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className={labelCls}>
            City {required && <span className="text-red-500">*</span>}
          </label>
          <Controller
            control={control}
            name={cityField}
            render={({ field }) => (
              <SearchableCombobox
                value={field.value ?? ""}
                onChange={field.onChange}
                options={cityOptions}
                placeholder={province ? "Select city" : "Select province first"}
                searchPlaceholder="Search city"
                loading={loadingCity}
                disabled={readOnly || !province || loadingCity}
                invalid={!!cityErr}
                allowFreeInput
              />
            )}
          />
          {cityErr?.message && (
            <p className={fieldErrCls}>{cityErr.message}</p>
          )}
        </div>
        {isIndonesia ? (
          <div className="space-y-1.5">
            <label className={labelCls}>District</label>
            <Controller
              control={control}
              name={districtField}
              render={({ field }) => (
                <SearchableCombobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={districtOptions}
                  placeholder={city ? "Select district" : "Select city first"}
                  searchPlaceholder="Search district"
                  loading={loadingDistrict}
                  disabled={readOnly || !city || loadingDistrict}
                  allowFreeInput
                />
              )}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className={labelCls}>District</label>
            <Controller
              control={control}
              name={districtField}
              render={({ field }) => (
                <Input
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="District"
                  readOnly={readOnly}
                  disabled={readOnly}
                  className={readOnly ? readonlyInputCls : undefined}
                />
              )}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <label className={labelCls}>Postal Code</label>
          <Controller
            control={control}
            name={postalField}
            render={({ field }) => (
              <SearchableCombobox
                value={field.value ?? ""}
                onChange={field.onChange}
                options={[]}
                placeholder="Postal code"
                searchPlaceholder="Type postal code..."
                emptyMessage="Type postal code and press Enter"
                allowFreeInput
                disabled={readOnly}
              />
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>
          Address {required && <span className="text-red-500">*</span>}
        </label>
        <Controller
          control={control}
          name={addressField}
          render={({ field }) => (
            <Textarea
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="Full address"
              readOnly={readOnly}
              disabled={readOnly}
              className={readOnly ? "min-h-24 bg-zinc-50 text-zinc-500" : "min-h-24 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm focus-visible:bg-white"}
            />
          )}
        />
        {(addressErr?.message) && (
          <p className={fieldErrCls}>{addressErr.message}</p>
        )}
      </div>
    </div>
  );
}
