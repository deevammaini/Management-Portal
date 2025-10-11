import React from 'react';
import { X, Shield } from 'lucide-react';

const PrivacyPolicy = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-semibold text-gray-900">Privacy Policy</h2>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yellow Stone Group - Privacy Policy</h3>
            
            <div className="space-y-6 text-sm text-gray-700">
              <section>
                <h4 className="font-semibold text-gray-900 mb-2">1. Information We Collect</h4>
                <p>
                  We collect information you provide directly to us, such as when you register as a vendor, complete forms, or communicate with us. This may include:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Company information (name, address, contact details)</li>
                  <li>Personal information (names, titles, email addresses)</li>
                  <li>Business details (certifications, capabilities, financial information)</li>
                  <li>Document uploads (certificates, photos, signatures)</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">2. How We Use Your Information</h4>
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Process vendor registration applications</li>
                  <li>Communicate with you about your account and services</li>
                  <li>Evaluate vendor capabilities and qualifications</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Improve our services and vendor portal</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">3. Information Sharing</h4>
                <p>
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information with:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Service providers who assist in our operations</li>
                  <li>Legal authorities when required by law</li>
                  <li>Business partners in connection with legitimate business purposes</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">4. Data Security</h4>
                <p>
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">5. Data Retention</h4>
                <p>
                  We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">6. Your Rights</h4>
                <p>You have the right to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Object to processing of your information</li>
                  <li>Data portability</li>
                </ul>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">7. Cookies and Tracking</h4>
                <p>
                  We use cookies and similar technologies to enhance your experience on our vendor portal. You can control cookie settings through your browser preferences.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">8. Third-Party Links</h4>
                <p>
                  Our vendor portal may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">9. Changes to This Policy</h4>
                <p>
                  We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the "Last Updated" date.
                </p>
              </section>

              <section>
                <h4 className="font-semibold text-gray-900 mb-2">10. Contact Us</h4>
                <p>
                  If you have questions about this privacy policy or our data practices, please contact us at:
                </p>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p><strong>Email:</strong> privacy@yellowstonegroup.com</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                  <p><strong>Address:</strong> Yellow Stone Group Legal Department, 123 Business Ave, City, State 12345</p>
                </div>
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

export default PrivacyPolicy;
