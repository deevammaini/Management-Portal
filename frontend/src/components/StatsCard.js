import React from 'react';

const StatsCard = ({ icon: Icon, title, value, color, subtitle, trend }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-gray-500 text-sm font-medium mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-green-500 font-medium">{trend}</span>
          </div>
        )}
      </div>
      <div className={`${color} p-3 rounded-xl shadow-sm`}>
        <Icon className="text-white" size={24} />
      </div>
    </div>
  </div>
);

export default StatsCard;
