import React, { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { supabase } from '../../lib/supabase';

interface Template {
  id: string;
  name: string;
  description?: string;
  elements: any[];
  background_image?: string;
}

interface CertificateTemplateGalleryProps {
  selectedTemplateId: string | null;
  onSelect: (id: string) => void;
}

const CANVAS_WIDTH = 220;
const CANVAS_HEIGHT = 140;

const MiniCanvas: React.FC<{ elements: any[]; backgroundImage?: string }> = ({ elements, backgroundImage }) => {
  const [bgImg] = useImage(backgroundImage || '', 'anonymous');
  return (
    <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ background: '#f8fafc', borderRadius: 12 }}>
      <Layer>
        {backgroundImage ? (
          <KonvaImage image={bgImg} x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} listening={false} />
        ) : (
          <Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#fff" cornerRadius={12} shadowBlur={4} />
        )}
        {elements && elements.map((el, idx) => {
          if (el.type === 'text') {
            return (
              <Text
                key={el.id || idx}
                x={el.x}
                y={el.y}
                text={el.text}
                fontSize={el.fontSize}
                fontFamily={el.fontFamily}
                fill={el.fill}
                width={el.width}
                opacity={el.opacity ?? 1}
                draggable={false}
              />
            );
          }
          if (el.type === 'image') {
            return (
              <MiniImage key={el.id || idx} src={el.src} x={el.x} y={el.y} width={el.width} height={el.height} opacity={el.opacity ?? 1} />
            );
          }
          return null;
        })}
      </Layer>
    </Stage>
  );
};

const MiniImage: React.FC<{ src: string; x: number; y: number; width: number; height: number; opacity?: number }> = ({ src, x, y, width, height, opacity }) => {
  const [img] = useImage(src, 'anonymous');
  return <KonvaImage image={img} x={x} y={y} width={width} height={height} opacity={opacity ?? 1} draggable={false} />;
};

export const CertificateTemplateGallery: React.FC<CertificateTemplateGalleryProps> = ({ selectedTemplateId, onSelect }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('id, name, description, elements, background_image, created_at')
        .order('created_at', { ascending: false });
      if (error) {
        setError('Failed to load templates');
      } else {
        setTemplates(data || []);
      }
      setLoading(false);
    };
    fetchTemplates();
  }, []);

  if (loading) return <div className="text-center py-8">Loading templates...</div>;
  if (error) return <div className="text-center text-red-600 py-8">{error}</div>;
  if (!templates.length) return <div className="text-center py-8 text-gray-500">No certificate templates found.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          className={`border-2 rounded-xl p-3 flex flex-col items-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            selectedTemplateId === template.id
              ? 'border-blue-600 bg-blue-50 shadow-lg'
              : 'border-gray-200 bg-white hover:border-blue-300'
          }`}
          onClick={() => onSelect(template.id)}
        >
          <div className="mb-2 w-full flex justify-center">
            <MiniCanvas elements={template.elements || []} backgroundImage={template.background_image} />
          </div>
          <div className="w-full text-left">
            <h3 className="font-semibold text-gray-900 text-base truncate">{template.name}</h3>
            <p className="text-xs text-gray-600 truncate">{template.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}; 