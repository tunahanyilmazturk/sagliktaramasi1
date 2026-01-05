
export const KnowledgeBase = {
  commands: {
    addCompany: {
      keywords: ['firma ekle', 'yeni firma', 'şirket ekle', 'firma oluştur'],
      action: 'NAVIGATE_CREATE_COMPANY',
      response: "Tabii, sizi yeni firma oluşturma sayfasına yönlendiriyorum."
    },
    addProposal: {
      keywords: ['teklif oluştur', 'yeni teklif', 'teklif ekle'],
      action: 'NAVIGATE_CREATE_PROPOSAL',
      response: "Hemen yeni bir teklif hazırlayabilmeniz için ilgili sayfayı açıyorum."
    },
    addStaff: {
      keywords: ['personel ekle', 'yeni personel', 'çalışan ekle'],
      action: 'NAVIGATE_STAFF',
      response: "Personel yönetim sayfasına yönlendiriliyorsunuz."
    }
  },
  finance: {
    keywords: ['ciro', 'gelir', 'para', 'kazanç', 'fatura', 'ödeme', 'hakediş', 'muhasebe'],
    concepts: {
      growth: 'Cironun geçen aya göre artış trendinde olması olumlu bir göstergedir.',
      risk: 'Bekleyen tekliflerin fazlalığı nakit akışında tıkanıklığa yol açabilir.',
      target: 'Aylık ciro hedefi genellikle 100.000 TL olarak belirlenmiştir.'
    },
    trainingData: [
      { pattern: /ciro tahmini/i, response: "Onay bekleyen tekliflerin %50 dönüşüm oranı üzerinden hesaplandığında, önümüzdeki ay cironuzda ciddi bir ivmelenme bekliyorum." },
      { pattern: /en çok kazandıran/i, response: "Şu anki verilere göre en yüksek bütçeli operasyonlar Mobil Sağlık Tarama kategorisinden gelmektedir." }
    ]
  },
  operations: {
    keywords: ['operasyon', 'randevu', 'tarama', 'muayene', 'takvim', 'plan', 'saha'],
    concepts: {
      efficiency: 'Operasyon tamamlama oranının %80 üzerinde olması yüksek verimliliğe işaret eder.',
      bottleneck: 'Personel sayısının yetersiz kaldığı yoğun günlerde randevu çakışmaları yaşanabilir.'
    },
    trainingData: [
      { pattern: /en yoğun gün/i, response: "Takviminize bakılırsa Salı ve Perşembe günleri saha operasyonları için en yoğun dönemler." },
      { pattern: /ekip durumu/i, response: "Sağlık ekibiniz şu anki operasyonel yükü %85 dolulukla yönetiyor. Yeni büyük projeler için ek personel ihtiyacı doğabilir." }
    ]
  },
  company: {
    keywords: ['firma', 'şirket', 'müşteri', 'sektör', 'portföy'],
    concepts: {
      topClient: 'En büyük müşteriler genellikle uzun süreli sözleşmesi olan firmalardır.',
      sectorAnalysis: 'Lojistik ve İnşaat sektörlerindeki müşteriler periyodik taramalara daha çok ihtiyaç duyar.'
    }
  },
  ohs: {
    keywords: ['isg', 'mevzuat', 'yönetmelik', 'sağlık', 'güvenlik', 'periyodik', 'muayene', 'tetkik'],
    concepts: {
      periodic: 'İşe giriş muayeneleri ve periyodik sağlık taramaları yasal zorunluluktur.',
      compliance: '6331 sayılı İSG kanununa göre tüm çalışanların sağlık raporları güncel olmalıdır.'
    },
    trainingData: [
      { pattern: /yasal zorunluluk/i, response: "6331 sayılı İSG Kanunu uyarınca, tehlike sınıfına göre 1, 3 veya 5 yılda bir periyodik muayene yapılması yasal zorunluluktur." },
      { pattern: /tetkik listesi/i, response: "Genel tetkikler arasında Akciğer Grafisi, SFT, Odyometri, Tam Kan Sayımı ve İdrar Tetkiki en sık istenen kalemlerdir." }
    ]
  },
  general: {
    greeting: ["Merhaba! Size nasıl yardımcı olabilirim?", "Hoş geldiniz, verilerinizi analiz etmeye hazırım."],
    unknown: ["Bu konuda henüz eğitilmedim, ancak finans veya operasyon verileriniz hakkında sorular sorabilirsiniz.", "Sorunuzu tam anlayamadım, biraz daha detay verebilir misiniz?"],
    capabilities: "Şu konularda uzmanlaştım: Ciro analizi, Operasyonel verimlilik, Firma portföy yönetimi ve Stratejik gelecek tahminleri."
  }
};
