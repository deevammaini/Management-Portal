import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar, Users, TrendingUp, Download, FileText } from 'lucide-react';
import { apiCall } from '../utils/api';
import { useSocket } from '../contexts/SocketContext';

const AttendanceView = ({ showNotification }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingMonthly, setDownloadingMonthly] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { isConnected } = useSocket();

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  // Real-time updates for attendance changes
  useEffect(() => {
    const handleDatabaseChange = (event) => {
      const change = event.detail;
      console.log('AttendanceView received database change:', change);
      
      if (change.table === 'attendance') {
        // Reload attendance data when attendance changes
        loadAttendanceData();
        
        // Show notification for attendance updates
        if (change.data && change.data.action) {
          const action = change.data.action;
          const message = action === 'clock_in' 
            ? 'Employee clocked in' 
            : action === 'clock_out' 
            ? 'Employee clocked out' 
            : 'Attendance updated';
          showNotification(message, 'success');
        }
      }
    };

    window.addEventListener('databaseChange', handleDatabaseChange);
    return () => {
      window.removeEventListener('databaseChange', handleDatabaseChange);
    };
  }, [showNotification]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/admin/attendance?date=${selectedDate}`);
      if (response.success) {
        setAttendanceRecords(response.attendance_records);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
      showNotification('Failed to load attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Late':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'Half Day':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'Absent':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Late':
        return 'bg-yellow-100 text-yellow-800';
      case 'Half Day':
        return 'bg-orange-100 text-orange-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateStats = () => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(record => record.status === 'Present').length;
    const late = attendanceRecords.filter(record => record.status === 'Late').length;
    const halfDay = attendanceRecords.filter(record => record.status === 'Half Day').length;
    const absent = attendanceRecords.filter(record => record.status === 'Absent').length;

    return { total, present, late, halfDay, absent };
  };

  const downloadAttendanceReport = async () => {
    if (attendanceRecords.length === 0) {
      showNotification('No attendance data to download', 'warning');
      return;
    }

    try {
      // Try to use backend endpoint first for more robust downloading
      const response = await fetch(`http://localhost:8000/api/admin/attendance/download?date=${selectedDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_report_${selectedDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showNotification(`Attendance report downloaded for ${selectedDate}`, 'success');
        return;
      }
    } catch (error) {
      console.log('Backend download failed, falling back to frontend generation:', error);
    }

    // Fallback to frontend CSV generation
    const headers = ['Employee Name', 'Employee Code', 'Date', 'Clock In', 'Clock Out', 'Status', 'Total Hours', 'Late Minutes'];
    const csvData = [
      headers.join(','),
      ...attendanceRecords.map(record => [
        `"${record.employee_name}"`,
        `"${record.employee_code}"`,
        `"${record.date}"`,
        `"${record.clock_in_time || 'N/A'}"`,
        `"${record.clock_out_time || 'N/A'}"`,
        `"${record.status}"`,
        `"${record.total_hours || '0'}"`,
        `"${record.late_minutes || '0'}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`Attendance report downloaded for ${selectedDate}`, 'success');
  };

  // Manual reset function for stuck states
  const resetDownloadState = () => {
    setDownloadingMonthly(false);
    showNotification('Download state reset', 'info');
  };

  const downloadMonthlyReport = async () => {
    setDownloadingMonthly(true);
    
    // Safety timeout to prevent stuck state
    const timeoutId = setTimeout(() => {
      setDownloadingMonthly(false);
      showNotification('Download timeout. Please try again.', 'warning');
    }, 60000); // 60 seconds timeout
    
    try {
      // Extract year and month from selected date
      const dateObj = new Date(selectedDate);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1; // getMonth() returns 0-11, so add 1
      const monthName = dateObj.toLocaleString('default', { month: 'long' });
      
      // Try to use backend endpoint for monthly report
      const response = await fetch(`http://localhost:8000/api/admin/attendance/monthly?year=${year}&month=${month}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `monthly_attendance_report_${monthName}_${year}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showNotification(`Monthly attendance report downloaded for ${monthName} ${year}`, 'success');
        console.log('Monthly download completed successfully via backend');
        setDownloadingMonthly(false);
        return;
      }
    } catch (error) {
      console.log('Backend monthly download failed, falling back to frontend generation:', error);
    }

    // Fallback: Generate monthly report using daily API calls
    try {
      const daysInMonth = new Date(year, month, 0).getDate();
      const allMonthlyRecords = [];
      
      showNotification('Generating monthly report... This may take a moment.', 'info');
      
      // Fetch attendance for each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        try {
          const response = await apiCall(`/api/admin/attendance?date=${dateStr}`);
          if (response.success && response.attendance_records) {
            allMonthlyRecords.push(...response.attendance_records);
          }
        } catch (error) {
          console.log(`Failed to fetch data for ${dateStr}:`, error);
        }
      }
      
      if (allMonthlyRecords.length === 0) {
        showNotification('No attendance data found for the selected month', 'warning');
        return;
      }

      // Prepare CSV data with additional columns for monthly report
      const headers = [
        'Employee Name', 'Employee Code', 'Date', 'Clock In', 'Clock Out', 
        'Status', 'Total Hours', 'Late Minutes', 'Week Day'
      ];
      
      const csvData = [
        headers.join(','),
        ...allMonthlyRecords.map(record => {
          const date = new Date(record.date);
          const weekDay = date.toLocaleDateString('en-US', { weekday: 'long' });
          return [
            `"${record.employee_name}"`,
            `"${record.employee_code}"`,
            `"${record.date}"`,
            `"${record.clock_in_time || 'N/A'}"`,
            `"${record.clock_out_time || 'N/A'}"`,
            `"${record.status}"`,
            `"${record.total_hours || '0'}"`,
            `"${record.late_minutes || '0'}"`,
            `"${weekDay}"`
          ].join(',');
        })
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `monthly_attendance_report_${monthName}_${year}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification(`Monthly attendance report downloaded for ${monthName} ${year}`, 'success');
    } catch (error) {
      console.error('Error generating monthly report:', error);
      showNotification('Failed to generate monthly report', 'error');
    } finally {
      clearTimeout(timeoutId);
      setDownloadingMonthly(false);
    }
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Attendance Info</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">
                  {isConnected ? 'Live Updates' : 'Offline'}
                </span>
              </div>
            </div>
            <p className="text-gray-600">Track employee attendance and working hours</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={loadAttendanceData}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={downloadAttendanceReport}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              title={`Download attendance report for ${selectedDate} as CSV`}
            >
              <Download className="h-4 w-4" />
              Daily Report
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadMonthlyReport}
                disabled={downloadingMonthly}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  downloadingMonthly 
                    ? 'bg-blue-300 text-white cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title={`Download monthly attendance report for ${new Date(selectedDate).toLocaleString('default', { month: 'long', year: 'numeric' })} as CSV`}
              >
                {downloadingMonthly ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Monthly Report
                  </>
                )}
              </button>
              {downloadingMonthly && (
                <button
                  onClick={resetDownloadState}
                  className="px-2 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs"
                  title="Reset download state if stuck"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Half Day</p>
              <p className="text-2xl font-bold text-orange-600">{stats.halfDay}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <XCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Today's Attendance ({selectedDate})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late Minutes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No attendance records found for today
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(record.status)}
                        <div>
                          <div className="font-medium text-gray-900">{record.employee_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.employee_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.clock_in_time || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.clock_out_time || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.total_hours}h
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.late_minutes > 0 ? `${record.late_minutes}m` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceView;
