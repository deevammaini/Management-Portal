import React, { useState } from 'react';
import { 
  Building, UserPlus, MapPin, Phone, Package, FileText, 
  Upload, X, CheckCircle, AlertCircle, Calendar, CreditCard,
  Users, Settings, Award, ClipboardList
} from 'lucide-react';

const ComprehensiveRegistrationForm = ({ isOpen, onClose, onSubmit, formData, onInputChange }) => {
  const [currentSection, setCurrentSection] = useState(0);
  
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

  const renderCompanyDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name of the Company/Organization *</label>
          <input
            type="text"
            value={formData.companyName || ''}
            onChange={(e) => onInputChange('companyName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter company name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type of Company *</label>
          <select
            value={formData.companyType || ''}
            onChange={(e) => onInputChange('companyType', e.target.value)}
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
          onChange={(e) => onInputChange('proprietorPhoto', e.target.files[0])}
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
            onChange={(e) => onInputChange('contactPersonName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter contact person name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Designation *</label>
          <input
            type="text"
            value={formData.contactPersonDesignation || ''}
            onChange={(e) => onInputChange('contactPersonDesignation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter designation"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visiting Card</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => onInputChange('visitingCard', e.target.files[0])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Attach visiting card</p>
      </div>
    </div>
  );

  const renderAddress = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Address for Communication/Registered Office Address *</label>
        <textarea
          value={formData.communicationAddress || ''}
          onChange={(e) => onInputChange('communicationAddress', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Enter communication address"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Registered Office Address (if different)</label>
        <textarea
          value={formData.registeredOfficeAddress || ''}
          onChange={(e) => onInputChange('registeredOfficeAddress', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Enter registered office address"
        />
      </div>
    </div>
  );

  const renderContactDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Office Phone</label>
          <input
            type="tel"
            value={formData.officePhone || ''}
            onChange={(e) => onInputChange('officePhone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter office phone"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Office Fax</label>
          <input
            type="tel"
            value={formData.officeFax || ''}
            onChange={(e) => onInputChange('officeFax', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter office fax"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
          <input
            type="tel"
            value={formData.mobileNumber || ''}
            onChange={(e) => onInputChange('mobileNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter mobile number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <input
            type="email"
            value={formData.emailAddress || ''}
            onChange={(e) => onInputChange('emailAddress', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter email address"
          />
        </div>
      </div>
    </div>
  );

  const renderBusinessDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Core Business Activity *</label>
          <input
            type="text"
            value={formData.coreBusinessActivity || ''}
            onChange={(e) => onInputChange('coreBusinessActivity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter core business activity"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type of Activity/Work for Registration *</label>
          <input
            type="text"
            value={formData.typeOfActivity || ''}
            onChange={(e) => onInputChange('typeOfActivity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter type of activity"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Geographic Areas</label>
          <input
            type="text"
            value={formData.preferredGeographicAreas || ''}
            onChange={(e) => onInputChange('preferredGeographicAreas', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter preferred geographic areas"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Establishment/Incorporation</label>
          <input
            type="date"
            value={formData.dateOfEstablishment || ''}
            onChange={(e) => onInputChange('dateOfEstablishment', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Locally Registered Firm or from Another Country?</label>
        <input
          type="text"
          value={formData.locallyRegistered || ''}
          onChange={(e) => onInputChange('locallyRegistered', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Specify country and attach registration certificate"
        />
        <p className="text-xs text-gray-500 mt-1">Please specify and attach relevant registration certificate</p>
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
            onChange={(e) => onInputChange('bankName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter bank name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bank Branch & Address</label>
          <input
            type="text"
            value={formData.bankBranch || ''}
            onChange={(e) => onInputChange('bankBranch', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter bank branch and address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name *</label>
          <input
            type="text"
            value={formData.accountHolderName || ''}
            onChange={(e) => onInputChange('accountHolderName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter account holder name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
          <input
            type="text"
            value={formData.accountNumber || ''}
            onChange={(e) => onInputChange('accountNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter account number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
          <select
            value={formData.accountType || ''}
            onChange={(e) => onInputChange('accountType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select Account Type</option>
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">RTGS Code</label>
          <input
            type="text"
            value={formData.rtgsCode || ''}
            onChange={(e) => onInputChange('rtgsCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter RTGS code"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Credit Limit</label>
          <input
            type="text"
            value={formData.creditLimit || ''}
            onChange={(e) => onInputChange('creditLimit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter credit limit"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">OD Limit</label>
          <input
            type="text"
            value={formData.odLimit || ''}
            onChange={(e) => onInputChange('odLimit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter OD limit"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">BG Limit</label>
          <input
            type="text"
            value={formData.bgLimit || ''}
            onChange={(e) => onInputChange('bgLimit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter BG limit"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">LC Limit</label>
          <input
            type="text"
            value={formData.lcLimit || ''}
            onChange={(e) => onInputChange('lcLimit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter LC limit"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">NRC No / Passport No</label>
        <input
          type="text"
          value={formData.nrcPassportNo || ''}
          onChange={(e) => onInputChange('nrcPassportNo', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Enter NRC or Passport number"
        />
      </div>
    </div>
  );

  const renderCustomersAndServices = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Major Customer Names *</label>
        <textarea
          value={formData.majorCustomers || ''}
          onChange={(e) => onInputChange('majorCustomers', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="List major customers with contact names (attach list with contact names)"
        />
        <p className="text-xs text-gray-500 mt-1">Attach list with contact names</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Type of Services Provided to Existing Clients *</label>
        <textarea
          value={formData.servicesToExistingClients || ''}
          onChange={(e) => onInputChange('servicesToExistingClients', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Describe services provided to existing clients"
        />
      </div>
    </div>
  );

  const renderBusinessTurnover = () => (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Business Details - Turnover (Previous 3 years)</h4>
      <div className="space-y-4">
        {[1, 2, 3].map(year => (
          <div key={year} className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-3">Year {year}</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Value</label>
                <input
                  type="text"
                  value={formData[`orderValueYear${year}`] || ''}
                  onChange={(e) => onInputChange(`orderValueYear${year}`, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter order value"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Executed Value</label>
                <input
                  type="text"
                  value={formData[`executedValueYear${year}`] || ''}
                  onChange={(e) => onInputChange(`executedValueYear${year}`, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter executed value"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreviousWork = () => (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Previous Work Experience with YellowStone</h4>
      <div className="space-y-4">
        {[1, 2, 3].map(year => (
          <div key={year} className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-3">Year {year}</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Details</label>
                <textarea
                  value={formData[`previousWorkYear${year}`] || ''}
                  onChange={(e) => onInputChange(`previousWorkYear${year}`, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Describe work done with YellowStone"
                />
              </div>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Order Numbers</label>
            <input
              type="text"
              value={formData.workOrderNumbers || ''}
              onChange={(e) => onInputChange('workOrderNumbers', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter work order numbers"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Order Dates</label>
            <input
              type="text"
              value={formData.workOrderDates || ''}
              onChange={(e) => onInputChange('workOrderDates', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter work order dates"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Order Values</label>
            <input
              type="text"
              value={formData.workOrderValues || ''}
              onChange={(e) => onInputChange('workOrderValues', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter work order values"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">Details can be listed in additional attachment, WO Copy</p>
      </div>
    </div>
  );

  const renderCertifications = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Quality Certifications</label>
        <textarea
          value={formData.qualityCertifications || ''}
          onChange={(e) => onInputChange('qualityCertifications', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="E.g., ISO 9001, ISO 14001, OHSAS 18001 etc."
        />
      </div>
      
      <div className="space-y-4">
        <h5 className="font-medium text-gray-900">Statutory Compliance Information</h5>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Certificate of Incorporation</label>
          <input
            type="file"
            accept=".pdf,.jpg,.png"
            onChange={(e) => onInputChange('certificateOfIncorporation', e.target.files[0])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Federation of Chamber of Commerce & Industries</label>
          <input
            type="text"
            value={formData.fcciRegistration || ''}
            onChange={(e) => onInputChange('fcciRegistration', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter FCCI registration details"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Other Registration Numbers</label>
          <input
            type="text"
            value={formData.otherRegistrationNumbers || ''}
            onChange={(e) => onInputChange('otherRegistrationNumbers', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter other registration numbers"
          />
        </div>
      </div>
    </div>
  );

  const renderManpowerDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total Number of Teams Available</label>
          <input
            type="text"
            value={formData.totalTeamsAvailable || ''}
            onChange={(e) => onInputChange('totalTeamsAvailable', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter total teams available"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Teams for YellowStone Myanmar Ltd</label>
          <input
            type="text"
            value={formData.teamsForYellowStone || ''}
            onChange={(e) => onInputChange('teamsForYellowStone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter teams for YellowStone"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Persons in Each Team</label>
          <input
            type="text"
            value={formData.personsPerTeam || ''}
            onChange={(e) => onInputChange('personsPerTeam', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter persons per team"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Parallel Teams Deployable</label>
          <input
            type="text"
            value={formData.parallelTeamsDeployable || ''}
            onChange={(e) => onInputChange('parallelTeamsDeployable', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter parallel teams deployable"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Additional Teams Arrangable</label>
          <input
            type="text"
            value={formData.additionalTeamsArrangable || ''}
            onChange={(e) => onInputChange('additionalTeamsArrangable', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter additional teams arrangable"
          />
        </div>
      </div>
    </div>
  );

  const renderCapabilities = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Capability for Executing Number of Sites in a Year</label>
        <input
          type="text"
          value={formData.sitesExecutablePerYear || ''}
          onChange={(e) => onInputChange('sitesExecutablePerYear', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          placeholder="Enter number of sites executable per year"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Machinery, Tools & Tackles and Safety Gear</label>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Availability</label>
            <textarea
              value={formData.machineryToolsAvailable || ''}
              onChange={(e) => onInputChange('machineryToolsAvailable', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="If yes, provide details"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">If Not Available: Period Required to Arrange</label>
            <input
              type="text"
              value={formData.machineryToolsPeriod || ''}
              onChange={(e) => onInputChange('machineryToolsPeriod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter period required to arrange"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderGeneralInformation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Normal Working Hours</label>
          <input
            type="text"
            value={formData.normalWorkingHours || ''}
            onChange={(e) => onInputChange('normalWorkingHours', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter normal working hours"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Whether Work for Additional Hours?</label>
          <select
            value={formData.workAdditionalHours || ''}
            onChange={(e) => onInputChange('workAdditionalHours', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Whether Work on Weekly Offs or Holidays?</label>
          <select
            value={formData.workOnHolidays || ''}
            onChange={(e) => onInputChange('workOnHolidays', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderOrganizationDetails = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Organization Details</label>
        <p className="text-sm text-gray-600 mb-4">Attach the Org chart, Project Team Structure and Escalation Matrix with Names, age, Qualification, cell nos and email addresses</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Management Team</label>
            <textarea
              value={formData.managementTeam || ''}
              onChange={(e) => onInputChange('managementTeam', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter management team details"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name of Project Manager</label>
            <input
              type="text"
              value={formData.projectManagerName || ''}
              onChange={(e) => onInputChange('projectManagerName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter project manager name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Technical Team</label>
            <textarea
              value={formData.technicalTeam || ''}
              onChange={(e) => onInputChange('technicalTeam', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter technical team details"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commercial Team</label>
            <textarea
              value={formData.commercialTeam || ''}
              onChange={(e) => onInputChange('commercialTeam', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter commercial team details"
            />
          </div>
        </div>
        
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organization Chart</label>
            <input
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={(e) => onInputChange('orgChart', e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Team Structure</label>
            <input
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={(e) => onInputChange('projectTeamStructure', e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Escalation Matrix</label>
            <input
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={(e) => onInputChange('escalationMatrix', e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeclaration = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Declaration</h4>
        <div className="space-y-4">
          <div className="text-sm text-gray-700">
            <p className="mb-2">I/We certify, confirm and declare that the information furnished on this registration form are correct to the best of my knowledge and belief & No employee or direct relation of any employee of Yellow Stone Group of companies is in any way connected as Partner/Shareholder/Director/Advisor/Consultant/Employee etc. with our company/organization (in event of any such association same to declared at the time of registration)</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name & Designation of Signing Authority *</label>
              <input
                type="text"
                value={formData.signingAuthorityName || ''}
                onChange={(e) => onInputChange('signingAuthorityName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter name and designation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Seal</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => onInputChange('companySeal', e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSupplierBankDetails = () => (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Supplier Bank Account Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier/Beneficiary Photograph</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onInputChange('beneficiaryPhotograph', e.target.files[0])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier/Beneficiary Company Name</label>
          <input
            type="text"
            value={formData.beneficiaryCompanyName || ''}
            onChange={(e) => onInputChange('beneficiaryCompanyName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter company name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier/Beneficiary Individual Name (Proprietorship)</label>
          <input
            type="text"
            value={formData.beneficiaryIndividualName || ''}
            onChange={(e) => onInputChange('beneficiaryIndividualName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter individual name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier/Beneficiary Address</label>
          <textarea
            value={formData.beneficiaryAddress || ''}
            onChange={(e) => onInputChange('beneficiaryAddress', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier/Beneficiary Bank & Branch Name & Address</label>
          <input
            type="text"
            value={formData.beneficiaryBankBranch || ''}
            onChange={(e) => onInputChange('beneficiaryBankBranch', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter bank and branch details"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier/Beneficiary Bank Account No.</label>
          <input
            type="text"
            value={formData.beneficiaryAccountNumber || ''}
            onChange={(e) => onInputChange('beneficiaryAccountNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter account number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SWIFT Code of Supplier/Beneficiary Bank Branch</label>
          <input
            type="text"
            value={formData.swiftCode || ''}
            onChange={(e) => onInputChange('swiftCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter SWIFT code"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type of Account</label>
          <select
            value={formData.accountTypeSupplier || ''}
            onChange={(e) => onInputChange('accountTypeSupplier', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select Account Type</option>
            <option value="Saving">Saving</option>
            <option value="Current">Current</option>
            <option value="CC">CC</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier/Beneficiary Contact Person Name</label>
          <input
            type="text"
            value={formData.beneficiaryContactPerson || ''}
            onChange={(e) => onInputChange('beneficiaryContactPerson', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter contact person name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier/Beneficiary Contact Person Email</label>
          <input
            type="email"
            value={formData.beneficiaryEmail || ''}
            onChange={(e) => onInputChange('beneficiaryEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter email address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier/Beneficiary Telephone Number</label>
          <input
            type="tel"
            value={formData.beneficiaryTelephone || ''}
            onChange={(e) => onInputChange('beneficiaryTelephone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter telephone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier/Beneficiary Fax Number</label>
          <input
            type="tel"
            value={formData.beneficiaryFax || ''}
            onChange={(e) => onInputChange('beneficiaryFax', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter fax number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplier/Beneficiary NRC & Passport No.</label>
          <input
            type="text"
            value={formData.beneficiaryNrcPassport || ''}
            onChange={(e) => onInputChange('beneficiaryNrcPassport', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter NRC or Passport number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Specimen Signature of Supplier/Beneficiary</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => onInputChange('specimenSignature', e.target.files[0])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Attested by Bank</p>
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
      case 13: return renderOrganizationDetails();
      case 14: return renderDeclaration();
      case 15: return renderSupplierBankDetails();
      default: return renderCompanyDetails();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">YellowStone Vendor Registration Form</h3>
              <p className="text-sm text-gray-600 mt-1">Complete all sections for vendor registration approval</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Registration Sections</h4>
            <div className="space-y-2">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentSection === index
                      ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <section.icon size={16} />
                  <span className="text-sm font-medium">{section.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  {React.createElement(sections[currentSection].icon, { 
                    className: "w-5 h-5 mr-2 text-amber-600" 
                  })}
                  {sections[currentSection].title}
                </h4>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Section {currentSection + 1} of {sections.length}
                </p>
              </div>

              {renderCurrentSection()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                  disabled={currentSection === 0}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex space-x-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  {currentSection === sections.length - 1 ? (
                    <button
                      onClick={onSubmit}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Submit Registration
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveRegistrationForm;
