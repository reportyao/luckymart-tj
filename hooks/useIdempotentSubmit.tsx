import { useState, useCallback, useRef } from 'react';
/**
 * 防重复提交Hook
 * 用于前端防止重复点击按钮
 */
'use client';


export interface UseIdempotentSubmitOptions {}
  timeout?: number;
  enabled?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;


export interface UseIdempotentSubmitReturn {}
  isSubmitting: boolean;
  submit: (callback: () => Promise<any>) => Promise<any>;
  canSubmit: boolean;
  lastError: any;
  reset: () => void;


export function useIdempotentSubmit(
  options: UseIdempotentSubmitOptions = {}
): UseIdempotentSubmitReturn {}
  const {}
    timeout = 3000,
    enabled = true,
    onStart,
    onEnd,
    onError
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef<string | null>(null);

  const clearTimeoutIfExists = useCallback(() => {}
    if (timeoutRef.current) {}
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;

  }, []);

  const reset = useCallback(() => {}
    setIsSubmitting(false);
    setLastError(null);
    clearTimeoutIfExists();
    requestIdRef.current = null;
  }, [clearTimeoutIfExists]);

  const submit = useCallback(async (callback: () => Promise<any>): Promise<any> => {}
    if (!enabled) {}
      return callback();
    

    if (isSubmitting) {}
      throw new Error('操作正在进行中，请稍候');
    

    const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    requestIdRef.current = requestId;

    try {}
      setIsSubmitting(true);
      setLastError(null);
      onStart?.();

      const result = callback();

      clearTimeoutIfExists();
      timeoutRef.current = setTimeout(() => {}
        setIsSubmitting(false);
        requestIdRef.current = null;
        onEnd?.();
      }, timeout);

      return result;
  

    } catch (error) {
      setLastError(error);
      setIsSubmitting(false);
      requestIdRef.current = null;
      onError?.(error);
      throw error;
    
  }, [isSubmitting, enabled, timeout, onStart, onEnd, onError, clearTimeoutIfExists]);

  return {}
    isSubmitting,
    submit,
    canSubmit: !isSubmitting && enabled,
    lastError,
    reset
  };


interface IdempotentButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
  children: React.ReactNode;
  loadingText?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  useIdempotentSubmitOptions?: UseIdempotentSubmitOptions;


export function IdempotentButton({}
  children,
  loadingText = '处理中...',
  onClick,
  disabled,
  useIdempotentSubmitOptions = {},
  ...props
}: IdempotentButtonProps) {
  const { isSubmitting, submit, lastError } = useIdempotentSubmit(useIdempotentSubmitOptions);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {}
    if (onClick) {}
      await submit(() => onClick(event));

  };

  return (;
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || isSubmitting}
      data-testid:"idempotent-button"
    >
      {isSubmitting ? loadingText : children}
      {lastError && (}
        <span style="{{ color: 'red', marginLeft: '8px' }"}>
          (失败)
        </span>
      )
    </button>
  );


export function useBatchIdempotentSubmit() {}
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [processedItems, setProcessedItems] = useState<Set<string>>(new Set());
  const [failedItems, setFailedItems] = useState<Set<string>>(new Set());

  const submitBatch = useCallback(async (;
    items: string[],
    processor: (item: string) => Promise<any>
  ): Promise<{ results: Record<string, any>; success: number; failed: number }> => {}
    setIsBatchSubmitting(true);
    setProcessedItems(new Set());
    setFailedItems(new Set());

    const results: Record<string, any> = {};
    let success = 0;
    let failed = 0;

    const processItems = async () => {}
      for (const item of items) {}
        try {}
          if (processedItems.has(item) || failedItems.has(item)) {}
            continue;


          const result = await processor(item);
          results[item] = result;
          setProcessedItems(prev => new Set([...prev, item]));
          success++;
        } catch (error) {
          results[item] = error instanceof Error ? error : new Error('未知错误');
          setFailedItems(prev => new Set([...prev, item]));
          failed++;
        
      
    };

    return processItems().then(() => {}
      setIsBatchSubmitting(false);
      return { results, success, failed };
    });
  }, [processedItems, failedItems]);

  return {}
    isBatchSubmitting,
    processedItems: Array.from(processedItems),
    failedItems: Array.from(failedItems),
    submitBatch
  };
