import React, { useRef, useEffect, useState } from 'react';
import CertificatePreview from './CertificatePreview';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
declare module 'html2pdf.js';
import html2pdf from 'html2pdf.js';
import { supabase } from '../../lib/supabase';

interface CertificateCompletionModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
  course: any;
  template: any;
  certificateId?: string;
}

export const CertificateCompletionModal: React.FC<CertificateCompletionModalProps> = ({ open, onClose, user, course, template, certificateId }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Export, upload, and insert certificate when modal opens
  useEffect(() => {
    const generateAndUpload = async () => {
      if (!open || !user?.id || !course?.id || uploadedUrl) return;
      setUploading(true);
      setError(null);
      try {
        // 1. Export as PDF
        const element = previewRef.current;
        const opt = {
          margin: 0,
          filename: `cert-${user.id}-${course.id}.pdf`,
          html2canvas: { scale: 3 },
          jsPDF: { unit: 'px', format: [1123, 794], orientation: 'landscape' },
        };
        const pdfBlob: Blob = await new Promise((resolve, reject) => {
          html2pdf().set(opt).from(element).outputPdf('blob').then(resolve).catch(reject);
        });
        // 2. Upload to Supabase Storage
        const fileName = `cert-${user.id}-${course.id}-${Date.now()}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(fileName, pdfBlob, { contentType: 'application/pdf' });
        if (uploadError) throw uploadError;
        // 3. Get public URL
        const { publicUrl } = supabase.storage.from('certificates').getPublicUrl(fileName);
        setUploadedUrl(publicUrl);
        // 4. Insert certificate row
        const { error: insertError } = await supabase.from('certificates').insert({
          user_id: user.id,
          course_id: course.id,
          url: publicUrl,
          template_id: template?.id || null,
          issue_date: new Date().toISOString(),
        });
        if (insertError) throw insertError;
      } catch (e: any) {
        setError(e.message || 'Failed to generate/upload certificate');
      }
      setUploading(false);
    };
    generateAndUpload();
    // eslint-disable-next-line
  }, [open, user?.id, course?.id, template, uploadedUrl]);

  if (!open) return null;

  const handleDownloadPDF = async () => {
    if (uploadedUrl) {
      window.open(uploadedUrl, '_blank');
      return;
    }
    if (previewRef.current) {
      const element = previewRef.current;
      html2pdf().set({
        margin: 0,
        filename: `${course?.title || 'certificate'}-${user?.first_name || ''}.pdf`,
        html2canvas: { scale: 3 },
        jsPDF: { unit: 'px', format: [1123, 794], orientation: 'landscape' },
      }).from(element).save();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full mx-4 flex flex-col items-center relative animate-fade-in">
        <h2 className="text-2xl font-bold mb-2 text-center">Your Certificate</h2>
        <p className="text-gray-600 mb-4 text-center">Congratulations on completing the course!</p>
        {/* Certificate Preview */}
        <div className="w-full flex justify-center items-center aspect-[1123/794] rounded-xl overflow-hidden bg-gray-100 mb-6" style={{ maxWidth: 600, maxHeight: 425 }}>
          <CertificatePreview ref={previewRef} template={template} user={user} course={course} />
        </div>
        {/* Uploading/Success/Error State */}
        {uploading && <div className="text-blue-600 mb-2">Uploading certificate...</div>}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {uploadedUrl && <div className="text-green-600 mb-2">Certificate saved! <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="underline">View</a></div>}
        {/* Download and Share Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition" onClick={handleDownloadPDF} disabled={uploading}>
            Download as Image
          </button>
          <div className="flex justify-center gap-4 mt-2">
            <button className="text-blue-700 hover:text-blue-900" title="Share on LinkedIn">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.968v5.699h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.601v5.595z"/></svg>
            </button>
            <button className="text-blue-500 hover:text-blue-700" title="Share on Twitter">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.92 4.92 0 0 0-8.384 4.482c-4.086-.205-7.713-2.164-10.141-5.144a4.822 4.822 0 0 0-.666 2.475c0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417a9.867 9.867 0 0 1-6.102 2.104c-.396 0-.787-.023-1.175-.069a13.945 13.945 0 0 0 7.548 2.212c9.057 0 14.009-7.513 14.009-14.009 0-.213-.005-.425-.014-.636a10.012 10.012 0 0 0 2.457-2.548z"/></svg>
            </button>
            <button className="text-blue-800 hover:text-blue-900" title="Share on Facebook">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.733 0-1.325.592-1.325 1.325v21.351c0 .733.592 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.729 0 1.322-.591 1.322-1.324v-21.35c0-.733-.593-1.325-1.326-1.325z"/></svg>
            </button>
          </div>
        </div>
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={onClose}>×</button>
      </div>
    </div>
  );
}; 