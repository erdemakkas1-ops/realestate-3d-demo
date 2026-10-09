# ATLAS Rezidans — etkileşimli 3D proje sitesi

Next.js App Router, TypeScript, Tailwind CSS, Three.js, React Three Fiber ve Drei ile tek sayfalık, bölümlü gayrimenkul satış sitesi.

## Çalıştırma

```sh
npm install
npm run dev
```

## Kontroller

```sh
npm run typecheck
npm run lint
npm run build
```

## Sayfa yapısı

Sabit üst menü (`SiteHeader`) bölümlere bağlantı verir ve görünür bölümü işaretler; tarayıcı kaydırması normaldir, hero'da tekerlek zoom'u kapalıdır.

1. **Proje** (`HeroSection`): alacakaranlık sahnesi, kat seçimi (sahneye tıklama veya her ekranda görünen ‹ Kat › seçici), kat paneli ve istatistikler.
2. **Kat Planları** (`FloorPlanSection`): daire seçici, oda listesi, 2D/3D plan.
3. **Ödeme** (`PaymentSection`): peşinat ve vade, aylık taksit kartı, "Satış danışmanına gönder".
4. **Konum** (`LocationSection`): şematik harita ve yakınlık noktaları.
5. **Randevu** (`ClosingSection`) ve `AppointmentDialog`: native `<dialog>`; seçili daire ve ödeme planı talebe eklenir. Form yerel demodur, hiçbir yere gönderilmez.

Seçili kat, daire, plan modu ve ödeme ayarları `ProjectExperience` içinde tutulur; tüm bölümler aynı daireyi gösterir.

## 3D sahne

Hero'da Meshy'den gelen bina modeli kullanılır.

- `public/models/building.glb`: değiştirilmemiş, materyalsiz kaynak model (SHA-256 `95eb1193…`).
- `public/models/building-colored.glb`: runtime'da yüklenen, aynı geometrinin cam / cephe / çerçeve / döşeme / ahşap tavan / taş / zemin / çim / ağaç / çatı PBR materyallerine ayrılmış hâli. `python scripts/colorize_building.py` (numpy gerekir) ile kaynaktan yeniden üretilir; palet ve eşikler script'in başındadır. Geometri ve sınırlar aynı olduğu için kat kalibrasyonu değişmez.
- `src/lib/glbBuildingConfig.ts` + `buildingFloors.ts`: modelin sınır kutusuna göre 14 kat hitbox'ı.
- `BuildingScene` → `BuildingCanvas` (sıcak güneş, serin dolgu, HDR indirmeyen prosedürel cam yansıması, ilk karelerde çizilen gölge) → `BuildingModel` (kamera kadrajı, OrbitControls; tekerlek sayfayı kaydırır, zoom yapmaz).

`Tower`, `Surroundings`, `buildingLayout.ts` ve `HeroCanvas` (yalnızca yeniden dışa aktarım) önceki kodla kurulmuş kuleye aittir.

## İçerik

Proje adı, metinler ve istatistikler `src/data/project.ts`; daireler `src/data/apartments.ts`; planlar `src/data/floorPlan.ts`; konum `src/data/location.ts`. Hepsi demo veridir.
