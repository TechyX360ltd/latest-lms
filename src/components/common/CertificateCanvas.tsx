import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer } from 'react-konva';

interface CertificateCanvasProps {
  template: any[]; // array of elements (text/image)
  user: { name: string };
  course: { title: string };
  completionDate: string;
  zoom?: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onChange?: (id: string, attrs: any) => void;
  onDelete?: (id: string) => void;
}

const CANVAS_WIDTH = 1123;
const CANVAS_HEIGHT = 794;

function injectPlaceholders(text: string, user: any, course: any, completionDate: string) {
  return text
    .replace('{name}', user.name)
    .replace('{course}', course.title)
    .replace('{date}', completionDate);
}

export const CertificateCanvas: React.FC<CertificateCanvasProps> = ({
  template,
  user,
  course,
  completionDate,
  zoom = 1,
  selectedId,
  onSelect,
  onChange,
  onDelete,
}) => {
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const nodeRefs = useRef<Record<string, any>>({});

  // Keyboard controls for selected element
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!selectedId) return;
      const el = template.find((el: any) => el.id === selectedId);
      if (!el) return;
      let updated = { ...el };
      let changed = false;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        onDelete && onDelete(selectedId);
        return;
      }
      if (el.type === 'text') {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          updated.text += e.key;
          changed = true;
        }
        if (e.key === 'Backspace' && updated.text.length > 0) {
          updated.text = updated.text.slice(0, -1);
          changed = true;
        }
      }
      // Arrow keys for moving
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const step = e.shiftKey ? 10 : 2;
        if (e.key === 'ArrowUp') updated.y -= step;
        if (e.key === 'ArrowDown') updated.y += step;
        if (e.key === 'ArrowLeft') updated.x -= step;
        if (e.key === 'ArrowRight') updated.x += step;
        changed = true;
      }
      if (changed) {
        onChange && onChange(selectedId, updated);
        e.preventDefault();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, template, onChange, onDelete]);

  // Attach transformer to selected node
  useEffect(() => {
    if (selectedId && trRef.current && nodeRefs.current[selectedId]) {
      trRef.current.nodes([nodeRefs.current[selectedId]]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedId, template]);

  // Render background (if any)
  const bg = template.find((el: any) => el.type === 'background');
  let bgNode = null;
  if (bg && bg.src) {
    bgNode = (
      <URLImage
        key={bg.id}
        src={bg.src}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />
    );
  } else {
    bgNode = (
      <Rect
        x={0}
        y={0}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        fill={bg?.fill || '#fff'}
      />
    );
  }

  return (
    <Stage
      width={CANVAS_WIDTH * zoom}
      height={CANVAS_HEIGHT * zoom}
      scaleX={zoom}
      scaleY={zoom}
      ref={stageRef}
      style={{ background: '#fff', border: '8px solid #333', borderRadius: 8, boxSizing: 'border-box' }}
    >
      <Layer>
        {bgNode}
        {template.filter((el: any) => el.type !== 'background').map((el: any) => {
          if (el.type === 'text') {
            return (
              <Text
                key={el.id}
                ref={node => nodeRefs.current[el.id] = node}
                x={el.x}
                y={el.y}
                text={injectPlaceholders(el.text, user, course, completionDate)}
                fontSize={el.fontSize || 32}
                fontFamily={el.fontFamily || 'serif'}
                fill={el.fill || '#222'}
                fontStyle={el.fontStyle}
                fontWeight={el.fontWeight}
                draggable
                rotation={el.rotation || 0}
                scaleX={el.scaleX || 1}
                scaleY={el.scaleY || 1}
                onClick={() => onSelect && onSelect(el.id)}
                onTap={() => onSelect && onSelect(el.id)}
                onDragEnd={e => onChange && onChange(el.id, { ...el, x: e.target.x(), y: e.target.y() })}
                onTransformEnd={e => {
                  const node = nodeRefs.current[el.id];
                  onChange && onChange(el.id, {
                    ...el,
                    x: node.x(),
                    y: node.y(),
                    scaleX: node.scaleX(),
                    scaleY: node.scaleY(),
                    rotation: node.rotation(),
                  });
                }}
                stroke={selectedId === el.id ? '#0070f3' : undefined}
                strokeWidth={selectedId === el.id ? 1 : 0}
                shadowColor={selectedId === el.id ? '#0070f3' : undefined}
                shadowBlur={selectedId === el.id ? 10 : 0}
                perfectDrawEnabled={false}
              />
            );
          }
          if (el.type === 'image') {
            return (
              <URLImage
                key={el.id}
                ref={node => nodeRefs.current[el.id] = node}
                src={el.src}
                x={el.x}
                y={el.y}
                width={el.width}
                height={el.height}
                opacity={el.opacity}
                draggable
                rotation={el.rotation || 0}
                scaleX={el.scaleX || 1}
                scaleY={el.scaleY || 1}
                onClick={() => onSelect && onSelect(el.id)}
                onTap={() => onSelect && onSelect(el.id)}
                onDragEnd={e => onChange && onChange(el.id, { ...el, x: e.target.x(), y: e.target.y() })}
                onTransformEnd={e => {
                  const node = nodeRefs.current[el.id];
                  onChange && onChange(el.id, {
                    ...el,
                    x: node.x(),
                    y: node.y(),
                    scaleX: node.scaleX(),
                    scaleY: node.scaleY(),
                    rotation: node.rotation(),
                  });
                }}
                stroke={selectedId === el.id ? '#0070f3' : undefined}
                strokeWidth={selectedId === el.id ? 2 : 0}
              />
            );
          }
          return null;
        })}
        {/* Transformer for selected element */}
        {selectedId && nodeRefs.current[selectedId] && (
          <Transformer
            ref={trRef}
            rotateEnabled={true}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            boundBoxFunc={(oldBox, newBox) => {
              // limit resize
              if (newBox.width < 20 || newBox.height < 20) {
                return oldBox;
              }
              return newBox;
            }}
          />
        )}
      </Layer>
    </Stage>
  );
};

// Helper for rendering images from URLs
function URLImage({ src, ...props }: any) {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = src;
    img.onload = () => setImage(img);
  }, [src]);
  return image ? <KonvaImage image={image} {...props} /> : null;
} 