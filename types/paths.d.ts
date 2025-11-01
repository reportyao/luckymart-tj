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

// bcryptjs type declarations
declare module 'bcryptjs' {
  export interface Bcrypt盐值轮数 {
    readonly length: number;
  }
  
  export interface Bcrypt结果 {
    toString(): string;
    readonly [Symbol.toStringTag]: string;
  }
  
  export interface Bcrypt工具 {
    hashSync(s: string, saltOrRounds: number | string): string;
    hash(s: string, saltOrRounds: number | string, callback?: (err: Error | null, result: string | undefined) => void): void;
    compareSync(s: string, hash: string): boolean;
    compare(s: string, hash: string, callback?: (err: Error | null, result: boolean | undefined) => void): void;
    genSaltSync(rounds?: number): string;
    genSalt(rounds?: number, callback?: (err: Error | null, result: string | undefined) => void): void;
    genSalt(rounds?: number, progress?: (percent: number) => void, callback?: (err: Error | null, result: string | undefined) => void): void;
    getRounds(hash: string): number;
    hashSync(s: string, salt: string): string;
  }
  
  const bcrypt: Bcrypt工具;
  export = bcrypt;
}

// jsonwebtoken type declarations
declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: any;
    exp?: number;
    iat?: number;
    iss?: string;
    aud?: string | string[];
    sub?: string;
    jti?: string;
  }
  
  export interface SignOptions {
    algorithm?: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512' | 'none';
    expiresIn?: string | number;
    notBefore?: string | number;
    audience?: string | string[];
    issuer?: string;
    jwtid?: string;
    subject?: string;
    header?: object;
    keyid?: string;
  }
  
  export interface VerifyOptions {
    algorithms?: string[];
    audience?: string | string[];
    issuer?: string;
    subject?: string;
    jwtid?: string;
    ignoreExpiration?: boolean;
    ignoreNotBefore?: boolean;
    clockTolerance?: string | number;
    maxAge?: string | number;
    clockTimestamp?: number;
    nonce?: string;
  }
  
  export interface DecodeOptions {
    complete?: boolean;
  }
  
  export interface Jwt工具 {
    sign(payload: string | object | Buffer, secretOrPrivateKey: Secret, options?: SignOptions): string;
    sign(payload: string | object | Buffer, secretOrPrivateKey: Secret, callback: (err: Error, token: string | undefined) => void): void;
    sign(payload: string | object | Buffer, secretOrPrivateKey: Secret, options: SignOptions, callback: (err: Error, token: string | undefined) => void): void;
    
    verify(token: string, secretOrPublicKey: Secret, options?: VerifyOptions): string | object;
    verify(token: string, secretOrPublicKey: Secret, callback: (err: Error, decoded: string | object | undefined) => void): void;
    verify(token: string, secretOrPublicKey: Secret, options: VerifyOptions, callback: (err: Error, decoded: string | object | undefined) => void): void;
    
    decode(token: string, options?: DecodeOptions): string | object | JwtPayload | null;
    
    JsonWebTokenError: typeof Error;
    TokenExpiredError: typeof Error;
    NotBeforeError: typeof Error;
  }
  
  type Secret = string | Buffer | { key: string; passphrase: string };
  
  const jwt: Jwt工具;
  export = jwt;
}