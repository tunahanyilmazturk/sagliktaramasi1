import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  variant = 'danger'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-50 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400',
          confirmBtn: 'danger' as const
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 dark:bg-amber-900/20',
          iconColor: 'text-amber-600 dark:text-amber-400',
          confirmBtn: 'primary' as const
        };
      default:
        return {
          iconBg: 'bg-blue-50 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400',
          confirmBtn: 'primary' as const
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button 
            variant={styles.confirmBtn} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4 py-2">
        <div className={`p-3 rounded-2xl ${styles.iconBg} ${styles.iconColor} shrink-0`}>
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};
