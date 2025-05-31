import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Trophy, Coins, Search, Clock, MessageSquare, Mic } from "lucide-react";

// Mock server ID for demo
// Extract serverId from URL path
function useServerId() {
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split('/');
  return pathSegments.length >= 3 ? pathSegments[2] : null;
}

export default function Analytics() {
  const serverId = useServerId();
  const [isUserStatsOpen, setIsUserStatsOpen] = useState(false);
  const [searchUserId, setSearchUserId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const { data: serverStats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/servers/${serverId}/stats`],
    enabled: !!serverId,
  });

  const { data: channelStats, isLoading: channelStatsLoading } = useQuery({
    queryKey: [`/api/servers/${serverId}/channel-stats`],
    enabled: !!serverId,
  });

  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: [`/api/user-stats/${selectedUserId}/${serverId}`],
    enabled: !!selectedUserId && !!serverId,
  });

  const handleUserSearch = () => {
    if (searchUserId.trim()) {
      setSelectedUserId(searchUserId.trim());
    }
  };

  const quickStats = [
    {
      title: "총 등록 유저",
      value: serverStats?.totalUsers || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/20",
    },
    {
      title: "총 메시지",
      value: serverStats?.totalMessages || 0,
      icon: MessageSquare,
      color: "text-green-500",
      bgColor: "bg-green-500/20",
    },
    {
      title: "음성 시간 (분)",
      value: serverStats?.totalVoiceTime || 0,
      icon: Mic,
      color: "text-pink-500",
      bgColor: "bg-pink-500/20",
    },
    {
      title: "레벨업 횟수",
      value: serverStats?.levelUps || 0,
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/20",
    },
  ];

  // Use actual channel statistics
  const channelStatsData = channelStats || [];

  return (
    <div className="animate-fade-in">
      <Header
        title="통계 분석"
        description="서버 활동과 사용자 참여도를 분석하세요"
      >
        <Dialog open={isUserStatsOpen} onOpenChange={setIsUserStatsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Search className="w-4 h-4 mr-2" />
              개인 통계 조회
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>개인 사용자 통계</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="사용자 ID 입력..."
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
                />
                <Button onClick={handleUserSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              
              {userStatsLoading && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">통계를 불러오는 중...</div>
                </div>
              )}
              
              {userStats && (
                <div className="space-y-6">
                  {/* User Basic Info */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xl font-bold">
                            {userStats.username?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{userStats.username || `사용자 ${selectedUserId}`}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>레벨 {userStats.level}</span>
                            <span>랭킹 #{userStats.rank}</span>
                            <span>{userStats.points} 포인트</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <MessageSquare className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{userStats.totalMessages || 0}</div>
                        <div className="text-sm text-muted-foreground">총 메시지</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Mic className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{Math.floor((userStats.totalVoiceTime || 0) / 60)}</div>
                        <div className="text-sm text-muted-foreground">음성채팅 시간 (분)</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Channel Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">채널별 활동</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userStats.channelActivity?.length > 0 ? (
                        <div className="space-y-2">
                          {userStats.channelActivity.map((channel: any) => (
                            <div key={channel.channelId} className="flex justify-between items-center">
                              <span className="text-sm">#{channel.name}</span>
                              <span className="text-sm text-muted-foreground">{channel.messageCount} 메시지</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          채널 활동 데이터가 없습니다.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Achievements */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">획득한 업적</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userStats.achievements?.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {userStats.achievements.map((achievement: any) => (
                            <Badge key={achievement.id} variant="secondary" className="justify-center">
                              {achievement.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          획득한 업적이 없습니다.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Activity Hours */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">주 활동 시간대</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-6 gap-2">
                        {Array.from({ length: 24 }, (_, hour) => {
                          const activity = userStats.hourlyActivity?.[hour] || 0;
                          const intensity = Math.min(activity / 10, 1); // Normalize to 0-1
                          return (
                            <div
                              key={hour}
                              className="h-8 rounded flex items-center justify-center text-xs"
                              style={{
                                backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                                color: intensity > 0.5 ? 'white' : 'black'
                              }}
                            >
                              {hour}시
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 text-center">
                        색이 진할수록 활동량이 많음
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {selectedUserId && !userStatsLoading && !userStats && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">해당 사용자의 통계를 찾을 수 없습니다.</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </Header>

      <div className="p-6 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`${stat.color} text-xl`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="text-muted-foreground text-sm">{stat.title}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>시간대별 활동량</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">히트맵 차트 영역 (실제 구현에서는 D3.js 사용)</p>
              </div>
            </CardContent>
          </Card>

          {/* Level Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>레벨 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">도넛 차트 영역 (실제 구현에서는 Recharts 사용)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Table */}
        <Card>
          <CardHeader>
            <CardTitle>채널별 상세 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-muted-foreground">채널</th>
                    <th className="text-left p-4 text-muted-foreground">메시지 수</th>
                    <th className="text-left p-4 text-muted-foreground">활성 유저</th>
                    <th className="text-left p-4 text-muted-foreground">평균 XP</th>
                    <th className="text-left p-4 text-muted-foreground">증감률</th>
                  </tr>
                </thead>
                <tbody>
                  {channelStatsLoading ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-muted-foreground text-center">
                        로딩 중...
                      </td>
                    </tr>
                  ) : channelStatsData.length > 0 ? (
                    channelStatsData.map((stat: any) => (
                      <tr key={stat.channelId || stat.id} className="border-b border-border">
                        <td className="p-4 text-foreground font-medium"># {stat.name || stat.channelName}</td>
                        <td className="p-4 text-muted-foreground">{(stat.totalMessages || 0).toLocaleString()}</td>
                        <td className="p-4 text-muted-foreground">{stat.activeUsers || 0}</td>
                        <td className="p-4 text-muted-foreground">{(stat.avgXp || 0).toLocaleString()}</td>
                        <td className="p-4">
                          <span className="text-green-500 text-sm">{stat.growth || "N/A"}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-muted-foreground text-center">
                        채널 통계 데이터가 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
