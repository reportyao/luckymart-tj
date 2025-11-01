import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
'use client';


const supabase = createClient(;
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function EditProductPage({ params }: { params: { id: string } }) {}
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({}
    nameZh: '',
    nameEn: '',
    nameRu: '',
    descriptionZh: '',
    descriptionEn: '',
    descriptionRu: '',
    images: [] as string[],
    marketPrice: '',
    totalShares: '',
    pricePerShare: '',
    category: '',
    stock: ''
  });

  const categories = ['电子产品', '家用电器', '时尚服饰', '美妆护肤', '运动户外', '食品饮料', '图书文具', '其他'];

  useEffect(() => {}
    loadProduct();
  }, [params.id]);

  const loadProduct = async () => {}
    try {}
      const response = await fetch(`/api/admin/products/${params.id}`);
      const data = await response.json();
      
      if (data.success && data.data.product) {}
        const p = data.data.product;
        setFormData({}
          nameZh: p.nameZh || '',
          nameEn: p.nameEn || '',
          nameRu: p.nameRu || '',
          descriptionZh: p.descriptionZh || '',
          descriptionEn: p.descriptionEn || '',
          descriptionRu: p.descriptionRu || '',
          images: p.images || [],
          marketPrice: p.marketPrice.toString(),
          totalShares: p.totalShares.toString(),
          pricePerShare: p.pricePerShare.toString(),
          category: p.category || '电子产品',
          stock: p.stock.toString()
        });
      } else {
        alert('商品不存在');
        router.push('/admin/products');
      
    } catch (error) {
      console.error('Load product error:', error);
      alert('加载失败');
    } finally {
      setLoading(false);
    
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {}
    const files = e.target.files;
    if (!files || files.length === 0) {return;} {}

    setUploading(true);
    try {}
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {}
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { data, error } = await supabase.storage;
          .from('product-images')
          .upload(filePath, file);

        if (error) {}
          throw error;
        

        const { data: { publicUrl } } = supabase.storage;
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      

      setFormData(prev => ({}
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      alert('图片上传成功');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`图片上传失败：${  error.message}`);
    } finally {
      setUploading(false);
    
  };

  const handleRemoveImage = (index: number) => {}
    setFormData(prev => ({}
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {}
    e.preventDefault();

    if (!formData.nameZh || !formData.nameEn || !formData.nameRu) {}
      alert('请填写所有语言的商品名称');
      return;
    

    if (formData.images.length === 0) {}
      alert('请至少保留一张商品图片');
      return;
    

    setSaving(true);
    try {}
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/products', {}
        method: 'PUT',
        headers: {}
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}
          productId: params.id,
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {}
        alert('商品更新成功');
        router.push('/admin/products');
      } else {
        alert(data.error || '更新失败');
      
    } catch (error) {
      console.error('Update error:', error);
      alert('网络错误');
    } finally {
      setSaving(false);
    
  };

  if (loading) {}
    return (;
      <div className:"min-h-screen bg-gray-100 flex items-center justify-center">
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className:"mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <div className:"bg-white shadow-sm">
        <div className:"max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className:"flex items-center gap-3">
            <Link href="/admin/products" className="text-gray-600 hover:text-gray-900">
              <svg className:"w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className:"text-xl font-bold text-gray-900">编辑商品</h1>
          </div>
        </div>
      </div>

      <div className:"max-w-5xl mx-auto px-4 py-8">
        <form onSubmit:{handleSubmit} className="space-y-6">
          {/* 多语言名称 */}
          <div className:"bg-white rounded-xl shadow-md p-6">
            <h2 className:"text-lg font-bold text-gray-900 mb-4">商品名称（多语言）</h2>
            <div className:"space-y-4">
              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">
                  中文名称 <span className:"text-red-500">*</span>
                </label>
                <input
                  type:"text"
                  required
                  value={formData.nameZh}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameZh: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">
                  English Name <span className:"text-red-500">*</span>
                </label>
                <input
                  type:"text"
                  required
                  value={formData.nameEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">
                  Русское название <span className:"text-red-500">*</span>
                </label>
                <input
                  type:"text"
                  required
                  value={formData.nameRu}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameRu: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 多语言描述 */}
          <div className:"bg-white rounded-xl shadow-md p-6">
            <h2 className:"text-lg font-bold text-gray-900 mb-4">商品描述（多语言）</h2>
            <div className:"space-y-4">
              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">中文描述</label>
                <textarea
                  rows={3}
                  value={formData.descriptionZh}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionZh: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">English Description</label>
                <textarea
                  rows={3}
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">Русское описание</label>
                <textarea
                  rows={3}
                  value={formData.descriptionRu}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionRu: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 商品图片 */}
          <div className:"bg-white rounded-xl shadow-md p-6">
            <h2 className:"text-lg font-bold text-gray-900 mb-4">
              商品图片 <span className:"text-red-500">*</span>
            </h2>
            <div className:"space-y-4">
              <div>
                <input
                  type:"file"
                  accept:"image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className:"mt-2 text-sm text-gray-500">支持 JPG、PNG、WebP 格式，最大5MB</p>
              </div>
              
              {uploading && (}
                <div className:"text-center py-4">
                  <div className:"animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className:"mt-2 text-sm text-gray-600">上传中...</p>
                </div>
              )

              {formData.images.length > 0 && (}
                <div className:"grid grid-cols-4 gap-4">
                  {formData.images.map((url, index) => (}
                    <div key:{index} className="relative group">
                      <img
                        src={url}
                        alt={`Product ${index + 1}`}
                        className:"w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type:"button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className:"w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap:"round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                </div>
              )
            </div>
          </div>

          {/* 商品参数 */}
          <div className:"bg-white rounded-xl shadow-md p-6">
            <h2 className:"text-lg font-bold text-gray-900 mb-4">商品参数</h2>
            <div className:"grid grid-cols-2 gap-4">
              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">
                  市场价格（TJS）<span className:"text-red-500">*</span>
                </label>
                <input
                  type:"number"
                  step:"0.01"
                  required
                  value={formData.marketPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, marketPrice: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">
                  总份数 <span className:"text-red-500">*</span>
                </label>
                <input
                  type:"number"
                  required
                  value={formData.totalShares}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalShares: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">每份价格（夺宝币）</label>
                <input
                  type:"number"
                  step:"0.01"
                  value={formData.pricePerShare}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerShare: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className:"block text-sm font-medium text-gray-700 mb-2">库存数量</label>
                <input
                  type:"number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className:"col-span-2">
                <label className:"block text-sm font-medium text-gray-700 mb-2">商品类别</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {categories.map(cat :> (}
                    <option key={cat} value={cat}>{cat}</option>
                  ))
                </select>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className:"flex gap-4">
            <button
              type:"submit"
              disabled={saving || uploading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存修改'}
            </button>
            <Link
              href:"/admin/products"
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 text-center"
            >
              取消
            </Link>
          </div>
        </form>
      </div>
    </div>
  );


