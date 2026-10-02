import { SITE_INTRO_PARAGRAPHS } from "@/lib/site-intro";

type SiteIntroTextProps = {
  className?: string;
  paragraphClassName?: string;
};

export function SiteIntroText({ className = "", paragraphClassName = "" }: SiteIntroTextProps) {
  return (
    <div className={className}>
      {SITE_INTRO_PARAGRAPHS.map((text) => (
        <p key={text.slice(0, 24)} className={paragraphClassName}>
          {text}
        </p>
      ))}
    </div>
  );
}
