import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPinned, Sparkles, Users } from "lucide-react";

const VALUES = [
  {
    icon: Sparkles,
    title: "VIP байрлал",
    description: "Зар тань жагсаалтын дээд хэсэгт тогтмол харагдана.",
  },
  {
    icon: BadgeCheck,
    title: "Баталгаажсан зар",
    description: "Шалгагдсан агент, ил тод мэдээлэл, итгэлтэй сонголт.",
  },
  {
    icon: MapPinned,
    title: "Ухаалаг байршлын хайлт",
    description: "Албан ёсны болон нутгийн нэршлээр хурдан олно.",
  },
  {
    icon: Users,
    title: "Агент & эзэн",
    description: "Хувь хүн, агент, компани — бүх төрлийн зар нэг дор.",
  },
];

export function HomeValueProps() {
  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-[1600px] px-4 py-14 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#183E95]">
            Яагаад EasyPro вэ?
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
            Мэргэжлийн үл хөдлөх хөрөнгийн туршлага
          </h2>
          <p className="mt-3 text-slate-600">
            Худалдах, түрээслэх, худалдан авах — нэг платформ, цэвэр интерфэйс, хүчтэй
            хайлт.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#183E95] text-white shadow-md shadow-[#183E95]/25">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/post-property"
            className="inline-flex items-center gap-2 rounded-xl bg-[#183E95] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#183E95]/30 transition hover:bg-[#1e4bb5]"
          >
            Зар нэмэх
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-800 shadow-sm transition hover:border-[#183E95]/40"
          >
            Бүх зар хайх
          </Link>
        </div>
      </div>
    </section>
  );
}
