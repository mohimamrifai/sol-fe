"use client";

import * as React from "react";
import {
  getAllProvinces,
  getCitiesForProvince,
  getDistrictsForCity,
} from "@/lib/id-regions";
import {
  getStatesForCountry,
  getCitiesForCountryState,
} from "@/lib/world-regions";
import { DEFAULT_COUNTRY } from "@/lib/countries";

export type ComboboxOption = { value: string; label: string };

export function useAddressRegionOptions(
  country: string,
  province: string,
  city: string,
) {
  const isIndonesia = country === DEFAULT_COUNTRY;
  const [provinceOptions, setProvinceOptions] = React.useState<ComboboxOption[]>([]);
  const [cityOptions, setCityOptions] = React.useState<ComboboxOption[]>([]);
  const [districtOptions, setDistrictOptions] = React.useState<ComboboxOption[]>([]);
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
          if (!cancelled) {
            setProvinceOptions(list.map((p) => ({ value: p.name, label: p.name })));
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingProvince(false);
        });
    } else {
      const list = getStatesForCountry(country);
      if (!cancelled) {
        setProvinceOptions(list.map((s) => ({ value: s.name, label: s.name })));
      }
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
          if (!cancelled) {
            setCityOptions(cities.map((c) => ({ value: c.name, label: c.name })));
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingCity(false);
        });
    } else {
      const list = getCitiesForCountryState(country, province);
      if (!cancelled) {
        setCityOptions(list.map((c) => ({ value: c.name, label: c.name })));
      }
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
      if (!cancelled) {
        setDistrictOptions(districts.map((d) => ({ value: d.name, label: d.name })));
      }
    })().finally(() => {
      if (!cancelled) setLoadingDistrict(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isIndonesia, province, city]);

  return {
    isIndonesia,
    provinceOptions,
    cityOptions,
    districtOptions,
    loadingProvince,
    loadingCity,
    loadingDistrict,
  };
}
