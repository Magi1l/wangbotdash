import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, Hash, Volume2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ServerSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  
  // Extract serverId from URL path
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split('/');
  const serverId = pathSegments.length >= 3 ? pathSegments[2] : null;
  
  console.log('ServerSettings - Extracted serverId:', serverId);

  const { data: channelConfigs, isLoading: channelsLoading } = useQuery({
    queryKey: [`/api/servers/${serverId}/channels`],
    enabled: !!serverId,
  });

  const { data: serverData } = useQuery({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !!serverId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return apiRequest("PATCH", `/api/servers/${serverId}/settings`, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
      toast({
        title: "설정 저장 완료!",
        description: "서버 설정이 성공적으로 업데이트되었습니다.",
      });
    },
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    const settings = {
      levelUpChannel: "general",
      pointsPerLevel: 100,
      levelUpMessage: "축하합니다! {user}님이 레벨 {level}에 도달했습니다!"
    };

    updateSettingsMutation.mutate(settings);
    setIsSaving(false);
  };

  // Mock channel data
  const mockChannels = [
    { id: "1", name: "일반", type: "text", messageXp: 15, cooldown: 60 },
    { id: "2", name: "개발", type: "text", messageXp: 20, cooldown: 45 },
    { id: "3", name: "음성채팅", type: "voice", voiceXpPerMinute: 5, minUsersForVoice: 2 },
  ];

  const mockVoiceChannels = [
    { id: "4", name: "일반 음성", xpPerMinute: 5, minUsers: 2 },
  ];

  return (
    <div className="animate-fade-in">
      <Header
        title="서버 설정"
        description="채널별 경험치 및 이벤트 설정을 관리하세요"
      />

      <div className="p-6 space-y-8">
        {/* Channel XP Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Hash className="w-5 h-5 mr-2" />
              채널별 경험치 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelsLoading ? (
                <div className="text-muted-foreground">로딩 중...</div>
              ) : (
                mockChannels.filter(ch => ch.type === "text").map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Hash className="text-muted-foreground" />
                      <span className="text-foreground font-medium">{channel.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">메시지 XP:</Label>
                        <Input
                          type="number"
                          defaultValue={channel.messageXp}
                          className="w-16"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">쿨다운:</Label>
                        <Input
                          type="number"
                          defaultValue={channel.cooldown}
                          className="w-16"
                        />
                        <span className="text-muted-foreground text-sm">초</span>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Voice Channel Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Volume2 className="w-5 h-5 mr-2" />
              음성 채널 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockVoiceChannels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="text-muted-foreground" />
                    <span className="text-foreground font-medium">{channel.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm">분당 XP:</Label>
                      <Input
                        type="number"
                        defaultValue={channel.xpPerMinute}
                        className="w-16"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm">최소 인원:</Label>
                      <Input
                        type="number"
                        defaultValue={channel.minUsers}
                        className="w-16"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Level Up Settings */}
        <Card>
          <CardHeader>
            <CardTitle>레벨업 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm mb-2">레벨업 공지 채널</Label>
                <Select defaultValue="general">
                  <SelectTrigger>
                    <SelectValue placeholder="채널 선택..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">일반</SelectItem>
                    <SelectItem value="announcements">공지사항</SelectItem>
                    <SelectItem value="level-ups">레벨업</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm mb-2">레벨당 포인트 지급</Label>
                <Input type="number" defaultValue="100" />
              </div>
            </div>

            <div className="mt-4">
              <Label className="text-sm mb-2">레벨업 메시지 템플릿</Label>
              <Textarea
                defaultValue="축하합니다! {user}님이 레벨 {level}에 도달했습니다!"
                className="h-20"
                placeholder="축하합니다! {user}님이 레벨 {level}에 도달했습니다!"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving || updateSettingsMutation.isPending}
          >
            {isSaving || updateSettingsMutation.isPending ? (
              "저장 중..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                설정 저장
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
