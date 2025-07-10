import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { supabase } from '../../lib/supabase';

interface CertificateDownloadProps {
  learnerName: string;
  courseTitle: string;
  userId: string;
  courseId: string;
  template?: 'default' | 'modern' | 'elegant';
  completionDate?: string;
  onCertificateCreated?: (certificateId: string) => void;
}

export const CertificateDownload: React.FC<CertificateDownloadProps> = ({
  learnerName,
  courseTitle,
  userId,
  courseId,
  template = 'default',
  completionDate = new Date().toLocaleDateString(),
  onCertificateCreated,
}) => {
  const certificateRef = React.useRef<HTMLDivElement>(null);
  const [certificateId] = React.useState(uuidv4());
  const [qrCodeUrl, setQrCodeUrl] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [dbSuccess, setDbSuccess] = React.useState(false);
  const [dbError, setDbError] = React.useState<string | null>(null);

  // Generate QR code for the certificate ID
  React.useEffect(() => {
    QRCode.toDataURL(certificateId).then(setQrCodeUrl);
  }, [certificateId]);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setUploading(false);
    setUploadedUrl(null);
    setUploadError(null);
    setDbSuccess(false);
    setDbError(null);
    // Render the certificate to canvas
    const canvas = await html2canvas(certificateRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });
    pdf.addImage(imgData, 'PNG', 0, 0, 841.89, 595.28);
    pdf.save(`Certificate-${courseTitle.replace(/\s+/g, '-')}.pdf`);

    // Upload to Supabase Storage
    setUploading(true);
    try {
      const pdfBlob = pdf.output('blob');
      const filePath = `user-${userId}/certificate-${certificateId}.pdf`;
      const { data, error } = await supabase.storage
        .from('certificates')
        .upload(filePath, pdfBlob, { upsert: true });
      if (error) {
        setUploadError(error.message);
        setUploading(false);
        return;
      }
      // Get public URL
      const { publicUrl } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath);
      setUploadedUrl(publicUrl);

      // Insert into certificates table
      const issueDate = new Date().toISOString();
      const { error: dbInsertError } = await supabase
        .from('certificates')
        .insert([
          {
            id: certificateId,
            user_id: userId,
            course_id: courseId,
            issue_date: issueDate,
            template: template,
            url: publicUrl,
          },
        ]);
      if (dbInsertError) {
        setDbError(dbInsertError.message);
      } else {
        setDbSuccess(true);
        if (onCertificateCreated) onCertificateCreated(certificateId);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Your Certificate</h2>
      <div className="w-full flex justify-center mb-6">
        {/* Certificate preview - A4 landscape size */}
        <div
          ref={certificateRef}
          style={{
            width: 1123,
            maxWidth: '100%',
            height: 794,
            padding: 40,
            background: 'white',
            color: '#222',
            border: '8px solid #2563eb',
            borderRadius: 24,
            margin: '0 auto',
            position: 'relative',
            fontFamily: 'serif',
            boxSizing: 'border-box',
          }}
          className="shadow-lg"
        >
          <h1 style={{ color: '#2563eb', fontSize: 40, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
            Certificate of Completion
          </h1>
          <p style={{ fontSize: 22, marginBottom: 32, textAlign: 'center' }}>This certifies that</p>
          <div style={{ fontSize: 32, fontWeight: 600, marginBottom: 24, textAlign: 'center' }}>
            {learnerName}
          </div>
          <p style={{ fontSize: 22, marginBottom: 24, textAlign: 'center' }}>
            has successfully completed the course
          </p>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#2563eb', marginBottom: 32, textAlign: 'center' }}>
            {courseTitle}
          </div>
          <p style={{ fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
            Date: <span style={{ fontWeight: 500 }}>{completionDate}</span>
          </p>
          <div style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
            Certificate ID: <span style={{ fontWeight: 500 }}>{certificateId}</span>
          </div>
          {/* QR Code */}
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="QR Code"
              style={{ position: 'absolute', bottom: 40, left: 40, width: 80 }}
            />
          )}
          <div style={{ position: 'absolute', bottom: 40, right: 40, fontSize: 16, color: '#888' }}>
            TECHYX 360 LMS
          </div>
        </div>
      </div>
      <hr className="w-full border-t border-gray-200 my-6" />
      <div className="flex flex-col items-center w-full">
        <div className="flex justify-center gap-4 w-full mb-4">
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Download & Save Certificate'}
          </button>
          <button
            onClick={() => { window.location.href = '/dashboard'; }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          >
            Go to My Courses
          </button>
        </div>
        {uploadedUrl && (
          <div className="mt-2 text-green-700">
            Uploaded! <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="underline">View Certificate</a>
          </div>
        )}
        {uploadError && (
          <div className="mt-2 text-red-600">Upload error: {uploadError}</div>
        )}
        {dbSuccess && (
          <div className="mt-2 text-green-700">Certificate record saved to database!</div>
        )}
        {dbError && (
          <div className="mt-2 text-red-600">DB error: {dbError}</div>
        )}
        {/* Social media share icons (always visible, use placeholder if no uploadedUrl) */}
        <div className="mt-8 flex justify-center gap-6">
          {/* LinkedIn */}
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(uploadedUrl || 'https://techyx360.com')}`} target="_blank" rel="noopener noreferrer" title="Share on LinkedIn">
            <svg width="32" height="32" fill="currentColor" className="text-blue-700 hover:text-blue-900" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm15.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z"/></svg>
          </a>
          {/* Twitter */}
          <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(uploadedUrl || 'https://techyx360.com')}&text=I%20just%20earned%20a%20certificate%20for%20${encodeURIComponent(courseTitle)}!`} target="_blank" rel="noopener noreferrer" title="Share on Twitter">
            <svg width="32" height="32" fill="currentColor" className="text-blue-400 hover:text-blue-600" viewBox="0 0 24 24"><path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.92 4.92 0 0 0-8.384 4.482c-4.086-.205-7.713-2.164-10.141-5.144a4.822 4.822 0 0 0-.666 2.475c0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417a9.867 9.867 0 0 1-6.102 2.104c-.396 0-.787-.023-1.175-.069a13.945 13.945 0 0 0 7.548 2.212c9.057 0 14.009-7.513 14.009-14.009 0-.213-.005-.425-.014-.636a10.012 10.012 0 0 0 2.457-2.548z"/></svg>
          </a>
          {/* Facebook */}
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(uploadedUrl || 'https://techyx360.com')}`} target="_blank" rel="noopener noreferrer" title="Share on Facebook">
            <svg width="32" height="32" fill="currentColor" className="text-blue-600 hover:text-blue-800" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.733 0-1.325.592-1.325 1.326v21.348c0 .733.592 1.326 1.325 1.326h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.326v-21.349c0-.734-.593-1.326-1.326-1.326z"/></svg>
          </a>
          {/* WhatsApp */}
          <a href={`https://api.whatsapp.com/send?text=I%20just%20earned%20a%20certificate%20for%20${encodeURIComponent(courseTitle)}%20${encodeURIComponent(uploadedUrl || 'https://techyx360.com')}`} target="_blank" rel="noopener noreferrer" title="Share on WhatsApp">
            <svg width="32" height="32" fill="currentColor" className="text-green-500 hover:text-green-700" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.174.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.363.709.306 1.262.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.617h-.001a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.991c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297a11.815 11.815 0 0 0-8.413-3.488c-6.627 0-12 5.373-12 12 0 2.121.555 4.199 1.607 6.032l-1.693 6.183a1 1 0 0 0 1.237 1.237l6.181-1.694a11.93 11.93 0 0 0 5.668 1.443h.005c6.627 0 12-5.373 12-12 0-3.181-1.241-6.167-3.488-8.413z"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
}; 