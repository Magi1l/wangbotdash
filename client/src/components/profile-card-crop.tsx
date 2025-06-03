import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ProfileCardCropProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

export function ProfileCardCrop({ imageSrc, onCropComplete, onCancel }: ProfileCardCropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);

  // 프로필 카드 비율 (450:150 = 3:1)
  const ASPECT_RATIO = 3;
  const MAX_CANVAS_WIDTH = 700;
  const MAX_CANVAS_HEIGHT = 400;

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    
    image.onload = () => {
      console.log('Image loaded:', image.width, 'x', image.height);
      setImageElement(image);
      setImageLoaded(true);
      
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        
        // 캔버스 크기를 이미지에 맞게 조정하되 최대 크기 제한
        let displayWidth = image.width;
        let displayHeight = image.height;
        
        if (displayWidth > MAX_CANVAS_WIDTH) {
          const ratio = MAX_CANVAS_WIDTH / displayWidth;
          displayWidth = MAX_CANVAS_WIDTH;
          displayHeight = displayHeight * ratio;
        }
        
        if (displayHeight > MAX_CANVAS_HEIGHT) {
          const ratio = MAX_CANVAS_HEIGHT / displayHeight;
          displayHeight = MAX_CANVAS_HEIGHT;
          displayWidth = displayWidth * ratio;
        }
        
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        
        setScale(image.width / displayWidth);
        
        // 기본 크롭 영역 설정 (중앙에 3:1 비율)
        const defaultWidth = Math.min(image.width, image.height * ASPECT_RATIO);
        const defaultHeight = defaultWidth / ASPECT_RATIO;
        const defaultX = (image.width - defaultWidth) / 2;
        const defaultY = (image.height - defaultHeight) / 2;
        
        setCropArea({
          x: defaultX,
          y: defaultY,
          width: defaultWidth,
          height: defaultHeight
        });
        
        redrawCanvas(image, {
          x: defaultX,
          y: defaultY,
          width: defaultWidth,
          height: defaultHeight
        });
      }
    };
    
    image.onerror = (error) => {
      console.error('Image load error:', error);
    };
    
    image.src = imageSrc;
  }, [imageSrc]);

  const redrawCanvas = useCallback((img: HTMLImageElement, area: typeof cropArea) => {
    if (!canvasRef.current || !img) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 원본 이미지 그리기
    ctx.drawImage(img, 0, 0);
    
    // 어두운 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 크롭 영역 클리어 (밝게 보이도록)
    if (area.width > 0 && area.height > 0) {
      ctx.clearRect(area.x, area.y, area.width, area.height);
      ctx.drawImage(img, area.x, area.y, area.width, area.height, 
                   area.x, area.y, area.width, area.height);
      
      // 크롭 영역 테두리
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.strokeRect(area.x, area.y, area.width, area.height);
      
      // 크롭 영역 모서리 핸들
      const handleSize = 10;
      ctx.fillStyle = '#3b82f6';
      
      // 네 모서리에 핸들 그리기
      ctx.fillRect(area.x - handleSize/2, area.y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(area.x + area.width - handleSize/2, area.y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(area.x - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize);
      ctx.fillRect(area.x + area.width - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize);
    }
  }, []);

  useEffect(() => {
    if (imageElement && imageLoaded) {
      redrawCanvas(imageElement, cropArea);
    }
  }, [cropArea, imageElement, imageLoaded, redrawCanvas]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    
    setIsDrawing(true);
    setStartPos({ x, y });
  }, [scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !imageElement) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    
    // 2:1 비율 유지하면서 크롭 영역 계산
    const width = Math.abs(x - startPos.x);
    const height = width / ASPECT_RATIO;
    
    const cropX = Math.min(startPos.x, x);
    const cropY = Math.min(startPos.y, y);
    
    // 이미지 경계 내에서만 크롭 가능
    const maxWidth = imageElement.width - cropX;
    const maxHeight = imageElement.height - cropY;
    
    const finalWidth = Math.min(width, maxWidth);
    const finalHeight = Math.min(height, maxHeight, finalWidth / ASPECT_RATIO);
    const finalWidthFromHeight = finalHeight * ASPECT_RATIO;
    
    setCropArea({
      x: cropX,
      y: cropY,
      width: finalWidthFromHeight,
      height: finalHeight
    });
  }, [isDrawing, startPos, scale, imageElement, ASPECT_RATIO]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!imageElement || cropArea.width === 0 || cropArea.height === 0) {
      alert('크롭 영역을 선택해주세요.');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 프로필 카드 최종 해상도 (450x150)
    canvas.width = 450;
    canvas.height = 150;

    // 크롭된 영역을 450x150으로 리사이즈
    ctx.drawImage(
      imageElement,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, 450, 150
    );

    canvas.toBlob((blob) => {
      if (blob) {
        console.log('Cropped image created:', blob.size, 'bytes');
        onCropComplete(blob);
      }
    }, 'image/png', 0.9);
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
        드래그하여 프로필 카드용 배경 영역을 선택하세요 (3:1 비율, 최종 450x150px)
      </div>
      
      <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden flex justify-center">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-crosshair"
        />
        
        {cropArea.width > 0 && cropArea.height > 0 && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
            {Math.round(cropArea.width)} × {Math.round(cropArea.height)} → 450 × 150
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