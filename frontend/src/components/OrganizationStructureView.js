import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit, Trash2, Search, Filter, Save, X, 
  UserPlus, Building, Mail, Phone, MapPin, Calendar,
  ChevronDown, ChevronRight, Crown, Shield, User, 
  MoreHorizontal, Eye, Settings, ArrowUpDown
} from 'lucide-react';
import { apiCall } from '../utils/api';
import './OrganizationChart.css';

const OrganizationStructureView = ({ showNotification }) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [showManagerForm, setShowManagerForm] = useState(false);
  const [isCreatingManager, setIsCreatingManager] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [viewMode, setViewMode] = useState('chart'); // tree, list, chart
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    manager: '',
    employeeId: '',
    hireDate: '',
    salary: '',
    address: '',
    emergencyContact: '',
    skills: [],
    status: 'active'
  });

  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    head: '',
    budget: '',
    location: '',
    establishedDate: ''
  });

  const [managerForm, setManagerForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    manager: '',
    employeeId: '',
    hireDate: '',
    salary: '',
    address: '',
    emergencyContact: '',
    skills: [],
    status: 'active'
  });

  useEffect(() => {
    loadOrganizationData();
  }, []);

  useEffect(() => {
    // Auto-expand CEO by default when employees are loaded
    if (employees.length > 0) {
      const ceo = employees.find(emp => 
        emp.position && (
          emp.position.toLowerCase().includes('ceo') || 
          emp.position.toLowerCase().includes('chief executive officer') || 
          emp.position.toLowerCase().includes('president') || 
          emp.name === 'Harpreet Singh'
        )
      );
      if (ceo) {
        setExpandedNodes(prev => new Set([...prev, ceo.id]));
      }
    }
  }, [employees]);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API
      const [employeesData, departmentsData, statsData] = await Promise.all([
        apiCall('/api/admin/employees'),
        apiCall('/api/admin/departments'),
        apiCall('/api/admin/organization-stats')
      ]);
      
      setEmployees(employeesData);
      setDepartments(departmentsData);
      
      // Update analytics with real data
      setAnalytics(statsData);
      
    } catch (error) {
      console.error('Error loading organization data:', error);
      showNotification('Failed to load organization data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = () => {
    const employeeMap = new Map();
    const rootEmployees = [];
    let ceoEmployee = null;

    // Create map of employees
    employees.forEach(emp => {
      employeeMap.set(emp.id, { ...emp, children: [] });
    });

    // First pass: Identify the CEO
    employees.forEach(emp => {
      const position = emp.position ? emp.position.toLowerCase() : '';
      if (position.includes('ceo') || position.includes('chief executive officer') || 
          position.includes('president') || emp.name === 'Harpreet Singh') {
        ceoEmployee = employeeMap.get(emp.id);
      }
    });

    // Second pass: Build hierarchy
    employees.forEach(emp => {
      // Convert manager to number if it's a string
      const managerId = emp.manager ? parseInt(emp.manager) : null;
      
      if (managerId && employeeMap.has(managerId)) {
        const manager = employeeMap.get(managerId);
        if (manager) {
          manager.children.push(employeeMap.get(emp.id));
        }
      } else {
        // If this employee has no manager and is not the CEO
        if (emp.id !== ceoEmployee?.id) {
          // Check if this is an executive position that should report to CEO
          const position = emp.position ? emp.position.toLowerCase() : '';
          if (position.includes('chro') || position.includes('cfo') || position.includes('cto') || 
              position.includes('vp') || position.includes('vice president') || 
              position.includes('chief') || position.includes('director')) {
            // Make this executive report to CEO
            if (ceoEmployee) {
              ceoEmployee.children.push(employeeMap.get(emp.id));
            } else {
              rootEmployees.push(employeeMap.get(emp.id));
            }
          } else {
            rootEmployees.push(employeeMap.get(emp.id));
          }
        }
      }
    });

    // Ensure CEO is at the top
    if (ceoEmployee) {
      return [ceoEmployee];
    }

    return rootEmployees;
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleAddEmployee = async () => {
    try {
      setLoading(true);
      
      const response = await apiCall('/api/admin/employees', {
        method: 'POST',
        body: JSON.stringify(employeeForm)
      });
      
      if (response.success) {
        showNotification('Employee added successfully', 'success');
        setShowAddEmployee(false);
        resetEmployeeForm();
        loadOrganizationData(); // Reload data
      } else {
        showNotification(response.message || 'Failed to add employee', 'error');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      showNotification('Failed to add employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = async () => {
    try {
      setLoading(true);
      
      const response = await apiCall(`/api/admin/employees/${editingEmployee.id}`, {
        method: 'PUT',
        body: JSON.stringify(employeeForm)
      });
      
      if (response.success) {
        showNotification('Employee updated successfully', 'success');
        setEditingEmployee(null);
        resetEmployeeForm();
        loadOrganizationData(); // Reload data
      } else {
        showNotification(response.message || 'Failed to update employee', 'error');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      showNotification('Failed to update employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      setLoading(true);
      
      const response = await apiCall(`/api/admin/employees/${employeeId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        showNotification('Employee deleted successfully', 'success');
        loadOrganizationData(); // Reload data
      } else {
        showNotification(response.message || 'Failed to delete employee', 'error');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      showNotification('Failed to delete employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    try {
      setLoading(true);
      // In real app, this would call API
      const newDepartment = {
        id: departments.length + 1,
        ...departmentForm,
        employeeCount: 0
      };
      
      setDepartments(prev => [...prev, newDepartment]);
      setShowAddDepartment(false);
      resetDepartmentForm();
      showNotification('Department added successfully', 'success');
    } catch (error) {
      showNotification('Failed to add department', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddManager = async () => {
    try {
      setLoading(true);
      
      const response = await apiCall('/api/admin/employees', {
        method: 'POST',
        body: JSON.stringify(managerForm)
      });
      
      if (response.success) {
        showNotification('Manager added successfully', 'success');
        setShowManagerForm(false);
        setIsCreatingManager(false);
        resetManagerForm();
        loadOrganizationData(); // Reload data
        
        // Update the employee form to select the new manager
        // We'll need to get the new manager's ID from the response or reload
        setTimeout(() => {
          loadOrganizationData();
        }, 1000);
      } else {
        showNotification(response.message || 'Failed to add manager', 'error');
      }
    } catch (error) {
      console.error('Error adding manager:', error);
      showNotification('Failed to add manager', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      manager: '',
      employeeId: '',
      hireDate: '',
      salary: '',
      address: '',
      emergencyContact: '',
      skills: [],
      status: 'active'
    });
  };

  const resetDepartmentForm = () => {
    setDepartmentForm({
      name: '',
      description: '',
      head: '',
      budget: '',
      location: '',
      establishedDate: ''
    });
  };

  const resetManagerForm = () => {
    setManagerForm({
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      manager: '',
      employeeId: '',
      hireDate: '',
      salary: '',
      address: '',
      emergencyContact: '',
      skills: [],
      status: 'active'
    });
  };

  const openEditEmployee = (employee) => {
    setEmployeeForm(employee);
    setEditingEmployee(employee);
  };

  const openEditDepartment = (department) => {
    setDepartmentForm(department);
    setEditingDepartment(department);
  };

  const handleManagerSelection = (value) => {
    if (value === 'add_new_manager') {
      setIsCreatingManager(true);
      setShowManagerForm(true);
    } else {
      setEmployeeForm(prev => ({ ...prev, manager: value }));
    }
  };

  const openEmployeeDetail = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeDetail(true);
  };

  const closeEmployeeDetail = () => {
    setSelectedEmployee(null);
    setShowEmployeeDetail(false);
  };

  const getNodeClass = (employee) => {
    const position = employee.position ? employee.position.toLowerCase() : '';
    
    if (position.includes('ceo') || position.includes('chief executive officer') || 
        position.includes('president') || employee.name === 'Harpreet Singh') {
      return 'ceo-node';
    } else if (position.includes('vp') || position.includes('vice president') || 
               position.includes('chro') || position.includes('cfo') || 
               position.includes('cto') || position.includes('chief')) {
      return 'vp-node';
    } else if (position.includes('director') || position.includes('head')) {
      return 'director-node';
    } else {
      return 'employee-node';
    }
  };

  const renderOrgChart = () => {
    const hierarchy = buildHierarchy();
    
    const renderEmployeeNode = (employee, level = 0) => {
      const hasReports = employee.children && employee.children.length > 0;
      const isExpanded = expandedNodes.has(employee.id);
      
      return (
        <div key={employee.id} className="org-level" style={{ marginTop: level === 0 ? '0' : '40px' }}>
          {/* Level Header - only show for top level */}
          {level === 0 && (
            <div className="level-header">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Chief Executive Officer</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto rounded-full"></div>
            </div>
          )}
          
          {/* Employee Node Container - Center aligned */}
          <div className="flex justify-center">
            <div className={`org-node ${getNodeClass(employee)}`} onClick={() => openEmployeeDetail(employee)}>
              <div className="node-avatar">
                <span className="avatar-text">{employee.avatar}</span>
              </div>
              <div className="node-info">
                <div className="node-name">{employee.name}</div>
                <div className="node-position">{employee.position}</div>
                <div className="node-department">{employee.department}</div>
              </div>
              <div className="node-actions">
                <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); openEditEmployee(employee); }}>
                  <Edit size={14} />
                </button>
                <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(employee.id); }}>
                  <Trash2 size={14} />
                </button>
              </div>
              
              {/* Expand/Collapse Button */}
              {hasReports && (
                <div className="expand-button">
                  <button 
                    className="expand-btn"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      toggleNode(employee.id); 
                    }}
                    title={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Direct Reports (only if expanded) */}
          {hasReports && isExpanded && (
            <div className="direct-reports">
              {/* VP Level - Horizontal Layout */}
              {level === 0 && (
                <div className="vp-level">
                  <div className="level-header">
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Executive Leadership</h3>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full"></div>
                  </div>
                  <div className="vp-container">
                    {employee.children.map(vp => (
                      <div key={vp.id} className="vp-column">
                        <div className={`org-node ${getNodeClass(vp)}`} onClick={() => openEmployeeDetail(vp)}>
                          <div className="node-avatar">
                            <span className="avatar-text">{vp.avatar}</span>
                          </div>
                          <div className="node-info">
                            <div className="node-name">{vp.name}</div>
                            <div className="node-position">{vp.position}</div>
                            <div className="node-department">{vp.department}</div>
                          </div>
                          <div className="node-actions">
                            <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); openEditEmployee(vp); }}>
                              <Edit size={14} />
                            </button>
                            <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(vp.id); }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          {/* Expand/Collapse Button for VP */}
                          {vp.children && vp.children.length > 0 && (
                            <div className="expand-button">
                              <button 
                                className="expand-btn"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  toggleNode(vp.id); 
                                }}
                                title={expandedNodes.has(vp.id) ? "Collapse" : "Expand"}
                              >
                                {expandedNodes.has(vp.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Directors under VP - Vertical Layout */}
                        {vp.children && vp.children.length > 0 && expandedNodes.has(vp.id) && (
                          <div className="directors-container">
                            <div className="level-header">
                              <h4 className="text-lg font-medium text-gray-600 mb-2">Team Members</h4>
                              <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-purple-600 mx-auto rounded-full"></div>
                            </div>
                            <div className="directors-list">
                              {vp.children.map(director => (
                                <div key={director.id} className="director-item">
                                  <div className={`org-node ${getNodeClass(director)}`} onClick={() => openEmployeeDetail(director)}>
                                    <div className="node-avatar">
                                      <span className="avatar-text">{director.avatar}</span>
                                    </div>
                                    <div className="node-info">
                                      <div className="node-name">{director.name}</div>
                                      <div className="node-position">{director.position}</div>
                                      <div className="node-department">{director.department}</div>
                                    </div>
                                    <div className="node-actions">
                                      <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); openEditEmployee(director); }}>
                                        <Edit size={14} />
                                      </button>
                                      <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(director.id); }}>
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                    
                                    {/* Expand/Collapse Button for Director */}
                                    {director.children && director.children.length > 0 && (
                                      <div className="expand-button">
                                        <button 
                                          className="expand-btn"
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            toggleNode(director.id); 
                                          }}
                                          title={expandedNodes.has(director.id) ? "Collapse" : "Expand"}
                                        >
                                          {expandedNodes.has(director.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Director's Team Members */}
                                  {director.children && director.children.length > 0 && expandedNodes.has(director.id) && (
                                    <div className="team-members-container">
                                      <div className="level-header">
                                        <h5 className="text-md font-medium text-gray-500 mb-2">Team Members</h5>
                                        <div className="w-8 h-1 bg-gradient-to-r from-green-500 to-green-600 mx-auto rounded-full"></div>
                                      </div>
                                      <div className="team-members-list">
                                        {director.children.map(teamMember => (
                                          <div key={teamMember.id} className="team-member-item">
                                            <div className={`org-node ${getNodeClass(teamMember)}`} onClick={() => openEmployeeDetail(teamMember)}>
                                              <div className="node-avatar">
                                                <span className="avatar-text">{teamMember.avatar}</span>
                                              </div>
                                              <div className="node-info">
                                                <div className="node-name">{teamMember.name}</div>
                                                <div className="node-position">{teamMember.position}</div>
                                                <div className="node-department">{teamMember.department}</div>
                                              </div>
                                              <div className="node-actions">
                                                <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); openEditEmployee(teamMember); }}>
                                                  <Edit size={14} />
                                                </button>
                                                <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(teamMember.id); }}>
                                                  <Trash2 size={14} />
                                                </button>
                                              </div>
                                              
                                              {/* Expand/Collapse Button for Team Member */}
                                              {teamMember.children && teamMember.children.length > 0 && (
                                                <div className="expand-button">
                                                  <button 
                                                    className="expand-btn"
                                                    onClick={(e) => { 
                                                      e.stopPropagation(); 
                                                      toggleNode(teamMember.id); 
                                                    }}
                                                    title={expandedNodes.has(teamMember.id) ? "Collapse" : "Expand"}
                                                  >
                                                    {expandedNodes.has(teamMember.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };
    
    return (
      <div className="org-chart-container">
        <div className="org-chart">
          {hierarchy.map(ceo => renderEmployeeNode(ceo, 0))}
        </div>
      </div>
    );
  };

  const renderTreeNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="ml-4">
        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => openEmployeeDetail(node)}>
          <button
            onClick={(e) => { e.stopPropagation(); hasChildren && toggleNode(node.id); }}
            className="w-6 h-6 flex items-center justify-center"
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-sm">{node.avatar}</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{node.name}</h3>
              {node.position === 'CEO' && <Crown size={16} className="text-yellow-500" />}
              {node.position.includes('Manager') && <Shield size={16} className="text-blue-500" />}
            </div>
            <p className="text-sm text-gray-600">{node.position} • {node.department}</p>
            <p className="text-xs text-gray-500">{node.email}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{node.employeeId}</span>
            <div className="flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); openEditEmployee(node); }}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Edit"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(node.id); }}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-6">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organization Structure</h2>
          <p className="text-gray-600 mt-1">Manage employees and departments</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddDepartment(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Building size={16} />
            Add Department
          </button>
          <button
            onClick={() => setShowAddEmployee(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <UserPlus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalEmployees || employees.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-green-600">{analytics.departments || departments.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Building className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-2xl font-bold text-purple-600">{analytics.activeEmployees || employees.filter(e => e.status === 'active').length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Managers</p>
              <p className="text-2xl font-bold text-amber-600">{analytics.managers || employees.filter(e => e.position && e.position.toLowerCase().includes('manager')).length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Crown className="text-amber-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employees by name, email, position, or ID..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
              <div className="flex border rounded-lg">
                <button
                  onClick={() => setViewMode('chart')}
                  className={`px-4 py-3 ${viewMode === 'chart' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'} rounded-l-lg transition-colors`}
                >
                  Chart
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`px-4 py-3 ${viewMode === 'tree' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'} transition-colors`}
                >
                  Tree
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-3 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'} rounded-r-lg transition-colors`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Tree/List/Chart */}
        <div className="p-6">
          {viewMode === 'chart' ? (
            <div key={employees.length}>
              {renderOrgChart()}
            </div>
          ) : viewMode === 'tree' ? (
            <div className="space-y-2" key={employees.length}>
              {buildHierarchy().map(node => renderTreeNode(node))}
            </div>
          ) : (
            <div className="space-y-3" key={employees.length}>
              {filteredEmployees.map(employee => (
                <div key={employee.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => openEmployeeDetail(employee)}>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">{employee.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{employee.name}</h3>
                      {employee.position === 'CEO' && <Crown size={16} className="text-yellow-500" />}
                      {employee.position.includes('Manager') && <Shield size={16} className="text-blue-500" />}
                    </div>
                    <p className="text-sm text-gray-600">{employee.position} • {employee.department}</p>
                    <p className="text-xs text-gray-500">{employee.email} • {employee.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{employee.employeeId}</p>
                    <p className="text-xs text-gray-500">Hired: {new Date(employee.hireDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditEmployee(employee); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(employee.id); }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {(showAddEmployee || editingEmployee) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddEmployee(false);
                    setEditingEmployee(null);
                    resetEmployeeForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 modal-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                  <input
                    type="text"
                    value={employeeForm.employeeId}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="EMP001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="employee@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="+91-98765-43210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                  <input
                    type="text"
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <select
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                  <select
                    value={employeeForm.manager}
                    onChange={(e) => handleManagerSelection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">No Manager</option>
                    <option value="add_new_manager" className="text-blue-600 font-semibold">+ Add New Manager</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date *</label>
                  <input
                    type="date"
                    value={employeeForm.hireDate}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, hireDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                  <input
                    type="text"
                    value={employeeForm.salary}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, salary: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="₹8,00,000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={employeeForm.address}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Complete address"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                  <input
                    type="text"
                    value={employeeForm.emergencyContact}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Contact Name - Phone Number"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={editingEmployee ? handleEditEmployee : handleAddEmployee}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
                <button
                  onClick={() => {
                    setShowAddEmployee(false);
                    setEditingEmployee(null);
                    resetEmployeeForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Department Modal */}
      {(showAddDepartment || editingDepartment) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  {editingDepartment ? 'Edit Department' : 'Add New Department'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddDepartment(false);
                    setEditingDepartment(null);
                    resetDepartmentForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 modal-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Name *</label>
                  <input
                    type="text"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Technology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={departmentForm.description}
                    onChange={(e) => setDepartmentForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Department description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Head</label>
                  <select
                    value={departmentForm.head}
                    onChange={(e) => setDepartmentForm(prev => ({ ...prev, head: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Select Department Head</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                    <input
                      type="text"
                      value={departmentForm.budget}
                      onChange={(e) => setDepartmentForm(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="₹30,00,000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={departmentForm.location}
                      onChange={(e) => setDepartmentForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Bangalore"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Established Date</label>
                  <input
                    type="date"
                    value={departmentForm.establishedDate}
                    onChange={(e) => setDepartmentForm(prev => ({ ...prev, establishedDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={handleAddDepartment}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {editingDepartment ? 'Update Department' : 'Add Department'}
                </button>
                <button
                  onClick={() => {
                    setShowAddDepartment(false);
                    setEditingDepartment(null);
                    resetDepartmentForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Manager Modal */}
      {showManagerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Add New Manager</h3>
                <button
                  onClick={() => {
                    setShowManagerForm(false);
                    setIsCreatingManager(false);
                    resetManagerForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 modal-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manager Name *</label>
                  <input
                    type="text"
                    value={managerForm.name}
                    onChange={(e) => setManagerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Enter manager name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                  <input
                    type="text"
                    value={managerForm.employeeId}
                    onChange={(e) => setManagerForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="MGR001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={managerForm.email}
                    onChange={(e) => setManagerForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="manager@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={managerForm.phone}
                    onChange={(e) => setManagerForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="+91-98765-43210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                  <input
                    type="text"
                    value={managerForm.position}
                    onChange={(e) => setManagerForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Senior Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <select
                    value={managerForm.department}
                    onChange={(e) => setManagerForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reports To</label>
                  <select
                    value={managerForm.manager}
                    onChange={(e) => setManagerForm(prev => ({ ...prev, manager: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">No Manager</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date *</label>
                  <input
                    type="date"
                    value={managerForm.hireDate}
                    onChange={(e) => setManagerForm(prev => ({ ...prev, hireDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                  <input
                    type="text"
                    value={managerForm.salary}
                    onChange={(e) => setManagerForm(prev => ({ ...prev, salary: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="₹12,00,000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={managerForm.address}
                    onChange={(e) => setManagerForm(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Complete address"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                  <input
                    type="text"
                    value={managerForm.emergencyContact}
                    onChange={(e) => setManagerForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Contact Name - Phone Number"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={handleAddManager}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add Manager
                </button>
                <button
                  onClick={() => {
                    setShowManagerForm(false);
                    setIsCreatingManager(false);
                    resetManagerForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {showEmployeeDetail && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{selectedEmployee.avatar}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedEmployee.name}</h3>
                    <p className="text-gray-600">{selectedEmployee.position}</p>
                    <p className="text-sm text-gray-500">{selectedEmployee.department}</p>
                  </div>
                </div>
                <button
                  onClick={closeEmployeeDetail}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6 modal-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Personal Information</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-900">{selectedEmployee.name}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{selectedEmployee.email}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900">{selectedEmployee.phone || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Employee ID</label>
                      <p className="text-gray-900">{selectedEmployee.employeeId}</p>
                    </div>
                  </div>
                </div>

                {/* Work Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Work Information</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Position</label>
                      <p className="text-gray-900">{selectedEmployee.position}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Department</label>
                      <p className="text-gray-900">{selectedEmployee.department}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Manager</label>
                      <p className="text-gray-900">
                        {selectedEmployee.manager ? 
                          employees.find(emp => emp.id === parseInt(selectedEmployee.manager))?.name || 'Unknown' 
                          : 'No Manager'
                        }
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Hire Date</label>
                      <p className="text-gray-900">{selectedEmployee.hireDate || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4 md:col-span-2">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Additional Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Salary</label>
                      <p className="text-gray-900">{selectedEmployee.salary || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedEmployee.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedEmployee.status || 'active'}
                      </span>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-gray-900">{selectedEmployee.address || 'Not provided'}</p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                      <p className="text-gray-900">{selectedEmployee.emergencyContact || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    closeEmployeeDetail();
                    openEditEmployee(selectedEmployee);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Edit Employee
                </button>
                <button
                  onClick={() => {
                    closeEmployeeDetail();
                    handleDeleteEmployee(selectedEmployee.id);
                  }}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={closeEmployeeDetail}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationStructureView;
