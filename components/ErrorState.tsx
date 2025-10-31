// ErrorState.tsx - 统一的错误展示组件
'use client';

import React from 'react';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  error, 
  onRetry, 
  onDismiss, 
  className = '' 
}) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="luckymart-layout-flex items-start">
        <div className="flex-shrink-0">
          <svg className="luckymart-size-sm luckymart-size-sm text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="luckymart-text-sm luckymart-font-medium text-red-800">
            操作失败
          </h3>
          <p className="mt-1 luckymart-text-sm text-red-700">
            {error}
          </p>
          
          <div className="luckymart-spacing-md luckymart-layout-flex luckymart-spacing-md">
            {onRetry && (
              <button
                onClick={onRetry}
                className="luckymart-text-sm bg-red-100 text-red-800 px-3 py-1 luckymart-rounded hover:bg-red-200 transition"
              >
                重试
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="luckymart-text-sm text-red-600 hover:text-red-800 transition"
              >
                关闭
              </button>
            )}
          </div>
        </div>
        
        {onDismiss && (
          <div className="ml-auto flex-shrink-0">
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600 transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorState;