"use client";

import { useEffect, useState } from "react";
import { project, sections, type SectionId } from "@/data/project";

export default function SiteHeader({ onAppointment }: { onAppointment: () => void }) {
  const [active, setActive] = useState<SectionId>("proje");

  useEffect(() => {
    const targets = sections.map(section => document.getElementById(section.id)).filter((node): node is HTMLElement => node !== null);
    // The section crossing a line ~35% down the viewport is the one being read.
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id as SectionId);
    }, { rootMargin: "-35% 0px -60% 0px" });
    targets.forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#070c16]/88 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-[1520px] items-center gap-6 px-4 sm:px-8">
      <a href="#proje" className="flex h-11 items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8b879]">
        <span className="font-display text-xl font-bold tracking-[0.28em] text-[#f1ebdf]">{project.name}</span>
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-[#8d9aac] sm:inline">{project.descriptor}</span>
        <span className="sr-only">, başa dön</span>
      </a>
      <nav aria-label="Bölümler" className="ml-auto hidden lg:block">
        <SectionLinks active={active} />
      </nav>
      <button type="button" onClick={onAppointment} className="ml-auto flex h-11 shrink-0 cursor-pointer items-center rounded-full border border-[#d8b879]/55 px-5 text-sm font-semibold text-[#f0dcb4] transition-colors hover:bg-[#d8b879] hover:text-[#101622] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b879] lg:ml-4">
        Randevu Talep Et
      </button>
    </div>
    <nav aria-label="Bölümler" className="border-t border-white/[0.05] lg:hidden">
      <SectionLinks active={active} />
    </nav>
  </header>;
}

function SectionLinks({ active }: { active: SectionId }) {
  return <ul className="flex items-center justify-between gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-2 sm:justify-start sm:px-6 lg:gap-2 lg:px-0">
    {sections.map(section => <li key={section.id} className="shrink-0">
      <a
        href={`#${section.id}`}
        aria-current={active === section.id ? "location" : undefined}
        className={`relative flex h-11 items-center rounded px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#d8b879] lg:h-16 ${active === section.id ? "text-[#f1ebdf]" : "text-[#8d9aac] hover:text-[#e9e4da]"}`}
      >
        {section.label}
        <span aria-hidden="true" className={`absolute inset-x-3 bottom-1.5 h-px bg-[#d8b879] transition-opacity lg:bottom-4 ${active === section.id ? "opacity-100" : "opacity-0"}`} />
      </a>
    </li>)}
  </ul>;
}
