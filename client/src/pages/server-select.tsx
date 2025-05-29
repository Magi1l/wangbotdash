import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, ExternalLink } from "lucide-react";

export default function ServerSelect() {
  const [, setLocation] = useLocation();

  const { data: guilds, isLoading } = useQuery({
    queryKey: ['/api/bot/guilds'],
  });

  const handleServerSelect = (serverId: string) => {
    setLocation(`/dashboard/${serverId}`);
  };

  const getBotInviteUrl = () => {
    return "https://discord.com/oauth2/authorize?client_id=1376994014712037426&permissions=8&integration_type=0&scope=bot+applications.commands";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">서버 목록을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">서버 선택</h1>
          <p className="text-muted-foreground">
            관리하고 싶은 Discord 서버를 선택해주세요.
          </p>
        </div>

        {!guilds || guilds.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">봇이 서버에 없습니다</h3>
                <p className="text-muted-foreground mb-4">
                  대시보드를 사용하려면 먼저 봇을 Discord 서버에 초대해주세요.
                </p>
                <Button asChild>
                  <a 
                    href={getBotInviteUrl()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    봇 초대하기
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guilds.map((guild: any) => (
              <Card key={guild.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage 
                        src={guild.icon 
                          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256`
                          : undefined
                        } 
                      />
                      <AvatarFallback>
                        {guild.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{guild.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        ID: {guild.id}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleServerSelect(guild.id)}
                    className="w-full"
                  >
                    대시보드 열기
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {guilds && guilds.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              다른 서버에도 봇을 추가하고 싶으신가요?
            </p>
            <Button variant="outline" asChild>
              <a 
                href={getBotInviteUrl()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                봇 초대하기
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}