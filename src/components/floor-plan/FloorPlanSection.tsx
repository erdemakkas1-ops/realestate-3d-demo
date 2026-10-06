"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { Apartment } from "@/types/apartment";
import type { ApartmentDetailMode } from "@/types/floorPlan";
import { getApartmentsForFloor } from "@/data/apartments";
import { getFloorPlanTemplate } from "@/data/floorPlan";
import { FLOOR_COUNT } from "@/lib/buildingConfig";
import FloorPlanSvg from "./FloorPlanSvg";
import PlanToggle from "./PlanToggle";

const FloorPlan3D = dynamic(() => import("./FloorPlan3D"), { ssr: false });

type Props = {
  apartment: Apartment;
  floor: number;
  mode: ApartmentDetailMode;
  onModeChange: (mode: ApartmentDetailMode) => void;
  onSelectApartment: (apartment: Apartment, floor: number) => void;
};

export default function FloorPlanSection({ apartment, floor, mode, onModeChange, onSelectApartment }: Props) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [requested3D, setRequested3D] = useState(mode === "3d");
  const [ready3D, setReady3D] = useState(false);
  const onReady = useCallback(() => setReady3D(true), []);
  const selectRoom = useCallback((id: string) => {
    setHoveredRoom(null);
    setSelectedRoom(current => current === id ? null : id);
  }, []);
  const activeRoom = hoveredRoom ?? selectedRoom;
  const { rooms, netArea } = getFloorPlanTemplate(apartment.type);
  const display3D = mode === "3d" && ready3D;
  const changeMode = (value: ApartmentDetailMode) => {
    onModeChange(value);
    if (value === "3d") setRequested3D(true);
    setHoveredRoom(null);
  };
  const pickFloor = (next: number) => {
    const candidates = getApartmentsForFloor(next);
    const sameUnit = candidates.find(item => item.id.slice(-1) === apartment.id.slice(-1) && item.status === "available");
    const fallback = sameUnit ?? candidates.find(item => item.status === "available");
    if (fallback) onSelectApartment(fallback, next);
  };

  return <section id="kat-planlari" aria-labelledby="plan-title" className="mx-auto max-w-[1520px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32 xl:px-16">
    <div className="motion-in-view grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#d8b879]">Kat planları</p>
        <h2 id="plan-title" tabIndex={-1} className="mt-4 outline-none font-display text-[clamp(2.1rem,4.6vw,3.9rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-[#f4efe4]">Her metrekare,<br className="sm:hidden" /> yaşam için çizildi.</h2>
      </div>
      <p className="text-sm leading-relaxed text-[#9aa8ba]">Planı 2D inceleyin ya da tek tıkla 3D maket görünümüne geçin. Odaların üzerine gelerek ya da dokunarak ölçüleri görün.</p>
    </div>

    <div className="mt-12 grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]">
      <aside aria-label={`Daire ${apartment.id} bilgileri`} className="order-2 rounded-3xl border border-white/[0.07] bg-[#0c1422] p-6 lg:order-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8d9aac]">{floor}. kat · {apartment.type}</p>
        <h3 className="mt-2 font-display text-3xl font-semibold text-[#f4efe4]">Daire {apartment.id}</h3>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-full border border-white/10 pl-4 text-sm text-[#aab5c4]">
            Kat
            <select value={floor} onChange={event => pickFloor(Number(event.target.value))} className="h-10 cursor-pointer rounded-full bg-transparent pr-3 font-semibold text-[#f1ebdf] focus-visible:outline-2 focus-visible:outline-[#d8b879]">
              {Array.from({ length: FLOOR_COUNT }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
            </select>
          </label>
          <div role="group" aria-label={`${floor}. kat daireleri`} className="flex gap-1.5">
            {getApartmentsForFloor(floor).map(item => <button
              key={item.id}
              type="button"
              disabled={item.status === "sold"}
              aria-pressed={item.id === apartment.id}
              aria-label={`Daire ${item.id}, ${item.type}${item.status === "sold" ? ", satıldı" : ""}`}
              onClick={() => onSelectApartment(item, floor)}
              className={`h-10 min-w-12 cursor-pointer rounded-full border px-3 font-display text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#d8b879] disabled:cursor-not-allowed disabled:text-[#5f6b7d] disabled:line-through ${item.id === apartment.id ? "border-[#d8b879] bg-[#d8b879] text-[#14110b]" : "border-white/10 text-[#e9e4da] hover:border-[#d8b879]/50"}`}
            >{item.id.slice(-1)}</button>)}
          </div>
        </div>

        <ul aria-label="Oda listesi" className="mt-6 divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {rooms.map(room => <li key={room.id}>
            <button
              type="button"
              aria-pressed={selectedRoom === room.id}
              onClick={() => selectRoom(room.id)}
              onPointerEnter={event => { if (event.pointerType !== "touch") setHoveredRoom(room.id); }}
              onPointerLeave={() => setHoveredRoom(null)}
              onFocus={() => setHoveredRoom(room.id)}
              onBlur={() => setHoveredRoom(null)}
              className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 px-1 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#d8b879] ${activeRoom === room.id ? "text-[#e9c98d]" : "text-[#b4bfcd] hover:text-[#f1ebdf]"}`}
            >
              <span>{room.name}</span>
              <span className="shrink-0 tabular-nums text-[#8d9aac]">{room.area} m²</span>
            </button>
          </li>)}
        </ul>
        <dl className="mt-5 grid grid-cols-2 gap-4">
          <div><dt className="text-xs text-[#8d9aac]">Net alan</dt><dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-[#f1ebdf]">{netArea} m²</dd></div>
          <div><dt className="text-xs text-[#8d9aac]">Brüt alan</dt><dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-[#f1ebdf]">{apartment.area} m²</dd></div>
        </dl>
      </aside>

      <div className="relative order-1 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0d1828] lg:order-2">
        <div className="absolute right-4 top-4 z-10"><PlanToggle mode={mode} onChange={changeMode} /></div>
        <div className="relative aspect-[10/9] w-full sm:aspect-[16/11] lg:aspect-auto lg:h-[min(72svh,680px)]">
          <div inert={display3D} aria-hidden={display3D} className={`motion-plan-layer absolute inset-x-4 bottom-10 top-20 sm:inset-x-8 sm:bottom-12 ${display3D ? "pointer-events-none opacity-0" : "opacity-100"}`}>
            <FloorPlanSvg fillContainer rooms={rooms} hoveredRoom={activeRoom} selectedRoom={selectedRoom} onSelect={selectRoom} onHover={setHoveredRoom} />
          </div>
          <div inert={!display3D} aria-hidden={!display3D} className={`scrollable-canvas motion-plan-layer absolute inset-0 ${display3D ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            {requested3D && <FloorPlan3D fillContainer onReady={onReady} rooms={rooms} hoveredRoom={display3D ? activeRoom : null} onSelect={selectRoom} onHover={setHoveredRoom} />}
          </div>
          {mode === "3d" && !ready3D && <p role="status" className="absolute bottom-4 left-4 rounded-full bg-[#070c16]/85 px-4 py-2 text-xs text-[#d8b879]">3D plan hazırlanıyor…</p>}
        </div>
        <p className="pointer-events-none absolute bottom-4 left-5 hidden font-mono text-[11px] uppercase tracking-[0.16em] text-[#7f8c9e] sm:block" aria-live="polite">
          {activeRoom ? `${rooms.find(room => room.id === activeRoom)?.name} · ${rooms.find(room => room.id === activeRoom)?.area} m²` : "Demo plan · ölçeksiz"}
        </p>
      </div>
    </div>
  </section>;
}
