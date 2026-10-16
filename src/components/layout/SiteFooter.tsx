import Link from "next/link";

import { EasyProLogoMark } from "@/components/layout/EasyProLogoMark";

const FOOTER_LINKS = {
  Зар: [
    { href: "/properties?listing_type=sell", label: "Үл хөдлөх худалдах" },
    { href: "/properties?listing_type=rent", label: "Үл хөдлөх түрээс" },
    { href: "/post-property", label: "Үл хөдлөх нэмэх" },
    { href: "/land", label: "Газар хайх" },
    { href: "/post-land", label: "Газар нэмэх" },
  ],
  Платформ: [
    { href: "/properties", label: "Үл хөдлөх" },
    { href: "/land", label: "Газар" },
    { href: "/login", label: "Нэвтрэх" },
    { href: "/login", label: "Бүртгүүлэх" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-[1600px] px-4 py-12 md:px-6 md:py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <EasyProLogoMark className="h-9 w-9" />
              <span className="text-xl font-bold text-white">EasyPro</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Монголын үл хөдлөх хөрөнгийн зар, хайлт, шүүлтүүр — мэргэжлийн түвшинд.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <p className="text-sm font-semibold uppercase tracking-wider text-white">
                {title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} EasyPro. Бүх эрх хамгаалагдсан.</p>
          <p>Улаанбаатар, Монгол</p>
        </div>
      </div>
    </footer>
  );
}
