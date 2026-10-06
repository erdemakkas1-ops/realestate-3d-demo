import { FLOOR_COUNT } from "@/lib/buildingConfig";
import { apartmentsByFloor } from "./apartments";

// Placeholder brand and copy for the demo; replace with the client's project details.
export const project = {
  name: "ATLAS",
  descriptor: "Rezidans",
  eyebrow: "Şehrin sakin yakası · Teslim 2027",
  headline: ["Şehrin", "yeni silueti."],
  intro: "14 katlı, 42 konutluk bir yaşam projesi. Her daire gün ışığına ve şehre açılıyor.",
  delivery: "2027",
};

const allApartments = Object.values(apartmentsByFloor).flat();

export const projectStats = [
  { value: String(allApartments.length), label: "Konut" },
  { value: String(FLOOR_COUNT), label: "Kat" },
  { value: String(new Set(allApartments.map(apartment => apartment.type)).size), label: "Daire tipi" },
  { value: project.delivery, label: "Teslim" },
];

/** Shown in the plan and payment sections before a visitor picks an apartment. */
export const DEFAULT_APARTMENT_ID = "12A";

export const sections = [
  { id: "proje", label: "Proje" },
  { id: "kat-planlari", label: "Kat Planları" },
  { id: "odeme", label: "Ödeme" },
  { id: "konum", label: "Konum" },
] as const;

export type SectionId = (typeof sections)[number]["id"];
