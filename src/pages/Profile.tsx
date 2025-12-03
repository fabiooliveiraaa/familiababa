import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/Header';
import { StarRating } from '@/components/StarRating';
import { PlayerStatsCard } from '@/components/PlayerStatsCard';
import { useProfile } from '@/hooks/useProfile';
import { useAuthContext } from '@/contexts/AuthContext';
import { useState, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { profile, ratings, averageRating, loading, updateProfile, uploadAvatar, ratePlayer, getUserRating } = useProfile(id || '');
  
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = user?.id === id;
  const existingRating = user ? getUserRating(user.id) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Perfil não encontrado</h1>
          <Button onClick={() => navigate('/')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    setUploading(true);
    await uploadAvatar(file);
    setUploading(false);
  };

  const handleSaveProfile = async () => {
    await updateProfile({ first_name: firstName, last_name: lastName });
    setEditing(false);
  };

  const handleSubmitRating = async () => {
    if (!user || newRating === 0) return;
    
    setSubmittingRating(true);
    await ratePlayer(user.id, newRating, newComment);
    setNewRating(0);
    setNewComment('');
    setSubmittingRating(false);
  };

  const startEditing = () => {
    setFirstName(profile.first_name);
    setLastName(profile.last_name);
    setEditing(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-3 sm:mb-4 -ml-2 h-9">
          <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="text-sm">Voltar</span>
        </Button>

        {/* Profile Card */}
        <Card className="border-2 mb-4 sm:mb-6">
          <CardContent className="p-4 sm:pt-6 sm:p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl sm:text-3xl font-bold">
                    {profile.first_name[0]}{profile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8 sm:h-10 sm:w-10 p-0"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </Button>
                  </>
                )}
              </div>

              {editing ? (
                <div className="mt-4 space-y-3 sm:space-y-4 w-full max-w-xs">
                  <div>
                    <Label className="text-sm">Nome</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-9 sm:h-10" />
                  </div>
                  <div>
                    <Label className="text-sm">Sobrenome</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-9 sm:h-10" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} className="flex-1 h-9 sm:h-10 text-sm">Salvar</Button>
                    <Button variant="outline" onClick={() => setEditing(false)} className="flex-1 h-9 sm:h-10 text-sm">Cancelar</Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold mt-3 sm:mt-4">{profile.first_name} {profile.last_name}</h1>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-2">
                    <StarRating rating={Math.round(averageRating)} size="lg" />
                    <span className="text-lg sm:text-xl font-bold text-warning">{averageRating > 0 ? averageRating.toFixed(1) : '-'}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">({ratings.length})</span>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Desde {format(parseISO(profile.created_at), "MMM/yyyy", { locale: ptBR })}
                  </p>

                  {isOwnProfile && (
                    <Button variant="outline" onClick={startEditing} className="mt-3 sm:mt-4 h-9 sm:h-10 text-sm">
                      Editar Perfil
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <div className="mb-4 sm:mb-6">
          <PlayerStatsCard userId={id || ''} />
        </div>

        {/* Rating Section - Only show for other users */}
        {user && !isOwnProfile && (
          <Card className="border-2 mb-4 sm:mb-6">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                Avaliar Jogador
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 space-y-3 sm:space-y-4">
              {existingRating && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Você já avaliou. Sua avaliação será atualizada.
                </p>
              )}
              <div>
                <Label className="mb-2 block text-sm">Nível Futebolístico</Label>
                <StarRating 
                  rating={newRating || existingRating?.skill_rating || 0} 
                  size="lg" 
                  interactive 
                  onRatingChange={setNewRating}
                />
              </div>
              <div>
                <Label className="text-sm">Comentário (opcional)</Label>
                <Textarea
                  placeholder="Ex: Ótimo finalizador..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
              <Button 
                onClick={handleSubmitRating} 
                disabled={newRating === 0 || submittingRating}
                className="w-full h-9 sm:h-10 text-sm"
              >
                {submittingRating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : existingRating ? 'Atualizar' : 'Enviar Avaliação'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        <Card className="border-2">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              Avaliações ({ratings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {ratings.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                Nenhuma avaliação ainda
              </p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {ratings.map((rating) => (
                  <div key={rating.id} className="p-3 sm:p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <Avatar 
                        className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer shrink-0" 
                        onClick={() => navigate(`/profile/${rating.rater_id}`)}
                      >
                        <AvatarImage src={rating.rater?.avatar_url || undefined} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs sm:text-sm">
                          {rating.rater?.first_name?.[0]}{rating.rater?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p 
                          className="font-medium cursor-pointer hover:underline text-sm sm:text-base truncate"
                          onClick={() => navigate(`/profile/${rating.rater_id}`)}
                        >
                          {rating.rater?.first_name} {rating.rater?.last_name}
                        </p>
                        <StarRating rating={rating.skill_rating} size="sm" />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(parseISO(rating.created_at), "dd/MM/yy")}
                      </span>
                    </div>
                    {rating.comment && (
                      <p className="text-xs sm:text-sm text-muted-foreground ml-10 sm:ml-13">{rating.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}