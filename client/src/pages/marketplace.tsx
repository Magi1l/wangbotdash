import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { BackgroundGrid } from "@/components/background-grid";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageCrop } from "@/components/image-crop";

// Extract serverId from URL path
function useServerId() {
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split('/');
  return pathSegments.length >= 3 ? pathSegments[2] : null;
}

const filterTabs = [
  { id: "all", label: "전체" },
  { id: "free", label: "무료" },
  { id: "premium", label: "유료" },
  { id: "achievement", label: "업적 전용" },
];

export default function Marketplace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    price: 0,
    category: "free",
    requiredAchievementId: null as number | null
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropPreview, setCropPreview] = useState<string>("");
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const serverId = useServerId();

  const { data: backgrounds, isLoading } = useQuery({
    queryKey: [`/api/servers/${serverId}/backgrounds`],
    enabled: !!serverId,
  });

  const { data: achievements } = useQuery({
    queryKey: [`/api/servers/${serverId}/achievements`],
    enabled: !!serverId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log('Uploading to:', `/api/servers/${serverId}/backgrounds`);
      const response = await fetch(`/api/servers/${serverId}/backgrounds`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "업로드 성공",
        description: "배경이 성공적으로 업로드되었습니다."
      });
      setIsUploadOpen(false);
      resetUploadForm();
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/backgrounds`] });
    },
    onError: (error: any) => {
      console.error('Upload mutation error:', error);
      toast({
        title: "업로드 실패",
        description: `배경 업로드 중 오류가 발생했습니다: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const resetUploadForm = () => {
    setUploadForm({
      name: "",
      description: "",
      price: 0,
      category: "free",
      requiredAchievementId: null
    });
    setSelectedFile(null);
    setCropPreview("");
    setCroppedBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = useCallback((blob: Blob) => {
    setCroppedBlob(blob);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "파일 오류",
          description: "이미지 파일만 업로드할 수 있습니다.",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "파일 크기 오류",
          description: "파일 크기는 5MB 이하여야 합니다.",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const imageUrl = e.target.result as string;
          setCropPreview(imageUrl);
        }
      };
      reader.onerror = () => {
        toast({
          title: "파일 읽기 오류",
          description: "파일을 읽는 중 오류가 발생했습니다.",
          variant: "destructive"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async () => {
    console.log('Upload submit called');
    console.log('Form data:', uploadForm);
    console.log('Selected file:', selectedFile);
    console.log('Cropped blob:', croppedBlob);

    if (!uploadForm.name.trim()) {
      toast({
        title: "입력 오류",
        description: "배경 이름을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!uploadForm.description.trim()) {
      toast({
        title: "입력 오류", 
        description: "배경 설명을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "파일 선택 오류",
        description: "업로드할 이미지를 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!croppedBlob) {
      toast({
        title: "이미지 처리 오류",
        description: "이미지 크롭이 완료될 때까지 기다려주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      const formData = new FormData();
      const croppedFile = new File([croppedBlob], `cropped_${selectedFile.name}`, { type: 'image/png' });
      formData.append('image', croppedFile);
      formData.append('name', uploadForm.name);
      formData.append('description', uploadForm.description);
      formData.append('price', uploadForm.price.toString());
      formData.append('category', uploadForm.category);
      if (uploadForm.requiredAchievementId && uploadForm.requiredAchievementId !== null) {
        formData.append('requiredAchievementId', uploadForm.requiredAchievementId.toString());
      }

      console.log('Submitting form data...');
      uploadMutation.mutate(formData);
    } catch (error) {
      console.error('Upload submit error:', error);
      toast({
        title: "업로드 오류",
        description: "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // Mock data for demo
  const mockBackgrounds = [
    {
      id: 1,
      name: "Neon Dreams",
      description: "추상적인 네온 그라데이션",
      imageUrl: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&w=300&h=200&fit=crop",
      creator: { name: "개발자123", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=20&h=20&fit=crop&crop=face" },
      category: "free" as const,
      price: 0,
    },
    {
      id: 2,
      name: "Cyber City",
      description: "미래도시 야경",
      imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&w=300&h=200&fit=crop",
      creator: { name: "아티스트456" },
      category: "premium" as const,
      price: 50,
    },
    {
      id: 3,
      name: "Sunset Peak",
      description: "일몰이 아름다운 산봉우리",
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&w=300&h=200&fit=crop",
      category: "achievement" as const,
      isLocked: true,
      requiredAchievement: "산악왕 업적 필요",
    },
    {
      id: 4,
      name: "Digital Flow",
      description: "디지털 아트 패턴",
      imageUrl: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?ixlib=rb-4.0.3&w=300&h=200&fit=crop",
      category: "owned" as const,
      sales: 250,
    },
  ];

  const filteredBackgrounds = mockBackgrounds.filter(bg => {
    if (activeFilter === "all") return true;
    if (activeFilter === "free") return bg.category === "free";
    if (activeFilter === "premium") return bg.category === "premium";
    if (activeFilter === "achievement") return bg.category === "achievement";
    return true;
  });

  return (
    <div className="animate-fade-in">
      <Header
        title="배경 마켓플레이스"
        description="커스텀 프로필 배경을 업로드하고 판매하세요"
      >
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              배경 업로드
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 배경 업로드</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">이름</Label>
                <Input
                  id="name"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  placeholder="배경 이름을 입력하세요"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">설명</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                  placeholder="배경에 대한 설명을 입력하세요"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">카테고리</Label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">무료</SelectItem>
                    <SelectItem value="premium">유료</SelectItem>
                    <SelectItem value="achievement">업적 전용</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {uploadForm.category === "premium" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">가격</Label>
                  <Input
                    id="price"
                    type="number"
                    value={uploadForm.price}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className="col-span-3"
                    placeholder="포인트 가격"
                  />
                </div>
              )}
              {uploadForm.category === "achievement" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="achievement" className="text-right">필요 업적</Label>
                  <Select
                    value={uploadForm.requiredAchievementId?.toString() || "none"}
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, requiredAchievementId: value === "none" ? null : parseInt(value) }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="업적을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택 안함</SelectItem>
                      {Array.isArray(achievements) && achievements.map((achievement: any) => (
                        <SelectItem key={achievement.id} value={achievement.id.toString()}>
                          {achievement.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">이미지</Label>
                <div className="col-span-3">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                  />
                  {cropPreview && (
                    <div className="mt-4">
                      <ImageCrop 
                        src={cropPreview}
                        onCropComplete={handleCropComplete}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                취소
              </Button>
              <Button 
                onClick={handleUploadSubmit}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "업로드 중..." : "업로드"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Header>

      <div className="p-6">
        <div className="flex space-x-4 mb-6">
          {filterTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeFilter === tab.id ? "default" : "ghost"}
              onClick={() => setActiveFilter(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : (
          <BackgroundGrid 
            backgrounds={filteredBackgrounds}
            onPreview={() => {}}
            onPurchase={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        )}
      </div>
    </div>
  );
}