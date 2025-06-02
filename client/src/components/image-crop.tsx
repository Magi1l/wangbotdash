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
  const [resizeHandle, setResizeHandle] = useState<string>('');
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

    // 이미지 크기 비율 계산
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    canvas.width = 800;
    canvas.height = 400;

    // 크롭 영역을 원본 이미지 좌표로 변환
    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceWidth = crop.width * scaleX;
    const sourceHeight = crop.height * scaleY;

    // 캔버스 클리어
    ctx.clearRect(0, 0, 800, 400);
    
    // 크롭된 이미지를 800x400으로 그리기
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      800,
      400
    );
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setDragStart({ x, y });
    } else {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  }, [cropArea]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if ((!isDragging && !isResizing) || !containerRef.current || !imgRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isResizing) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      let newCrop = { ...cropArea };

      switch (resizeHandle) {
        case 'se': // 우하단
          newCrop.width = Math.max(50, cropArea.width + deltaX);
          newCrop.height = newCrop.width / 2; // 2:1 비율 유지
          break;
        case 'sw': // 좌하단
          const newWidth = Math.max(50, cropArea.width - deltaX);
          newCrop.width = newWidth;
          newCrop.height = newWidth / 2;
          newCrop.x = cropArea.x + (cropArea.width - newWidth);
          break;
        case 'ne': // 우상단
          const newWidthNE = Math.max(50, cropArea.width + deltaX);
          newCrop.width = newWidthNE;
          newCrop.height = newWidthNE / 2;
          newCrop.y = cropArea.y + cropArea.height - newCrop.height;
          break;
        case 'nw': // 좌상단
          const newWidthNW = Math.max(50, cropArea.width - deltaX);
          newCrop.width = newWidthNW;
          newCrop.height = newWidthNW / 2;
          newCrop.x = cropArea.x + (cropArea.width - newWidthNW);
          newCrop.y = cropArea.y + cropArea.height - newCrop.height;
          break;
      }

      // 경계 체크
      const maxX = imgRef.current.clientWidth - newCrop.width;
      const maxY = imgRef.current.clientHeight - newCrop.height;
      newCrop.x = Math.max(0, Math.min(newCrop.x, maxX));
      newCrop.y = Math.max(0, Math.min(newCrop.y, maxY));

      setCropArea(newCrop);
      updatePreview(newCrop);
    } else if (isDragging) {
      const newX = x - dragStart.x;
      const newY = y - dragStart.y;

      const maxX = imgRef.current.clientWidth - cropArea.width;
      const maxY = imgRef.current.clientHeight - cropArea.height;

      const newCrop = {
        ...cropArea,
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      };

      setCropArea(newCrop);
      updatePreview(newCrop);
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, cropArea, updatePreview]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
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
              <div 
                className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize"
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
              ></div>
              <div 
                className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize"
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
              ></div>
              <div 
                className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize"
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
              ></div>
              <div 
                className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
                onMouseDown={(e) => handleMouseDown(e, 'se')}
              ></div>
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