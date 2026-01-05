import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

export const Captcha: React.FC<CaptchaProps> = ({ onVerify }) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput('');
    setIsVerified(false);
    onVerify(false);
  }, [onVerify]);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);
    
    if (value === captchaText) {
      setIsVerified(true);
      onVerify(true);
    } else {
      setIsVerified(false);
      onVerify(false);
    }
  };

  return (
    <div className="space-y-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/30 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Güvenlik Doğrulaması
        </label>
        <button
          type="button"
          onClick={generateCaptcha}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
          title="Yeni Kod Oluştur"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        <div 
          className="flex-1 py-3 px-2 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center select-none"
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            letterSpacing: '0.4rem',
            fontStyle: 'italic',
            fontWeight: 'bold',
            fontSize: '1.4rem',
            backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
            backgroundSize: '8px 8px',
            color: 'rgb(79 70 229)',
            textShadow: '2px 2px 4px rgba(79, 70, 229, 0.1)'
          }}
        >
          {captchaText}
        </div>
        
        <div className="relative flex-[1.2]">
          <input
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Kodu buraya yazın"
            autoComplete="off"
            disabled={isVerified}
            className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
              isVerified 
                ? 'border-green-500 bg-green-50/30 dark:bg-green-900/10' 
                : 'border-slate-100 dark:border-slate-700 focus:border-indigo-500'
            }`}
          />
          {isVerified && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in duration-300" size={20} />
          )}
        </div>
      </div>
      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
        <span className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse"></span>
        Bot olmadığınızı doğrulamak için yukarıdaki 6 karakterli kodu kutucuğa yazın.
      </p>
    </div>
  );
};
