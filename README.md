# Kurum Uygulamaları Portföyü

Kurum için geliştirilen tüm uygulamaların tek bir platformda toplandığı portföy yönetim sistemi.

## Teknoloji Yığını

### Temel Framework
- **Next.js 16** - App Router ile React framework
- **TypeScript 5** - Tip güvenli JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework

### UI Bileşenleri
- **shadcn/ui** - Radix UI tabanlı erişilebilir bileşenler
- **Lucide React** - İkon kütüphanesi

### Formlar & Validasyon
- **React Hook Form** - Form yönetimi
- **Zod** - Schema validasyonu

### Veritabanı & Backend
- **Prisma** - TypeScript ORM
- **SQLite** - Yerel veritabanı

## Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
bun install

# Veritabanını oluştur
bun run db:push

# Örnek veri ekle (opsiyonel)
bun seed.ts

# Geliştirme sunucusunu başlat
bun run dev

# Üretim build
bun run build

# Üretim sunucusunu başlat
bun start
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışır.

## Proje Yapısı

```
src/
├── app/
│   ├── api/projects/    # REST API endpoint'leri
│   ├── layout.tsx       # Kök layout
│   └── page.tsx         # Ana sayfa (portföy listesi)
├── components/
│   └── ui/              # shadcn/ui bileşenleri
├── hooks/               # Özel React hook'ları
└── lib/
    ├── db.ts            # Prisma istemcisi
    └── utils.ts         # Yardımcı fonksiyonlar
prisma/
└── schema.prisma        # Veritabanı şeması
```

## Özellikler

- **Proje Listeleme** - Tüm kurum uygulamalarını kart görünümünde listele
- **Proje Ekleme/Düzenleme** - Dialog formu ile CRUD işlemleri
- **Durum Yönetimi** - Aktif, Geliştirme, Arşiv durumları
- **Arama & Filtreleme** - İsim, açıklama ve teknoloji etiketlerine göre arama
- **Bağlantı Yönetimi** - GitHub ve canlı URL desteği
- **İstatistik Kartları** - Proje sayılarının özet görünümü

## Veritabanı Komutları

```bash
bun run db:push      # Şemayı veritabanına uygula
bun run db:generate  # Prisma istemcisini oluştur
bun run db:migrate   # Migration oluştur ve uygula
bun run db:reset     # Veritabanını sıfırla
```

## Docker ile Çalıştırma

```bash
docker-compose up --build
```
