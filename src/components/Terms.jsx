import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFadeIn } from '../hooks/useFadeIn';
import { useUser } from '../hooks/useUser';

const Terms = () => {
    const navigate = useNavigate();
    const isVisible = useFadeIn();
    const { user } = useUser();

    return (
        <div className={`bg-white rounded-xl shadow-md border border-rose-100 overflow-hidden min-h-[600px] p-6 lg:p-12 max-w-4xl mx-auto my-8 transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <button
                onClick={() => user ? navigate('/') : navigate('/signin')}
                className="text-rose-700 hover:text-rose-900 hover:underline flex items-center text-sm font-medium transition-colors mb-8"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> Go Back
            </button>
            
            <h1 className="text-4xl font-serif font-bold text-rose-950 mb-8 text-center border-b border-rose-100 pb-6">Terms and Conditions</h1>
            
            <div className="space-y-8 text-gray-700 leading-relaxed">
                <div className="p-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-amber-900 mb-2 font-serif">Sandbox Testing Environment</h2>
                    <p className="text-amber-800">
                        <strong>Notice:</strong> Pehenavas is currently operating as a sandbox testing environment.
                        This is a demonstration store created for testing, educational, and portfolio purposes.
                    </p>
                </div>
                
                <div>
                    <h3 className="text-2xl font-serif font-bold text-rose-900 mb-3">1. Fictional Transactions</h3>
                    <p>All products, prices, delivery times, and availability shown on this website are entirely fictional. No real purchases can be made, and any payment information entered (such as UPI IDs or credit/debit card numbers) is used strictly for UI/UX demonstration purposes. <strong>Please do not enter real credit card numbers, active UPI IDs, or actual sensitive financial data.</strong></p>
                </div>

                <div>
                    <h3 className="text-2xl font-serif font-bold text-rose-900 mb-3">2. Data Privacy</h3>
                    <p>User accounts created during this testing phase are simulated. Your authentication state is handled locally within your browser. We do not permanently store your personal data on external production servers. Any email addresses, names, or passwords used to log in or sign up should be dummy data.</p>
                </div>

                <div>
                    <h3 className="text-2xl font-serif font-bold text-rose-900 mb-3">3. Intellectual Property</h3>
                    <p>The Pehenavas brand, logo ("The Royal Heritage"), and overall design theme are created for demonstration. Product images and descriptions are utilized under fair use strictly for educational and testing purposes.</p>
                </div>

                <div>
                    <h3 className="text-2xl font-serif font-bold text-rose-900 mb-3">4. Liability</h3>
                    <p>As this is a sandbox environment, the creator of this application assumes no responsibility or liability for any perceived transactions, data loss, or issues arising from the use of this demonstration site.</p>
                </div>

                <div className="mt-12 pt-6 border-t border-rose-100 text-sm text-gray-500 text-center">
                    <p>Last updated: April 2026</p>
                </div>
            </div>
        </div>
    );
};

export default Terms;