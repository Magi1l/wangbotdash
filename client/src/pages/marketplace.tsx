import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Edit, Trash2, Star } from "lucide-react";
import { SimpleImageCrop } from "@/components/simple-image-crop";

function useServerId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('server') || '1376994014712037426';
}

export default function Marketplace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const serverId = useServerId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  
  const [backgroundForm, setBackgroundForm] = useState({
    name: "",
    description: "",
    price: 0,
    category: "custom" as const
  });

  // 배경 목록 조회 (새 API 사용)
  const { data: backgrounds = [], isLoading } = useQuery({
    queryKey: [`/api/simple/backgrounds/${serverId}`],
    enabled: !!serverId,
  });

  // 배경 업로드 mutation (새 API 사용)
  const uploadBackgroundMutation = useMutation({
    mutationFn: async (data: { formData: FormData }) => {
      console.log('Uploading background with simple API');
      console.log('FormData entries:');
      const entries = Array.from(data.formData.entries());
      for (let [key, value] of entries) {
        console.log(`${key}:`, value);
      }
      
      const response = await fetch('/api/simple/backgrounds', {
        method: 'POST',
        body: data.formData,
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }
        throw new Error(error.error || '배경 업로드 실패');
      }
      
      const result = await response.json();
      console.log('Upload successful:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/simple/backgrounds/${serverId}`] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "배경 업로드 완료",
        description: "새로운 배경이 성공적으로 업로드되었습니다.",
      });
    },
    onError: (error: any) => {
      console.error('Background upload error:', error);
      toast({
        title: "배경 업로드 실패",
        description: `배경 업로드 중 오류가 발생했습니다: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setBackgroundForm({
      name: "",
      description: "",
      price: 0,
      category: "custom"
    });
    setSelectedImage(null);
    setCroppedImageBlob(null);
    setShowCropper(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setCroppedImageBlob(croppedBlob);
    setShowCropper(false);
    toast({
      title: "이미지 크롭 완료",
      description: "이미지가 성공적으로 크롭되었습니다.",
    });
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    try {
      if (!backgroundForm.name.trim() || !backgroundForm.description.trim()) {
        toast({
          title: "입력 오류",
          description: "이름과 설명을 모두 입력해주세요.",
          variant: "destructive"
        });
        return;
      }

      if (!croppedImageBlob) {
        toast({
          title: "이미지 필요",
          description: "배경 이미지를 선택하고 크롭해주세요.",
          variant: "destructive"
        });
        return;
      }

      const formData = new FormData();
      formData.append('serverId', serverId);
      formData.append('name', backgroundForm.name.trim());
      formData.append('description', backgroundForm.description.trim());
      formData.append('price', backgroundForm.price.toString());
      formData.append('category', backgroundForm.category);
      formData.append('image', croppedImageBlob, 'background.png');

      await uploadBackgroundMutation.mutateAsync({ formData });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">배경 목록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">배경 마켓플레이스</h1>
          <p className="text-gray-600 dark:text-gray-400">
            프로필 카드 배경을 관리하고 새로운 배경을 추가하세요
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              배경 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 배경 추가</DialogTitle>
            </DialogHeader>
            
            {showCropper && selectedImage ? (
              <SimpleImageCrop
                imageSrc={selectedImage}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
              />
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">배경 이름</Label>
                  <Input
                    id="name"
                    value={backgroundForm.name}
                    onChange={(e) => setBackgroundForm({ ...backgroundForm, name: e.target.value })}
                    placeholder="배경 이름을 입력하세요"
                  />
                </div>

                <div>
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={backgroundForm.description}
                    onChange={(e) => setBackgroundForm({ ...backgroundForm, description: e.target.value })}
                    placeholder="배경에 대한 설명을 입력하세요"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">가격 (포인트)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={backgroundForm.price}
                      onChange={(e) => setBackgroundForm({ ...backgroundForm, price: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">카테고리</Label>
                    <Select
                      value={backgroundForm.category}
                      onValueChange={(value: any) => setBackgroundForm({ ...backgroundForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">무료</SelectItem>
                        <SelectItem value="premium">프리미엄</SelectItem>
                        <SelectItem value="custom">커스텀</SelectItem>
                        <SelectItem value="event">이벤트</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="image">배경 이미지</Label>
                  <div className="mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      이미지 선택
                    </Button>
                  </div>
                </div>

                {croppedImageBlob && (
                  <div>
                    <Label>크롭된 이미지 미리보기</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(croppedImageBlob)}
                        alt="크롭된 배경"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={uploadBackgroundMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploadBackgroundMutation.isPending ? "업로드 중..." : "배경 추가"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.isArray(backgrounds) && backgrounds.map((background: any) => (
          <Card key={background.id || background._id} className="overflow-hidden">
            <div className="aspect-video relative">
              <img
                src={background.imageUrl}
                alt={background.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge variant={background.category === 'free' ? 'secondary' : 'default'}>
                  {background.category === 'free' ? '무료' :
                   background.category === 'premium' ? '프리미엄' :
                   background.category === 'custom' ? '커스텀' : '이벤트'}
                </Badge>
              </div>
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg">{background.name}</CardTitle>
              <CardDescription className="text-sm">
                {background.description}
              </CardDescription>
            </CardHeader>
            
            <CardFooter className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">{background.price} 포인트</span>
              </div>
              <Button size="sm" variant="outline">
                구매
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {!Array.isArray(backgrounds) || backgrounds.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            등록된 배경이 없습니다
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            첫 번째 배경 추가하기
          </Button>
        </div>
      )}
    </div>
  );
}