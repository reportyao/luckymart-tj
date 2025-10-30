// useApi.ts - 统一的API调用Hook
import { useState, useEffect, useRef, useCallback } from 'react';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiOptions {
  immediate?: boolean;
  onError?: (error: string) => void;
}

export function useApi<T>(
  apiFunction: () => Promise<T>,
  deps: any[] = [],
  options: UseApiOptions = {}
): ApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  
  const controllerRef = useRef<AbortController | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const { immediate = true, onError } = options;

  // 清理函数
  const cleanup = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // 取消之前的请求
  const cancelPreviousRequest = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const fetchData = useCallback(async () => {
    // 取消之前的请求
    cancelPreviousRequest();
    
    if (!isMountedRef.current) return;
    
    // 创建新的AbortController
    const controller = new AbortController();
    controllerRef.current = controller;
    abortControllerRef.current = controller;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiFunction();
      
      // 检查组件是否已卸载
      if (!isMountedRef.current) return;
      
      setState({ data: result, loading: false, error: null });
    } catch (error: any) {
      // 检查是否是用户取消的请求
      if (error.name === 'AbortError') {
        return;
      }
      
      // 检查组件是否已卸载
      if (!isMountedRef.current) return;
      
      const errorMessage = error.message || '请求失败';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      
      // 调用错误回调
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [apiFunction, cancelPreviousRequest, onError]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (immediate) {
      fetchData();
    }
    
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, deps);

  return { ...state, refetch: fetchData };
}