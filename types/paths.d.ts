/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.

// Path mapping declarations
declare module '@/*' {
  import { ReactNode } from 'react';
  
  // React components
  export type Component = ReactNode;
  
  // API types
  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
  }
  
  export interface ApiError {
    code: string;
    message: string;
    details?: any;
  }
}