// CustomDialog.tsx - 自定义确认对话框组件
'use client';

import React, { useState, useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  type?: 'info' | 'warning' | 'danger';
  loading?: boolean;
}

interface DialogState extends ConfirmDialogProps {
  isOpen: boolean;
}

const CustomDialog: React.FC<DialogState> = ({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  type = 'info',
  loading = false
}) => {
  const [show, setShow] = useState(isOpen);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    setShow(isOpen);
  }, [isOpen]);

  const handleConfirm = async () => {
    if (isConfirming || loading) {return;}
    
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('确认操作失败:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    if (isConfirming) {return;}
    onCancel?.();
    setShow(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700',
          border: 'border-red-200'
        };
      case 'warning':
        return {
          icon: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          border: 'border-yellow-200'
        };
      case 'info':
      default:
        return {
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700',
          border: 'border-blue-200'
        };
    }
  };

  if (!show) {return null;}

  const styles = getTypeStyles();

  return (
    <div 
      className="fixed inset-0 z-50 luckymart-layout-flex luckymart-layout-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="luckymart-bg-white luckymart-rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b luckymart-border-light">
          <div className="luckymart-layout-flex luckymart-layout-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${styles.border} bg-gray-50`}>
              {type === 'danger' && (
                <svg className={`w-5 h-5 ${styles.icon}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {type === 'warning' && (
                <svg className={`w-5 h-5 ${styles.icon}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {type === 'info' && (
                <svg className={`w-5 h-5 ${styles.icon}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <h3 className="luckymart-text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-gray-600 whitespace-pre-line">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 luckymart-layout-flex justify-end luckymart-spacing-md">
          <button
            onClick={handleCancel}
            disabled={isConfirming}
            className="px-4 py-2 luckymart-text-sm luckymart-font-medium text-gray-700 luckymart-bg-white luckymart-border border-gray-300 luckymart-rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 ${styles.button}`}
          >
            {(isConfirming || loading) ? (
              <div className="luckymart-layout-flex luckymart-layout-center">
                <svg className="luckymart-animation-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                处理中...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for using the dialog
export function useConfirmDialog() {
  const [dialog, setDialog] = useState<ConfirmDialogProps | null>(null);

  const showConfirm = (options: Omit<ConfirmDialogProps, 'isOpen' | 'onConfirm' | 'onCancel'>) => {
    return new Promise<boolean>((resolve) => {
      const handleConfirm = async () => {
        resolve(true);
        setDialog(null);
      };

      const handleCancel = () => {
        resolve(false);
        setDialog(null);
      };

      setDialog({
        ...options,
        isOpen: true,
        onConfirm: handleConfirm,
        onCancel: handleCancel
      });
    });
  };

  const ConfirmDialogComponent = dialog ? (
    <CustomDialog {...dialog} />
  ) : null;

  return {
    showConfirm,
    ConfirmDialog: ConfirmDialogComponent
  };
}

export default CustomDialog;