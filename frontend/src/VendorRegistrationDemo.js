import React, { useState } from 'react';
import ComprehensiveRegistrationForm from './components/ComprehensiveRegistrationForm';

// Demo wrapper to test the form
const VendorRegistrationDemo = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    alert('Registration submitted successfully!');
    setIsFormOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Vendor Registration System</h1>
        <p className="text-gray-600 mb-8">Complete the registration form to become an approved vendor</p>
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 font-medium text-lg shadow-lg"
        >
          Start Registration
        </button>
      </div>

      <ComprehensiveRegistrationForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        formData={formData}
        onInputChange={handleInputChange}
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
      />
    </div>
  );
};

export default VendorRegistrationDemo;
