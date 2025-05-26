import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MessageSquare, Mic, TrendingUp, ArrowUp } from "lucide-react";

// Mock server ID for demo
const SERVER_ID = "123456789";

export default function Dashboard() {
  const { data: serverStats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/servers/${SERVER_ID}/stats`],
  });

  const { data: topUsers, isLoading: usersLoading } = useQuery({
    queryKey: [`/api/servers/${SERVER_ID}/leaderboard`],
  });

  const stats = [
    {
      title: "총 활성 유저",
      value: serverStats?.totalUsers || 1234,
      change: "+12%",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/20",
    },
    {
      title: "총 메시지",
      value: serverStats?.totalMessages || 45678,
      change: "+8%",
      icon: MessageSquare,
      color: "text-green-500",
      bgColor: "bg-green-500/20",
    },
    {
      title: "음성 시간",
      value: `${Math.floor((serverStats?.totalVoiceTime || 53520) / 60)}시간`,
      change: "+15%",
      icon: Mic,
      color: "text-pink-500",
      bgColor: "bg-pink-500/20",
    },
    {
      title: "레벨업 횟수",
      value: serverStats?.levelUps || 156,
      change: "+23%",
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
          <span className="text-foreground ml-2 font-medium">개발자 커뮤니티</span>
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
                  <div className="mt-4 flex items-center">
                    <ArrowUp className="text-green-500 w-4 h-4" />
                    <span className="text-green-500 text-sm ml-1">{stat.change}</span>
                    <span className="text-muted-foreground text-sm ml-1">이번 주</span>
                  </div>
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
                ) : (
                  Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-bold">{i + 1}</span>
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={`https://images.unsplash.com/photo-150750321${i}169-0a1dd7228f2d?ixlib=rb-4.0.3&w=32&h=32&fit=crop&crop=face`} />
                        <AvatarFallback>U{i + 1}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-foreground text-sm font-medium">개발자{i + 1}23</p>
                        <p className="text-muted-foreground text-xs">레벨 {45 - i * 3} • {(12450 - i * 1000).toLocaleString()} XP</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
