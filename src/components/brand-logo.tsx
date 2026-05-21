import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** `sm` sidebar / navbar compact; `md` auth cards; `lg` hero */
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-20 max-w-[15rem] sm:max-w-[18rem]",
  md: "h-24 max-w-[20rem] sm:max-w-[24rem]",
  lg: "h-28 max-w-[24rem] sm:max-w-[28rem]",
} as const;

const wrapperClasses = {
  sm: "h-10",
  md: "h-12",
  lg: "h-16",
} as const;

export function BrandLogo({ size = "md", className }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        wrapperClasses[size],
        className
      )}
    >
      <Image
        src="/logo-baru.png"
        alt="SOL Logistics"
        width={600}
        height={200}
        priority
        className={cn("w-auto object-contain object-left", sizeClasses[size])}
      />
    </span>
  );
}
