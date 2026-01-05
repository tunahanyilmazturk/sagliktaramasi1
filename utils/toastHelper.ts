import toast, { ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
  position: 'top-right',
  duration: 4000,
  style: {
    background: '#1e293b',
    color: '#fff',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
};

export const toasts = {
  success: (message: string, options?: ToastOptions) => 
    toast.success(message, { ...defaultOptions, ...options }),
    
  error: (message: string, options?: ToastOptions) => 
    toast.error(message, { ...defaultOptions, ...options }),
    
  loading: (message: string, options?: ToastOptions) => 
    toast.loading(message, { ...defaultOptions, ...options }),
    
  info: (message: string, options?: ToastOptions) => 
    toast(message, { ...defaultOptions, ...options }),
    
  // Common messages
  saved: (item: string) => toast.success(`${item} başarıyla kaydedildi`, defaultOptions),
  updated: (item: string) => toast.success(`${item} başarıyla güncellendi`, defaultOptions),
  deleted: (item: string) => toast.success(`${item} başarıyla silindi`, defaultOptions),
  created: (item: string) => toast.success(`${item} başarıyla oluşturuldu`, defaultOptions),
  
  copied: () => toast.success('Panoya kopyalandı', defaultOptions),
  downloaded: (item: string) => toast.success(`${item} indirildi`, defaultOptions),
  
  networkError: () => toast.error('Bağlantı hatası. Lütfen tekrar deneyin.', defaultOptions),
  unauthorized: () => toast.error('Bu işlem için yetkiniz yok', defaultOptions),
  notFound: (item: string) => toast.error(`${item} bulunamadı`, defaultOptions),
  
  // Form validation
  required: (field: string) => toast.error(`${field} alanı zorunludur`, defaultOptions),
  invalid: (field: string) => toast.error(`${field} alanı geçersiz`, defaultOptions),
  tooShort: (field: string, min: number) => toast.error(`${field} en az ${min} karakter olmalı`, defaultOptions),
  tooLong: (field: string, max: number) => toast.error(`${field} en fazla ${max} karakter olmalı`, defaultOptions),
  
  // Async operations
  saving: (item: string) => toast.loading(`${item} kaydediliyor...`, defaultOptions),
  deleting: (item: string) => toast.loading(`${item} siliniyor...`, defaultOptions),
  loadingAsync: (item: string) => toast.loading(`${item} yükleniyor...`, defaultOptions),
};

export const dismissAllToasts = () => toast.dismiss();
