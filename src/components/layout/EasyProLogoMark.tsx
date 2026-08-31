import Image from "next/image";

interface EasyProLogoMarkProps {
  className?: string;
}

export function EasyProLogoMark({
  className = "h-8 w-8 md:h-9 md:w-9",
}: EasyProLogoMarkProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5 shadow ${className}`}
    >
      <Image
        src="/logo-mark.png"
        alt="EasyPro"
        fill
        className="object-contain p-0.5"
        sizes="36px"
        priority
      />
    </span>
  );
}
