import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Crop as CropIcon } from "lucide-react";

interface ImageCropProps {
  src: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

export function ImageCrop({ src, onCropComplete }: ImageCropProps) {
  const [ReactCrop, setReactCrop] = useState<any>(null);
  const [crop, setCrop] = useState<any>({
    unit: '%',
    width: 90,
    height: 50,
    x: 5,
    y: 25
  });
  const [completedCrop, setCompletedCrop] = useState<any>();
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamic import of react-image-crop
  useEffect(() => {
    const loadCropComponent = async () => {
      try {
        const module = await import('react-image-crop');
        setReactCrop(() => module.default);
        
        // Also load CSS
        await import('react-image-crop/dist/ReactCrop.css');
      } catch (error) {
        console.error('Failed to load react-image-crop:', error);
      }
    };
    
    loadCropComponent();
  }, []);

  const drawCroppedImage = useCallback((
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    crop: any
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = 800;
    canvas.height = 400;

    ctx.drawImage(
      image,
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

  const onCropCompleteHandler = useCallback((crop: any) => {
    if (imgRef.current && previewCanvasRef.current && crop.width && crop.height) {
      drawCroppedImage(imgRef.current, previewCanvasRef.current, crop);
    }
  }, [drawCroppedImage]);

  const handleCropFinish = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/png', 0.95);
  }, [onCropComplete]);

  if (!ReactCrop) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg">
        <div className="text-center">
          <CropIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">크롭 컴포넌트 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CropIcon className="w-4 h-4" />
        <span className="text-sm">이미지 크롭 (드래그하여 원하는 영역을 선택하세요)</span>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <ReactCrop
          crop={crop}
          onChange={(c: any) => setCrop(c)}
          onComplete={(c: any) => {
            setCompletedCrop(c);
            onCropCompleteHandler(c);
          }}
          aspect={2}
        >
          <img
            ref={imgRef}
            src={src}
            alt="원본 이미지"
            style={{ maxHeight: '300px', width: 'auto' }}
            onLoad={() => {
              if (imgRef.current && previewCanvasRef.current) {
                const initialCrop = {
                  unit: 'px',
                  x: imgRef.current.width * 0.05,
                  y: imgRef.current.height * 0.25,
                  width: imgRef.current.width * 0.9,
                  height: imgRef.current.height * 0.5
                };
                setCompletedCrop(initialCrop);
                onCropCompleteHandler(initialCrop);
              }
            }}
          />
        </ReactCrop>
      </div>

      {completedCrop && (
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
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '200px',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}