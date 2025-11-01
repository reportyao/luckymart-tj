import { createContext, useContext, useEffect, useState } from 'react';
'use client';


interface User {}
  id: string;
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  luckyCoins: number;


interface AuthContextType {}
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {}
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 恢复认证状态
  useEffect(() => {}
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {}
      try {}
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('恢复认证状态失败:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');

    
    
    setIsLoading(false);
  }, []);

  // 登录
  const login = (newToken: string, newUser: User) => {}
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  // 登出
  const logout = () => {}
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const value = {}
    user,
    token,
    login,
    logout,
    isLoading
  };

  return (;
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );


export function useAuth() {}
  const context = useContext(AuthContext);
  if (context === undefined) {}
    throw new Error('useAuth must be used within an AuthProvider');

  return context;
