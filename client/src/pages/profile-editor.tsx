import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ProfileCardPreview } from "@/components/profile-card-preview";
import { ColorPicker } from "@/components/color-picker";
import { Save, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const gradientOptions = [
  { name: "Discord", colors: ["#5865F2", "#FF73FA"] },
  { name: "Nature", colors: ["#3BA55D", "#FEE75C"] },
  { name: "Sunset", colors: ["#FF73FA", "#FEE75C"] },
  { name: "Ocean", colors: ["#3B82F6", "#06B6D4"] },
];

const backgroundOptions = [
  { id: 1, name: "Default Gradient", type: "gradient", value: "linear-gradient(135deg, #5865F2 0%, #FF73FA 100%)" },
  { id: 2, name: "Nature Gradient", type: "gradient", value: "linear-gradient(135deg, #3BA55D 0%, #FEE75C 100%)" },
  { id: 3, name: "Neon Dreams", type: "image", value: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&w=300&h=200&fit=crop" },
  { id: 4, name: "Cyber City", type: "image", value: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&w=300&h=200&fit=crop" },
];

export default function ProfileEditor() {
  const { toast } = useToast();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  
  // Extract serverId from URL path using window.location for accuracy
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split('/');
  const serverId = pathSegments.length >= 3 ? pathSegments[2] : null;
  
  console.log('ProfileEditor - Window pathname:', currentPath);
  console.log('ProfileEditor - Wouter location:', location);
  console.log('ProfileEditor - Extracted serverId:', serverId);
  
  const [selectedAccentColor, setSelectedAccentColor] = useState("#5865F2");
  const [selectedGradient, setSelectedGradient] = useState(["#5865F2", "#FF73FA"]);
  const [selectedBackground, setSelectedBackground] = useState(backgroundOptions[0]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current user data from session
  const { data: userSession } = useQuery({
    queryKey: ['/api/me'],
    enabled: true
  });

  // Fetch user's profile data for this server
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/user-profile', serverId],
    enabled: !!serverId,
    queryFn: () => fetch(`/api/user-profile/284280254216798211/${serverId}`).then(res => res.json())
  });

  // Update form state when profile data loads
  useEffect(() => {
    if (profileData?.profileCard) {
      const card = profileData.profileCard;
      if (card.accentColor) setSelectedAccentColor(card.accentColor);
      if (card.progressGradient) setSelectedGradient(card.progressGradient);
      if (card.backgroundColor || card.backgroundImage) {
        const bg = backgroundOptions.find(option => 
          (card.backgroundImage && option.value === card.backgroundImage) ||
          (card.backgroundColor && option.value === card.backgroundColor)
        );
        if (bg) setSelectedBackground(bg);
      }
    }
  }, [profileData]);

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (profileSettings: any) => {
      const response = await fetch(`/api/user-profile/${(userSession as any).user.id}/${serverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileCard: {
            accentColor: selectedAccentColor,
            progressGradient: selectedGradient,
            backgroundColor: selectedBackground.type === "gradient" ? selectedBackground.value : undefined,
            backgroundImage: selectedBackground.type === "image" ? selectedBackground.value : undefined
          }
        })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "프로필 저장 완료!",
        description: "프로필 카드가 성공적으로 저장되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-profile', serverId] });
    },
    onError: (error) => {
      toast({
        title: "저장 실패",
        description: "프로필 저장 중 오류가 발생했습니다.",
      });
    }
  });

  const handleSave = async () => {
    if (!(userSession as any)?.user?.id || !serverId) {
      toast({
        title: "오류",
        description: "사용자 정보나 서버 정보를 찾을 수 없습니다.",
      });
      return;
    }
    
    saveProfileMutation.mutate({});
  };

  const handleFileUpload = () => {
    toast({
      title: "파일 업로드",
      description: "커스텀 배경 업로드 기능이 실행됩니다.",
    });
  };

  // Show login prompt if user is not authenticated
  if (!userSession?.user) {
    return (
      <div className="animate-fade-in">
        <Header
          title="프로필 카드 편집기"
          description="나만의 프로필 카드를 커스터마이징하세요"
        />
        <div className="p-6 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">로그인이 필요합니다</h3>
            <p className="text-gray-600 mb-6">프로필 카드를 편집하려면 Discord 계정으로 로그인해야 합니다.</p>
            <Button asChild>
              <a href="/auth/discord" className="inline-flex items-center">
                Discord로 로그인
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while fetching profile data
  if (isLoadingProfile) {
    return (
      <div className="animate-fade-in">
        <Header
          title="프로필 카드 편집기"
          description="나만의 프로필 카드를 커스터마이징하세요"
        />
        <div className="p-6 text-center">
          <p>프로필 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Header
        title="프로필 카드 편집기"
        description="나만의 프로필 카드를 커스터마이징하세요"
      />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Card Preview */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">실시간 미리보기</h3>
            <ProfileCardPreview
              user={{
                username: "gj_m",
                discriminator: "1234",
                avatar: "https://cdn.discordapp.com/avatars/284280254216798211/avatar.png"
              }}
              stats={{
                level: profileData?.level || 1,
                xp: profileData?.xp || 0,
                maxXp: profileData?.maxXp || 100,
                rank: profileData?.rank || 1,
                points: profileData?.points || 0
              }}
              style={{
                accentColor: selectedAccentColor,
                progressGradient: selectedGradient,
                backgroundImage: selectedBackground.type === "image" ? selectedBackground.value : undefined,
                backgroundColor: selectedBackground.type === "gradient" ? selectedBackground.value : undefined,
              }}
            />
          </div>

          {/* Customization Panel */}
          <div className="space-y-6">
            {/* Color Customization */}
            <Card>
              <CardHeader>
                <CardTitle>색상 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm mb-2">포인트 색상</Label>
                  <ColorPicker
                    selectedColor={selectedAccentColor}
                    onColorSelect={setSelectedAccentColor}
                  />
                </div>

                <div>
                  <Label className="text-sm mb-2">진행바 그라데이션</Label>
                  <div className="space-y-2">
                    {gradientOptions.map((gradient, index) => (
                      <button
                        key={index}
                        className="w-full h-8 rounded-lg transition-all hover:scale-105"
                        style={{
                          background: `linear-gradient(to right, ${gradient.colors[0]}, ${gradient.colors[1]})`
                        }}
                        onClick={() => setSelectedGradient(gradient.colors)}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Background Selection */}
            <Card>
              <CardHeader>
                <CardTitle>배경 설정</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {backgroundOptions.map((background) => (
                    <button
                      key={background.id}
                      className={`h-20 rounded-lg transition-all hover:scale-105 ${
                        selectedBackground.id === background.id ? 'ring-2 ring-primary' : ''
                      }`}
                      style={{
                        background: background.type === "gradient" 
                          ? background.value 
                          : `url(${background.value}) center/cover`
                      }}
                      onClick={() => setSelectedBackground(background)}
                    >
                      {selectedBackground.id === background.id && (
                        <div className="w-full h-full flex items-center justify-center bg-black/30 rounded-lg">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-primary rounded-full" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={handleFileUpload}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  커스텀 배경 업로드
                </Button>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                "저장 중..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  프로필 카드 저장
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
