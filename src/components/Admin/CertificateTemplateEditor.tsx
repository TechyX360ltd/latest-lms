import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { CertificateCanvas } from '../common/CertificateCanvas';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Bold, Italic, Type, AlignLeft, AlignCenter, AlignRight, ArrowUpAZ, ArrowDownAZ, PaintBucket, Trash2, Square, Circle, Droplet } from 'lucide-react';

// --- Types ---
type TextElement = {
  id: string;
  type: 'text';
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  width: number;
  opacity: number;
  fontWeight?: string;
  fontStyle?: string;
  align?: string;
  letterSpacing?: number;
  lineHeight?: number;
  shadow?: any;
  rotation?: number;
  locked?: boolean;
};

type ImageElement = {
  id: string;
  type: 'image';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  border?: string;
  shadow?: any;
  rotation?: number;
  locked?: boolean;
};

type ShapeElement = {
  id: string;
  type: 'shape';
  shapeType: 'rect' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  opacity: number;
  cornerRadius?: number; // for rect
};

type ElementType = TextElement | ImageElement | ShapeElement;

const CANVAS_WIDTH = 3508;
const CANVAS_HEIGHT = 2480;

const DEFAULT_ELEMENTS: ElementType[] = [
  {
    id: 'text-1',
    type: 'text',
    text: 'Certificate of Completion',
    x: 1000,
    y: 200,
    fontSize: 120,
    fontFamily: 'serif',
    fill: '#222',
    width: 1500,
    opacity: 1,
  },
  {
    id: 'text-2',
    type: 'text',
    text: 'This certifies that {name}',
    x: 900,
    y: 600,
    fontSize: 80,
    fontFamily: 'serif',
    fill: '#333',
    width: 1800,
    opacity: 1,
  },
  {
    id: 'text-3',
    type: 'text',
    text: 'has completed the {course} course on {date}',
    x: 900,
    y: 800,
    fontSize: 60,
    fontFamily: 'serif',
    fill: '#333',
    width: 1800,
    opacity: 1,
  },
];

function injectPlaceholders(text: string, user: any, course: any) {
  return text
    .replace(/\{name\}/gi, user?.name || 'Jane Doe')
    .replace(/\{course\}/gi, course?.title || 'React Basics')
    .replace(/\{date\}/gi, new Date().toLocaleDateString());
}

export function CertificateTemplateEditor() {
  const { user } = useAuth();
  if (!user || user.role !== 'super_admin') {
    return <div className="text-red-600 p-8">Access denied. Only super admins can create certificate templates.</div>;
  }
  const [elements, setElements] = useState<ElementType[]>(DEFAULT_ELEMENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [bgImg] = useImage(backgroundImage, 'anonymous');
  const stageRef = useRef<Konva.Stage | null>(null);

  // Add state for zoom, grid, and snap
  const [zoom, setZoom] = useState(0.25);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const GRID_SIZE = 20;

  // Simulate user/course for preview
  const previewUser = { name: 'Jane Doe' };
  const course = { title: 'React Basics' };

  // Add text element
  const addText = () => {
    setElements([
      ...elements,
      {
        id: `text-${Date.now()}`,
        type: 'text',
        text: 'New Text {name}',
        x: 500,
        y: 500,
        fontSize: 60,
        fontFamily: 'serif',
        fill: '#222',
        width: 1000,
        opacity: 1,
      },
    ]);
  };

  // Add image element
  const addImage = (src: string) => {
    setElements([
      ...elements,
      {
        id: `img-${Date.now()}`,
        type: 'image',
        src,
        x: 500,
        y: 1000,
        width: 400,
        height: 400,
        opacity: 1,
      },
    ]);
  };

  // Select element
  const handleSelect = (id: string) => setSelectedId(id);

  // Enhanced handleDrag with snap-to-grid
  const handleDrag = (id: string, pos: { x: number; y: number }) => {
    let { x, y } = pos;
    if (snapToGrid) {
      x = Math.round(x / GRID_SIZE) * GRID_SIZE;
      y = Math.round(y / GRID_SIZE) * GRID_SIZE;
    }
    setElements(elements.map(el => el.id === id ? { ...el, x, y } : el));
  };

  // Edit text
  const handleTextChange = (id: string, value: string) => {
    setElements(elements.map(el => el.id === id && el.type === 'text' ? { ...el, text: value } : el));
  };

  // Change font size
  const handleFontSize = (id: string, size: number) => {
    setElements(elements.map(el => el.id === id && el.type === 'text' ? { ...el, fontSize: size } : el));
  };

  // Change color
  const handleColor = (id: string, color: string) => {
    setElements(elements.map(el => el.id === id && el.type === 'text' ? { ...el, fill: color } : el));
  };

  // Add handlers for new controls (all typed)
  const handleFontFamily = (id: string, fontFamily: string) => {
    setElements(elements.map(el => el.id === id && el.type === 'text' ? { ...el, fontFamily } : el));
  };
  const handleFontWeight = (id: string, fontWeight: string) => {
    setElements(elements.map(el => el.id === id && el.type === 'text' ? { ...el, fontWeight } : el));
  };
  const handleFontStyle = (id: string, fontStyle: string) => {
    setElements(elements.map(el => el.id === id && el.type === 'text' ? { ...el, fontStyle } : el));
  };
  const handleTextAlign = (id: string, align: string) => {
    setElements(elements.map(el => el.id === id && el.type === 'text' ? { ...el, align } : el));
  };
  const handleLetterSpacing = (id: string, spacing: number) => {
    setElements(elements.map(el => el.id === id && el.type === 'text' ? { ...el, letterSpacing: spacing } : el));
  };
  const handleLineHeight = (id: string, lineHeight: number) => {
    setElements(elements.map(el => el.id === id && el.type === 'text' ? { ...el, lineHeight } : el));
  };
  const handleTextShadow = (id: string, shadow: any) => {
    setElements(elements.map(el => el.id === id && el.type === 'text' ? { ...el, shadow } : el));
  };
  const handleOpacity = (id: string, opacity: number) => {
    setElements(elements.map(el => el.id === id ? { ...el, opacity } : el));
  };
  const handleRotation = (id: string, rotation: number) => {
    setElements(elements.map(el => el.id === id ? { ...el, rotation } : el));
  };
  const handleLock = (id: string, locked: boolean) => {
    setElements(elements.map(el => el.id === id ? { ...el, locked } : el));
  };
  const handleDuplicate = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    setElements([...elements, { ...el, id: `${el.id}-copy`, x: el.x + 40, y: el.y + 40 }]);
  };
  const handleBringForward = (id: string) => {
    const idx = elements.findIndex(el => el.id === id);
    if (idx < elements.length - 1) {
      const newEls = [...elements];
      const [el] = newEls.splice(idx, 1);
      newEls.splice(idx + 1, 0, el);
      setElements(newEls);
    }
  };
  const handleSendBackward = (id: string) => {
    const idx = elements.findIndex(el => el.id === id);
    if (idx > 0) {
      const newEls = [...elements];
      const [el] = newEls.splice(idx, 1);
      newEls.splice(idx - 1, 0, el);
      setElements(newEls);
    }
  };
  // For images
  const handleImageSize = (id: string, width: number, height: number) => {
    setElements(elements.map(el => el.id === id && el.type === 'image' ? { ...el, width, height } : el));
  };
  const handleImageBorder = (id: string, border: string) => {
    setElements(elements.map(el => el.id === id && el.type === 'image' ? { ...el, border } : el));
  };
  const handleImageShadow = (id: string, shadow: any) => {
    setElements(elements.map(el => el.id === id && el.type === 'image' ? { ...el, shadow } : el));
  };
  const handleReplaceImage = (id: string, src: string) => {
    setElements(elements.map(el => el.id === id && el.type === 'image' ? { ...el, src } : el));
  };

  // Remove element
  const removeElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    setSelectedId(null);
  };

  // Upload background image
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') setBackgroundImage(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  // In the component body, update the zoom state on wheel event
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => {
      let next = z - e.deltaY * 0.001;
      next = Math.max(0.1, Math.min(2, next));
      return next;
    });
  };

  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);

  // Fetch templates
  useEffect(() => {
    async function fetchTemplates() {
      setLoadingTemplates(true);
      setFetchError(null);
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) setFetchError(error.message);
      setTemplates(data || []);
      setLoadingTemplates(false);
    }
    fetchTemplates();
  }, []);

  // Load template for editing
  const handleEditTemplate = (t: any) => {
    setEditingTemplateId(t.id);
    setElements(t.elements || []);
    setBackgroundImage(t.background_image || '');
  };

  // Preview template in modal
  const handlePreviewTemplate = (t: any) => setPreviewTemplate(t);
  const closePreviewModal = () => setPreviewTemplate(null);

  // Save or update template
  const handleSave = async () => {
    setSaving(true);
    const template = {
      elements,
      background_image: backgroundImage,
      updated_at: new Date().toISOString(),
      name: 'Certificate Template', // You can add a name input for templates
    };
    let result;
    if (editingTemplateId) {
      // Update existing
      result = await supabase
        .from('certificate_templates')
        .update(template)
        .eq('id', editingTemplateId);
    } else {
      // Insert new
      result = await supabase
        .from('certificate_templates')
        .insert([{ ...template, created_at: new Date().toISOString() }]);
    }
    if (!result.error) {
      // Refresh list
      const { data } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false });
      setTemplates(data || []);
      if (!editingTemplateId && data && data[0]) setEditingTemplateId(data[0].id);
    }
    setSaving(false);
  };

  // Delete template
  const handleDeleteTemplate = async (id: string) => {
    await supabase.from('certificate_templates').delete().eq('id', id);
    setTemplates(templates.filter(t => t.id !== id));
    setShowDeleteId(null);
    // If deleting the one being edited, reset editor
    if (editingTemplateId === id) {
      setEditingTemplateId(null);
      setElements(DEFAULT_ELEMENTS);
      setBackgroundImage('');
    }
  };

  // Duplicate template
  const handleDuplicateTemplate = async (t: any) => {
    setDuplicating(true);
    const newTemplate = {
      ...t,
      id: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      name: (t.name || 'Template') + ' (Copy)',
    };
    await supabase.from('certificate_templates').insert([newTemplate]);
    // Refresh list
    const { data } = await supabase
      .from('certificate_templates')
      .select('*')
      .order('created_at', { ascending: false });
    setTemplates(data || []);
    setDuplicating(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <h1 className="text-3xl font-bold mb-2">Certificate Template Editor</h1>
      <p className="mb-4 text-gray-600">Design your certificate at true print size (A4 landscape, 3508x2480px, 300dpi). Use placeholders: <code className="bg-gray-200 px-1 rounded">{'{name}'}</code>, <code className="bg-gray-200 px-1 rounded">{'{course}'}</code>, <code className="bg-gray-200 px-1 rounded">{'{date}'}</code>.</p>
      <div className="flex gap-8 w-full max-w-7xl">
        {/* Toolbar - now only Save Template and non-canvas actions */}
        <div className="w-64 flex flex-col gap-4 bg-white rounded-xl shadow p-4 h-fit">
          <button className="bg-green-600 text-white px-4 py-2 rounded font-semibold" onClick={handleSave}>Save Template</button>
        </div>
        {/* Editor Canvas */}
        <div className="flex-1 flex flex-col items-center">
          {/* Horizontal main element add toolbar */}
          <div className="flex gap-2 items-center mb-4 bg-white rounded-xl shadow p-2 w-full max-w-3xl justify-center">
            <button className="p-1 hover:bg-gray-200 rounded" title="Add Text" onClick={addText}><Type className="w-5 h-5" /></button>
            <button className="p-1 hover:bg-gray-200 rounded" title="Add Rectangle" onClick={() => setElements([...elements, { id: `shape-rect-${Date.now()}`, type: 'shape', shapeType: 'rect', x: 400, y: 400, width: 200, height: 120, fill: '#cccccc', opacity: 1, cornerRadius: 0 }])}><Square className="w-5 h-5" /></button>
            <button className="p-1 hover:bg-gray-200 rounded" title="Add Circle" onClick={() => setElements([...elements, { id: `shape-circle-${Date.now()}`, type: 'shape', shapeType: 'circle', x: 600, y: 400, width: 120, height: 120, fill: '#cccccc', opacity: 1 }])}><Circle className="w-5 h-5" /></button>
            <label className="p-1 hover:bg-gray-200 rounded cursor-pointer" title="Add Image">
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  if (typeof ev.target?.result === 'string') addImage(ev.target.result);
                };
                reader.readAsDataURL(file);
              }} />
              <PaintBucket className="w-5 h-5" />
            </label>
            <label className="p-1 hover:bg-gray-200 rounded cursor-pointer" title="Add Background">
              <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
              <Droplet className="w-5 h-5" />
            </label>
          </div>
          {/* Horizontal text property toolbar */}
          {selectedId && (() => {
            const el = elements.find(e => e.id === selectedId);
            if (!el) return null;
            if (el.type === 'text') {
              return (
                <div className="flex gap-2 items-center mb-4 bg-white rounded-xl shadow p-2 w-full max-w-3xl justify-center flex-wrap">
                  {/* Font Family */}
                  <div className="flex flex-col items-center" title="Font Family">
                    <Type className="w-5 h-5" />
                    <select
                      className="border rounded px-1 py-0 text-xs mt-1"
                      value={el.fontFamily || 'serif'}
                      onChange={e => handleFontFamily(el.id, e.target.value)}
                    >
                      <option value="serif">Serif</option>
                      <option value="sans-serif">Sans-serif</option>
                      <option value="monospace">Monospace</option>
                      <option value="cursive">Cursive</option>
                      <option value="fantasy">Fantasy</option>
                    </select>
                  </div>
                  {/* Font Size */}
                  <button className="p-1 hover:bg-gray-200 rounded" title="Increase Font Size" onClick={() => handleFontSize(el.id, (el.fontSize || 32) + 2)}><ArrowUpAZ className="w-5 h-5" /></button>
                  <button className="p-1 hover:bg-gray-200 rounded" title="Decrease Font Size" onClick={() => handleFontSize(el.id, Math.max(2, (el.fontSize || 32) - 2))}><ArrowDownAZ className="w-5 h-5" /></button>
                  {/* Bold */}
                  <button className={`p-1 rounded ${el.fontWeight === 'bold' ? 'bg-blue-200' : 'hover:bg-gray-200'}`} title="Bold" onClick={() => handleFontWeight(el.id, el.fontWeight === 'bold' ? 'normal' : 'bold')}><Bold className="w-5 h-5" /></button>
                  {/* Italic */}
                  <button className={`p-1 rounded ${el.fontStyle === 'italic' ? 'bg-blue-200' : 'hover:bg-gray-200'}`} title="Italic" onClick={() => handleFontStyle(el.id, el.fontStyle === 'italic' ? 'normal' : 'italic')}><Italic className="w-5 h-5" /></button>
                  {/* Align Left */}
                  <button className={`p-1 rounded ${el.align === 'left' ? 'bg-blue-200' : 'hover:bg-gray-200'}`} title="Align Left" onClick={() => handleTextAlign(el.id, 'left')}><AlignLeft className="w-5 h-5" /></button>
                  {/* Align Center */}
                  <button className={`p-1 rounded ${el.align === 'center' ? 'bg-blue-200' : 'hover:bg-gray-200'}`} title="Align Center" onClick={() => handleTextAlign(el.id, 'center')}><AlignCenter className="w-5 h-5" /></button>
                  {/* Align Right */}
                  <button className={`p-1 rounded ${el.align === 'right' ? 'bg-blue-200' : 'hover:bg-gray-200'}`} title="Align Right" onClick={() => handleTextAlign(el.id, 'right')}><AlignRight className="w-5 h-5" /></button>
                  {/* Letter Spacing */}
                  <input
                    type="number"
                    className="border rounded px-1 py-0 text-xs w-12 ml-2"
                    title="Letter Spacing"
                    value={el.letterSpacing || 0}
                    onChange={e => handleLetterSpacing(el.id, Number(e.target.value))}
                    style={{ width: 40 }}
                  />
                  {/* Line Height */}
                  <input
                    type="number"
                    className="border rounded px-1 py-0 text-xs w-12 ml-2"
                    title="Line Height"
                    value={el.lineHeight || 1}
                    step={0.1}
                    min={0.5}
                    max={3}
                    onChange={e => handleLineHeight(el.id, Number(e.target.value))}
                    style={{ width: 40 }}
                  />
                  {/* Color */}
                  <label className="flex items-center ml-2 cursor-pointer" title="Text Color">
                    <PaintBucket className="w-5 h-5 mr-1" />
                    <input
                      type="color"
                      className="w-6 h-6 border rounded"
                      value={el.fill}
                      onChange={e => handleColor(el.id, e.target.value)}
                      style={{ padding: 0, border: 'none', background: 'none' }}
                    />
                  </label>
                  {/* Delete */}
                  <button className="p-1 hover:bg-red-100 rounded ml-2" title="Delete" onClick={() => removeElement(el.id)}><Trash2 className="w-5 h-5 text-red-500" /></button>
                </div>
              );
            }
            if (el.type === 'image') {
              return (
                <div className="flex gap-4 items-end mb-4 bg-white rounded-xl shadow p-4 w-full max-w-3xl justify-center">
                  <label className="flex flex-col items-start">
                    <span className="text-xs font-medium mb-1">Width</span>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20"
                      value={el.width}
                      onChange={e => handleImageSize(el.id, Number(e.target.value), el.height)}
                    />
                  </label>
                  <label className="flex flex-col items-start">
                    <span className="text-xs font-medium mb-1">Height</span>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20"
                      value={el.height}
                      onChange={e => handleImageSize(el.id, el.width, Number(e.target.value))}
                    />
                  </label>
                  <label className="flex flex-col items-start">
                    <span className="text-xs font-medium mb-1">Opacity</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={el.opacity}
                      onChange={e => handleOpacity(el.id, Number(e.target.value))}
                    />
                  </label>
                  <button className="bg-red-500 text-white px-4 py-2 rounded ml-4" onClick={() => removeElement(el.id)}>Delete</button>
                </div>
              );
            }
            if (el.type === 'shape') {
              return (
                <div className="flex gap-2 items-center mb-4 bg-white rounded-xl shadow p-2 w-full max-w-3xl justify-center flex-wrap">
                  {/* Shape Type Icon */}
                  {el.shapeType === 'rect' ? <Square className="w-5 h-5" title="Rectangle" /> : <Circle className="w-5 h-5" title="Circle" />}
                  {/* Fill Color */}
                  <label className="flex items-center ml-2 cursor-pointer" title="Shape Color">
                    <Droplet className="w-5 h-5 mr-1" />
                    <input
                      type="color"
                      className="w-6 h-6 border rounded"
                      value={el.fill}
                      onChange={e => setElements(elements.map(e2 => e2.id === el.id ? { ...e2, fill: e.target.value } : e2))}
                      style={{ padding: 0, border: 'none', background: 'none' }}
                    />
                  </label>
                  {/* Opacity */}
                  <label className="flex items-center ml-2 cursor-pointer" title="Opacity">
                    <Droplet className="w-5 h-5 mr-1" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={el.opacity}
                      onChange={e => setElements(elements.map(e2 => e2.id === el.id ? { ...e2, opacity: Number(e.target.value) } : e2))}
                    />
                  </label>
                  {/* Corner Radius for Rect */}
                  {el.shapeType === 'rect' && (
                    <label className="flex flex-col items-center ml-2" title="Corner Radius">
                      <span className="text-xs">Radius</span>
                      <input
                        type="number"
                        className="border rounded px-1 py-0 text-xs w-12"
                        value={el.cornerRadius || 0}
                        min={0}
                        max={Math.min(el.width, el.height) / 2}
                        onChange={e => setElements(elements.map(e2 => e2.id === el.id ? { ...e2, cornerRadius: Number(e.target.value) } : e2))}
                        style={{ width: 40 }}
                      />
                    </label>
                  )}
                  {/* Delete */}
                  <button className="p-1 hover:bg-red-100 rounded ml-2" title="Delete" onClick={() => removeElement(el.id)}><Trash2 className="w-5 h-5 text-red-500" /></button>
                </div>
              );
            }
            return null;
          })()}
          {/* Add zoom and grid controls above the toolbar */}
          <div className="flex gap-4 items-center mb-4 w-full max-w-3xl justify-center">
            <span className="font-semibold">Zoom: {(zoom * 100).toFixed(0)}%</span>
            <button className={`px-3 py-1 rounded ${showGrid ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} onClick={() => setShowGrid(g => !g)}>
              {showGrid ? 'Hide Grid' : 'Show Grid'}
            </button>
            <button className={`px-3 py-1 rounded ${snapToGrid ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} onClick={() => setSnapToGrid(s => !s)}>
              {snapToGrid ? 'Snap On' : 'Snap Off'}
            </button>
          </div>
          <div
            className="border-4 border-blue-200 rounded-xl bg-white shadow-xl overflow-auto"
            style={{ width: CANVAS_WIDTH / 4, height: CANVAS_HEIGHT / 4 }}
            onWheel={handleWheel}
          >
            <CertificateCanvas
              template={(() => {
                // Compose elements with background if set
                if (backgroundImage) {
                  // Remove any previous background element
                  const els = elements.filter(e => e.type !== 'background');
                  return [
                    { id: 'background', type: 'background', src: backgroundImage },
                    ...els,
                  ];
                }
                return elements;
              })()}
              user={previewUser}
              course={course}
              completionDate={new Date().toLocaleDateString()}
              zoom={zoom}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={(id, attrs) => setElements(els => els.map(e => e.id === id ? { ...e, ...attrs } : e))}
              onDelete={removeElement}
            />
          </div>
        </div>
      </div>
      <div className="w-full max-w-7xl mb-8">
        <h2 className="text-2xl font-bold mb-4">Saved Certificate Templates</h2>
        {loadingTemplates ? (
          <div className="text-gray-500">Loading templates...</div>
        ) : fetchError ? (
          <div className="text-red-600">{fetchError}</div>
        ) : templates.length === 0 ? (
          <div className="text-gray-500">No templates found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(t => (
              <div key={t.id} className="bg-white rounded-xl shadow p-4 border border-gray-200 flex flex-col gap-2">
                <div className="font-semibold text-lg">{t.name || 'Untitled Template'}</div>
                <div className="text-gray-500 text-sm">Created: {new Date(t.created_at).toLocaleString()}</div>
                <div className="flex gap-2 mt-2">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => handleEditTemplate(t)}>Edit</button>
                  <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded" onClick={() => handlePreviewTemplate(t)}>Preview</button>
                  <button className="bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => handleDuplicateTemplate(t)} disabled={duplicating}>Duplicate</button>
                  <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => setShowDeleteId(t.id)}>Delete</button>
                </div>
                {showDeleteId === t.id && (
                  <div className="mt-2 flex flex-col gap-2">
                    <span>Are you sure you want to delete this template?</span>
                    <div className="flex gap-2">
                      <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => handleDeleteTemplate(t.id)}>Yes, Delete</button>
                      <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded" onClick={() => setShowDeleteId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-xl shadow-xl p-8 relative"
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" onClick={closePreviewModal}>✕</button>
            <h3 className="text-xl font-bold mb-4">Template Preview</h3>
            <ResponsiveCertificatePreview
              template={previewTemplate.elements}
              user={previewUser}
              course={course}
              completionDate={new Date().toLocaleDateString()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateTemplateEditor;

// Update ResponsiveCertificatePreview to fill modal and center certificate, scaling to fit
const CERT_WIDTH = 1123;
const CERT_HEIGHT = 794;
function ResponsiveCertificatePreview({ template, user, course, completionDate }: any) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(1);

  React.useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      const maxW = containerRef.current.offsetWidth;
      const maxH = containerRef.current.offsetHeight;
      const scale = Math.min(maxW / CERT_WIDTH, maxH / CERT_HEIGHT, 1);
      setZoom(scale);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: CERT_WIDTH,
          height: CERT_HEIGHT,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CertificateCanvas
          template={template}
          user={user}
          course={course}
          completionDate={completionDate}
          zoom={1}
        />
      </div>
    </div>
  );
} 