import React, { forwardRef } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

// A4 landscape at 96dpi: 1123x794 px
const CANVAS_WIDTH = 3508;
const CANVAS_HEIGHT = 2480;

function injectPlaceholders(text: string, user: any, course: any) {
  return text
    .replace(/\{name\}/gi, `${user?.first_name || ''} ${user?.last_name || ''}`.trim())
    .replace(/\{course\}/gi, course?.title || '');
}

const CertificatePreview = forwardRef(({ template, user, course }: any, ref) => {
  const [bgImg] = useImage(template?.background_image || '', 'anonymous');
  return (
    <div ref={ref} className="w-full flex justify-center items-center aspect-[1123/794] rounded-xl overflow-hidden bg-[#f8fafc]">
      <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ width: '100%', height: 'auto' }}>
        <Layer>
          {template?.background_image ? (
            <KonvaImage image={bgImg} x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} listening={false} />
          ) : (
            <Rect x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#fff" cornerRadius={24} shadowBlur={8} />
          )}
          {template?.elements?.map((el: any, idx: number) => {
            if (el.type === 'text') {
              return (
                <Text
                  key={el.id || idx}
                  x={el.x}
                  y={el.y}
                  text={injectPlaceholders(el.text, user, course)}
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
    </div>
  );
});

const MiniImage = ({ src, x, y, width, height, opacity }: any) => {
  const [img] = useImage(src, 'anonymous');
  return <KonvaImage image={img} x={x} y={y} width={width} height={height} opacity={opacity ?? 1} draggable={false} />;
};

export default CertificatePreview; 