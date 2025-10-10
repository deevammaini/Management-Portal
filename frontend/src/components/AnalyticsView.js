import React from 'react';
import { Download, TrendingUp } from 'lucide-react';

const AnalyticsView = ({ stats, vendors }) => {
  const chartData = {
    vendorsByStatus: [
      { name: 'Completed', value: vendors.filter(v => v.nda_status === 'completed').length, color: '#10b981' },
      { name: 'Sent', value: vendors.filter(v => v.nda_status === 'sent').length, color: '#3b82f6' },
      { name: 'Pending', value: vendors.filter(v => v.nda_status === 'pending' || v.nda_status === 'not_sent').length, color: '#f59e0b' }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics & Insights</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
          <Download size={18} />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="text-lg font-bold mb-4">Vendor Status Distribution</h3>
          <div className="space-y-4">
            {chartData.vendorsByStatus.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm font-bold">{item.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      width: `${(item.value / vendors.length) * 100}%`,
                      backgroundColor: item.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="text-lg font-bold mb-4">Monthly Activity</h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {[65, 78, 90, 81, 56, 88, 95].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full">
                  <div
                    className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all hover:from-amber-600 hover:to-amber-500 cursor-pointer"
                    style={{ height: `${height * 2}px` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-bold">87%</p>
            </div>
          </div>
          <p className="text-xs text-green-600">+5% from last month</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Response Time</p>
              <p className="text-2xl font-bold">2.4h</p>
            </div>
          </div>
          <p className="text-xs text-green-600">-12% faster</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-2xl font-bold">{stats.active_users || 0}</p>
            </div>
          </div>
          <p className="text-xs text-green-600">+8 new this week</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
