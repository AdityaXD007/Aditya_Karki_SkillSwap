import React from 'react';
import { motion } from 'framer-motion';

export const TermsContent: React.FC = () => {
  return (
    <div className="text-slate-700 dark:text-slate-300 space-y-8 leading-relaxed">
      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          1. Academic Disclaimer
        </h2>
        <p>
          Welcome to SkillSwap. Please note that this platform is a <strong>Final Year Project (FYP)</strong> created for academic purposes. It is not currently a commercial product or entity. Any skill exchanges, payments, or transactions made through integrations like Khalti or Stripe are strictly run in <strong>sandbox/test environments</strong> and do not involve real currency. SkillSwap makes no binding commercial guarantees.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">2. User Conduct & Safety</h2>
        <p>
          As a peer-to-peer learning environment, users must maintain a high standard of professional conduct. Harassment, hate speech, inappropriate behavior during sessions, or spamming will result in an immediate and permanent account ban. Treat your peers with respect.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. Peer-to-Peer Quality Guarantee</h2>
        <p>
          SkillSwap acts purely as an intermediary facilitating connections between learners and independent peer-tutors. We do not certify the qualifications of the users on the platform. The quality, accuracy, and safety of the skills being taught are solely the responsibility of the participating individuals.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">4. Payments & Platform Fees</h2>
        <p>
          Certain premium sessions may require a simulated payment. A small platform fee may be deducted from the total amount. Sessions canceled with more than 24 hours' notice are eligible for a simulated refund. Sessions canceled within 24 hours of the start time are non-refundable.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">5. Data Privacy & Security</h2>
        <p>
          We prioritize the protection of your data. Information such as your email, profile bio, and chat logs are stored securely. We do not sell your personal data to third parties. Please do not share highly sensitive information, such as real passwords or active banking credentials, through the platform.
        </p>
      </section>

      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-sm font-medium text-slate-500">
          By checking "I agree" during sign-up, you acknowledge that you have read and understood these Terms and Conditions.
        </p>
      </div>
    </div>
  );
};

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Terms and Conditions</h1>
          <p className="mt-2 text-blue-100 font-medium">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="px-8 py-10">
          <TermsContent />
        </div>
      </motion.div>
    </div>
  );
};
