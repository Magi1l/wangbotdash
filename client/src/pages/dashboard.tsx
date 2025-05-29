import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MessageSquare, Mic, TrendingUp, ArrowUp } from "lucide-react";

export default function Dashboard() {
  const params = useParams();
  const serverId = params.serverId;

  const { data: serverStats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/servers/${serverId}/stats`],
    enabled: !!serverId,
  });

  const { data: topUsers, isLoading: usersLoading } = useQuery({
    queryKey: [`/api/servers/${serverId}/leaderboard`],
    enabled: !!serverId,
  });

  const { data: serverInfo } = useQuery({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !!serverId,
  });

  if (!serverId) {
    return <div className="p-6">서버를 선택해주세요.</div>;
  }

  const stats = [
    {
      title: "총 활성 유저",
      value: (serverStats as any)?.totalUsers || 0,
      change: null, // 실제 데이터가 없어 변경률 표시하지 않음
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/20",
    },
    {
      title: "총 메시지",
      value: (serverStats as any)?.totalMessages || 0,
      change: null, // 실제 데이터가 없어 변경률 표시하지 않음
      icon: MessageSquare,
      color: "text-green-500",
      bgColor: "bg-green-500/20",
    },
    {
      title: "음성 시간",
      value: `${Math.floor(((serverStats as any)?.totalVoiceTime || 0) / 60)}시간`,
      change: null, // 실제 데이터가 없어 변경률 표시하지 않음
      icon: Mic,
      color: "text-pink-500",
      bgColor: "bg-pink-500/20",
    },
    {
      title: "레벨업 횟수",
      value: (serverStats as any)?.levelUps || 0,
      change: null, // 실제 데이터가 없어 변경률 표시하지 않음
      icon: TrendingUp,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/20",
    },
  ];

  return (
    <div className="animate-fade-in">
      <Header
        title="서버 대시보드"
        description="서버 활동 현황과 주요 지표를 확인하세요"
      >
        <div className="bg-secondary px-4 py-2 rounded-lg">
          <span className="text-muted-foreground text-sm">서버:</span>
          <span className="text-foreground ml-2 font-medium">
            {(serverInfo as any)?.name || "서버 정보 로딩 중..."}
          </span>
        </div>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      </Header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`${stat.color} text-xl`} />
                    </div>
                  </div>
                  {stat.change && (
                    <div className="mt-4 flex items-center">
                      <ArrowUp className="text-green-500 w-4 h-4" />
                      <span className="text-green-500 text-sm ml-1">{stat.change}</span>
                      <span className="text-muted-foreground text-sm ml-1">이번 주</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>주간 활동 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">차트 영역 (실제 구현에서는 Recharts 사용)</p>
              </div>
            </CardContent>
          </Card>

          {/* Top Users */}
          <Card>
            <CardHeader>
              <CardTitle>상위 활동 유저</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usersLoading ? (
                  <div className="text-muted-foreground">로딩 중...</div>
                ) : topUsers && topUsers.length > 0 ? (
                  (topUsers as any[]).map((userServer: any, i: number) => (
                    <div key={userServer.userId} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-bold">{i + 1}</span>
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={userServer.user?.avatar || undefined} />
                        <AvatarFallback>
                          {userServer.user?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-foreground text-sm font-medium">
                          {userServer.user?.username || `유저${i + 1}`}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          레벨 {userServer.level} • {userServer.xp?.toLocaleString()} XP
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm">아직 활동한 유저가 없습니다.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
