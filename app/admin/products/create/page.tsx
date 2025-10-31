'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nameZh: '',
    nameEn: '',
    nameRu: '',
    descriptionZh: '',
    descriptionEn: '',
    descriptionRu: '',
    images: [] as string[],
    marketPrice: '',
    totalShares: '',
    pricePerShare: '1.00',
    category: '电子产品',
    stock: '1',
    // 营销角标
    marketingBadge: {
      enabled: false,
      textZh: '',
      textEn: '',
      textRu: '',
      color: '#FFFFFF',
      bgColor: '#FF0000',
      position: 'top-right' as 'top-left' | 'top-right' | 'center',
      animation: 'none' as 'pulse' | 'bounce' | 'none'
    }
  });

  const categories = ['电子产品', '家用电器', '时尚服饰', '美妆护肤', '运动户外', '食品饮料', '图书文具', '其他'];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {return;}

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (error) {
          throw error;
        }

        // 获取公开URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      alert('图片上传成功');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`图片上传失败：${  error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.nameZh || !formData.nameEn || !formData.nameRu) {
      alert('请填写所有语言的商品名称');
      return;
    }

    if (!formData.marketPrice || !formData.totalShares) {
      alert('请填写市场价格和总份数');
      return;
    }

    if (formData.images.length === 0) {
      alert('请至少上传一张商品图片');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert('商品创建成功');
        router.push('/admin/products');
      } else {
        alert(data.error || '创建失败');
      }
    } catch (error) {
      console.error('Create error:', error);
      alert('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/products" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">创建商品</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 多语言名称 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">商品名称（多语言）</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  中文名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nameZh}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameZh: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例如：iPhone 15 Pro Max 256GB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  English Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nameEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g. iPhone 15 Pro Max 256GB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Русское название <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nameRu}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameRu: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="например iPhone 15 Pro Max 256GB"
                />
              </div>
            </div>
          </div>

          {/* 多语言描述 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">商品描述（多语言）</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">中文描述</label>
                <textarea
                  rows={3}
                  value={formData.descriptionZh}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionZh: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="详细描述商品特点、规格等信息"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">English Description</label>
                <textarea
                  rows={3}
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Detailed product description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Русское описание</label>
                <textarea
                  rows={3}
                  value={formData.descriptionRu}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionRu: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Подробное описание продукта"
                />
              </div>
            </div>
          </div>

          {/* 商品图片 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              商品图片 <span className="text-red-500">*</span>
            </h2>
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="mt-2 text-sm text-gray-500">支持 JPG、PNG、WebP 格式，最大5MB</p>
              </div>
              
              {uploading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">上传中...</p>
                </div>
              )}

              {formData.images.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 商品参数 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">商品参数</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  市场价格（TJS）<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.marketPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, marketPrice: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例如：5999.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  总份数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.totalShares}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalShares: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例如：5999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">每份价格（夺宝币）</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerShare}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerShare: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="默认：1.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">库存数量</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例如：10"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">商品类别</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 营销角标 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">营销角标设置</h2>
            <div className="space-y-4">
              {/* 启用开关 */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">启用营销角标</label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    marketingBadge: { ...prev.marketingBadge, enabled: !prev.marketingBadge.enabled }
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.marketingBadge.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.marketingBadge.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {formData.marketingBadge.enabled && (
                <>
                  {/* 角标文案 */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">中文文案</label>
                      <input
                        type="text"
                        value={formData.marketingBadge.textZh}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          marketingBadge: { ...prev.marketingBadge, textZh: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="例如：马上结束"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">English Text</label>
                      <input
                        type="text"
                        value={formData.marketingBadge.textEn}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          marketingBadge: { ...prev.marketingBadge, textEn: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. Ending Soon"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Русский текст</label>
                      <input
                        type="text"
                        value={formData.marketingBadge.textRu}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          marketingBadge: { ...prev.marketingBadge, textRu: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Скоро закончится"
                      />
                    </div>
                  </div>

                  {/* 样式设置 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">文字颜色</label>
                      <input
                        type="color"
                        value={formData.marketingBadge.color}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          marketingBadge: { ...prev.marketingBadge, color: e.target.value }
                        }))}
                        className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">背景颜色</label>
                      <input
                        type="color"
                        value={formData.marketingBadge.bgColor}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          marketingBadge: { ...prev.marketingBadge, bgColor: e.target.value }
                        }))}
                        className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">位置</label>
                      <select
                        value={formData.marketingBadge.position}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          marketingBadge: { ...prev.marketingBadge, position: e.target.value as any }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="top-left">左上角</option>
                        <option value="top-right">右上角</option>
                        <option value="center">居中</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">动画效果</label>
                      <select
                        value={formData.marketingBadge.animation}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          marketingBadge: { ...prev.marketingBadge, animation: e.target.value as any }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="none">无动画</option>
                        <option value="pulse">脉冲</option>
                        <option value="bounce">弹跳</option>
                      </select>
                    </div>
                  </div>

                  {/* 预览 */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">预览效果</label>
                    <div className="relative w-48 h-48 bg-gray-100 rounded-lg">
                      <div 
                        className={`absolute ${
                          formData.marketingBadge.position === 'top-left' ? 'top-2 left-2' :
                          formData.marketingBadge.position === 'top-right' ? 'top-2 right-2' :
                          'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                        } px-3 py-1.5 rounded-full text-sm font-bold ${
                          formData.marketingBadge.animation === 'pulse' ? 'animate-pulse' :
                          formData.marketingBadge.animation === 'bounce' ? 'animate-bounce' : ''
                        }`}
                        style={{
                          backgroundColor: formData.marketingBadge.bgColor,
                          color: formData.marketingBadge.color
                        }}
                      >
                        {formData.marketingBadge.textZh || '示例文案'}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '创建中...' : '创建商品'}
            </button>
            <Link
              href="/admin/products"
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 text-center"
            >
              取消
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
