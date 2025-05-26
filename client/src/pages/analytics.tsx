import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Trophy, Coins } from "lucide-react";

// Mock server ID for demo
const SERVER_ID = "123456789";

export default function Analytics() {
  const { data: serverStats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/servers/${SERVER_ID}/stats`],
  });

  const { data: channelStats, isLoading: channelStatsLoading } = useQuery({
    queryKey: [`/api/servers/${SERVER_ID}/channel-stats`],
  });

  const quickStats = [
    {
      title: "총 등록 유저",
      value: 1542,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/20",
    },
    {
      title: "평균 레벨",
      value: "23.7",
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/20",
    },
    {
      title: "달성된 업적",
      value: 8429,
      icon: Trophy,
      color: "text-pink-500",
      bgColor: "bg-pink-500/20",
    },
    {
      title: "총 포인트 순환",
      value: 245680,
      icon: Coins,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/20",
    },
  ];

  // Mock channel statistics
  const mockChannelStats = [
    { channelId: "general", name: "일반", totalMessages: 12456, activeUsers: 234, avgXp: 1890, growth: "+15%" },
    { channelId: "dev", name: "개발", totalMessages: 8732, activeUsers: 156, avgXp: 2340, growth: "+8%" },
    { channelId: "random", name: "잡담", totalMessages: 6543, activeUsers: 189, avgXp: 1456, growth: "+12%" },
    { channelId: "help", name: "도움", totalMessages: 3421, activeUsers: 98, avgXp: 980, growth: "+5%" },
  ];

  return (
    <div className="animate-fade-in">
      <Header
        title="통계 분석"
        description="서버 활동과 사용자 참여도를 분석하세요"
      />

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
                  ) : (
                    mockChannelStats.map((stat) => (
                      <tr key={stat.channelId} className="border-b border-border">
                        <td className="p-4 text-foreground font-medium"># {stat.name}</td>
                        <td className="p-4 text-muted-foreground">{stat.totalMessages.toLocaleString()}</td>
                        <td className="p-4 text-muted-foreground">{stat.activeUsers}</td>
                        <td className="p-4 text-muted-foreground">{stat.avgXp.toLocaleString()}</td>
                        <td className="p-4">
                          <span className="text-green-500 text-sm">{stat.growth}</span>
                        </td>
                      </tr>
                    ))
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
