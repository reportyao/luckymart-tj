'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUsers, FiShield, FiSettings, FiPlus, FiEdit, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

interface Department {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  isActive: boolean;
  permissions: any;
}

interface Admin {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}

type TabType = 'departments' | 'roles' | 'admins' | 'logs';

function OrganizationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('departments');
  const [loading, setLoading] = useState(true);
  
  // 部门数据
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  
  // 角色数据
  const [roles, setRoles] = useState<Role[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  // 管理员数据
  const [admins, setAdmins] = useState<Admin[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchData();
  }, [router, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      if (activeTab === 'departments') {
        const res = await fetch('/api/admin/organization/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setDepartments(data.data);
      } else if (activeTab === 'roles') {
        const res = await fetch('/api/admin/organization/roles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setRoles(data.data);
      } else if (activeTab === 'admins') {
        const res = await fetch('/api/admin/organization/admins', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setAdmins(data.data);
      }
    } catch (error) {
      console.error('获取组织数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('确定要删除这个部门吗？')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/organization/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert('删除失败: ' + data.error);
      }
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleToggleDepartmentStatus = async (dept: Department) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/organization/departments/${dept.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !dept.isActive })
      });
      
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      alert('更新状态失败');
    }
  };

  const TabButton = ({ tab, label, icon: Icon }: { tab: TabType; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
        activeTab === tab
          ? 'text-indigo-600 border-b-2 border-indigo-600'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">组织架构管理</h1>
              <p className="mt-1 text-sm text-gray-600">管理部门、角色和管理员权限</p>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              返回
            </button>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <TabButton tab="departments" label="部门管理" icon={FiUsers} />
            <TabButton tab="roles" label="角色管理" icon={FiShield} />
            <TabButton tab="admins" label="管理员" icon={FiSettings} />
            <TabButton tab="logs" label="操作日志" icon={FiSettings} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 部门管理 */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">部门列表</h2>
              <button
                onClick={() => {
                  setEditingDept(null);
                  setShowDeptModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FiPlus />
                添加部门
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      部门名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      描述
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      排序
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{dept.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{dept.sortOrder}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleDepartmentStatus(dept)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            dept.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {dept.isActive ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
                          {dept.isActive ? '启用' : '停用'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setEditingDept(dept);
                              setShowDeptModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(dept.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 角色管理 */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">角色列表</h2>
              <button
                onClick={() => setShowRoleModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FiPlus />
                添加角色
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      描述
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{role.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{role.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          role.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {role.isActive ? '启用' : '停用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          配置权限
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 管理员列表 */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">管理员列表</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <FiPlus />
                添加管理员
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最后登录
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{admin.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{admin.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString('zh-CN') : '从未登录'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          admin.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {admin.isActive ? '启用' : '停用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                          编辑
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          禁用
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 操作日志 */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center text-gray-500">
            操作日志功能开发中...
          </div>
        )}
      </div>
    </div>
  );
}


// 导出带权限控制的页面
function ProtectedOrganizationPage() {
  return (
    <PagePermission 
      permissions={AdminPermissions.system.manage()}
      showFallback={true}
    >
      <OrganizationPage />
    </PagePermission>
  );
}

export default ProtectedOrganizationPage;
