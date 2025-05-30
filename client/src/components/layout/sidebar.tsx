import { Link, useLocation, useParams, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { Bot, BarChart3, User, Settings, Store, Trophy, Activity } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Extract serverId from URL path using window.location for accuracy
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split('/');
  const serverId = pathSegments.length >= 3 ? pathSegments[2] : null;
  
  // Debug logging
  console.log('Window pathname:', currentPath);
  console.log('Wouter location:', location);
  console.log('Path segments:', pathSegments);
  console.log('Extracted serverId:', serverId);
  
  const navigation = [
    { name: "대시보드", href: serverId ? `/dashboard/${serverId}` : '#', icon: BarChart3 },
    { name: "프로필 카드", href: serverId ? `/profile/${serverId}` : '#', icon: User },
    { name: "서버 설정", href: serverId ? `/settings/${serverId}` : '#', icon: Settings },
    { name: "배경 마켓", href: serverId ? `/marketplace/${serverId}` : '#', icon: Store },
    { name: "업적 관리", href: serverId ? `/achievements/${serverId}` : '#', icon: Trophy },
    { name: "통계 분석", href: serverId ? `/analytics/${serverId}` : '#', icon: Activity },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="text-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">LevelBot</h1>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "sidebar-nav-item",
                isActive ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://cdn.discordapp.com/avatars/284280254216798211/avatar.png" />
            <AvatarFallback>gj</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">gj_m</p>
            <p className="text-xs text-muted-foreground">#1234</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
