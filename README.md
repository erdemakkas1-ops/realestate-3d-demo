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

Bina, `Ön Cephe at Dusk` referans render'ına göre kodla kurulur; model dosyası yüklenmez.

- `src/lib/buildingConfig.ts`: kat sayısı ve yüksekliği, kule / balkon / podyum / sokak ölçüleri.
- `src/lib/buildingLayout.ts`: ön cephe aksları (balkonlu kanat, ahşap kolon, dar pencere, antrasit kanat, ışık şeritli orta bölüm), kat hitbox'ları ve her pencerenin hangi daireye ait olduğu (A batı kanadı, B orta + arka, C doğu kanadı).
- `Tower`: statik parçalar materyal başına tek geometride birleşir (antrasit, ahşap, taş, cam korkuluk, ışık şeritleri, bitkiler); pencereler instanced'dır ve oda derinliği shader'ı (aydınlık tavan, mobilya bandı) taşır. Seçilen / üzerine gelinen dairenin pencereleri altın rengi yanar.
- `Surroundings`: kaldırım, çitler, ağaçlar ve palmiyeler, şeritli yol, ışıkları yanan arabalar, sokak lambaları.
- `HeroCanvas`: akşam gökyüzü (CSS) ve SVG şehir silueti, akşam ışığı, prosedürel akşam kubbesi yansıması, kamera kadrajı (tekerlek sayfayı kaydırır, zoom yok), 2× piksel yoğunluğuna kadar render.

`public/models/` (Meshy modeli ve renkli kopyası) ve `scripts/colorize_building.py` önceki GLB tabanlı görünüme aittir; deploy'a girmez.

## İçerik

Proje adı, metinler ve istatistikler `src/data/project.ts`; daireler `src/data/apartments.ts`; planlar `src/data/floorPlan.ts`; konum `src/data/location.ts`. Hepsi demo veridir.
