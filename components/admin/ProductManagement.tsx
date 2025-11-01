'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { Product, MarketingBadge } from '@/types';

// 产品统计接口
interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  pendingProducts: number;
  soldoutProducts: number;
  lowStockProducts: number;
  totalValue: number;
  avgPrice: number;
}

// 产品筛选接口
interface ProductFilters {
  status: string;
  category: string;
  searchQuery: string;
  priceRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// 产品管理组件接口
interface ProductManagementProps {
  className?: string;
  showAdvancedFeatures?: boolean;
  defaultPageSize?: number;
  onProductChange?: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({
  className = '',
  showAdvancedFeatures = true,
  defaultPageSize = 10,
  onProductChange
}) => {
  const router = useRouter();
  
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [totalPages, setTotalPages] = useState(1);
  
  // 数据状态
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productStats, setProductStats] = useState<ProductStats>({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    pendingProducts: 0,
    soldoutProducts: 0,
    lowStockProducts: 0,
    totalValue: 0,
    avgPrice: 0
  });
  
  // 筛选状态
  const [filters, setFilters] = useState<ProductFilters>({
    status: '',
    category: '',
    searchQuery: '',
    priceRange: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // 模态框状态
  const [formData, setFormData] = useState<Partial<Product>>({
    nameZh: '',
    nameEn: '',
    nameRu: '',
    descriptionZh: '',
    descriptionEn: '',
    descriptionRu: '',
    images: [],
    marketPrice: 0,
    totalShares: 0,
    pricePerShare: 0,
    category: '',
    stock: 0,
    status: 'pending',
    marketingBadge: {
      textZh: '',
      textEn: '',
      textRu: '',
      color: '#FFFFFF',
      bgColor: '#FF0000',
      position: 'top-left',
      animation: 'none',
      enabled: false
    }
  });

  // 状态选项
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'active', label: '上架中' },
    { value: 'pending', label: '待审核' },
    { value: 'inactive', label: '已下架' },
    { value: 'soldout', label: '已售罄' }
  ];
  
  const categoryOptions = [
    { value: '', label: '全部分类' },
    { value: 'electronics', label: '电子产品' },
    { value: 'fashion', label: '时尚服饰' },
    { value: 'home', label: '家居用品' },
    { value: 'beauty', label: '美妆护肤' },
    { value: 'sports', label: '运动健身' },
    { value: 'books', label: '图书文具' },
    { value: 'food', label: '食品饮料' }
  ];

  // 格式化货币
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'TJS'
    }).format(amount);
  };

  // 格式化日期
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString('zh-CN');
  };

  // 获取状态样式
  const getStatusStyle = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'soldout':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string): string => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  // 模拟API调用
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟产品数据
      const mockProducts: Product[] = [
        {
          id: '1',
          nameZh: 'iPhone 15 Pro Max',
          nameEn: 'iPhone 15 Pro Max',
          nameRu: 'iPhone 15 Pro Max',
          descriptionZh: '最新款苹果手机，钛金属设计',
          descriptionEn: 'Latest Apple phone with titanium design',
          descriptionRu: 'Последний iPhone с титановым дизайном',
          images: ['/placeholder-phone.jpg'],
          marketPrice: 8999,
          totalShares: 1000,
          pricePerShare: 9.0,
          category: 'electronics',
          stock: 850,
          status: 'active',
          marketingBadge: {
            textZh: '热销',
            textEn: 'Hot Sale',
            textRu: 'Горячая продажа',
            color: '#FFFFFF',
            bgColor: '#FF0000',
            position: 'top-right',
            animation: 'pulse',
            enabled: true
          },
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: '2',
          nameZh: 'MacBook Air M3',
          nameEn: 'MacBook Air M3',
          nameRu: 'MacBook Air M3',
          descriptionZh: '搭载M3芯片的超薄笔记本',
          descriptionEn: 'Ultra-thin laptop with M3 chip',
          descriptionRu: 'Ультратонкий ноутбук с чипом M3',
          images: ['/placeholder-laptop.jpg'],
          marketPrice: 12999,
          totalShares: 500,
          pricePerShare: 26.0,
          category: 'electronics',
          stock: 0,
          status: 'soldout',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10')
        },
        {
          id: '3',
          nameZh: 'Nike运动鞋',
          nameEn: 'Nike Sports Shoes',
          nameRu: 'Кроссовки Nike',
          descriptionZh: '舒适透气的运动鞋',
          descriptionEn: 'Comfortable and breathable sports shoes',
          descriptionRu: 'Удобная дышащая спортивная обувь',
          images: ['/placeholder-shoes.jpg'],
          marketPrice: 899,
          totalShares: 800,
          pricePerShare: 1.12,
          category: 'sports',
          stock: 200,
          status: 'pending',
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-12')
        }
      ];
      
      // 计算统计数据
      const stats: ProductStats = {
        totalProducts: mockProducts.length,
        activeProducts: mockProducts.filter(p => p.status === 'active').length,
        inactiveProducts: mockProducts.filter(p => p.status === 'inactive').length,
        pendingProducts: mockProducts.filter(p => p.status === 'pending').length,
        soldoutProducts: mockProducts.filter(p => p.status === 'soldout').length,
        lowStockProducts: mockProducts.filter(p => p.stock < 100).length,
        totalValue: mockProducts.reduce((sum, p) => sum + (p.marketPrice * p.totalShares), 0),
        avgPrice: mockProducts.reduce((sum, p) => sum + p.marketPrice, 0) / mockProducts.length
      };
      
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
      setProductStats(stats);
      setTotalPages(Math.ceil(mockProducts.length / pageSize));
      
    } catch (err) {
      setError('加载产品数据失败');
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pageSize]);

  // 应用筛选
  const applyFilters = useCallback(() => {
    let filtered = [...products];
    
    // 状态筛选
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    
    // 分类筛选
    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }
    
    // 搜索筛选
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.nameZh.toLowerCase().includes(query) ||
        p.nameEn.toLowerCase().includes(query) ||
        p.nameRu.toLowerCase().includes(query) ||
        p.descriptionZh?.toLowerCase().includes(query) ||
        p.descriptionEn?.toLowerCase().includes(query) ||
        p.descriptionRu?.toLowerCase().includes(query)
      );
    }
    
    // 价格范围筛选
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      if (!isNaN(min)) {
        filtered = filtered.filter(p => p.marketPrice >= min);
      }
      if (!isNaN(max)) {
        filtered = filtered.filter(p => p.marketPrice <= max);
      }
    }
    
    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.nameZh;
          bValue = b.nameZh;
          break;
        case 'price':
          aValue = a.marketPrice;
          bValue = b.marketPrice;
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (filters.sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
    
    setFilteredProducts(filtered);
    setTotalPages(Math.ceil(filtered.length / pageSize));
  }, [products, filters, pageSize]);

  // 处理筛选变化
  const handleFilterChange = (key: keyof ProductFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // 处理表单变化
  const handleFormChange = (key: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // 处理营销角标变化
  const handleMarketingBadgeChange = (key: keyof MarketingBadge, value: any) => {
    setFormData(prev => ({
      ...prev,
      marketingBadge: {
        ...prev.marketingBadge!,
        [key]: value
      }
    }));
  };

  // 切换产品状态
  const handleStatusToggle = async (productId: string, newStatus: string) => {
    if (!confirm(`确定要${getStatusText(newStatus)}这个产品吗？`)) {
      return;
    }
    
    try {
      // 这里应该调用API
      const response = await fetch(`/api/admin/products/${productId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        await fetchProducts();
        onProductChange?.();
      }
    } catch (err) {
      setError('更新产品状态失败');
      console.error('Failed to update product status:', err);
    }
  };

  // 删除产品
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('确定要删除这个产品吗？此操作无法撤销。')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchProducts();
        onProductChange?.();
      }
    } catch (err) {
      setError('删除产品失败');
      console.error('Failed to delete product:', err);
    }
  };

  // 批量操作
  const handleBatchAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      alert('请先选择产品');
      return;
    }
    
    if (!confirm(`确定要对选中的 ${selectedProducts.length} 个产品执行${action}操作吗？`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/admin/products/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedProducts, action })
      });
      
      if (response.ok) {
        setSelectedProducts([]);
        await fetchProducts();
        onProductChange?.();
      }
    } catch (err) {
      setError('批量操作失败');
      console.error('Failed to perform batch action:', err);
    }
  };

  // 处理选择变化
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pageProducts = filteredProducts.slice(startIndex, endIndex);
      setSelectedProducts(pageProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
  }, [fetchProducts]);

  // 初始化加载
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 应用筛选
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // 计算分页数据
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 全选状态
  const isAllSelected = paginatedProducts.length > 0 && 
    paginatedProducts.every(p => selectedProducts.includes(p.id));

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载产品数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? '刷新中...' : '重新加载'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">产品管理</h1>
                <p className="text-sm text-gray-600">
                  管理和维护平台产品信息、库存和价格
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <svg 
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? '刷新中...' : '刷新'}
              </Button>
              
              <Button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加产品
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">总产品数</h3>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{productStats.totalProducts}</p>
            <div className="flex items-center text-sm">
              <span className="text-red-600 font-medium">{productStats.lowStockProducts}</span>
              <span className="text-gray-500 ml-1">低库存</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">上架中</h3>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{productStats.activeProducts}</p>
            <div className="flex items-center text-sm">
              <span className="text-gray-500">销售中</span>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">待审核</h3>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{productStats.pendingProducts}</p>
            <div className="flex items-center text-sm">
              <span className="text-gray-500">需处理</span>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">总库存价值</h3>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(productStats.totalValue)}</p>
            <div className="flex items-center text-sm">
              <span className="text-gray-500">平均: {formatCurrency(productStats.avgPrice)}</span>
            </div>
          </Card>
        </div>

        {/* 筛选和搜索 */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">产品筛选</h2>
            <span className="text-sm text-gray-500">找到 {filteredProducts.length} 个产品</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium">搜索产品</Label>
              <Input
                id="search"
                placeholder="搜索名称或描述..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="status" className="text-sm font-medium">状态</Label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="category" className="text-sm font-medium">分类</Label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="priceRange" className="text-sm font-medium">价格范围</Label>
              <select
                id="priceRange"
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">全部价格</option>
                <option value="0-100">0 - 100 TJS</option>
                <option value="100-500">100 - 500 TJS</option>
                <option value="500-1000">500 - 1000 TJS</option>
                <option value="1000-5000">1000 - 5000 TJS</option>
                <option value="5000-">5000+ TJS</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="sortBy" className="text-sm font-medium">排序方式</Label>
              <select
                id="sortBy"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="createdAt">创建时间</option>
                <option value="name">名称</option>
                <option value="price">价格</option>
                <option value="stock">库存</option>
                <option value="status">状态</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="sortOrder" className="text-sm font-medium">排序顺序</Label>
              <select
                id="sortOrder"
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>
          
          {/* 批量操作 */}
          {selectedProducts.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  已选择 {selectedProducts.length} 个产品
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBatchAction('activate')}
                  >
                    批量上架
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBatchAction('deactivate')}
                  >
                    批量下架
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBatchAction('delete')}
                    className="text-red-600 hover:text-red-700"
                  >
                    批量删除
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 产品列表 */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">产品列表</h2>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-gray-500">暂无产品数据</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">价格</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">库存</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-12 w-12 flex-shrink-0 relative">
                              {product.images && product.images[0] ? (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.nameZh}
                                  className="h-12 w-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                  无图
                                </div>
                              )}
                              {product.marketingBadge?.enabled && (
                                <Badge className="absolute -top-1 -right-1 text-xs px-1 py-0">
                                  {product.marketingBadge.textZh}
                                </Badge>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.nameZh}</div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">{product.descriptionZh}</div>
                              <div className="text-xs text-gray-400">{product.nameEn}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {categoryOptions.find(c => c.value === product.category)?.label || product.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(product.marketPrice)}</div>
                          <div className="text-xs text-gray-500">{product.totalShares} 份 × {formatCurrency(product.pricePerShare)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${product.stock < 100 ? 'text-red-600' : 'text-gray-900'}`}>
                            {product.stock}
                          </div>
                          {product.stock < 100 && (
                            <div className="text-xs text-red-500">库存不足</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(product.status)}`}>
                            {getStatusText(product.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(product.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setShowEditModal(true);
                              }}
                            >
                              编辑
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusToggle(product.id, product.status === 'active' ? 'inactive' : 'active')}
                              className={product.status === 'active' ? 'text-red-600' : 'text-green-600'}
                            >
                              {product.status === 'active' ? '下架' : '上架'}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              删除
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/product/${product.id}`, '_blank')}
                            >
                              查看
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 分页 */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      显示 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, filteredProducts.length)} 条，
                      共 {filteredProducts.length} 条记录
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        上一页
                      </Button>
                      <span className="text-sm text-gray-700">
                        第 {currentPage} 页，共 {totalPages} 页
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* 添加产品模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">添加新产品</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    nameZh: '',
                    nameEn: '',
                    nameRu: '',
                    descriptionZh: '',
                    descriptionEn: '',
                    descriptionRu: '',
                    images: [],
                    marketPrice: 0,
                    totalShares: 0,
                    pricePerShare: 0,
                    category: '',
                    stock: 0,
                    status: 'pending',
                    marketingBadge: {
                      textZh: '',
                      textEn: '',
                      textRu: '',
                      color: '#FFFFFF',
                      bgColor: '#FF0000',
                      position: 'top-left',
                      animation: 'none',
                      enabled: false
                    }
                  });
                }}
              >
                ×
              </Button>
            </div>
            
            <ProductForm
              formData={formData}
              onFormChange={handleFormChange}
              onMarketingBadgeChange={handleMarketingBadgeChange}
              onSubmit={() => {
                // 处理提交逻辑
                setShowAddModal(false);
                fetchProducts();
                onProductChange?.();
              }}
            />
          </div>
        </div>
      )}

      {/* 编辑产品模态框 */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">编辑产品</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
              >
                ×
              </Button>
            </div>
            
            <ProductForm
              formData={formData}
              onFormChange={handleFormChange}
              onMarketingBadgeChange={handleMarketingBadgeChange}
              onSubmit={() => {
                // 处理提交逻辑
                setShowEditModal(false);
                setEditingProduct(null);
                fetchProducts();
                onProductChange?.();
              }}
              isEdit={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// 产品表单组件
interface ProductFormProps {
  formData: Partial<Product>;
  onFormChange: (key: keyof Product, value: any) => void;
  onMarketingBadgeChange: (key: keyof MarketingBadge, value: any) => void;
  onSubmit: () => void;
  isEdit?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  formData,
  onFormChange,
  onMarketingBadgeChange,
  onSubmit,
  isEdit = false
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证表单
    if (!formData.nameZh || !formData.marketPrice || !formData.totalShares) {
      alert('请填写必要字段');
      return;
    }
    
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
          
          <div>
            <Label htmlFor="nameZh">产品名称（中文） *</Label>
            <Input
              id="nameZh"
              value={formData.nameZh || ''}
              onChange={(e) => onFormChange('nameZh', e.target.value)}
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="nameEn">产品名称（英文）</Label>
            <Input
              id="nameEn"
              value={formData.nameEn || ''}
              onChange={(e) => onFormChange('nameEn', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="nameRu">产品名称（俄文）</Label>
            <Input
              id="nameRu"
              value={formData.nameRu || ''}
              onChange={(e) => onFormChange('nameRu', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="category">分类</Label>
            <select
              id="category"
              value={formData.category || ''}
              onChange={(e) => onFormChange('category', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">选择分类</option>
              <option value="electronics">电子产品</option>
              <option value="fashion">时尚服饰</option>
              <option value="home">家居用品</option>
              <option value="beauty">美妆护肤</option>
              <option value="sports">运动健身</option>
              <option value="books">图书文具</option>
              <option value="food">食品饮料</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">价格信息</h3>
          
          <div>
            <Label htmlFor="marketPrice">市场价格（TJS） *</Label>
            <Input
              id="marketPrice"
              type="number"
              step="0.01"
              value={formData.marketPrice || ''}
              onChange={(e) => onFormChange('marketPrice', parseFloat(e.target.value) || 0)}
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="totalShares">总份数 *</Label>
            <Input
              id="totalShares"
              type="number"
              value={formData.totalShares || ''}
              onChange={(e) => onFormChange('totalShares', parseInt(e.target.value) || 0)}
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="pricePerShare">每份价格（TJS） *</Label>
            <Input
              id="pricePerShare"
              type="number"
              step="0.01"
              value={formData.pricePerShare || ''}
              onChange={(e) => onFormChange('pricePerShare', parseFloat(e.target.value) || 0)}
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="stock">库存数量</Label>
            <Input
              id="stock"
              type="number"
              value={formData.stock || ''}
              onChange={(e) => onFormChange('stock', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>
      </div>
      
      {/* 描述信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">描述信息</h3>
        
        <div>
          <Label htmlFor="descriptionZh">产品描述（中文）</Label>
          <textarea
            id="descriptionZh"
            value={formData.descriptionZh || ''}
            onChange={(e) => onFormChange('descriptionZh', e.target.value)}
            rows={3}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <Label htmlFor="descriptionEn">产品描述（英文）</Label>
          <textarea
            id="descriptionEn"
            value={formData.descriptionEn || ''}
            onChange={(e) => onFormChange('descriptionEn', e.target.value)}
            rows={3}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <Label htmlFor="descriptionRu">产品描述（俄文）</Label>
          <textarea
            id="descriptionRu"
            value={formData.descriptionRu || ''}
            onChange={(e) => onFormChange('descriptionRu', e.target.value)}
            rows={3}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      
      {/* 营销角标 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">营销角标</h3>
        
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="marketingEnabled"
            checked={formData.marketingBadge?.enabled || false}
            onChange={(e) => onMarketingBadgeChange('enabled', e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <Label htmlFor="marketingEnabled">启用营销角标</Label>
        </div>
        
        {formData.marketingBadge?.enabled && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="badgeTextZh">角标文字（中文）</Label>
              <Input
                id="badgeTextZh"
                value={formData.marketingBadge?.textZh || ''}
                onChange={(e) => onMarketingBadgeChange('textZh', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="badgeTextEn">角标文字（英文）</Label>
              <Input
                id="badgeTextEn"
                value={formData.marketingBadge?.textEn || ''}
                onChange={(e) => onMarketingBadgeChange('textEn', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="badgeTextRu">角标文字（俄文）</Label>
              <Input
                id="badgeTextRu"
                value={formData.marketingBadge?.textRu || ''}
                onChange={(e) => onMarketingBadgeChange('textRu', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="badgeColor">文字颜色</Label>
              <Input
                id="badgeColor"
                type="color"
                value={formData.marketingBadge?.color || '#FFFFFF'}
                onChange={(e) => onMarketingBadgeChange('color', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="badgeBgColor">背景颜色</Label>
              <Input
                id="badgeBgColor"
                type="color"
                value={formData.marketingBadge?.bgColor || '#FF0000'}
                onChange={(e) => onMarketingBadgeChange('bgColor', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="badgePosition">位置</Label>
              <select
                id="badgePosition"
                value={formData.marketingBadge?.position || 'top-left'}
                onChange={(e) => onMarketingBadgeChange('position', e.target.value as any)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="top-left">左上角</option>
                <option value="top-right">右上角</option>
                <option value="center">居中</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* 状态 */}
      <div>
        <Label htmlFor="status">产品状态</Label>
        <select
          id="status"
          value={formData.status || 'pending'}
          onChange={(e) => onFormChange('status', e.target.value as any)}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="pending">待审核</option>
          <option value="active">上架</option>
          <option value="inactive">下架</option>
          <option value="soldout">售罄</option>
        </select>
      </div>
      
      {/* 提交按钮 */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSubmit()}
        >
          取消
        </Button>
        <Button type="submit">
          {isEdit ? '更新产品' : '添加产品'}
        </Button>
      </div>
    </form>
  );
};

export default ProductManagement;