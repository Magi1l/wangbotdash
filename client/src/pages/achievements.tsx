import { useState } from "react";
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
import { Plus, Star, Trophy, Target, Calendar, Clock, MessageSquare, Mic } from "lucide-react";

function useServerId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('server') || '1376994014712037426';
}

export default function Achievements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const serverId = useServerId();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [achievementForm, setAchievementForm] = useState({
    name: "",
    description: "",
    type: "activity" as const,
    pointReward: 0
  });

  // 업적 목록 조회 (새 API 사용)
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: [`/api/simple/achievements/${serverId}`],
    enabled: !!serverId,
  });

  // 업적 생성 mutation (새 API 사용)
  const createAchievementMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating achievement with simple API:', data);
      
      const requestData = {
        serverId,
        name: data.name,
        description: data.description,
        type: data.type || 'activity',
        pointReward: data.pointReward || 0
      };
      
      const result = await apiRequest("POST", `/api/simple/achievements`, requestData);
      console.log('Achievement created:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/simple/achievements/${serverId}`] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "업적 생성 완료",
        description: "새로운 업적이 성공적으로 생성되었습니다.",
      });
    },
    onError: (error: any) => {
      console.error('Achievement creation error:', error);
      toast({
        title: "업적 생성 실패",
        description: `업적 생성 중 오류가 발생했습니다: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setAchievementForm({
      name: "",
      description: "",
      type: "activity",
      pointReward: 0
    });
  };

  const handleCreateSubmit = () => {
    if (!achievementForm.name.trim()) {
      toast({
        title: "입력 오류",
        description: "업적 이름을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!achievementForm.description.trim()) {
      toast({
        title: "입력 오류",
        description: "업적 설명을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    createAchievementMutation.mutate(achievementForm);
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'activity': return <MessageSquare className="w-8 h-8 text-white" />;
      case 'social': return <Mic className="w-8 h-8 text-white" />;
      case 'milestone': return <Trophy className="w-8 h-8 text-white" />;
      case 'special': return <Star className="w-8 h-8 text-white" />;
      default: return <Target className="w-8 h-8 text-white" />;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'activity': return 'from-blue-500 to-blue-600';
      case 'social': return 'from-green-500 to-green-600';
      case 'milestone': return 'from-purple-500 to-purple-600';
      case 'special': return 'from-yellow-500 to-yellow-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">업적 목록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">업적 관리</h1>
          <p className="text-gray-600 dark:text-gray-400">
            서버 업적을 관리하고 새로운 업적을 만들어보세요
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              새 업적 생성
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 업적 생성</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">업적 이름</Label>
                <Input
                  id="name"
                  value={achievementForm.name}
                  onChange={(e) => setAchievementForm({ ...achievementForm, name: e.target.value })}
                  placeholder="업적 이름을 입력하세요"
                />
              </div>

              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={achievementForm.description}
                  onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                  placeholder="업적에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">업적 유형</Label>
                  <Select
                    value={achievementForm.type}
                    onValueChange={(value: any) => setAchievementForm({ ...achievementForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="업적 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activity">활동</SelectItem>
                      <SelectItem value="social">소셜</SelectItem>
                      <SelectItem value="milestone">마일스톤</SelectItem>
                      <SelectItem value="special">특별</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pointReward">포인트 보상</Label>
                  <Input
                    id="pointReward"
                    type="number"
                    min="0"
                    value={achievementForm.pointReward}
                    onChange={(e) => setAchievementForm({ ...achievementForm, pointReward: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  취소
                </Button>
                <Button
                  onClick={handleCreateSubmit}
                  disabled={createAchievementMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createAchievementMutation.isPending ? "생성 중..." : "업적 생성"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(achievements) && achievements.map((achievement: any) => (
          <Card key={achievement.id || achievement._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Badge variant={achievement.type === 'special' ? 'default' : 'secondary'}>
                  {achievement.type === 'activity' ? '활동' :
                   achievement.type === 'social' ? '소셜' :
                   achievement.type === 'milestone' ? '마일스톤' : '특별'}
                </Badge>
                {achievement.eventEndDate && (
                  <div className="flex items-center text-sm text-orange-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    이벤트
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${getAchievementColor(achievement.type)} rounded-xl flex items-center justify-center`}>
                    {getAchievementIcon(achievement.type)}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">{achievement.name}</h4>
                    <p className="text-muted-foreground">{achievement.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-green-500 text-sm">
                        보상: {achievement.rewards?.points ? `${achievement.rewards.points} 포인트` : '0 포인트'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!Array.isArray(achievements) || achievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            등록된 업적이 없습니다
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            첫 번째 업적 만들기
          </Button>
        </div>
      )}
    </div>
  );
}