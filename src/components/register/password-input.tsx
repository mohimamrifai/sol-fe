"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { FieldError, fieldClass, useRegisterT } from "./types";
import type { RegisterFormValues } from "./types";

interface PasswordInputProps {
  name: "password" | "confirm_password";
}

/**
 * Password / Confirm Password input with show/hide toggle.
 * All labels, placeholders, and ARIA strings are fully translated via
 * the parent <RegisterStepper> -> useRegisterT() context.
 */
export function PasswordInput({ name }: PasswordInputProps) {
  const t = useRegisterT();
  const {
    control,
    formState: { errors },
  } = useFormContext<RegisterFormValues>();
  const [show, setShow] = React.useState(false);
  const error = errors[name]?.message;

  const isConfirm = name === "confirm_password";
  const label = isConfirm ? t("field.confirmPassword") : t("field.password");
  const placeholder = isConfirm
    ? t("field.confirmPasswordPlaceholder")
    : t("field.passwordPlaceholder");

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
      >
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Input
              id={name}
              type={show ? "text" : "password"}
              placeholder={placeholder}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              className={fieldClass(!!error) + " pr-9"}
            />
          )}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600"
          aria-label={show ? t("field.hidePassword") : t("field.showPassword")}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <FieldError message={error} />
    </div>
  );
}
