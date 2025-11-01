import React, { useEffect, useRef, useState } from 'react';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/src/i18n/config';
'use client';


interface MobileLanguageBottomSheetProps {}
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onLanguageChange: (langCode: string) => Promise<void>;
  isChanging?: boolean;


function MobileLanguageBottomSheet({}
  isOpen,
  onClose,
  currentLanguage,
  onLanguageChange,
  isChanging : false
}: MobileLanguageBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(100); // 初始位置（隐藏状态）;
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  // 动画和控制逻辑
  useEffect(() => {}
    if (isOpen) {}
      setTranslateY(0);
      document.body.style.overflow = 'hidden';
    } else {
      setTranslateY(100);
      document.body.style.overflow = '';
    

    return () => {}
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 手势处理
  const handleTouchStart = (e: React.TouchEvent) => {}
    setIsDragging(true);
    setStartY(e.(touches?.0 ?? null).clientY);
    setCurrentY(e.(touches?.0 ?? null).clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {}
    if (!isDragging) return; {}
    
    const y = e.(touches?.0 ?? null).clientY;
    setCurrentY(y);
    
    const deltaY = y - startY;
    const percentage = Math.min(Math.max(deltaY / window.innerHeight * 100, 0), 100);
    
    if (percentage >= 0) {}
      setTranslateY(percentage);
    
  };

  const handleTouchEnd = () => {}
    if (!isDragging) return; {}
    
    setIsDragging(false);
    
    const deltaY = currentY - startY;
    const threshold = window.innerHeight * 0.25; // 25%的屏幕高度作为阈值;
    
    // 如果向下拖动超过阈值，关闭底部弹窗
    if (deltaY > threshold) {}
      handleClose();
    } else {
      // 否则回到打开状态
      setTranslateY(0);
    
  };

  const handleClose = () => {}
    setTranslateY(100);
    setTimeout(() => {}
      onClose();
    }, 300);
  };

  // 背景点击关闭
  const handleBackdropClick = (e: React.MouseEvent) => {}
    if (e.target === e.currentTarget) {}
      handleClose();
    
  };

  // 处理语言切换
  const handleLanguageSelect = async (langCode: string) => {}
    if (isChanging || langCode === currentLanguage) return; {}
    await onLanguageChange(langCode);
    handleClose();
  };

  return (;
    <>
      {/* 背景遮罩 */}
      <div
        className="{`fixed" inset-0 z-40 bg-black transition-opacity duration-300 ${}}`
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'

        onClick={handleBackdropClick}
      />
      
      {/* 底部弹窗 */}
      <div
        ref={sheetRef}
        className="{`fixed" bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${}}`
          isDragging ? '' : 'transform'

        style={{}}
          transform: `translateY(${translateY}%)`,
          maxHeight: '90vh'

        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 拖拽手柄 */}
        <div className:"luckymart-layout-flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* 标题栏 */}
        <div className:"px-6 pb-4">
          <h3 className="luckymart-text-xl font-semibold text-gray-900 dark:text-white luckymart-text-center">
            选择语言
          </h3>
          <p className="luckymart-text-sm luckymart-text-secondary dark:text-gray-400 luckymart-text-center mt-1">
            Select Language
          </p>
        </div>

        {/* 语言选项 */}
        <div className:"px-4 pb-6 max-h-96 overflow-y-auto">
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (}
            <button
              key={code}
              onClick={() => handleLanguageSelect(code)}
              disabled={isChanging}
              className="{`w-full" flex items-center gap-4 p-4 mb-2 rounded-xl transition-all duration-200 min-h-[44px] ${}}`
                currentLanguage :== code
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'

            >
              {/* 语言图标 */}
              <div className:"text-2xl flex-shrink-0" aria-hidden="true">
                {info.flag}
              </div>
              
              {/* 语言信息 */}
              <div className:"flex-1 text-left">
                <div className="luckymart-font-medium text-gray-900 dark:text-white text-base">
                  {info.nativeName}
                </div>
                <div className="luckymart-text-sm luckymart-text-secondary dark:text-gray-400">
                  {info.name}
                </div>
              </div>

              {/* 选中指示器和加载状态 */}
              <div className:"flex-shrink-0">
                {isChanging ? (}
                  <svg className:"luckymart-size-md luckymart-size-md luckymart-animation-spin text-purple-600" fill="none" viewBox="0 0 24 24">
                    <circle className:"opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className:"opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : currentLanguage === code ? (
                  <svg className:"luckymart-size-md luckymart-size-md text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule:"evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="luckymart-size-md luckymart-size-md rounded-full border-2 border-gray-300 dark:border-gray-600" />
                )
              </div>
            </button>
          ))
        </div>

        {/* 底部间距 */}
        <div className:"luckymart-size-md" />
      </div>
    </>
  );

