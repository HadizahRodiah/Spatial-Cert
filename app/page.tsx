'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { FilePlus, IdCard, Mail, TrendingUp, Signature } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import Image from 'next/image';

interface CertificateData {
  id: string;
  date: string;
  expiryDate: string;
  registrationNumber: string;
  fullName: string;
  emailAddress: string;
  courseCompleted: string;
  levelCompleted: string;
  signature: string;
  qrCode: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const CertificateForm = () => {
  const [formData, setFormData] = useState({
    registrationNumber: '',
    fullName: '',
    emailAddress: '',
    courseCompleted: '',
    levelCompleted: '',
    signature: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getBase64Signature = () => {
    const canvas = sigCanvasRef.current;
    return canvas ? canvas.toDataURL('image/png') : '';
  };

  const isSignatureEmpty = () => {
    return sigCanvasRef.current?.isEmpty();
  };

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus('idle');

    if (
      !formData.registrationNumber ||
      !formData.fullName ||
      !formData.emailAddress ||
      !formData.courseCompleted ||
      !formData.levelCompleted ||
      isSignatureEmpty()
    ) {
      setSubmissionStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      const signatureBase64 = getBase64Signature();
      const qrCodeData = encodeURIComponent(`https://yourdomain.com/verify?reg=${formData.registrationNumber}`);
      const issueDate = new Date();
      const expiryDate = new Date(issueDate);
      expiryDate.setFullYear(issueDate.getFullYear() + 2);

      const certificateData: CertificateData = {
        id: crypto.randomUUID(),
        date: issueDate.toLocaleDateString(),
        expiryDate: expiryDate.toLocaleDateString(),
        registrationNumber: formData.registrationNumber,
        fullName: formData.fullName,
        emailAddress: formData.emailAddress,
        courseCompleted: formData.courseCompleted,
        levelCompleted: formData.levelCompleted,
        signature: signatureBase64,
        qrCode: qrCodeData,
      };

      const params = new URLSearchParams();
      for (const key in certificateData) {
        params.set(key, encodeURIComponent(certificateData[key as keyof CertificateData]));
      }

      router.push(`/certificate?${params.toString()}`);
      setSubmissionStatus('success');
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image src="/icon.png" alt="Logo" width={300} height={200} className="rounded-full shadow-lg" />
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
           Spatial and Data Science Association of Nigeria.
          </h1>
          <p className="text-gray-400 text-lg">
            Fill out the form to generate your personalized certificate.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={onSubmit}
          className="bg-white/5 backdrop-blur-lg rounded-xl shadow-2xl p-6 sm:p-8 space-y-6 border border-white/10"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
          }}
        >
          <motion.h2 className="text-2xl font-semibold text-white flex items-center gap-2" variants={itemVariants}>
            <FilePlus className="w-6 h-6 text-blue-400" />
            Registration Form
          </motion.h2>

          {/* Input fields */}
          <motion.div variants={itemVariants} className="space-y-4">
            {[
              { id: 'registrationNumber', label: 'Registration Number', icon: <IdCard className="w-4 h-4" />, type: 'text' },
              { id: 'fullName', label: 'Full Name', icon: null, type: 'text' },
              { id: 'emailAddress', label: 'Email Address', icon: <Mail className="w-4 h-4" />, type: 'email' },
              { id: 'courseCompleted', label: 'Course Completed', icon: null, type: 'text' },
              { id: 'levelCompleted', label: 'Level Completed (1-5)', icon: <TrendingUp className="w-4 h-4" />, type: 'number' },
            ].map(({ id, label, icon, type }) => (
              <div key={id} className="space-y-2">
                <label htmlFor={id} className="text-gray-300 flex items-center gap-1.5">
                  {icon}
                  {label}
                </label>
                <input
                  id={id}
                  name={id}
                  type={type}
                  value={formData[id as keyof typeof formData]}
                  onChange={handleChange}
                  placeholder={`Enter your ${label.toLowerCase()}`}
                  className="w-full px-4 py-2 bg-black/20 text-white border border-purple-500/30 rounded-md placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            ))}

            {/* Signature */}
            <div className="space-y-2">
              <label className="text-gray-300 flex items-center gap-1.5">
                <Signature className="w-4 h-4" />
                Draw Your Signature
              </label>
              <div className="border border-purple-500 rounded-md bg-white w-full max-w-md">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  canvasProps={{ width: 400, height: 100, className: 'bg-white rounded-md' }}
                />
              </div>
              <button
                type="button"
                onClick={clearSignature}
                className="text-sm text-purple-300 hover:underline mt-1"
              >
                Clear Signature
              </button>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full sm:w-auto bg-gradient-to-r from-purple-500 to-blue-500 text-white',
                'px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all',
                'font-semibold text-lg flex items-center justify-center gap-2',
                isSubmitting && 'opacity-70 cursor-not-allowed',
                submissionStatus === 'success' && 'bg-green-500 from-green-500 to-green-500'
              )}
            >
              {isSubmitting ? 'Generating...' : 'Generate Certificate'}
            </button>
            {submissionStatus === 'error' && (
              <p className="text-red-400 text-sm">Please fill in all fields and draw your signature.</p>
            )}
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
};

export default CertificateForm;
