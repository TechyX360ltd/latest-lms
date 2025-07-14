import React from 'react';
import html2canvas from 'html2canvas';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';

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

  // PNG download logic
  const handleDownloadPNG = async () => {
    if (!certificateRef.current) return;
    const canvas = await html2canvas(certificateRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `Certificate-${courseTitle.replace(/\s+/g, '-')}.png`;
    link.click();
  };

  // PDF download logic
  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    const canvas = await html2canvas(certificateRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });
    pdf.addImage(imgData, 'PNG', 0, 0, 841.89, 595.28);
    pdf.save(`Certificate-${courseTitle.replace(/\s+/g, '-')}.pdf`);
  };

  // Download all notes as PDF
  const handleDownloadNotesPDF = async () => {
    if (!userId || !courseId) return;
    // Fetch all lessons for the course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('course_id', courseId);
    if (lessonsError || !lessons) {
      alert('Could not fetch lessons for this course.');
        return;
      }
    // Fetch all notes for the user and lessons in this course
    const lessonIds = lessons.map((l: any) => l.id);
    const { data: notes, error: notesError } = await supabase
      .from('lesson_notes')
      .select('lesson_id, content')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds);
    if (notesError) {
      alert('Could not fetch your notes.');
      return;
    }
    // Map lesson titles to notes
    const notesByLesson: { [lessonId: string]: string } = {};
    notes.forEach((n: any) => { notesByLesson[n.lesson_id] = n.content; });
    // Generate PDF
    const pdf = new jsPDF();
    let y = 20;
    pdf.setFontSize(18);
    pdf.text('My Notes', 14, y);
    y += 10;
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Course:`, 14, y);
    pdf.setFont(undefined, 'normal');
    pdf.text(`${courseTitle}`, 40, y);
    y += 8;
    pdf.setFont(undefined, 'bold');
    pdf.text(`Instructor:`, 14, y);
    pdf.setFont(undefined, 'normal');
    pdf.text(`${course?.instructor || ''}`, 44, y);
    y += 8;
    pdf.setFont(undefined, 'bold');
    pdf.text(`Date:`, 14, y);
    pdf.setFont(undefined, 'normal');
    pdf.text(`${completionDate || new Date().toLocaleDateString()}`, 32, y);
    y += 8;
    pdf.setFont(undefined, 'bold');
    pdf.text(`Course summary:`, 14, y);
    pdf.setFont(undefined, 'normal');
    const summaryLines = pdf.splitTextToSize(course?.description || '', 180);
    pdf.text(summaryLines, 14, y + 7);
    y += summaryLines.length * 7 + 10;
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Lesson Notes', 14, y);
    y += 10;
    pdf.setFontSize(12);
    lessons.forEach((lesson: any, idx: number) => {
      const note = notesByLesson[lesson.id];
      if (note && note.trim()) {
        pdf.setFont(undefined, 'bold');
        pdf.text(`${idx + 1}. ${lesson.title}`, 14, y);
        y += 8;
        pdf.setFont(undefined, 'normal');
        const lines = pdf.splitTextToSize(note, 180);
        pdf.text(lines, 18, y);
        y += lines.length * 7 + 8;
        if (y > 270) { pdf.addPage(); y = 20; }
      }
    });
    pdf.save(`My-Notes-${courseTitle.replace(/\s+/g, '-')}.pdf`);
  };

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
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Course Certificate</h2>
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
            onClick={handleDownloadPDF}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition"
          >
            Download as PDF
          </button>
          <button
            onClick={handleDownloadPNG}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          >
            Download as PNG
          </button>
          {userId && courseId && (
            <button
              onClick={handleDownloadNotesPDF}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold shadow hover:bg-purple-700 transition"
            >
              Download My Notes as PDF
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold shadow hover:bg-gray-300 transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 