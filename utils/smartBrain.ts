
import { KnowledgeBase } from './knowledgeBase';

export interface AssistantContext {
  totalRevenue: number;
  pendingProposalsCount: number;
  completedScreenings: number;
  upcomingAppointments: number;
  proposalsCount: number;
  appointmentsCount: number;
  companiesCount: number;
  staffCount: number;
  topCompany: string;
}

export interface SmartResponse {
  text: string;
  action?: string;
}

export const smartBrain = {
  memory: [] as string[],

  processInput(input: string, context: AssistantContext): SmartResponse {
    const query = input.toLowerCase();
    this.memory.push(query);
    if (this.memory.length > 5) this.memory.shift();

    // 1. Check for Commands (Action Execution)
    for (const cmd of Object.values(KnowledgeBase.commands)) {
      if (cmd.keywords.some(k => query.includes(k))) {
        return {
          text: cmd.response,
          action: cmd.action
        };
      }
    }

    // 2. Contextual Memory Reasoning
    if (this.memory.length > 1) {
      const lastQuery = this.memory[this.memory.length - 2];
      if (query.includes('detay') || query.includes('daha fazla') || query.includes('başka')) {
        if (lastQuery.includes('ciro') || lastQuery.includes('gelir')) {
          return { text: `Finansal detaylar: Onay bekleyen ${context.pendingProposalsCount} teklifinizin toplam değeri yaklaşık ₺${(context.pendingProposalsCount * 15000).toLocaleString('tr-TR')}. Bu rakamın yarısının bile onaylanması hedeflerinizi yakalamanızı sağlar.` };
        }
        if (lastQuery.includes('operasyon') || lastQuery.includes('randevu')) {
          return { text: `Operasyonel detaylar: Gelecek ${context.upcomingAppointments} randevunun çoğu periyodik muayene odaklı. Personelinizin uzmanlık dağılımı bu yükü taşımak için yeterli.` };
        }
      }
    }

    // 3. Check Training Data Patterns
    for (const category of Object.values(KnowledgeBase)) {
      if ('trainingData' in category) {
        for (const data of (category as any).trainingData) {
          if (data.pattern.test(query)) {
            return { text: data.response };
          }
        }
      }
    }

    // 4. OHS Reasoning
    if (KnowledgeBase.ohs.keywords.some(k => query.includes(k))) {
      return { text: `Mevzuat ve İSG analizi: Sistemde kayıtlı ${context.completedScreenings} tamamlanmış tarama var. ${KnowledgeBase.ohs.concepts.compliance} Gelecek dönem planlamasında tehlike sınıflarına göre periyodik yenilemeleri unutmamalıyız.` };
    }

    // 5. Keyword & Context Reasoning
    // Finance Reasoning
    if (KnowledgeBase.finance.keywords.some(k => query.includes(k))) {
      if (query.includes('tahmin') || query.includes('gelecek') || query.includes('nasıl')) {
        const growthPotential = Math.round((context.pendingProposalsCount / context.proposalsCount) * 100) || 0;
        return { text: `Finansal analizim sonucunda: Toplam onaylanmış geliriniz ₺${context.totalRevenue.toLocaleString('tr-TR')}. Bekleyen ${context.pendingProposalsCount} teklifinizin takibi kritik. Eğer bunları realize edebilirsek portföyünüzde %${growthPotential} oranında bir genişleme sağlayabiliriz. ${KnowledgeBase.finance.concepts.growth}` };
      }
      return { text: `Şu anki muhasebe durumunuz: ₺${context.totalRevenue.toLocaleString('tr-TR')} toplam ciro ve ${context.pendingProposalsCount} bekleyen ödeme/teklif kalemi var. ${KnowledgeBase.finance.concepts.target}` };
    }

    // Operations Reasoning
    if (KnowledgeBase.operations.keywords.some(k => query.includes(k))) {
      const efficiency = Math.round((context.completedScreenings / context.appointmentsCount) * 100) || 0;
      if (efficiency > 80) {
        return { text: `Operasyonel verimlilik düzeyiniz harika (%${efficiency}). ${KnowledgeBase.operations.concepts.efficiency} Mevcut ${context.upcomingAppointments} randevuyu mevcut ekiple rahatça yönetebilirsiniz.` };
      }
      return { text: `Operasyonel görünüm: Toplam ${context.appointmentsCount} görevden ${context.completedScreenings} tanesi bitti. Gelecek ${context.upcomingAppointments} randevu için planlama yapmamız gerekiyor. ${KnowledgeBase.operations.concepts.bottleneck}` };
    }

    // Company Reasoning
    if (KnowledgeBase.company.keywords.some(k => query.includes(k))) {
      return { text: `Portföyünüzde ${context.companiesCount} aktif firma var. "${context.topCompany}" en stratejik ortağınız olarak öne çıkıyor. ${KnowledgeBase.company.concepts.sectorAnalysis}` };
    }

    // General Responses
    if (query.includes('neler yapabilirsin') || query.includes('yetenek') || query.includes('kimsin')) {
      return { text: KnowledgeBase.general.capabilities };
    }

    if (query.includes('merhaba') || query.includes('selam')) {
      return { text: KnowledgeBase.general.greeting[Math.floor(Math.random() * KnowledgeBase.general.greeting.length)] };
    }

    return { text: KnowledgeBase.general.unknown[Math.floor(Math.random() * KnowledgeBase.general.unknown.length)] };
  }
};
