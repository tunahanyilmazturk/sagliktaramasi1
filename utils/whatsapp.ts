
export const sendWhatsAppMessage = (phone: string, message: string) => {
  // Telefon numarasındaki sayı dışındaki karakterleri temizle
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Türkiye için numara 90 ile başlamıyorsa ekle (varsayım: Türkiye odaklı)
  const formattedPhone = cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};

export const formatScreeningMessage = (companyName: string, date: string, title: string) => {
  const formattedDate = new Date(date).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `Merhaba, *${companyName}* firması için planlanan *${title}* operasyonu ${formattedDate} tarihinde gerçekleştirilecektir. Bilginize sunarız.`;
};
