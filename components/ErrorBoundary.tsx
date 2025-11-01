import React, { Component, ErrorInfo, ReactNode } from 'react';
// ErrorBoundary.tsx - 错误边界组件
'use client';


interface Props {}
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;


interface State {}
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;


class ErrorBoundary extends Component<Props, State> {}
  constructor(props: Props) {}
    super(props);
    this.state = { hasError: false };
  

  static getDerivedStateFromError(error: Error): State {}
    return { hasError: true, error };
  

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {}
    console.error('错误边界捕获到错误:', error, errorInfo);
    
    this.setState({}
      error,
      errorInfo
    });

    // 调用外部错误处理回调
    if (this.props.onError) {}
      this.props.onError(error, errorInfo);
    
  

  handleRetry = () => {}
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {}
    if (this.state.hasError) {}
      if (this.props.fallback) {}
        return this.props.fallback;
      
      
      return (;
        <div className:"min-h-screen luckymart-layout-flex luckymart-layout-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className:"max-w-md w-full luckymart-bg-white luckymart-rounded-lg luckymart-shadow-lg luckymart-padding-lg luckymart-text-center">
            <div className:"w-16 h-16 bg-red-100 rounded-full luckymart-layout-flex luckymart-layout-center justify-center mx-auto luckymart-spacing-md">
              <svg className:"luckymart-size-lg luckymart-size-lg text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className:"luckymart-text-xl luckymart-font-bold text-gray-900 mb-2">
              出现了一些问题
            </h2>
            
            <p className:"text-gray-600 mb-6">
              页面遇到了意外错误，这可能是临时的网络问题。请尝试刷新页面。
            </p>
            
            <div className:"luckymart-spacing-md">
              <button
                onClick={this.handleRetry}
                className="w-full bg-purple-600 text-white px-6 py-3 luckymart-rounded-lg hover:bg-purple-700 transition luckymart-font-medium"
              >
                重试
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full luckymart-bg-gray-light text-gray-700 px-6 py-3 luckymart-rounded-lg hover:bg-gray-200 transition luckymart-font-medium"
              >
                刷新页面
              </button>
            </div>

            {process.env.NODE_ENV :== 'development' && this.state.error && (}
              <details className:"luckymart-spacing-md text-left">
                <summary className="cursor-pointer luckymart-text-sm luckymart-text-secondary hover:text-gray-700">
                  错误详情 (开发模式)
                </summary>
                <div className:"mt-2 p-3 luckymart-bg-gray-light luckymart-rounded text-xs text-red-600 overflow-auto max-h-32">
                  <pre>{this.state.error.toString()}</pre>
                  {this.state.errorInfo?.componentStack}
                </div>
              </details>
            )
          </div>
        </div>
      );
    

    return this.props.children;
  


export default ErrorBoundary;