'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface UserAddress {
  id: number;
  recipientName: string;
  recipientPhone: string;
  province: string;
  city: string;
  district?: string;
  detailAddress: string;
  isDefault: boolean;
}

export default function AddressPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    province: '',
    city: '',
    district: '',
    detailAddress: '',
    isDefault: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAddresses(data.data);
      }
    } catch (error) {
      console.error(t('common:address_management') + ' fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const url = editingId 
        ? `/api/user/addresses/${editingId}` 
        : '/api/user/addresses';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message || t('common:operation_success'));
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchAddresses();
      } else {
        alert(data.error || t('common:operation_failed'));
      }
    } catch (error) {
      console.error(t('common:save_failed') + ':', error);
      alert(t('common:save_failed'));
    }
  };

  const handleEdit = (address: UserAddress) => {
    setFormData({
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      province: address.province,
      city: address.city,
      district: address.district || '',
      detailAddress: address.detailAddress,
      isDefault: address.isDefault
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('common:confirm_delete'))) {return;}

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert(t('common:delete_success'));
        fetchAddresses();
      } else {
        alert(data.error || t('common:delete_failed'));
      }
    } catch (error) {
      console.error(t('common:delete_failed') + ':', error);
      alert(t('common:delete_failed'));
    }
  };

  const resetForm = () => {
    setFormData({
      recipientName: '',
      recipientPhone: '',
      province: '',
      city: '',
      district: '',
      detailAddress: '',
      isDefault: false
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 头部 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="ml-4 text-xl font-bold text-gray-900">收货地址</h1>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                resetForm();
                setEditingId(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + 新增地址
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {showForm ? (
          /* 地址表单 */
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              {editingId ? '编辑地址' : '新增地址'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    收件人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    手机号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.recipientPhone}
                    onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                    placeholder="+992XXXXXXXXX"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    省份 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    城市 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    区县
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  详细地址 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.detailAddress}
                  onChange={(e) => setFormData({ ...formData, detailAddress: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                  设为默认地址
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* 地址列表 */
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-500 mb-4">暂无收货地址</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  添加地址
                </button>
              </div>
            ) : (
              addresses.map((address) => (
                <div key={address.id} className="bg-white rounded-xl p-5 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{address.recipientName}</span>
                        <span className="text-gray-600">{address.recipientPhone}</span>
                        {address.isDefault && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded">
                            默认
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {address.province} {address.city} {address.district} {address.detailAddress}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t">
                    <button
                      onClick={() => handleEdit(address)}
                      className="flex-1 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="flex-1 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
