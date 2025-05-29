import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Crown, MessageCircleQuestion, Gift, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Mock server ID for demo
// Extract serverId from URL path
function useServerId() {
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split('/');
  return pathSegments.length >= 3 ? pathSegments[2] : null;
}

const categoryTabs = [
  { id: "all", label: "전체" },
  { id: "level", label: "레벨" },
  { id: "activity", label: "활동" },
  { id: "hidden", label: "히든" },
];

export default function Achievements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");
  const serverId = useServerId();

  const { data: achievements, isLoading } = useQuery({
    queryKey: [`/api/servers/${serverId}/achievements`],
    enabled: !!serverId,
  });

  const createAchievementMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/servers/${serverId}/achievements`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/achievements`] });
      toast({
        title: "업적 생성 완료",
        description: "새로운 업적이 성공적으로 생성되었습니다.",
      });
    },
  });

  const deleteAchievementMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/achievements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/achievements`] });
      toast({
        title: "업적 삭제 완료",
        description: "업적이 성공적으로 삭제되었습니다.",
      });
    },
  });

  const handleCreateAchievement = () => {
    toast({
      title: "업적 생성",
      description: "새로운 업적을 생성하는 모달이 열립니다.",
    });
  };

  const handleEditAchievement = (achievement: any) => {
    toast({
      title: "업적 편집",
      description: `${achievement.name} 업적을 편집합니다.`,
    });
  };

  const handleDeleteAchievement = (achievement: any) => {
    deleteAchievementMutation.mutate(achievement.id);
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "level":
        return <Crown className="text-white text-2xl" />;
      case "hidden":
        return <MessageCircleQuestion className="text-white text-2xl" />;
      case "event":
        return <Gift className="text-white text-2xl" />;
      default:
        return <Crown className="text-white text-2xl" />;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case "level":
        return "from-yellow-500 to-orange-500";
      case "hidden":
        return "from-purple-500 to-pink-500";
      case "event":
        return "from-yellow-500 to-orange-500";
      default:
        return "from-blue-500 to-purple-500";
    }
  };

  const getCategoryBadge = (type: string, isHidden: boolean, eventEndDate?: string) => {
    if (isHidden) {
      return <Badge className="bg-pink-500 text-white">히든</Badge>;
    }
    if (eventEndDate) {
      return <Badge className="bg-yellow-500 text-black font-medium">이벤트</Badge>;
    }
    return null;
  };

  // Mock data for demonstration
  const mockAchievements = [
    {
      id: 1,
      name: "채팅의 왕",
      description: "1,000개의 메시지를 보내세요",
      type: "activity",
      isHidden: false,
      rewards: { points: 500 },
      achievementRate: 45,
    },
    {
      id: 2,
      name: "신비로운 발견",
      description: "특별한 조건을 만족하세요 (히든)",
      type: "hidden",
      isHidden: true,
      rewards: { backgroundId: 1 },
      achievementRate: 0.1,
    },
    {
      id: 3,
      name: "연말 이벤트 참여자",
      description: "12월 중 특별 활동에 참여하세요",
      type: "event",
      isHidden: false,
      eventEndDate: "2024-12-31",
      rewards: { points: 1000, backgroundId: 2 },
      achievementRate: 12,
      daysLeft: 7,
    },
  ];

  const filteredAchievements = mockAchievements.filter(achievement => {
    if (activeCategory === "all") return true;
    if (activeCategory === "hidden") return achievement.isHidden;
    return achievement.type === activeCategory;
  });

  return (
    <div className="animate-fade-in">
      <Header
        title="업적 관리"
        description="서버 업적과 히든 이벤트를 설정하세요"
      >
        <Button onClick={handleCreateAchievement}>
          <Plus className="w-4 h-4 mr-2" />
          업적 생성
        </Button>
      </Header>

      <div className="p-6">
        {/* Category Tabs */}
        <div className="flex space-x-4 mb-6">
          {categoryTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeCategory === tab.id ? "default" : "ghost"}
              onClick={() => setActiveCategory(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Achievement List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-muted-foreground">로딩 중...</div>
          ) : (
            filteredAchievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`relative ${achievement.eventEndDate ? 'border-yellow-500' : ''}`}
              >
                {getCategoryBadge(achievement.type, achievement.isHidden, achievement.eventEndDate) && (
                  <div className="absolute top-4 right-4">
                    {getCategoryBadge(achievement.type, achievement.isHidden, achievement.eventEndDate)}
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${getAchievementColor(achievement.type)} rounded-xl flex items-center justify-center ${achievement.eventEndDate ? 'animate-pulse-gentle' : ''}`}>
                        {getAchievementIcon(achievement.type)}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground">{achievement.name}</h4>
                        <p className="text-muted-foreground">{achievement.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-green-500 text-sm">
                            보상: {achievement.rewards.points ? `${achievement.rewards.points} 포인트` : ''}
                            {achievement.rewards.backgroundId ? ' + 배경' : ''}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            달성률: {achievement.achievementRate}%
                          </span>
                          {achievement.daysLeft && (
                            <span className="text-yellow-500 text-sm">
                              마감: {achievement.daysLeft}일 남음
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditAchievement(achievement)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAchievement(achievement)}
                        disabled={deleteAchievementMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
