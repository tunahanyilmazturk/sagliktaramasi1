
import { z } from 'zod';

export const companySchema = z.object({
    name: z.string().min(2, 'Firma adı en az 2 karakter olmalıdır'),
    taxInfo: z.string().min(5, 'Vergi bilgisi en az 5 karakter olmalıdır'),
    authorizedPerson: z.string().min(3, 'Yetkili kişi adı en az 3 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    phone: z.string().min(10, 'Telefon numarası en az 10 haneli olmalıdır'),
    address: z.string().min(10, 'Adres en az 10 karakter olmalıdır'),
});

export type CompanyFormData = z.infer<typeof companySchema>;
