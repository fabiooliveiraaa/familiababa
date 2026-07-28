import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, Users, Lock, Unlock, Loader2, Upload, Copy, CheckCircle, Trash2, Download, UserPlus, UserRoundPlus } from 'lucide-react';
import { ChampionTeamSelector } from '@/components/ChampionTeamSelector';
import { UserSearchSelect } from '@/components/UserSearchSelect';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { PlayerList } from '@/components/PlayerList';
import { BabaVoting } from '@/components/BabaVoting';
import { AdminAITools } from '@/components/AdminAITools';
import { PublishedTeams } from '@/components/PublishedTeams';
import { useBabas, useBabaRegistrations } from '@/hooks/useBabas';
import { useAuthContext } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatCountdown, isRegistrationLive, useNow } from '@/lib/registrationSchedule';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function BabaDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { babas, loading: babasLoading, toggleBabaOpen, deleteBaba, refetch: refetchBabas } = useBabas();
  const { registrations, loading: regsLoading, register, registerMensalista, registerGuest, promoteFromWaitingList, updateStatus, removeRegistration, refetch } = useBabaRegistrations(id || '');
  const { user, isAdmin } = useAuthContext();
  const [selectedPosition, setSelectedPosition] = useState<'linha' | 'goleiro'>('linha');
  const [uploading, setUploading] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mensalistaDialogOpen, setMensalistaDialogOpen] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPosition, setGuestPosition] = useState<'linha' | 'goleiro'>('linha');
  const [selectedMensalista, setSelectedMensalista] = useState<{ id: string; first_name: string; last_name: string; avatar_url: string | null } | null>(null);
  const now = useNow();

  const baba = babas.find((b) => b.id === id);

  if (babasLoading || regsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!baba) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Baba não encontrado</h1>
          <Button onClick={() => navigate('/')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const linhaCount = registrations.filter((r) => r.position === 'linha' && r.status !== 'lista_espera').length;
  const goleiroCount = registrations.filter((r) => r.position === 'goleiro').length;
  const confirmedCount = registrations.filter((r) => r.status === 'confirmado').length;

  const isUserRegistered = user && registrations.some((r) => r.user_id === user.id);
  const isLinhaFull = linhaCount >= baba.max_linha_players;
  const isGoleiroFull = goleiroCount >= baba.max_goleiros;
  const registrationLive = isRegistrationLive(baba, now);
  const scheduledOpening = baba.is_open && !registrationLive && !!baba.registration_opens_at;
  const openingCountdown = baba.registration_opens_at
    ? formatCountdown(baba.registration_opens_at, now)
    : null;

  const canRegister = () => {
    if (!registrationLive) return false;
    if (isUserRegistered) return false;
    if (selectedPosition === 'goleiro' && isGoleiroFull) return false;
    if (selectedPosition === 'linha' && !paymentProofFile) return false;
    return true;
  };

  const handleAddMensalista = async () => {
    if (!selectedMensalista) return;
    const success = await registerMensalista(selectedMensalista.id);
    if (success) {
      setSelectedMensalista(null);
      setMensalistaDialogOpen(false);
    }
  };

  const handleAddGuest = async () => {
    const success = await registerGuest(guestName, guestPosition);
    if (success) {
      setGuestName('');
      setGuestPosition('linha');
      setGuestDialogOpen(false);
    }
  };

  const handlePromoteFromWaitingList = async (userId: string) => {
    await promoteFromWaitingList(userId);
  };

  const handleCopyPix = async () => {
    if (baba.pix_key) {
      await navigator.clipboard.writeText(baba.pix_key);
      setCopied(true);
      toast({ title: 'Chave PIX copiada!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Arquivo muito grande', description: 'Máximo 5MB', variant: 'destructive' });
        return;
      }
      setPaymentProofFile(file);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setUploading(true);
    let paymentProofUrl: string | undefined;

    if (selectedPosition === 'linha' && paymentProofFile) {
      const fileExt = paymentProofFile.name.split('.').pop();
      const fileName = `${user.id}/${id}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, paymentProofFile);

      if (error) {
        toast({ title: 'Erro ao enviar comprovante', description: error.message, variant: 'destructive' });
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(data.path);
      paymentProofUrl = urlData.publicUrl;
    }

    await register(user.id, selectedPosition, paymentProofUrl, isLinhaFull && selectedPosition === 'linha');
    setPaymentProofFile(null);
    setUploading(false);
  };

  const handleStatusChange = (userId: string, newStatus: 'inscrito' | 'pago' | 'confirmado' | 'lista_espera') => {
    updateStatus(userId, newStatus);
  };

  const handleRemovePlayer = async (registrationId: string) => {
    await removeRegistration(registrationId);
  };

  const handleDeleteBaba = async () => {
    const success = await deleteBaba(baba.id);
    if (success) {
      navigate('/');
    }
  };

  const handleExportList = () => {
    const confirmedLinhaPlayers = registrations
      .filter((r) => r.position === 'linha' && r.status === 'confirmado')
      .map((r, idx) => `${idx + 1}. ${r.profiles?.first_name} ${r.profiles?.last_name}`)
      .join('\n');

    const goleiros = registrations
      .filter((r) => r.position === 'goleiro')
      .map((r, idx) => `${idx + 1}. ${r.profiles?.first_name} ${r.profiles?.last_name}`)
      .join('\n');

    const content = `${baba.title} - ${format(parseISO(baba.date), "dd/MM/yyyy", { locale: ptBR })}\n\n` +
      `JOGADORES CONFIRMADOS (${registrations.filter(r => r.position === 'linha' && r.status === 'confirmado').length}):\n${confirmedLinhaPlayers || 'Nenhum'}\n\n` +
      `GOLEIROS (${registrations.filter(r => r.position === 'goleiro').length}):\n${goleiros || 'Nenhum'}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baba.title.replace(/\s+/g, '_')}_${baba.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Lista exportada!' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-3 sm:mb-4 -ml-2 h-9">
          <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="text-sm">Voltar</span>
        </Button>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Info Card */}
          <Card className="lg:col-span-1 border-2">
            <CardHeader className="bg-secondary p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-secondary-foreground text-base sm:text-xl truncate">{baba.title}</CardTitle>
                <Badge variant={baba.is_open ? 'default' : 'secondary'} className={`shrink-0 ${baba.is_open ? 'bg-success' : ''}`}>
                  {baba.is_open ? 'Aberto' : 'Fechado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-4 sm:pt-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="text-sm sm:text-base font-medium truncate">
                  {format(parseISO(baba.date), "EEE, dd 'de' MMM", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="text-sm sm:text-base">{baba.start_time} - {baba.end_time}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="text-sm sm:text-base truncate">{baba.location}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="font-bold text-base sm:text-lg">R$ {Number(baba.price).toFixed(2)}</span>
              </div>

              {/* PIX Key Section */}
              {baba.pix_key && (
                <div className="border-t pt-3 sm:pt-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                    <DollarSign className="h-4 w-4" />
                    Pagamento via PIX
                  </h4>
                  <div className="bg-muted p-2 sm:p-3 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Chave PIX:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs sm:text-sm bg-background p-2 rounded truncate">{baba.pix_key}</code>
                      <Button size="sm" variant="outline" onClick={handleCopyPix} className="h-8 px-2 sm:px-3 shrink-0">
                        {copied ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <Users className="h-4 w-4" />
                  Vagas
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-muted p-2 sm:p-3 rounded-lg text-center">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{linhaCount}/{baba.max_linha_players}</p>
                    <p className="text-xs text-muted-foreground">Linha</p>
                  </div>
                  <div className="bg-muted p-2 sm:p-3 rounded-lg text-center">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{goleiroCount}/{baba.max_goleiros}</p>
                    <p className="text-xs text-muted-foreground">Goleiros</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">Confirmados</h4>
                <div className="bg-success/20 p-2 sm:p-3 rounded-lg text-center">
                  <p className="text-xl sm:text-2xl font-bold text-success">{confirmedCount}</p>
                  <p className="text-xs text-muted-foreground">Participantes confirmados</p>
                </div>
              </div>

              {user && !isAdmin && (
                <div className="border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                  {isUserRegistered ? (
                    <div className="bg-success/20 p-3 sm:p-4 rounded-lg text-center">
                      <p className="font-semibold text-success text-sm sm:text-base">✓ Você está inscrito!</p>
                    </div>
                  ) : baba.is_open ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPosition('linha')}
                          className={`rounded-lg border-2 p-3 text-center transition-all ${
                            selectedPosition === 'linha'
                              ? 'border-primary bg-primary/10 shadow-sm'
                              : 'border-border bg-card hover:border-primary/40'
                          }`}
                        >
                          <div className="text-2xl mb-1">⚽</div>
                          <div className="text-sm font-semibold">Linha</div>
                          {isLinhaFull && <div className="text-[10px] text-warning mt-0.5">Lista de espera</div>}
                        </button>
                        <button
                          type="button"
                          onClick={() => !isGoleiroFull && setSelectedPosition('goleiro')}
                          disabled={isGoleiroFull}
                          className={`rounded-lg border-2 p-3 text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            selectedPosition === 'goleiro'
                              ? 'border-primary bg-primary/10 shadow-sm'
                              : 'border-border bg-card hover:border-primary/40'
                          }`}
                        >
                          <div className="text-2xl mb-1">🧤</div>
                          <div className="text-sm font-semibold">Goleiro</div>
                          {isGoleiroFull && <div className="text-[10px] text-destructive mt-0.5">Cheio</div>}
                        </button>
                      </div>

                      {selectedPosition === 'linha' && (
                        <div className="space-y-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,.pdf"
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant={paymentProofFile ? 'secondary' : 'outline'}
                            className="w-full h-10 text-sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {paymentProofFile ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2 text-success shrink-0" />
                                <span className="truncate">Comprovante anexado</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2 shrink-0" />
                                <span className="truncate">Anexar comprovante PIX</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {selectedPosition === 'goleiro' && (
                        <p className="text-xs text-muted-foreground bg-muted p-2 rounded text-center">
                          🧤 Goleiros não pagam e são confirmados automaticamente.
                        </p>
                      )}

                      <p className="text-[11px] text-center text-destructive font-bold animate-pulse">
                        🚫 PROIBIDO JUNIOR MORAES 🚫
                      </p>

                      <Button 
                        className="w-full btn-glow h-11 text-base font-semibold" 
                        onClick={handleRegister} 
                        disabled={!canRegister() || uploading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : isLinhaFull && selectedPosition === 'linha' ? (
                          'Entrar na lista de espera'
                        ) : (
                          'Confirmar inscrição'
                        )}
                      </Button>
                    </>
                  ) : scheduledOpening ? (
                    <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-4 text-center animate-fade-in">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-primary animate-pulse" />
                      <p className="text-sm font-semibold text-primary">
                        Inscrições abrem em {openingCountdown ?? 'instantes'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(baba.registration_opens_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-muted p-3 sm:p-4 rounded-lg text-center">
                      <Lock className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">Inscrições fechadas</p>
                    </div>
                  )}
                </div>
              )}

              {!user && (
                <div className="border-t pt-3 sm:pt-4">
                  <Button className="w-full h-10 text-sm sm:text-base" onClick={() => navigate('/auth')}>
                    Entrar para se inscrever
                  </Button>
                </div>
              )}

              {isAdmin && (
                <div className="border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                  <Dialog open={mensalistaDialogOpen} onOpenChange={setMensalistaDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="w-full h-9 sm:h-10 text-sm">
                        <UserPlus className="h-4 w-4 mr-2" /> Mensalista
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[90vw] sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Adicionar Mensalista 👑</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Mensalistas são adicionados diretamente como confirmados. Busque pelo nome do jogador cadastrado.
                        </p>
                        <UserSearchSelect
                          onSelect={setSelectedMensalista}
                          excludeUserIds={registrations.map(r => r.user_id).filter((id): id is string => id !== null)}
                          placeholder="Buscar jogador cadastrado..."
                        />
                        {selectedMensalista && (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <span className="text-sm font-medium">
                              👑 {selectedMensalista.first_name} {selectedMensalista.last_name}
                            </span>
                          </div>
                        )}
                        <Button 
                          className="w-full" 
                          onClick={handleAddMensalista}
                          disabled={!selectedMensalista}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-9 sm:h-10 text-sm">
                        <UserRoundPlus className="h-4 w-4 mr-2" /> Convidado
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[90vw] sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Adicionar Convidado 🎟️</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Convidados são jogadores sem cadastro. Digite o nome e selecione a posição.
                        </p>
                        <Input
                          placeholder="Nome do convidado"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                        />
                        <Select value={guestPosition} onValueChange={(v) => setGuestPosition(v as 'linha' | 'goleiro')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Posição" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linha">Linha</SelectItem>
                            <SelectItem value="goleiro">Goleiro</SelectItem>
                          </SelectContent>
                        </Select>
                        {guestName.trim() && (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <span className="text-sm font-medium">
                              🎟️ {guestName.trim()} ({guestPosition === 'linha' ? 'Linha' : 'Goleiro'})
                            </span>
                          </div>
                        )}
                        <Button 
                          className="w-full" 
                          onClick={handleAddGuest}
                          disabled={!guestName.trim()}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant={baba.is_open ? 'destructive' : 'default'}
                    className="w-full h-9 sm:h-10 text-sm"
                    onClick={() => toggleBabaOpen(baba.id, baba.is_open)}
                  >
                    {baba.is_open ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" /> Fechar
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 mr-2" /> Abrir
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-9 sm:h-10 text-sm"
                    onClick={handleExportList}
                  >
                    <Download className="h-4 w-4 mr-2" /> Exportar
                  </Button>

                  {!baba.is_open && (
                    <ChampionTeamSelector 
                      babaId={baba.id} 
                      registrations={registrations} 
                      onSaved={refetch}
                    />
                  )}

                  <div className="border-t pt-3 mt-3">
                    <AdminAITools 
                      baba={baba} 
                      registrations={registrations} 
                      onTeamsPublished={refetchBabas}
                    />
                  </div>

                  {!baba.is_open && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full h-9 sm:h-10 text-sm">
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Baba?</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            Esta ação não pode ser desfeita. Todas as inscrições serão removidas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteBaba} className="w-full sm:w-auto">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="lg:col-span-2 border-2">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-xl">Lista de Jogadores</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <PlayerList 
                registrations={registrations}
                isAdmin={isAdmin}
                onStatusChange={handleStatusChange}
                onRemovePlayer={handleRemovePlayer}
                onPromoteFromWaitingList={handlePromoteFromWaitingList}
              />
            </CardContent>
          </Card>

          {/* Published Teams - Show when baba is closed and teams are published */}
          {!baba.is_open && baba.teams_data && (
            <div className="lg:col-span-3">
              <PublishedTeams teamsData={baba.teams_data as unknown as { times: Array<{ nome: string; jogadores: Array<{ id: string; nome: string; posicao: string; rating: number }>; mediaRating: number }>; goleirosExcluidos?: Array<{ id: string; nome: string; rating: number }>; publishedAt: string }} />
            </div>
          )}

          {/* Voting Section - Only show when baba is closed */}
          {!baba.is_open && (
            <div className="lg:col-span-3">
              <BabaVoting 
                babaId={baba.id}
                registrations={registrations}
                userId={user?.id}
                isParticipant={registrations.some(r => r.user_id === user?.id && r.status === 'confirmado')}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}