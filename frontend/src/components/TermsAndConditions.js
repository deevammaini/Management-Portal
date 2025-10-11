import React from 'react';
import { X, FileText } from 'lucide-react';

const TermsAndConditions = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-semibold text-gray-900">Terms and Conditions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="prose prose-gray max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yellow Stone Group - Terms and Conditions</h3>
            
            <div className="space-y-6 text-sm text-gray-700">
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h4>
                <p>
                  By accessing and using Yellow Stone Group's vendor portal and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">2. Vendor Registration</h4>
                <p>
                  All vendors must complete the registration process and provide accurate information. Yellow Stone Group reserves the right to reject any registration application at its sole discretion. Vendors are responsible for maintaining the confidentiality of their account credentials.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">3. Business Conduct</h4>
                <p>
                  Vendors agree to conduct business in accordance with all applicable laws and regulations. Any vendor found to be in violation of these terms may have their registration revoked and access terminated immediately.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">4. Confidentiality</h4>
                <p>
                  Vendors acknowledge that they may receive confidential information from Yellow Stone Group and agree to maintain strict confidentiality. This includes but is not limited to business strategies, financial information, and proprietary data.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">5. Intellectual Property</h4>
                <p>
                  All intellectual property rights in the vendor portal and related materials remain the property of Yellow Stone Group. Vendors may not reproduce, distribute, or modify any content without written permission.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">6. Limitation of Liability</h4>
                <p>
                  Yellow Stone Group shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from the use of the vendor portal or services.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">7. Termination</h4>
                <p>
                  Either party may terminate this agreement at any time with written notice. Upon termination, vendors must cease all use of the portal and return any confidential information.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">8. Governing Law</h4>
                <p>
                  These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Yellow Stone Group operates.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">9. Amendments</h4>
                <p>
                  Yellow Stone Group reserves the right to modify these terms at any time. Vendors will be notified of significant changes and continued use constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">10. Contact Information</h4>
                <p>
                  For questions regarding these terms and conditions, please contact Yellow Stone Group's legal department at legal@yellowstonegroup.com.
                </p>
              </section>
            </div>

            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
