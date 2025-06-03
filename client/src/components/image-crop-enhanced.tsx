import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ImageCropProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropEnhanced({ imageSrc, onCropComplete, onCancel }: ImageCropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      setImageLoaded(true);
      setImageElement(image);
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0);
        }
      }
    };
    image.src = imageSrc;
  }, [imageSrc]);

  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current || !imageElement || !imageLoaded) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 이미지 다시 그리기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageElement, 0, 0);

    // 크롭 영역이 있으면 오버레이 그리기
    if (cropArea.width > 0 && cropArea.height > 0) {
      // 반투명 오버레이
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 크롭 영역 클리어 (원본 이미지 보이게)
      ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      ctx.drawImage(imageElement, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 
                   cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      
      // 크롭 영역 테두리
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    }
  }, [cropArea, imageLoaded, imageElement]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setCurrentPos({ x, y });
    
    const cropX = Math.min(startPos.x, x);
    const cropY = Math.min(startPos.y, y);
    const cropWidth = Math.abs(x - startPos.x);
    const cropHeight = Math.abs(y - startPos.y);
    
    setCropArea({ x: cropX, y: cropY, width: cropWidth, height: cropHeight });
  }, [isDrawing, startPos]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!canvasRef.current || !imageElement || cropArea.width === 0 || cropArea.height === 0) {
      alert('크롭 영역을 선택해주세요.');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    ctx.drawImage(
      imageElement,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/png');
  }, [cropArea, onCropComplete, imageElement]);

  if (!imageLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">이미지를 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        마우스로 드래그하여 크롭할 영역을 선택하세요
      </div>
      
      <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="max-w-full max-h-96 cursor-crosshair"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
        
        {cropArea.width > 0 && cropArea.height > 0 && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
            {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button 
          onClick={handleCrop}
          disabled={cropArea.width === 0 || cropArea.height === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          크롭 완료
        </Button>
      </div>
    </div>
  );
}