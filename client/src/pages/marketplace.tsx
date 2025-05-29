import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { BackgroundGrid } from "@/components/background-grid";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock server ID for demo
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
  const [activeFilter, setActiveFilter] = useState("all");
  const serverId = useServerId();

  const { data: backgrounds, isLoading } = useQuery({
    queryKey: [`/api/servers/${serverId}/backgrounds`],
    enabled: !!serverId,
  });

  const handleUploadBackground = () => {
    toast({
      title: "배경 업로드",
      description: "새로운 배경을 업로드할 수 있는 창이 열립니다.",
    });
  };

  const handlePreview = (background: any) => {
    toast({
      title: "미리보기",
      description: `${background.name} 배경을 미리보기합니다.`,
    });
  };

  const handlePurchase = (background: any) => {
    toast({
      title: "구매 완료",
      description: `${background.name} 배경을 ${background.price}P에 구매했습니다.`,
    });
  };

  const handleEdit = (background: any) => {
    toast({
      title: "편집",
      description: `${background.name} 배경을 편집합니다.`,
    });
  };

  const handleDelete = (background: any) => {
    toast({
      title: "삭제",
      description: `${background.name} 배경을 삭제했습니다.`,
      variant: "destructive",
    });
  };

  // Mock data for demonstration
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
        <Button onClick={handleUploadBackground}>
          <Plus className="w-4 h-4 mr-2" />
          배경 업로드
        </Button>
      </Header>

      <div className="p-6">
        {/* Filter Tabs */}
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

        {/* Background Grid */}
        {isLoading ? (
          <div className="text-muted-foreground">로딩 중...</div>
        ) : (
          <BackgroundGrid
            backgrounds={filteredBackgrounds}
            onPreview={handlePreview}
            onPurchase={handlePurchase}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
