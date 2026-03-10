import { db } from "./src/lib/db";

async function main() {
  // Örnek projeler
  const projects = [
    {
      name: "E-Devlet Portal",
      description: "Vatandaşların tüm kamu hizmetlerine tek noktadan erişim sağladığı dijital platform. Kimlik doğrulama, belge başvurusu ve takip işlemleri.",
      githubUrl: "https://github.com/kurum/edevlet-portal",
      liveUrl: "https://edevlet.kurum.gov.tr",
      status: "ACTIVE",
      tags: "React, Node.js, PostgreSQL, Keycloak",
    },
    {
      name: "İnsan Kaynakları Yönetim Sistemi",
      description: "Personel bordro, izin takibi, performans değerlendirme ve özlük işlemlerini yöneten kurumsal HR sistemi.",
      githubUrl: "https://github.com/kurum/hr-system",
      liveUrl: "https://hr.kurum.gov.tr",
      status: "ACTIVE",
      tags: "Next.js, TypeScript, Prisma, MySQL",
    },
    {
      name: "Belge Yönetim Sistemi",
      description: "Kurum içi belge dolaşımı, arşivleme ve elektronik imza desteği sunan doküman yönetim platformu.",
      githubUrl: "https://github.com/kurum/belge-yonetimi",
      liveUrl: null,
      status: "DEVELOPMENT",
      tags: "Vue.js, Django, Elasticsearch",
    },
    {
      name: "Toplantı Yönetim Paneli",
      description: "Toplantı planlama, gündem oluşturma, karar takibi ve toplantı notları yönetimi için web uygulaması.",
      githubUrl: "https://github.com/kurum/toplanti-panel",
      liveUrl: "https://toplanti.kurum.gov.tr",
      status: "ACTIVE",
      tags: "React, Express, MongoDB, Socket.io",
    },
    {
      name: "Eski Stok Takip Sistemi",
      description: "Eski stok yönetim sistemi. Yeni sistem ile değiştirildi, arşiv amaçlı tutulmaktadır.",
      githubUrl: "https://github.com/kurum/eski-stok",
      liveUrl: null,
      status: "ARCHIVED",
      tags: "PHP, MySQL, jQuery",
    },
    {
      name: "Mobil Vatandaş Uygulaması",
      description: "Vatandaşların mobil cihazlardan kamu hizmetlerine erişimini sağlayan iOS ve Android uygulaması.",
      githubUrl: "https://github.com/kurum/vatandas-mobile",
      liveUrl: "https://apps.apple.com/app/vatandas",
      status: "DEVELOPMENT",
      tags: "React Native, TypeScript, Firebase",
    },
  ];

  console.log("Örnek projeler ekleniyor...");

  for (const project of projects) {
    await db.project.create({ data: project });
    console.log(`✓ ${project.name} eklendi`);
  }

  console.log("\nTüm örnek projeler başarıyla eklendi!");
}

main()
  .catch((e) => {
    console.error("Hata:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
