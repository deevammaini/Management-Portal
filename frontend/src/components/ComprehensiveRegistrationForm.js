import React, { useState } from 'react';
import { 
  Building, UserPlus, MapPin, Phone, Package, FileText, 
  Upload, X, CheckCircle, AlertCircle, Calendar, CreditCard,
  Users, Settings, Award, ClipboardList
} from 'lucide-react';

// Mock Terms and Conditions Component
const TermsAndConditions = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Terms and Conditions</h2>
          <button type="button" onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
      </div>
      <div className="p-6 overflow-y-auto max-h-[60vh]">
        <p className="text-gray-700 mb-4">
          These are the terms and conditions for vendor registration. Please read carefully before accepting.
        </p>
        <p className="text-gray-700">
          By registering as a vendor, you agree to comply with all company policies and regulations.
        </p>
      </div>
      <div className="bg-gray-50 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

// Mock Privacy Policy Component
const PrivacyPolicy = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Privacy Policy</h2>
          <button type="button" onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
      </div>
      <div className="p-6 overflow-y-auto max-h-[60vh]">
        <p className="text-gray-700 mb-4">
          This privacy policy outlines how we collect, use, and protect your information.
        </p>
        <p className="text-gray-700">
          Your personal information will be kept confidential and used only for vendor registration purposes.
        </p>
      </div>
      <div className="bg-gray-50 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

const ComprehensiveRegistrationForm = ({ isOpen, onClose, onSubmit }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // Internal form data state
  const [formData, setFormData] = useState({
    // Company Details
    companyName: '',
    companyType: '',
    proprietorPhoto: null,
    
    // Contact Person
    contactPersonName: '',
    designation: '',
    contactPersonPhoto: null,
    
    // Address
    communicationAddress: '',
    registeredOfficeAddress: '',
    
    // Contact Details
    emailAddress: '',
    phoneNumber: '',
    faxNumber: '',
    website: '',
    
    // Business Details
    natureOfBusiness: '',
    yearOfEstablishment: '',
    panNumber: '',
    
    // Bank Details
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    
    // Customers and Services
    majorCustomers: '',
    servicesOffered: '',
    
    // Business Turnover
    annualTurnover: '',
    netWorth: '',
    
    // Previous Work
    previousWorkExperience: '',
    
    // Certifications
    certifications: '',
    
    // Manpower Details
    totalEmployees: '',
    technicalStaff: '',
    
    // Capabilities
    technicalCapabilities: '',
    
    // General Information
    additionalInformation: '',
    
    // Organization
    organizationStructure: '',
    
    // Declaration
    declaration1: false,
    declaration2: false,
    
    // Supplier Bank Details
    supplierBankName: '',
    supplierAccountNumber: '',
    supplierIfscCode: '',
    supplierBranchName: ''
  });
  
  // Internal input change handler
  const handleInputChange = (field, value) => {
    console.log(`Form field changed: ${field} = "${value}"`);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Debug: Log component state
  console.log('ComprehensiveRegistrationForm rendered, currentSection:', currentSection);
  console.log('Current form data:', formData);
  
  const sections = [
    { id: 'company', title: 'Company Details', icon: Building },
    { id: 'contact', title: 'Contact Person', icon: UserPlus },
    { id: 'address', title: 'Address', icon: MapPin },
    { id: 'contact-details', title: 'Contact Details', icon: Phone },
    { id: 'business', title: 'Business Details', icon: Package },
    { id: 'bank', title: 'Bank Details', icon: CreditCard },
    { id: 'customers', title: 'Customers & Services', icon: Users },
    { id: 'turnover', title: 'Business Turnover', icon: FileText },
    { id: 'previous-work', title: 'Previous Work', icon: ClipboardList },
    { id: 'certifications', title: 'Certifications', icon: Award },
    { id: 'manpower', title: 'Manpower Details', icon: Users },
    { id: 'capabilities', title: 'Capabilities', icon: Settings },
    { id: 'general', title: 'General Information', icon: Calendar },
    { id: 'organization', title: 'Organization', icon: Building },
    { id: 'declaration', title: 'Declaration', icon: CheckCircle },
    { id: 'bank-supplier', title: 'Supplier Bank Details', icon: CreditCard }
  ];

  // Lightweight section completion (for sidebar badges)
  const isSectionComplete = (idx) => {
    switch (idx) {
      case 0: return !!formData.companyName && !!formData.companyType;
      case 1: return !!formData.contactPersonName && !!formData.contactPersonDesignation;
      case 2: return !!formData.communicationAddress;
      case 3: return !!formData.emailAddress && !!formData.phoneNumber;
      case 4: return !!formData.natureOfBusiness && !!formData.yearOfEstablishment;
      case 5: return !!formData.bankName && !!formData.accountNumber && !!formData.ifscCode;
      case 14: return !!formData.declaration1 && !!formData.declaration2;
      default: return false;
    }
  };

  const renderCompanyDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name of the Company/Organization *</label>
          <input
            type="text"
            value={formData.companyName || ''}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter company name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type of Company *</label>
          <select
            value={formData.companyType || ''}
            onChange={(e) => handleInputChange('companyType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select Company Type</option>
            <option value="Proprietary">Proprietary</option>
            <option value="Partnership">Partnership</option>
            <option value="Pvt Ltd">Pvt Ltd</option>
            <option value="Public Ltd">Public Ltd</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Proprietor/Partner Photograph</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleInputChange('proprietorPhoto', e.target.files[0])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Upload recent photograph (in case of public ltd, upload marketing manager/account head photograph)</p>
      </div>
    </div>
  );

  const renderContactPerson = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person Name *</label>
          <input
            type="text"
            value={formData.contactPersonName || ''}
            onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter contact person name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Designation *</label>
          <input
            type="text"
            value={formData.contactPersonDesignation || ''}
            onChange={(e) => handleInputChange('contactPersonDesignation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter designation"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visiting Card</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleInputChange('visitingCard', e.target.files[0])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderAddress = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Communication Address *</label>
        <textarea
          value={formData.communicationAddress || ''}
          onChange={(e) => handleInputChange('communicationAddress', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          rows={3}
          placeholder="Enter complete communication address"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Registered Office Address</label>
        <textarea
          value={formData.registeredOfficeAddress || ''}
          onChange={(e) => handleInputChange('registeredOfficeAddress', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          rows={3}
          placeholder="Enter registered office address (if different)"
        />
      </div>
    </div>
  );

  const renderContactDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <input
            type="email"
            value={formData.emailAddress || ''}
            onChange={(e) => handleInputChange('emailAddress', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter email address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="tel"
            value={formData.phoneNumber || ''}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter phone number"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fax Number</label>
          <input
            type="tel"
            value={formData.faxNumber || ''}
            onChange={(e) => handleInputChange('faxNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter fax number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
          <input
            type="url"
            value={formData.website || ''}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter website URL"
          />
        </div>
      </div>
    </div>
  );

  const renderBusinessDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nature of Business *</label>
          <input
            type="text"
            value={formData.natureOfBusiness || ''}
            onChange={(e) => handleInputChange('natureOfBusiness', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter nature of business"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Year of Establishment *</label>
          <input
            type="number"
            value={formData.yearOfEstablishment || ''}
            onChange={(e) => handleInputChange('yearOfEstablishment', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter year"
            min="1900"
            max="2024"
          />
        </div>
        </div>
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number *</label>
        <input
          type="text"
          value={formData.panNumber || ''}
          onChange={(e) => handleInputChange('panNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Enter PAN number"
          maxLength="10"
        />
      </div>
    </div>
  );

  const renderBankDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
          <input
            type="text"
            value={formData.bankName || ''}
            onChange={(e) => handleInputChange('bankName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter bank name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
          <input
            type="text"
            value={formData.accountNumber || ''}
            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter account number"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code *</label>
          <input
            type="text"
            value={formData.ifscCode || ''}
            onChange={(e) => handleInputChange('ifscCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter IFSC code"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
          <input
            type="text"
            value={formData.branchName || ''}
            onChange={(e) => handleInputChange('branchName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter branch name"
          />
        </div>
      </div>
    </div>
  );

  const renderCustomersAndServices = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Major Customers</label>
        <textarea
          value={formData.majorCustomers || ''}
          onChange={(e) => handleInputChange('majorCustomers', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          rows={4}
          placeholder="List major customers"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered</label>
        <textarea
          value={formData.servicesOffered || ''}
          onChange={(e) => handleInputChange('servicesOffered', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          rows={4}
          placeholder="Describe services offered"
        />
      </div>
    </div>
  );

  const renderBusinessTurnover = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Annual Turnover (Last 3 Years)</label>
                <input
                  type="text"
            value={formData.annualTurnover || ''}
            onChange={(e) => handleInputChange('annualTurnover', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter annual turnover"
                />
              </div>
              <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Net Worth</label>
                <input
                  type="text"
            value={formData.netWorth || ''}
            onChange={(e) => handleInputChange('netWorth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter net worth"
                />
              </div>
      </div>
    </div>
  );

  const renderPreviousWork = () => (
    <div className="space-y-6">
              <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Previous Work Experience</label>
                <textarea
          value={formData.previousWorkExperience || ''}
          onChange={(e) => handleInputChange('previousWorkExperience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          rows={6}
          placeholder="Describe previous work experience and projects"
        />
      </div>
    </div>
  );

  const renderCertifications = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Certifications & Licenses</label>
        <textarea
          value={formData.certifications || ''}
          onChange={(e) => handleInputChange('certifications', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          rows={6}
          placeholder="List all certifications and licenses"
        />
      </div>
    </div>
  );

  const renderManpowerDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total Employees</label>
          <input
            type="number"
            value={formData.totalEmployees || ''}
            onChange={(e) => handleInputChange('totalEmployees', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter total number of employees"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Technical Staff</label>
          <input
            type="number"
            value={formData.technicalStaff || ''}
            onChange={(e) => handleInputChange('technicalStaff', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter number of technical staff"
            min="0"
          />
        </div>
      </div>
    </div>
  );

  const renderCapabilities = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Technical Capabilities</label>
            <textarea
          value={formData.technicalCapabilities || ''}
          onChange={(e) => handleInputChange('technicalCapabilities', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          rows={6}
          placeholder="Describe technical capabilities and expertise"
        />
      </div>
    </div>
  );

  const renderGeneralInformation = () => (
    <div className="space-y-6">
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
        <textarea
          value={formData.additionalInformation || ''}
          onChange={(e) => handleInputChange('additionalInformation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          rows={6}
          placeholder="Any additional information you'd like to provide"
        />
      </div>
    </div>
  );

  const renderOrganization = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Organization Structure</label>
            <textarea
          value={formData.organizationStructure || ''}
          onChange={(e) => handleInputChange('organizationStructure', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          rows={6}
          placeholder="Describe organization structure"
        />
      </div>
    </div>
  );

  const renderDeclaration = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-amber-800 mb-4">Declaration</h3>
        <div className="space-y-4">
          <label className="flex items-start space-x-3">
              <input
              type="checkbox"
              checked={formData.declaration1 || false}
              onChange={(e) => handleInputChange('declaration1', e.target.checked)}
              className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              I declare that the information provided above is true and correct to the best of my knowledge.
            </span>
          </label>
          <label className="flex items-start space-x-3">
              <input
                type="checkbox"
              checked={formData.declaration2 || false}
              onChange={(e) => handleInputChange('declaration2', e.target.checked)}
                className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-amber-600 hover:text-amber-700 underline">Terms and Conditions</button> and <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-amber-600 hover:text-amber-700 underline">Privacy Policy</button>.
            </span>
              </label>
        </div>
      </div>
    </div>
  );

  const renderSupplierBankDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Bank Name</label>
          <input
            type="text"
            value={formData.supplierBankName || ''}
            onChange={(e) => handleInputChange('supplierBankName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter supplier bank name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Account Number</label>
          <input
            type="text"
            value={formData.supplierAccountNumber || ''}
            onChange={(e) => handleInputChange('supplierAccountNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter supplier account number"
          />
        </div>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier IFSC Code</label>
          <input
            type="text"
            value={formData.supplierIfscCode || ''}
            onChange={(e) => handleInputChange('supplierIfscCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter supplier IFSC code"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Branch Name</label>
          <input
            type="text"
            value={formData.supplierBranchName || ''}
            onChange={(e) => handleInputChange('supplierBranchName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter supplier branch name"
          />
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0: return renderCompanyDetails();
      case 1: return renderContactPerson();
      case 2: return renderAddress();
      case 3: return renderContactDetails();
      case 4: return renderBusinessDetails();
      case 5: return renderBankDetails();
      case 6: return renderCustomersAndServices();
      case 7: return renderBusinessTurnover();
      case 8: return renderPreviousWork();
      case 9: return renderCertifications();
      case 10: return renderManpowerDetails();
      case 11: return renderCapabilities();
      case 12: return renderGeneralInformation();
      case 13: return renderOrganization();
      case 14: return renderDeclaration();
      case 15: return renderSupplierBankDetails();
      default: return renderCompanyDetails();
    }
  };

  const nextSection = () => {
    console.log('=== NEXT BUTTON CLICKED ===');
    console.log('currentSection:', currentSection);
    console.log('sections.length:', sections.length);
    
    if (currentSection < sections.length - 1) {
      console.log('Moving to section:', currentSection + 1);
      setCurrentSection(currentSection + 1);
      console.log('Navigation successful');
    } else {
      console.log('Already at last section');
    }
  };

  const prevSection = () => {
    console.log('=== PREVIOUS BUTTON CLICKED ===');
    console.log('currentSection:', currentSection);
    
    if (currentSection > 0) {
      console.log('Moving to section:', currentSection - 1);
      setCurrentSection(currentSection - 1);
      console.log('Navigation successful');
    } else {
      console.log('Already at first section');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900/40 via-indigo-900/40 to-purple-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Vendor Registration</h2>
              <p className="text-blue-100/90 mt-1 text-sm">Complete all sections to request full portal access</p>
            </div>
            <button type="button" onClick={onClose} className="text-white/90 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Sidebar - Steps */}
          <aside className="md:col-span-4 lg:col-span-3 bg-gray-50 border-r p-4 overflow-y-auto max-h-[66vh]">
            <div className="space-y-2">
              {sections.map((s, i) => {
                const Icon = s.icon;
                const active = i === currentSection;
                const done = i < currentSection || isSectionComplete(i);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentSection(i)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors ${
                      active
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : done
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={16} />
                      <span className="text-sm font-medium">{s.title}</span>
                    </span>
                    {done && (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-green-600 text-white rounded-full">Done</span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(((currentSection + 1) / sections.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }} />
              </div>
            </div>
          </aside>

          {/* Content */}
          <section className="md:col-span-8 lg:col-span-9 p-6 overflow-y-auto max-h-[66vh]">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">{sections[currentSection]?.title || 'Loading...'}</h3>
              <p className="text-gray-600 text-sm">Please fill in the required information for this section.</p>
            </div>
            {renderCurrentSection()}
          </section>
        </div>

        {/* Footer */}
        <div className="bg-white border-t px-6 py-4 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between items-center">
          <button
            type="button"
            onClick={prevSection}
            disabled={currentSection === 0}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            {currentSection === sections.length - 1 ? (
              <button
                type="button"
                onClick={() => onSubmit(formData)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow"
              >
                Submit Registration
              </button>
            ) : (
              <button
                type="button"
                onClick={nextSection}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <TermsAndConditions onClose={() => setShowTermsModal(false)} />
      )}
      
      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <PrivacyPolicy onClose={() => setShowPrivacyModal(false)} />
      )}
    </div>
  );
};

export default ComprehensiveRegistrationForm;