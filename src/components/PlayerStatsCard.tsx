import { usePlayerStats, Achievement } from '@/hooks/usePlayerStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, Star, Users, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PlayerStatsCardProps {
  userId: string;
}

export function PlayerStatsCard({ userId }: PlayerStatsCardProps) {
  const { stats, achievements, loading } = usePlayerStats(userId);

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const preferredPosition = stats.matches_as_goleiro > stats.matches_as_linha ? 'Goleiro' : 'Linha';
  const positionPercentage = stats.total_matches > 0 
    ? Math.round((Math.max(stats.matches_as_goleiro, stats.matches_as_linha) / stats.total_matches) * 100)
    : 0;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Estatísticas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatBox 
            icon={<Users className="h-4 w-4" />}
            label="Babas Jogados"
            value={stats.total_matches}
            color="text-primary"
          />
          <StatBox 
            icon={<Trophy className="h-4 w-4" />}
            label="Craque do Baba"
            value={`${stats.craque_titles}x`}
            color="text-yellow-500"
          />
          <StatBox 
            icon={<Star className="h-4 w-4" />}
            label="Avaliação Média"
            value={stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : '-'}
            color="text-orange-500"
          />
          <StatBox 
            icon={<Target className="h-4 w-4" />}
            label="Posição Preferida"
            value={stats.total_matches > 0 ? `${preferredPosition} (${positionPercentage}%)` : '-'}
            color="text-green-500"
          />
        </div>

        {/* Position Breakdown */}
        {stats.total_matches > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Distribuição por posição</p>
            <div className="flex gap-2 items-center">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(stats.matches_as_linha / stats.total_matches) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground min-w-[80px]">
                Linha: {stats.matches_as_linha}
              </span>
            </div>
            <div className="flex gap-2 items-center mt-1">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(stats.matches_as_goleiro / stats.total_matches) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground min-w-[80px]">
                Goleiro: {stats.matches_as_goleiro}
              </span>
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Conquistas</p>
            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                {achievements.map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} />
                ))}
              </TooltipProvider>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>
        {icon}
        <span className="text-lg font-bold">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className={`${achievement.color} rounded-full w-8 h-8 flex items-center justify-center text-white text-sm shadow-lg hover:scale-110 transition-transform cursor-pointer`}>
          {achievement.icon}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-center">
          <p className="font-semibold">{achievement.name}</p>
          <p className="text-xs text-muted-foreground">{achievement.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
