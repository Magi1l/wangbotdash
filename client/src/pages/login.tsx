import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileCardPreview } from "@/components/profile-card-preview";
import { MessageSquare, Users, Trophy, Settings, BarChart3, Palette } from "lucide-react";

export default function LoginPage() {
  const handleDiscordLogin = () => {
    window.location.href = '/auth/discord';
  };

  const features = [
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "메시지 XP 추적",
      description: "채팅 활동에 따라 경험치 획득"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "음성 채팅 보상",
      description: "음성 채널 참여 시간에 따른 XP"
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      title: "업적 시스템",
      description: "다양한 목표 달성으로 특별 보상"
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: "세부 설정",
      description: "채널별 XP 배율 및 쿨다운 조정"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "분석 대시보드",
      description: "서버 활동 통계 및 리더보드"
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: "프로필 커스텀",
      description: "개인 프로필 카드 디자인 변경"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Discord Level Bot
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            서버 활동을 게임화하여 멤버들의 참여도를 높이는 완전한 레벨링 시스템
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gray-900/60 border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-600 rounded-lg text-white">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-400">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profile Card Preview */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">
            아름다운 프로필 카드
          </h2>
          <div className="flex justify-center">
            <ProfileCardPreview />
          </div>
          <p className="text-gray-400 mt-8 max-w-md mx-auto">
            멤버들은 자신만의 스타일로 프로필 카드를 커스터마이징할 수 있습니다
          </p>
        </div>

        {/* Login Card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md bg-gray-900/80 border-gray-700">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">
                관리자 대시보드
              </CardTitle>
              <CardDescription className="text-gray-400">
                서버 설정 및 통계를 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                asChild
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3"
                size="lg"
              >
                <a href="/auth/discord">로그인</a>
              </Button>
              
              <div className="text-center text-sm text-gray-500 mt-4">
                <p>Discord 계정이 필요합니다</p>
                <p className="mt-1">서버 관리자 권한이 있는 계정으로 로그인해주세요</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}