import React, { useState } from 'react';
import { Users, BookOpen, AlertCircle, TrendingUp, Shield } from 'lucide-react';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'skills' | 'reports'>('users');

  // Mock data
  const stats = {
    totalUsers: 1247,
    activeSkills: 156,
    totalSessions: 3421,
    reportsPending: 8
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-gray-600">Manage users, skills, and platform activities</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Skills</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeSkills}</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSessions}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reports</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.reportsPending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            {(['users', 'skills', 'reports'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">User Management</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">User {i}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">user{i}@example.com</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4.{5 + i}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                        <button className="text-red-600 hover:text-red-900">Suspend</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'skills' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Skill Management</h2>
              <p className="text-gray-600">Manage and moderate platform skills</p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reports Management</h2>
              <p className="text-gray-600">Review and handle user reports</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
