import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

// Types for elements
interface CanvasText {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  width?: number;
  draggable: boolean;
}

interface CanvasImage {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  draggable: boolean;
  opacity?: number;
}

type CanvasElement = CanvasText | CanvasImage;

const defaultElements: CanvasElement[] = [
  {
    id: 'title',
    type: 'text',
    x: 250,
    y: 80,
    text: 'Certificate of Completion',
    fontSize: 40,
    fontFamily: 'serif',
    fill: '#1e293b',
    draggable: true,
  },
  {
    id: 'subtitle',
    type: 'text',
    x: 200,
    y: 160,
    text: 'This certifies that',
    fontSize: 24,
    fontFamily: 'serif',
    fill: '#334155',
    draggable: true,
  },
  {
    id: 'learner_name',
    type: 'text',
    x: 200,
    y: 210,
    text: '{learner_name}',
    fontSize: 32,
    fontFamily: 'serif',
    fill: '#0ea5e9',
    draggable: true,
  },
  {
    id: 'course_title',
    type: 'text',
    x: 200,
    y: 270,
    text: 'has completed the course: {course_title}',
    fontSize: 24,
    fontFamily: 'serif',
    fill: '#334155',
    draggable: true,
  },
  {
    id: 'date',
    type: 'text',
    x: 200,
    y: 320,
    text: 'Date: {date}',
    fontSize: 20,
    fontFamily: 'serif',
    fill: '#64748b',
    draggable: true,
  },
];

const fontFamilies = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy'];

const CertificateImage: React.FC<{ image: CanvasImage; isSelected: boolean; onSelect: () => void; onChange: (attrs: Partial<CanvasImage>) => void; }>
  = ({ image, isSelected, onSelect, onChange }) => {
  const [img] = useImage(image.src);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  React.useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={img}
        x={image.x}
        y={image.y}
        width={image.width}
        height={image.height}
        opacity={image.opacity ?? 1}
        draggable={image.draggable}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={e => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={e => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(20, node.width() * scaleX),
            height: Math.max(20, node.height() * scaleY),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && (
        <Transformer ref={trRef} />
      )}
    </>
  );
};

const CertificateManagementPage: React.FC = () => {
  const [elements, setElements] = useState<CanvasElement[]>(defaultElements);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const stageRef = useRef<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState<{ [url: string]: HTMLImageElement | undefined }>({});

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Gather all unique image URLs from templates
    const urls = new Set<string>();
    templates.forEach(tpl => {
      if (tpl.background_image) urls.add(tpl.background_image);
      tpl.elements?.forEach((el: any) => {
        if (el.type === 'image' && el.src) urls.add(el.src);
      });
    });

    // Load all images
    urls.forEach(url => {
      if (!previewImages[url]) {
        const img = new window.Image();
        img.src = url;
        img.onload = () => setPreviewImages(prev => ({ ...prev, [url]: img }));
      }
    });
    // eslint-disable-next-line
  }, [templates]);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('certificate_templates')
      .select('id, name, description, elements, background_image');
    setTemplates(data || []);
    setLoading(false);
  };

  // Load selected template into editor
  useEffect(() => {
    if (selectedTemplateId) {
      const tpl = templates.find(t => t.id === selectedTemplateId);
      if (tpl) {
        setElements(tpl.elements || []);
        setBackgroundImage(tpl.background_image || null);
      }
    }
  }, [selectedTemplateId]);

  // Filtered templates
  const filteredTemplates = templates.filter(tpl =>
    tpl.name.toLowerCase().includes(search.toLowerCase()) ||
    (tpl.description || '').toLowerCase().includes(search.toLowerCase())
  );

  // Add text element
  const addText = () => {
    const id = `text-${Date.now()}`;
    setElements([
      ...elements,
      {
        id,
        type: 'text',
        x: 100,
        y: 100,
        text: 'New Text',
        fontSize: 24,
        fontFamily: 'serif',
        fill: '#1e293b',
        draggable: true,
      },
    ]);
    setSelectedId(id);
  };

  // Add placeholder
  const addPlaceholder = (placeholder: string) => {
    const id = `ph-${placeholder}-${Date.now()}`;
    setElements([
      ...elements,
      {
        id,
        type: 'text',
        x: 120,
        y: 120,
        text: `{${placeholder}}`,
        fontSize: 28,
        fontFamily: 'serif',
        fill: '#0ea5e9',
        draggable: true,
      },
    ]);
    setSelectedId(id);
  };

  // Add image to canvas
  const addImage = (src: string) => {
    const id = `img-${Date.now()}`;
    setElements([
      ...elements,
      {
        id,
        type: 'image',
        x: 100,
        y: 100,
        width: 200,
        height: 120,
        src,
        draggable: true,
      },
    ]);
    setSelectedId(id);
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) addImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Set background image
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) setBackgroundImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Update element
  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el => (el.id === id ? { ...el, ...updates } : el)));
  };

  // Delete element
  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Move element forward/backward
  const moveElement = (id: string, direction: 'forward' | 'backward') => {
    const idx = elements.findIndex(el => el.id === id);
    if (idx === -1) return;
    let newElements = [...elements];
    if (direction === 'forward' && idx < elements.length - 1) {
      [newElements[idx], newElements[idx + 1]] = [newElements[idx + 1], newElements[idx]];
    } else if (direction === 'backward' && idx > 0) {
      [newElements[idx], newElements[idx - 1]] = [newElements[idx - 1], newElements[idx]];
    }
    setElements(newElements);
  };

  // Replace image
  const handleReplaceImage = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) updateElement(id, { src: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // Save as Template logic
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setToast({ type: 'error', message: 'Template name is required.' });
      return;
    }
    setSaving(true);
    const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
    const { error } = await supabase.from('certificate_templates').insert([
      {
        name: templateName,
        description: templateDescription,
        elements: elements,
        background_image: backgroundImage,
        created_by: user ? user.id : null,
      },
    ]);
    setSaving(false);
    if (error) {
      setToast({ type: 'error', message: 'Failed to save template.' });
    } else {
      setToast({ type: 'success', message: 'Template saved successfully!' });
      setShowSaveModal(false);
      setTemplateName('');
      setTemplateDescription('');
    }
  };

  // Delete template
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    setDeletingId(id);
    await supabase.from('certificate_templates').delete().eq('id', id);
    setDeletingId(null);
    fetchTemplates();
    if (selectedTemplateId === id) setSelectedTemplateId(null);
  };

  // Duplicate template
  const handleDuplicate = async (tpl: any) => {
    setLoading(true);
    await supabase.from('certificate_templates').insert([
      {
        name: `Copy of ${tpl.name}`,
        description: tpl.description,
        elements: tpl.elements,
        background_image: tpl.background_image,
      },
    ]);
    setLoading(false);
    fetchTemplates();
  };

  // Render selected element properties
  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Certificate Management</h1>
      {/* Search and Gallery */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <h2 className="text-xl font-semibold">Existing Templates</h2>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="px-4 py-2 border rounded-lg w-full md:w-64"
          />
        </div>
        {loading ? (
          <div className="text-center py-8">Loading templates...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTemplates.map(tpl => (
              <div key={tpl.id} className={`relative border-2 rounded-xl p-3 flex flex-col items-center transition-colors ${selectedTemplateId === tpl.id ? 'border-blue-600 bg-blue-50 shadow-lg' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <button
                    className="p-1 rounded hover:bg-gray-100"
                    title="Preview"
                    onClick={() => setPreviewTemplate(tpl)}
                  >
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                  <button
                    className="p-1 rounded hover:bg-gray-100"
                    title="Duplicate"
                    onClick={() => handleDuplicate(tpl)}
                  >
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-7 8h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v11a2 2 0 002 2z" /></svg>
                  </button>
                  <button
                    className="p-1 rounded hover:bg-gray-100"
                    title="Delete"
                    disabled={deletingId === tpl.id}
                    onClick={() => handleDelete(tpl.id)}
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="mb-2 w-full flex justify-center">
                  <Stage width={180} height={110} style={{ background: '#f8fafc', borderRadius: 8 }}>
                    <Layer>
                      {tpl.background_image ? (
                        <KonvaImage image={previewImages[tpl.background_image]} x={0} y={0} width={180} height={110} listening={false} />
                      ) : (
                        <Rect x={0} y={0} width={180} height={110} fill="#fff" cornerRadius={8} shadowBlur={4} />
                      )}
                      {tpl.elements && tpl.elements.map((el: any, idx: number) => {
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
                            <KonvaImage
                              key={el.id || idx}
                              image={previewImages[el.src]}
                              x={el.x}
                              y={el.y}
                              width={el.width}
                              height={el.height}
                              opacity={el.opacity ?? 1}
                              draggable={false}
                            />
                          );
                        }
                        return null;
                      })}
                    </Layer>
                  </Stage>
                </div>
                <div className="w-full text-left mb-2">
                  <h3 className="font-semibold text-gray-900 text-base truncate">{tpl.name}</h3>
                  <p className="text-xs text-gray-600 truncate">{tpl.description}</p>
                </div>
                <button
                  className={`mt-2 px-4 py-1 rounded text-sm font-medium ${selectedTemplateId === tpl.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                >
                  {selectedTemplateId === tpl.id ? 'Editing' : 'Edit'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-8">
        {/* Toolbar */}
        <div className="w-64 bg-white rounded-xl shadow p-4 flex flex-col gap-4">
          <h2 className="text-lg font-semibold mb-2">Toolbar</h2>
          <button onClick={addText} className="bg-blue-600 text-white px-4 py-2 rounded mb-2 hover:bg-blue-700">Add Text</button>
          <button onClick={() => addPlaceholder('learner_name')} className="bg-sky-500 text-white px-4 py-2 rounded mb-2 hover:bg-sky-600">Add Learner Name</button>
          <button onClick={() => addPlaceholder('course_title')} className="bg-sky-500 text-white px-4 py-2 rounded mb-2 hover:bg-sky-600">Add Course Title</button>
          <button onClick={() => addPlaceholder('date')} className="bg-sky-500 text-white px-4 py-2 rounded mb-2 hover:bg-sky-600">Add Date</button>
          <label className="bg-yellow-500 text-white px-4 py-2 rounded mb-2 hover:bg-yellow-600 cursor-pointer text-center">
            Add Image
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
          <label className="bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600 cursor-pointer text-center">
            Set Background
            <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
          </label>
          <button onClick={() => setShowSaveModal(true)} className="bg-green-600 text-white px-4 py-2 rounded mb-2 hover:bg-green-700">Save as Template</button>
          <hr className="my-2" />
          <div className="text-xs text-gray-500">Drag, resize, and edit elements on the canvas. Select an element to edit its properties.</div>
        </div>
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col items-center">
          {/* Properties Toolbar */}
          {selectedElement && (
            <div className="w-full bg-white rounded-xl shadow p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Properties - {selectedElement.type}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => moveElement(selectedElement.id, 'backward')}
                    className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                  >
                    Send Backward
                  </button>
                  <button
                    onClick={() => moveElement(selectedElement.id, 'forward')}
                    className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                  >
                    Bring Forward
                  </button>
                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {selectedElement.type === 'text' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium mb-1">Text</label>
                      <input
                        type="text"
                        value={selectedElement.text}
                        onChange={e => updateElement(selectedElement.id, { text: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Font Size</label>
                      <input
                        type="number"
                        value={selectedElement.fontSize}
                        onChange={e => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Font Family</label>
                      <select
                        value={selectedElement.fontFamily}
                        onChange={e => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Color</label>
                      <input
                        type="color"
                        value={selectedElement.fill}
                        onChange={e => updateElement(selectedElement.id, { fill: e.target.value })}
                        className="w-full h-8 p-0 border rounded"
                      />
                    </div>
                  </>
                )}
                {selectedElement.type === 'image' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium mb-1">Replace Image</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => handleReplaceImage(selectedElement.id, e)} 
                        className="w-full text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Opacity</label>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.01}
                        value={(selectedElement as CanvasImage).opacity ?? 1}
                        onChange={e => updateElement(selectedElement.id, { opacity: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          <Stage
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            ref={stageRef}
            style={{ background: '#f8fafc', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
            onMouseDown={e => {
              // Deselect when clicking on empty area
              if (e.target === e.target.getStage()) setSelectedId(null);
            }}
          >
            <Layer>
              {/* Background rectangle or image */}
              {backgroundImage ? (
                <KonvaImage
                  image={useImage(backgroundImage)[0]}
                  x={0}
                  y={0}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  listening={false}
                />
              ) : (
                <Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#fff" cornerRadius={16} shadowBlur={8} />
              )}
              {elements.map(el => {
                if (el.type === 'text') {
                  return (
                    <Text
                      key={el.id}
                      {...el}
                      onClick={() => setSelectedId(el.id)}
                      onTap={() => setSelectedId(el.id)}
                      draggable
                      onDragEnd={e => updateElement(el.id, { x: e.target.x(), y: e.target.y() })}
                      onTransformEnd={e => {
                        const node = e.target as any;
                        updateElement(el.id, { x: node.x(), y: node.y(), width: node.width() * node.scaleX(), fontSize: node.fontSize() * node.scaleY() });
                        node.scaleX(1);
                        node.scaleY(1);
                      }}
                    />
                  );
                }
                if (el.type === 'image') {
                  return (
                    <CertificateImage
                      key={el.id}
                      image={{ ...el, opacity: (el as any).opacity ?? 1 }}
                      isSelected={selectedId === el.id}
                      onSelect={() => setSelectedId(el.id)}
                      onChange={attrs => updateElement(el.id, attrs)}
                    />
                  );
                }
                return null;
              })}
              {/* Transformer for selected element (text only, images handled in CertificateImage) */}
              {selectedId && elements.find(el => el.id === selectedId)?.type === 'text' && (
                <Transformer
                  nodes={stageRef.current?.find(`#${selectedId}`) ? [stageRef.current.findOne(`#${selectedId}`)] : []}
                  enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                  rotateEnabled
                />
              )}
            </Layer>
          </Stage>
          <div className="text-xs text-gray-400 mt-2">Canvas size: {CANVAS_WIDTH} x {CANVAS_HEIGHT} px</div>
        </div>
      </div>
      {/* Save as Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Save as Template</h2>
            <label className="block mb-2 text-sm font-medium">Template Name *</label>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4"
              placeholder="Enter template name"
              disabled={saving}
            />
            <label className="block mb-2 text-sm font-medium">Description</label>
            <textarea
              value={templateDescription}
              onChange={e => setTemplateDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-4"
              placeholder="Enter description (optional)"
              rows={3}
              disabled={saving}
            />
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative">
            <button
              onClick={() => setPreviewTemplate(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              aria-label="Close"
            >×</button>
            <h2 className="text-xl font-bold mb-4">{previewTemplate.name}</h2>
            <Stage width={540} height={330} style={{ background: '#f8fafc', borderRadius: 16 }}>
              <Layer>
                {previewTemplate.background_image ? (
                  <KonvaImage image={previewImages[previewTemplate.background_image]} x={0} y={0} width={540} height={330} listening={false} />
                ) : (
                  <Rect x={0} y={0} width={540} height={330} fill="#fff" cornerRadius={16} shadowBlur={8} />
                )}
                {previewTemplate.elements && previewTemplate.elements.map((el: any, idx: number) => {
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
                      <KonvaImage
                        key={el.id || idx}
                        image={previewImages[el.src]}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        opacity={el.opacity ?? 1}
                        draggable={false}
                      />
                    );
                  }
                  return null;
                })}
              </Layer>
            </Stage>
            <div className="mt-4">
              <p className="text-gray-700 text-base">{previewTemplate.description}</p>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded shadow-lg text-white z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
          <button className="ml-4 text-white font-bold" onClick={() => setToast(null)}>&times;</button>
        </div>
      )}
    </div>
  );
};

export default CertificateManagementPage; 