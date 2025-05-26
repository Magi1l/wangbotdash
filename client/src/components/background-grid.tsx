import { useState } from "react";
import { Eye, Download, ShoppingCart, Lock, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Background {
  id: number;
  name: string;
  description?: string;
  imageUrl: string;
  creator?: {
    name: string;
    avatar?: string;
  };
  category: "free" | "premium" | "achievement" | "owned";
  price?: number;
  sales?: number;
  isLocked?: boolean;
  requiredAchievement?: string;
}

interface BackgroundGridProps {
  backgrounds: Background[];
  onPreview?: (background: Background) => void;
  onPurchase?: (background: Background) => void;
  onEdit?: (background: Background) => void;
  onDelete?: (background: Background) => void;
  className?: string;
}

export function BackgroundGrid({
  backgrounds,
  onPreview,
  onPurchase,
  onEdit,
  onDelete,
  className
}: BackgroundGridProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const getCategoryBadge = (category: string, price?: number) => {
    switch (category) {
      case "free":
        return <Badge className="bg-green-500 text-white">무료</Badge>;
      case "premium":
        return <Badge className="bg-yellow-500 text-black font-medium">{price}P</Badge>;
      case "achievement":
        return <Badge className="bg-pink-500 text-white">업적</Badge>;
      case "owned":
        return <Badge className="bg-blue-500 text-white">내 작품</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", className)}>
      {backgrounds.map((background) => (
        <div
          key={background.id}
          className="bg-card rounded-xl overflow-hidden border border-border group"
          onMouseEnter={() => setHoveredId(background.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Background Image */}
          <div className="h-32 bg-cover bg-center relative overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${background.imageUrl})` }}
            />
            
            {/* Overlay for locked items */}
            {background.isLocked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="text-white text-2xl mb-2 mx-auto" />
                  <p className="text-white text-xs">업적 필요</p>
                </div>
              </div>
            )}

            {/* Hover overlay with actions */}
            {hoveredId === background.id && !background.isLocked && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity">
                <div className="flex space-x-2">
                  {onPreview && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 backdrop-blur-sm text-white border-0"
                      onClick={() => onPreview(background)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {background.category === "owned" && onEdit && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 backdrop-blur-sm text-white border-0"
                      onClick={() => onEdit(background)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {background.category === "owned" && onDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-red-500/80 backdrop-blur-sm text-white border-0"
                      onClick={() => onDelete(background)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Category badge */}
            <div className="absolute top-2 right-2">
              {getCategoryBadge(background.category, background.price)}
            </div>
          </div>

          {/* Background Info */}
          <div className="p-4">
            <h4 className="text-foreground font-medium">{background.name}</h4>
            {background.description && (
              <p className="text-muted-foreground text-sm mt-1">{background.description}</p>
            )}
            
            <div className="flex items-center justify-between mt-3">
              {/* Creator info or achievement requirement */}
              <div className="flex items-center space-x-2">
                {background.creator ? (
                  <>
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={background.creator.avatar} />
                      <AvatarFallback className="text-xs">{background.creator.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground text-xs">{background.creator.name}</span>
                  </>
                ) : background.requiredAchievement ? (
                  <div className="text-muted-foreground text-xs flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    {background.requiredAchievement}
                  </div>
                ) : background.category === "owned" && background.sales ? (
                  <div className="text-muted-foreground text-xs">
                    판매 수익: {background.sales}P
                  </div>
                ) : null}
              </div>

              {/* Action button */}
              <div>
                {background.category === "free" && !background.isLocked && (
                  <Button size="sm" variant="ghost" className="text-primary">
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                {background.category === "premium" && !background.isLocked && onPurchase && (
                  <Button 
                    size="sm" 
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                    onClick={() => onPurchase(background)}
                  >
                    구매
                  </Button>
                )}
                {background.isLocked && (
                  <Button size="sm" variant="ghost" disabled>
                    <Lock className="w-4 h-4" />
                  </Button>
                )}
                {background.category === "owned" && (
                  <Button size="sm" variant="ghost" className="text-primary">
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
