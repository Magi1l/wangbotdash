import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Crown, MessageCircleQuestion, Gift, Edit, Trash2, X } from "lucide-react";
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

interface AchievementCondition {
  id: string;
  type: 'messages' | 'voice_time' | 'level' | 'date_range' | 'time_range' | 'channel_specific';
  operator: 'gte' | 'lte' | 'eq' | 'between';
  value: number | string;
  secondValue?: number | string; // for between operator
  channelId?: string;
  description: string;
}

export default function Achievements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [achievementForm, setAchievementForm] = useState({
    name: "",
    description: "",
    type: "activity",
    isHidden: false,
    pointReward: 0,
    backgroundReward: null as number | null,
    eventStartDate: "",
    eventEndDate: "",
    conditions: [] as AchievementCondition[]
  });
  const serverId = useServerId();

  const { data: achievements, isLoading } = useQuery({
    queryKey: [`/api/simple/achievements/${serverId}`],
    enabled: !!serverId,
  });

  const { data: channels = [] } = useQuery({
    queryKey: [`/api/public/servers/${serverId}/channels`],
    enabled: !!serverId,
  });

  const { data: backgrounds = [] } = useQuery({
    queryKey: [`/api/servers/${serverId}/backgrounds`],
    enabled: !!serverId,
  });

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
      isHidden: false,
      pointReward: 0,
      backgroundReward: null,
      eventStartDate: "",
      eventEndDate: "",
      conditions: []
    });
  };

  const addCondition = () => {
    const newCondition: AchievementCondition = {
      id: Date.now().toString(),
      type: 'messages',
      operator: 'gte',
      value: 0,
      description: '메시지 수 조건'
    };
    setAchievementForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const updateCondition = (id: string, updates: Partial<AchievementCondition>) => {
    setAchievementForm(prev => ({
      ...prev,
      conditions: prev.conditions.map(condition => 
        condition.id === id ? { ...condition, ...updates } : condition
      )
    }));
  };

  const removeCondition = (id: string) => {
    setAchievementForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter(condition => condition.id !== id)
    }));
  };

  const getConditionDescription = (condition: AchievementCondition) => {
    const typeLabels = {
      messages: '메시지 수',
      voice_time: '음성채팅 시간(분)',
      level: '레벨',
      date_range: '날짜 범위',
      time_range: '시간 범위',
      channel_specific: '특정 채널'
    };
    
    const operatorLabels = {
      gte: '이상',
      lte: '이하', 
      eq: '정확히',
      between: '범위'
    };

    let desc = typeLabels[condition.type];
    if (condition.channelId && condition.type === 'channel_specific') {
      const channel = channels?.find((c: any) => c.id === condition.channelId);
      desc += ` (#${channel?.name || '알 수 없음'})`;
    }
    desc += ` ${operatorLabels[condition.operator]} ${condition.value}`;
    if (condition.operator === 'between' && condition.secondValue) {
      desc += ` ~ ${condition.secondValue}`;
    }
    return desc;
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

  const filteredAchievements = achievements?.filter((achievement: any) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "hidden") return achievement.isHidden;
    return achievement.type === activeCategory;
  }) || [];

  return (
    <div className="animate-fade-in">
      <Header
        title="업적 관리"
        description="서버 업적과 히든 이벤트를 설정하세요"
      >
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              업적 생성
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 업적 생성</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">이름</Label>
                <Input
                  id="name"
                  value={achievementForm.name}
                  onChange={(e) => setAchievementForm(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  placeholder="업적 이름을 입력하세요"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">설명</Label>
                <Textarea
                  id="description"
                  value={achievementForm.description}
                  onChange={(e) => setAchievementForm(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                  placeholder="업적에 대한 설명을 입력하세요"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">타입</Label>
                <Select
                  value={achievementForm.type}
                  onValueChange={(value) => setAchievementForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity">활동</SelectItem>
                    <SelectItem value="level">레벨</SelectItem>
                    <SelectItem value="event">이벤트</SelectItem>
                    <SelectItem value="hidden">히든</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hidden" className="text-right">히든 업적</Label>
                <div className="col-span-3">
                  <Switch
                    id="hidden"
                    checked={achievementForm.isHidden}
                    onCheckedChange={(checked) => setAchievementForm(prev => ({ ...prev, isHidden: checked }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pointReward" className="text-right">포인트 보상</Label>
                <Input
                  id="pointReward"
                  type="number"
                  value={achievementForm.pointReward}
                  onChange={(e) => setAchievementForm(prev => ({ ...prev, pointReward: parseInt(e.target.value) || 0 }))}
                  className="col-span-3"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="backgroundReward" className="text-right">배경 보상</Label>
                <Select
                  value={achievementForm.backgroundReward?.toString() || "none"}
                  onValueChange={(value) => setAchievementForm(prev => ({ ...prev, backgroundReward: value === "none" ? null : parseInt(value) }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="선택 안함" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안함</SelectItem>
                    {backgrounds?.map((bg: any) => (
                      <SelectItem key={bg.id} value={bg.id.toString()}>
                        {bg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {achievementForm.type === "event" && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="eventStart" className="text-right">시작 날짜</Label>
                    <Input
                      id="eventStart"
                      type="date"
                      value={achievementForm.eventStartDate}
                      onChange={(e) => setAchievementForm(prev => ({ ...prev, eventStartDate: e.target.value }))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="eventEnd" className="text-right">종료 날짜</Label>
                    <Input
                      id="eventEnd"
                      type="date"
                      value={achievementForm.eventEndDate}
                      onChange={(e) => setAchievementForm(prev => ({ ...prev, eventEndDate: e.target.value }))}
                      className="col-span-3"
                    />
                  </div>
                </>
              )}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg font-semibold">달성 조건</Label>
                  <Button type="button" onClick={addCondition} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    조건 추가
                  </Button>
                </div>
                
                {achievementForm.conditions.map((condition, index) => (
                  <Card key={condition.id} className="mb-4">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium">조건 {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCondition(condition.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <Label>조건 타입</Label>
                          <Select
                            value={condition.type}
                            onValueChange={(value: any) => updateCondition(condition.id, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="messages">메시지 수</SelectItem>
                              <SelectItem value="voice_time">음성채팅 시간</SelectItem>
                              <SelectItem value="level">레벨</SelectItem>
                              <SelectItem value="date_range">날짜 범위</SelectItem>
                              <SelectItem value="time_range">시간 범위</SelectItem>
                              <SelectItem value="channel_specific">특정 채널</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>조건</Label>
                          <Select
                            value={condition.operator}
                            onValueChange={(value: any) => updateCondition(condition.id, { operator: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gte">이상</SelectItem>
                              <SelectItem value="lte">이하</SelectItem>
                              <SelectItem value="eq">정확히</SelectItem>
                              <SelectItem value="between">범위</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {condition.type === 'channel_specific' && (
                        <div className="mb-3">
                          <Label>채널 선택</Label>
                          <Select
                            value={condition.channelId || ""}
                            onValueChange={(value) => updateCondition(condition.id, { channelId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="채널을 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              {channels?.map((channel: any) => (
                                <SelectItem key={channel.id} value={channel.id}>
                                  #{channel.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>값</Label>
                          <Input
                            type={condition.type === 'date_range' ? 'date' : condition.type === 'time_range' ? 'time' : 'number'}
                            value={condition.value}
                            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                            placeholder={condition.type === 'voice_time' ? '분' : condition.type === 'messages' ? '메시지 수' : '값'}
                          />
                        </div>
                        
                        {condition.operator === 'between' && (
                          <div>
                            <Label>최댓값</Label>
                            <Input
                              type={condition.type === 'date_range' ? 'date' : condition.type === 'time_range' ? 'time' : 'number'}
                              value={condition.secondValue || ''}
                              onChange={(e) => updateCondition(condition.id, { secondValue: e.target.value })}
                              placeholder="최댓값"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          {getConditionDescription(condition)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {achievementForm.conditions.length === 0 && (
                  <div className="text-center text-muted-foreground p-8 border border-dashed rounded-lg">
                    조건을 추가해주세요
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                취소
              </Button>
              <Button 
                onClick={handleCreateSubmit}
                disabled={createAchievementMutation.isPending}
              >
                {createAchievementMutation.isPending ? "생성 중..." : "생성"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                      <div className={`w-16 h-16 bg-gradient-to-br ${getAchievementColor(achievement.type)} rounded-xl flex items-center justify-cent