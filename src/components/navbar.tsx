"use client";

import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChevronDown, Menu, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  if (pathname.startsWith("/dashboard")) return null;

  const isHome = pathname === "/" || pathname === "";

  const navItems: { label: string; href: string; anchor?: boolean }[] = [
    { label: t("home"), href: "/" },
    { label: t("estimate"), href: "/estimasi" },
    { label: t("track"), href: "/tracking" },
    { label: t("services"), href: isHome ? "#layanan" : "/#layanan", anchor: true },
    { label: t("information"), href: isHome ? "#informasi" : "/#informasi", anchor: true },
  ];

  const isActive = (item: { href: string; anchor?: boolean }) => {
    if (item.anchor) return false;
    if (item.href === "/") return isHome;
    return pathname.startsWith(item.href);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out py-4",
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-zinc-200/80 shadow-sm py-3"
          : "bg-white border-b border-zinc-200/40 py-5"
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-6 md:px-12">
        <Link
          href="/"
          className="group flex shrink-0 items-center transition-transform duration-300 hover:opacity-95"
        >
          <BrandLogo size="sm" className="group-hover:rotate-[0.5deg]" />
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 bg-white/60 backdrop-blur-sm px-1.5 py-1.5 rounded-full border border-zinc-200/50 shadow-sm absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) =>
            item.anchor ? (
              <a
                key={item.href}
                href={item.href.startsWith("#") ? item.href : `/${locale}${item.href}`}
                className="px-4 py-2 rounded-full text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all duration-200"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  isActive(item)
                    ? "bg-[#0b1b69] text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                )}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button
                className="rounded-full px-6 font-medium bg-[#0b1b69] text-white hover:bg-[#0d2280] transition-all duration-300 shadow-lg shadow-[#0b1b69]/20"
              >
                {t("login")}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "rounded-full border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 flex items-center gap-2 shadow-sm transition-all duration-300 px-4"
                )}
              >
                <Globe className="h-4 w-4" />
                <span className="font-medium">{locale.toUpperCase()}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-45 rounded-xl p-2">
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => handleLanguageChange("id")}>
                  <span className="font-medium mr-2">ID</span> Bahasa Indonesia
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => handleLanguageChange("en")}>
                  <span className="font-medium mr-2">EN</span> English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Sheet>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "md:hidden rounded-full hover:bg-zinc-100"
              )}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[350px] rounded-l-3xl p-6">
              <div className="flex flex-col h-full">
                <div className="mb-8">
                  <BrandLogo size="sm" />
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                  {navItems.map((item) =>
                    item.anchor ? (
                      <a
                        key={item.href}
                        href={item.href.startsWith("#") ? item.href : `/${locale}${item.href}`}
                        className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        {item.label}
                        <ChevronDown className="-rotate-90 h-4 w-4 opacity-30" />
                      </a>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-all",
                          isActive(item)
                            ? "bg-[#0b1b69]/10 text-[#0b1b69]"
                            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        )}
                      >
                        {item.label}
                        <ChevronDown className="-rotate-90 h-4 w-4 opacity-30" />
                      </Link>
                    )
                  )}
                </nav>

                <div className="flex flex-col gap-3 pt-6 border-t mt-auto">
                  <Link href="/login" className="w-full">
                    <Button className="w-full rounded-full h-12 text-base font-medium bg-[#0b1b69] text-white hover:bg-[#0d2280] shadow-lg shadow-[#0b1b69]/10">
                      {t("login")}
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full justify-between rounded-full h-12 px-6"
                    )}>
                      {locale === 'id' ? 'Bahasa Indonesia' : 'English'} <ChevronDown className="h-4 w-4 opacity-50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width] rounded-xl p-2">
                      <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => handleLanguageChange("id")}>
                        <span className="font-medium mr-2">ID</span> Bahasa Indonesia
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => handleLanguageChange("en")}>
                        <span className="font-medium mr-2">EN</span> English
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
