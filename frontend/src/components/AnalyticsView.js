import React, { useEffect, useMemo, useState } from 'react';
import { Download, Users, Briefcase } from 'lucide-react';
import { apiCall } from '../utils/api';

const AnalyticsView = () => {
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [vendorsRes, leadsRes, projectsRes, tendersRes, statsRes] = await Promise.all([
          apiCall('/api/admin/vendors'),
          apiCall('/api/admin/leads'),
          apiCall('/api/admin/projects'),
          apiCall('/api/admin/tenders'),
          apiCall('/api/dashboard/stats')
        ]);
        setVendors(vendorsRes?.filter?.(v => v.id !== 'metadata') || vendorsRes || []);
        setLeads(leadsRes || []);
        setProjects(projectsRes || []);
        setTenders(tendersRes || []);
        setStats(statsRes || {});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartData = {
    vendorsByStatus: [
      { name: 'Completed', value: vendors.filter(v => String(v.nda_status).toLowerCase() === 'completed').length, color: '#10b981' },
      { name: 'Sent', value: vendors.filter(v => String(v.nda_status).toLowerCase() === 'sent').length, color: '#3b82f6' },
      { name: 'Pending', value: vendors.filter(v => ['pending', 'not_sent', ''].includes(String(v.nda_status).toLowerCase())).length, color: '#f59e0b' }
    ],
    leadsByStatus: [
      { name: 'Active', value: leads.filter(l => ['active', 'open'].includes(String(l.status || l.assignment_status))).length, color: '#3b82f6' },
      { name: 'Pending', value: leads.filter(l => String(l.status || l.assignment_status) === 'pending').length, color: '#f59e0b' },
      { name: 'Closed', value: leads.filter(l => String(l.status || l.assignment_status) === 'closed').length, color: '#10b981' }
    ]
  };

  async function exportWorkbook() {
    try {
      // Excel 2003 XML multi-sheet workbook (.xls)
      const esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const rowXml = (row) => `<Row>${row.map(c => `<Cell><Data ss:Type="String">${esc(c)}</Data></Cell>`).join('')}</Row>`;

      const makeSheet = (name, header, rows) => `
        <Worksheet ss:Name="${esc(name)}">
          <Table>
            ${rowXml(header)}
            ${rows.map(r => rowXml(r)).join('')}
          </Table>
        </Worksheet>`;

      const vendorHeader = ['Vendor ID','Company','Email','Contact Person','NDA Status','Portal Access','Reference Number','Created Date'];
      const vendorRows = vendors.map(v => [v.id, v.company_name, v.email, v.contact_person, v.nda_status, v.portal_access ? 'Yes' : 'No', v.reference_number, v.created_at]);

      const leadHeader = ['Lead ID','Company','Email','Status','Priority','Assigned To','Created Date'];
      const leadRows = leads.map(l => [l.id, l.company_name, l.client_email, l.assignment_status || l.status, l.lead_source || l.priority, l.assigned_employee_name || 'Unassigned', l.created_at]);

      const projHeader = ['Project ID','Name','Status','Priority','Assigned To','Start','End'];
      const projRows = projects.map(p => [p.id, p.project_name || p.name, p.status, p.priority, p.assigned_to_name || '', p.start_date || '', p.end_date || '']);

      const tendHeader = ['Tender ID','Title','Type','Category','Organization','Status','Published','Deadline'];
      const tendRows = tenders.map(t => [t.id, t.title, t.tender_type, t.category, t.organization_name, t.status, t.published_date || '', t.submission_deadline || '']);

      const workbook = `<?xml version="1.0"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:html="http://www.w3.org/TR/REC-html40">
        ${makeSheet('Vendors', vendorHeader, vendorRows)}
        ${makeSheet('Leads', leadHeader, leadRows)}
        ${makeSheet('Projects', projHeader, projRows)}
        ${makeSheet('Tenders', tendHeader, tendRows)}
      </Workbook>`;

      const blob = new Blob([workbook], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Analytics_Report_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Export failed', e);
      alert('Failed to export report.');
    }
  }

  // Additional analytics for charts
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const toMonthIndex = (d) => { const dt = new Date(d || ''); return isNaN(dt.getTime()) ? null : { m: dt.getMonth(), y: dt.getFullYear() }; };
  const monthly = useMemo(() => {
    const year = new Date().getFullYear();
    const v = Array(12).fill(0);
    const l = Array(12).fill(0);
    vendors.forEach(x => { const p = toMonthIndex(x.created_at); if (p && p.y === year) v[p.m] += 1; });
    leads.forEach(x => { const p = toMonthIndex(x.created_at); if (p && p.y === year) l[p.m] += 1; });
    return { v, l, max: Math.max(1, ...v, ...l) };
  }, [vendors, leads]);

  const Donut = ({ data, colors, size = 160, thickness = 14, label }) => {
    const total = data.reduce((a,b)=>a+b,0) || 1;
    const r = (size - thickness) / 2;
    const C = 2 * Math.PI * r;
    let off = 0;
    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`translate(${size/2},${size/2})`}>
            {data.map((val,i)=>{
              const dash = (val/total) * C;
              const el = (
                <circle key={i} r={r} cx="0" cy="0" fill="transparent" stroke={colors[i]} strokeWidth={thickness}
                  strokeDasharray={`${dash} ${C-dash}`} strokeDashoffset={-off} transform="rotate(-90)" strokeLinecap="round"/>
              );
              off += dash; return el;})}
            <circle r={r} cx="0" cy="0" fill="transparent" stroke="#e5e7eb" strokeWidth={1}/>
          </g>
        </svg>
        {label && <div className="mt-2 text-sm text-gray-600">{label}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics & Insights</h2>
        <button onClick={exportWorkbook} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* Dashboards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Vendor Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="text-lg font-bold mb-4">Vendor Status Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Donut data={chartData.vendorsByStatus.map(x=>x.value)} colors={chartData.vendorsByStatus.map(x=>x.color)} label={`Total ${vendors.length}`}/>
            <div className="space-y-4">
              {chartData.vendorsByStatus.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm" style={{backgroundColor:item.color}}></span><span className="text-sm font-medium">{item.name}</span></div>
                    <span className="text-sm font-bold">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${vendors.length ? (item.value/vendors.length)*100 : 0}%`, backgroundColor:item.color}}/></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leads Snapshot */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="text-lg font-bold mb-4">Lead Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Donut data={chartData.leadsByStatus.map(x=>x.value)} colors={chartData.leadsByStatus.map(x=>x.color)} label={`Total ${leads.length}`}/>
            <div className="space-y-4">
              {chartData.leadsByStatus.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm" style={{backgroundColor:item.color}}></span><span className="text-sm font-medium">{item.name}</span></div>
                    <span className="text-sm font-bold">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${leads.length ? (item.value/leads.length)*100 : 0}%`, backgroundColor:item.color}}/></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Vendors</p>
              <p className="text-2xl font-bold">{vendors.length}</p>
            </div>
          </div>
          <p className="text-xs text-green-600">Portal access: {vendors.filter(v => v.portal_access === 1).length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Leads</p>
              <p className="text-2xl font-bold">{leads.length}</p>
            </div>
          </div>
          <p className="text-xs text-green-600">Active: {chartData.leadsByStatus[0].value} • Pending: {chartData.leadsByStatus[1].value}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Briefcase className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Projects / Tenders</p>
              <p className="text-2xl font-bold">{projects.length} / {tenders.length}</p>
            </div>
          </div>
          <p className="text-xs text-green-600">In progress: {projects.filter(p => String(p.status).toLowerCase() === 'in_progress').length}</p>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h3 className="text-lg font-bold mb-4">Monthly Activity (Current Year)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium mb-2">New Vendors</p>
            <div className="h-52 flex items-end gap-2">
              {monthly.v.map((val,i)=> (
                <div key={`v-${i}`} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t" style={{height:`${(val/monthly.max)*100}%`}}/>
                  <span className="text-[10px] text-gray-500 mt-1">{monthNames[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">New Leads</p>
            <div className="h-52 flex items-end gap-2">
              {monthly.l.map((val,i)=> (
                <div key={`l-${i}`} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{height:`${(val/monthly.max)*100}%`}}/>
                  <span className="text-[10px] text-gray-500 mt-1">{monthNames[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
