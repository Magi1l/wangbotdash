import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Plus, Settings, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function ServersPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user's Discord guilds from API
  const { data: userGuilds = [], isLoading: userLoading } = useQuery<any[]>({
    queryKey: ['/api/user/guilds'],
    enabled: !!user,
  });

  // Fetch bot's Discord guilds from API
  const { data: botGuilds = [], isLoading: botLoading } = useQuery<any[]>({
    queryKey: ['/api/bot/guilds'],
    enabled: !!user,
  });

  const isLoading = userLoading || botLoading;

  // Combine and prioritize guilds
  const adminGuilds = React.useMemo(() => {
    if (!userGuilds.length && !botGuilds.length) return [];

    const combined = new Map();
    
    // Add user's admin guilds with priority
    userGuilds.forEach((guild: any) => {
      combined.set(guild.id, {
        ...guild,
        hasAdmin: true,
        hasBotAccess: false,
        priority: 1 // Admin only
      });
    });

    // Add bot guilds and update priority
    botGuilds.forEach((guild: any) => {
      const existing = combined.get(guild.id);
      if (existing) {
        // User is admin AND bot is present
        combined.set(guild.id, {
          ...existing,
          hasBotAccess: true,
          priority: 3 // Admin + Bot
        });
      } else {
        // Bot only
        combined.set(guild.id, {
          ...guild,
          hasAdmin: false,
          hasBotAccess: true,
          priority: 2 // Bot only
        });
      }
    });

    // Sort by priority (highest first) and then by name
    return Array.from(combined.values()).sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.name.localeCompare(b.name);
    });
  }, [userGuilds, botGuilds]);



  const handleServerSelect = (serverId: string) => {
    setLocation(`/dashboard/${serverId}`);
  };

  const inviteBot = (guildId: string) => {
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=1376994014712037426&permissions=8&integration_type=0&scope=bot+applications.commands&guild_id=${guildId}`;
    window.open(inviteUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="서버 선택"
        description="관리할 서버를 선택하세요"
      />

      <div className="container mx-auto p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p>서버 목록을 불러오는 중...</p>
          </div>
        ) : adminGuilds.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>관리 권한이 있는 서버가 없습니다</CardTitle>
              <CardDescription>
                관리자 또는 소유자 권한이 있는 Discord 서버에서 봇을 사용할 수 있습니다.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminGuilds.map((guild: any) => {
              const hasBotAccess = guild.hasBotAccess;
              
              return (
                <Card 
                  key={guild.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : undefined} 
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {guild.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{guild.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {guild.owner && (
                            <Badge variant="secondary" className="text-xs">
                              소유자
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {guild.approximate_member_count || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {guild.priority === 3 ? (
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                          관리자 권한 + 봇 연결됨
                        </div>
                        <Button 
                          onClick={() => handleServerSelect(guild.id)}
                          className="w-full"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          관리하기
                        </Button>
                      </div>
                    ) : guild.priority === 2 ? (
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-blue-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                          봇이 서버에 있습니다 (제한된 기능)
                        </div>
                        <Button 
                          onClick={() => handleServerSelect(guild.id)}
                          variant="outline"
                          className="w-full"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          통계 및 프로필 보기
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                          봇을 초대해주세요
                        </div>
                        <Button 
                          onClick={() => inviteBot(guild.id)}
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          봇 초대하기
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}