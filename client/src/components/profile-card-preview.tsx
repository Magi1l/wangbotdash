import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, Star, Heart } from "lucide-react";

interface ProfileCardPreviewProps {
  user?: {
    username: string;
    discriminator: string;
    avatar?: string;
  };
  stats?: {
    level: number;
    xp: number;
    maxXp: number;
    points: number;
    rank?: number;
  };
  style?: {
    backgroundColor?: string;
    backgroundImage?: string;
    accentColor: string;
    progressGradient: string[];
  };
  achievements?: Array<{
    icon: string;
    color: string;
  }>;
}

export function ProfileCardPreview({
  user,
  stats,
  style = {
    accentColor: "#5865F2",
    progressGradient: ["#5865F2", "#FF73FA"]
  },
  achievements = []
}: ProfileCardPreviewProps) {
  // Don't render if no user data is provided
  if (!user || !stats) {
    return (
      <div className="rounded-lg p-4 w-80 mx-auto bg-[#36393F] text-white text-center">
        <p>사용자 데이터를 불러오는 중...</p>
      </div>
    );
  }
  const progressPercentage = (stats.xp / stats.maxXp) * 100;

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case "crown":
        return <Crown className="w-3 h-3 text-white" />;
      case "star":
        return <Star className="w-3 h-3 text-white" />;
      case "heart":
        return <Heart className="w-3 h-3 text-white" />;
      default:
        return <Star className="w-3 h-3 text-white" />;
    }
  };

  return (
    <div 
      className="rounded-lg p-4 w-80 mx-auto relative overflow-hidden"
      style={{
        background: style?.backgroundImage 
          ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${style.backgroundImage})`
          : style?.backgroundColor || '#2F3136',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Main content: Avatar and Progress */}
      <div className="flex items-center space-x-3 mb-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=48&h=48&fit=crop&crop=face"} />
            <AvatarFallback className="bg-[#5865F2] text-white">{user.username[0]}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#00D26A] rounded-full border-2 border-[#2F3136]"></div>
        </div>

        {/* User Info and Level */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium text-sm truncate">{user.username}</h4>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-[#B9BBBE] text-xs font-medium">RANK</span>
              <span className="text-white text-sm font-bold">#{stats.rank || 44}</span>
              <span className="text-[#B9BBBE] text-xs font-medium ml-2">LEVEL</span>
              <span className="text-white text-sm font-bold">{stats.level}</span>
            </div>
          </div>

          {/* Progress Bar with XP */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 h-3 bg-[#202225] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercentage}%`,
                  background: `linear-gradient(90deg, ${style.accentColor}, ${style.progressGradient[1] || style.accentColor})`
                }}
              />
            </div>
            <span className="text-[#B9BBBE] text-xs whitespace-nowrap">{stats.xp} / {stats.maxXp} XP</span>
          </div>
        </div>
      </div>

      {/* Achievements at bottom */}
      {achievements && achievements.length > 0 && (
        <div className="flex justify-center">
          <div className="flex space-x-1">
            {achievements.slice(0, 6).map((achievement, index) => (
              <div
                key={index}
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ backgroundColor: achievement.color }}
              >
                {getAchievementIcon(achievement.icon)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
