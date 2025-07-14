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
  user?: any;
  course?: any;
  onClose?: () => void;
}

interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  elements: any[];
  background_image?: string;
  background_color: string;
  border_color: string;
  border_width: number;
  font_family: string;
}

export const CertificateDownload: React.FC<CertificateDownloadProps> = ({
  learnerName,
  courseTitle,
  userId,
  courseId,
  template = 'default',
  completionDate = new Date().toLocaleDateString(),
  onCertificateCreated,
  user,
  course,
  onClose,
}) => {
  const certificateRef = React.useRef<HTMLDivElement>(null);
  const [certificateId] = React.useState(uuidv4());
  const [qrCodeUrl, setQrCodeUrl] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [dbSuccess, setDbSuccess] = React.useState(false);
  const [dbError, setDbError] = React.useState<string | null>(null);
  const [certificateTemplate, setCertificateTemplate] = React.useState<CertificateTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = React.useState(true);

  // Generate QR code for the certificate ID
  React.useEffect(() => {
    QRCode.toDataURL(certificateId).then(setQrCodeUrl);
  }, [certificateId]);

  // Fetch certificate template
  React.useEffect(() => {
    const fetchTemplate = async () => {
      setLoadingTemplate(true);
      try {
        // First try to get template from course
        let templateId = course?.certificate_template_id;
        
        if (!templateId) {
          // Fallback to default template
          const { data: defaultTemplate } = await supabase
            .from('certificate_templates')
            .select('*')
            .eq('is_default', true)
            .eq('is_active', true)
            .single();
          
          if (defaultTemplate) {
            templateId = defaultTemplate.id;
          }
        }

        if (templateId) {
          const { data: templateData } = await supabase
            .from('certificate_templates')
            .select('*')
            .eq('id', templateId)
            .eq('is_active', true)
            .single();
          
          if (templateData) {
            setCertificateTemplate(templateData);
          }
        }
      } catch (error) {
        console.error('Error fetching certificate template:', error);
      } finally {
        setLoadingTemplate(false);
      }
    };

    fetchTemplate();
  }, [course]);

  const renderTemplateElement = (element: any) => {
    const { type, id, text, x, y, fontSize, fontFamily, fill, fontWeight, textAlign, width, height, src, opacity } = element;
    
    // Replace placeholders with actual data
    let displayText = text;
    if (displayText) {
      displayText = displayText
        .replace('{{student_name}}', learnerName)
        .replace('{{course_name}}', courseTitle)
        .replace('{{completion_date}}', completionDate)
        .replace('{{certificate_id}}', certificateId);
    }

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      fontSize: `${fontSize}px`,
      fontFamily: fontFamily || 'serif',
      color: fill,
      fontWeight: fontWeight || 'normal',
      textAlign: textAlign || 'left',
      width: width ? `${width}%` : 'auto',
      height: height ? `${height}px` : 'auto',
      opacity: opacity || 1,
      transform: 'translate(-50%, -50%)',
    };

    if (type === 'text') {
      return (
        <div key={id} style={style}>
          {displayText}
        </div>
      );
    }

    if (type === 'image' && src) {
      return (
        <img
          key={id}
          src={src}
          alt=""
          style={style}
        />
      );
    }

    return null;
  };

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
            template_id: certificateTemplate?.id,
            issue_date: issueDate,
            certificate_url: publicUrl,
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
  }

  if (loadingTemplate) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading certificate template...</p>
      </div>
    );
  }

  if (!certificateTemplate) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
        <p className="text-red-600">Error: Could not load certificate template</p>
      </div>
    );
  }

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
            background: certificateTemplate.background_color,
            color: '#222',
            border: `${certificateTemplate.border_width}px solid ${certificateTemplate.border_color}`,
            borderRadius: 24,
            margin: '0 auto',
            position: 'relative',
            fontFamily: certificateTemplate.font_family,
            boxSizing: 'border-box',
            backgroundImage: certificateTemplate.background_image ? `url(${certificateTemplate.background_image})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          className="shadow-lg"
        >
          {/* Render template elements */}
          {certificateTemplate.elements.map((element) => renderTemplateElement(element))}
          
          {/* QR Code */}
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="QR Code"
              style={{ position: 'absolute', bottom: 40, left: 40, width: 80 }}
            />
          )}
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
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold shadow hover:bg-gray-300 transition"
            >
              Close
            </button>
          )}
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
      </div>
    </div>
  );
}; 