import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface SimpleCropProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

export function SimpleImageCrop({ imageSrc, onCropComplete, onCancel }: SimpleCropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentPos({ x, y });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPos({ x, y });
    
    // 크롭 영역 계산
    const cropX = Math.min(startPos.x, x);
    const cropY = Math.min(startPos.y, y);
    const cropWidth = Math.abs(x - startPos.x);
    const cropHeight = Math.abs(y - startPos.y);
    
    setCropArea({ x: cropX, y: cropY, width: cropWidth, height: cropHeight });
    
    // 캔버스 다시 그리기
    redrawCanvas();
  }, [isDrawing, startPos]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 이미지 그리기
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    // 크롭 영역 표시
    if (cropArea.width > 0 && cropArea.height > 0) {
      // 반투명 오버레이
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 크롭 영역 클리어 (원본 이미지 보이게)
      ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      
      // 크롭 영역 테두리
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    }
  }, [cropArea]);

  const handleImageLoad = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    
    // 캔버스 크기를 이미지에 맞게 조정
    canvas.width = 600;
    canvas.height = (image.naturalHeight / image.naturalWidth) * 600;
    
    redrawCanvas();
  }, [redrawCanvas]);

  const handleCrop = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || cropArea.width === 0 || cropArea.height === 0) return;
    
    // 실제 이미지 크기와 캔버스 크기 비율 계산
    const scaleX = image.naturalWidth / canvas.width;
    const scaleY = image.naturalHeight / canvas.height;
    
    // 실제 이미지에서의 크롭 좌표
    const actualCropX = cropArea.x * scaleX;
    const actualCropY = cropArea.y * scaleY;
    const actualCropWidth = cropArea.width * scaleX;
    const actualCropHeight = cropArea.height * scaleY;
    
    console.log('크롭 정보:', {
      canvas: { width: canvas.width, height: canvas.height },
      image: { width: image.naturalWidth, height: image.naturalHeight },
      scale: { x: scaleX, y: scaleY },
      crop: { x: actualCropX, y: actualCropY, width: actualCropWidth, height: actualCropHeight }
    });
    
    // 새 캔버스에 크롭된 이미지 그리기
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = actualCropWidth;
    cropCanvas.height = actualCropHeight;
    const cropCtx = cropCanvas.getContext('2d');
    
    if (cropCtx) {
      cropCtx.drawImage(
        image,
        actualCropX, actualCropY, actualCropWidth, actualCropHeight,
        0, 0, actualCropWidth, actualCropHeight
      );
      
      cropCanvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      }, 'image/png');
    }
  }, [cropArea, onCropComplete]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        마우스로 드래그하여 크롭할 영역을 선택하세요
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <img
          ref={imageRef}
          src={imageSrc}
          alt="크롭할 이미지"
          className="hidden"
          onLoad={handleImageLoad}
        />
        
        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      
      <div className="flex space-x-2">
        <Button
          onClick={handleCrop}
          disabled={cropArea.width === 0 || cropArea.height === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          크롭 적용
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
        >
          취소
        </Button>
      </div>
    </div>
  );
}