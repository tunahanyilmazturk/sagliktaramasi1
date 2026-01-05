import React, { useState, useEffect } from 'react';
import { validateForm, sanitizeObject, ValidationRule } from '../utils/inputValidation';
import toast from 'react-hot-toast';

interface SecureFormProps {
  onSubmit: (data: any) => void;
  validationRules: Record<string, ValidationRule[]>;
  children: React.ReactNode;
  className?: string;
}

interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'textarea';
  required?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  className?: string;
}

export const SecureFormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  required = false,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  className = ''
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const inputClasses = `
    w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
    ${error 
      ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
      : isFocused 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
    }
    focus:outline-none focus:ring-2 focus:ring-blue-500/20
    ${className}
  `;

  const labelClasses = `
    block text-sm font-semibold mb-2
    ${error ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}
  `;

  return (
    <div className="mb-4">
      <label htmlFor={name} className={labelClasses}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={localValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`${inputClasses} min-h-[100px] resize-none`}
          required={required}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={localValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={inputClasses}
          required={required}
        />
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const SecureForm: React.FC<SecureFormProps> = ({
  onSubmit,
  validationRules,
  children,
  className = ''
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // CSRF Protection
  const [csrfToken] = useState(() => {
    // Generate or retrieve CSRF token
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    return token || Math.random().toString(36).substring(2);
  });

  useEffect(() => {
    // Add CSRF token to form if not present
    if (!document.querySelector('meta[name="csrf-token"]')) {
      const meta = document.createElement('meta');
      meta.name = 'csrf-token';
      meta.content = csrfToken;
      document.head.appendChild(meta);
    }
  }, [csrfToken]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors for this field when user starts typing
    if (submitCount > 0) {
      setErrors(prev => ({ ...prev, [name]: [] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitCount(prev => prev + 1);

    try {
      // Sanitize form data
      const sanitizedData = sanitizeObject(formData);
      
      // Validate form data
      const validation = validateForm(sanitizedData, validationRules);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        
        // Show error toast
        const errorCount = Object.values(validation.errors).flat().length;
        toast.error(`Lütfen ${errorCount} hatayı düzeltin`);
        
        // Scroll to first error
        const firstErrorField = document.querySelector('[data-error="true"]');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return;
      }

      // Add CSRF token to data
      const dataWithToken = {
        ...sanitizedData,
        _csrf: csrfToken
      };

      // Submit form
      await onSubmit(dataWithToken);
      
      // Reset form on successful submission
      setFormData({});
      setErrors({});
      setSubmitCount(0);
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Form gönderilirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clone children and inject props
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      const name = child.props.name;
      const error = errors[name]?.[0];
      
      return React.cloneElement(child, {
        value: formData[name] || '',
        onChange: (value: string) => handleInputChange(name, value),
        error: error,
        'data-error': !!error
      });
    }
    return child;
  });

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {/* Hidden CSRF token field */}
      <input type="hidden" name="_csrf" value={csrfToken} />
      
      {/* Form fields */}
      {childrenWithProps}
      
      {/* Submit button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Gönderiliyor...
            </>
          ) : (
            'Gönder'
          )}
        </button>
      </div>
    </form>
  );
};

// Pre-built validation rules for common fields
export const commonValidationRules = {
  email: [
    {
      validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Geçerli bir e-posta adresi giriniz'
    }
  ],
  password: [
    {
      validator: (value: string) => value.length >= 8,
      message: 'Şifre en az 8 karakter olmalıdır'
    },
    {
      validator: (value: string) => /[A-Z]/.test(value),
      message: 'Şifre en az bir büyük harf içermelidir'
    },
    {
      validator: (value: string) => /[a-z]/.test(value),
      message: 'Şifre en az bir küçük harf içermelidir'
    },
    {
      validator: (value: string) => /\d/.test(value),
      message: 'Şifre en az bir rakam içermelidir'
    },
    {
      validator: (value: string) => /[^a-zA-Z0-9]/.test(value),
      message: 'Şifre en az bir özel karakter içermelidir'
    }
  ],
  phone: [
    {
      validator: (value: string) => /^\+?[1-9]\d{1,14}$/.test(value.replace(/[\s\-\(\)]/g, '')),
      message: 'Geçerli bir telefon numarası giriniz'
    }
  ],
  name: [
    {
      validator: (value: string) => value.length >= 2,
      message: 'Ad en az 2 karakter olmalıdır'
    },
    {
      validator: (value: string) => value.length <= 50,
      message: 'Ad en fazla 50 karakter olabilir'
    },
    {
      validator: (value: string) => /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(value),
      message: 'Ad sadece harflerden oluşabilir'
    }
  ],
  required: [
    {
      validator: (value: any) => value !== undefined && value !== null && value !== '',
      message: 'Bu alan zorunludur'
    }
  ]
};
