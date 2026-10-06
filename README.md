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

Bina kodla üretilir; model dosyası yüklenmez.

- `src/lib/buildingConfig.ts`: kat sayısı, kat yüksekliği, kule / podyum / meydan ölçüleri, cephe başına pencere aksı sayısı.
- `src/lib/buildingLayout.ts`: kat hitbox'ları, pencere konumları ve her pencerenin hangi daireye (A batı + ön-sol, B arka, C doğu + ön-sağ) ait olduğu.
- `Tower`: statik parçalar materyal başına tek geometride birleştirilir; pencereler instanced mesh'tir. Seçilen / üzerine gelinen daire kendi pencerelerinde yanar.
- `Surroundings`: gökyüzü gradyanı (shader), şehir silueti, meydan ve ağaçlar.
- `HeroCanvas`: ışıklar, prosedürel `Environment` (HDR indirmez), su yansıması (sahnenin aynalanmış kopyası), kamera kadrajı (geniş ekranda bina metnin sağına kaydırılır) ve yalnızca ilk karelerde çizilen gölge haritası.

`public/models/` altındaki Meshy GLB'leri ve `scripts/colorize_building.py` artık kullanılmıyor.

## İçerik

Proje adı, metinler ve istatistikler `src/data/project.ts`; daireler `src/data/apartments.ts`; planlar `src/data/floorPlan.ts`; konum `src/data/location.ts`. Hepsi demo veridir.
