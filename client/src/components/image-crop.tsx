import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Crop as CropIcon, Move } from "lucide-react";

interface ImageCropProps {
  src: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCrop({ src, onCropComplete }: ImageCropProps) {
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      initializeCrop();
    }
  }, [src]);

  const initializeCrop = useCallback(() => {
    if (!imgRef.current) return;
    
    const img = imgRef.current;
    const width = img.clientWidth * 0.8;
    const height = width / 2; // 2:1 비율 유지
    const x = (img.clientWidth - width) / 2;
    const y = (img.clientHeight - height) / 2;
    
    setCropArea({ x, y, width, height });
    updatePreview({ x, y, width, height });
  }, []);

  const updatePreview = useCallback((crop: CropArea) => {
    const img = imgRef.current;
    const canvas = previewCanvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    canvas.width = 800;
    canvas.height = 400;

    ctx.drawImage(
      img,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      800,
      400
    );
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
  }, [cropArea]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !imgRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStart.x;
    const y = e.clientY - rect.top - dragStart.y;

    const maxX = imgRef.current.clientWidth - cropArea.width;
    const maxY = imgRef.current.clientHeight - cropArea.height;

    const newCrop = {
      ...cropArea,
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    };

    setCropArea(newCrop);
    updatePreview(newCrop);
  }, [isDragging, dragStart, cropArea, updatePreview]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleCropFinish = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/png', 0.95);
  }, [onCropComplete]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CropIcon className="w-4 h-4" />
        <span className="text-sm">이미지 크롭 (상자를 드래그하여 원하는 영역을 선택하세요)</span>
      </div>
      
      <div 
        ref={containerRef}
        className="relative border rounded-lg overflow-hidden cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imgRef}
          src={src}
          alt="원본 이미지"
          className="max-h-80 w-auto block mx-auto"
          onLoad={initializeCrop}
          style={{ userSelect: 'none' }}
        />
        
        {cropArea.width > 0 && (
          <>
            {/* 어두운 오버레이 */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none"
              style={{
                clipPath: `polygon(0% 0%, 0% 100%, ${cropArea.x}px 100%, ${cropArea.x}px ${cropArea.y}px, ${cropArea.x + cropArea.width}px ${cropArea.y}px, ${cropArea.x + cropArea.width}px ${cropArea.y + cropArea.height}px, ${cropArea.x}px ${cropArea.y + cropArea.height}px, ${cropArea.x}px 100%, 100% 100%, 100% 0%)`
              }}
            />
            
            {/* 크롭 영역 */}
            <div
              className="absolute border-2 border-blue-500 bg-transparent cursor-move"
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height
              }}
              onMouseDown={handleMouseDown}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Move className="w-6 h-6 text-blue-500" />
              </div>
              
              {/* 모서리 핸들 */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize"></div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"></div>
            </div>
          </>
        )}
      </div>

      {cropArea.width > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">미리보기 (800x400)</Label>
            <Button size="sm" onClick={handleCropFinish}>
              크롭 완료
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden bg-gray-100">
            <canvas
              ref={previewCanvasRef}
              className="w-full h-auto max-h-48 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}