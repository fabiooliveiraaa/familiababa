import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Loader2,
  Wallet,
  Trophy,
  Crown,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { FinancePanel } from '@/components/FinancePanel';
import { useBabas } from '@/hooks/useBabas';
import { useAuthContext } from '@/contexts/AuthContext';
import { isRegistrationLive, useNow } from '@/lib/registrationSchedule';


export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuthContext();
  const { babas, createBaba } = useBabas();
  const [submitting, setSubmitting] = useState(false);
  const now = useNow();

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    price: '',
    maxLinhaPlayers: '24',
    maxGoleiros: '3',
    pixKey: '',
    registrationOpensAt: '',
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">Você precisa ser administrador para acessar esta página.</p>
          <Button onClick={() => navigate('/')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const newBaba = await createBaba({
      title: formData.title,
      date: formData.date,
      start_time: formData.startTime,
      end_time: formData.endTime,
      location: formData.location,
      price: parseFloat(formData.price),
      max_linha_players: parseInt(formData.maxLinhaPlayers),
      max_goleiros: parseInt(formData.maxGoleiros),
      is_open: true,
      created_by: user.id,
      pix_key: formData.pixKey || null,
      registration_opens_at: formData.registrationOpensAt
        ? new Date(formData.registrationOpensAt).toISOString()
        : null,
    });

    setSubmitting(false);

    if (newBaba) {
      navigate(`/baba/${newBaba.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-4 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-3">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Painel do Administrador</h1>
        </div>

        <Tabs defaultValue="babas">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="babas" className="flex-col gap-0.5 text-[11px]">
              <Plus className="h-4 w-4" />
              Criar
            </TabsTrigger>
            <TabsTrigger value="gerenciar" className="flex-col gap-0.5 text-[11px]">
              <Trophy className="h-4 w-4" />
              Babas
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex-col gap-0.5 text-[11px]">
              <Wallet className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
          </TabsList>


          {/* CRIAR BABA */}
          <TabsContent value="babas" className="pt-4">
            <Card className="border-2">
              <CardHeader className="bg-secondary">
                <CardTitle className="flex items-center gap-2 text-secondary-foreground">
                  <Plus className="h-5 w-5" />
                  Criar Novo Baba
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título do Baba</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Baba Quarta-Feira"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Início
                      </Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Fim
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Local
                    </Label>
                    <Input
                      id="location"
                      placeholder="Ex: Arena FBFC"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Valor (R$)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="25.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pixKey" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Chave PIX
                    </Label>
                    <Input
                      id="pixKey"
                      placeholder="Ex: email@exemplo.com ou CPF"
                      value={formData.pixKey}
                      onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-3">
                    <Label htmlFor="opensAt" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Abertura das inscrições (opcional)
                    </Label>
                    <Input
                      id="opensAt"
                      type="datetime-local"
                      value={formData.registrationOpensAt}
                      onChange={(e) => setFormData({ ...formData, registrationOpensAt: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      O baba aparece na lista imediatamente, mas as inscrições só liberam
                      automaticamente na data e hora escolhidas. Deixe vazio para abrir agora.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="flex items-center gap-2 mb-4">
                      <Users className="h-4 w-4" />
                      Limite de Vagas
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxLinha" className="text-sm text-muted-foreground">
                          Jogadores de Linha
                        </Label>
                        <Input
                          id="maxLinha"
                          type="number"
                          value={formData.maxLinhaPlayers}
                          onChange={(e) => setFormData({ ...formData, maxLinhaPlayers: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxGoleiro" className="text-sm text-muted-foreground">
                          Goleiros
                        </Label>
                        <Input
                          id="maxGoleiro"
                          type="number"
                          value={formData.maxGoleiros}
                          onChange={(e) => setFormData({ ...formData, maxGoleiros: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full btn-glow" size="lg" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Baba
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GERENCIAR BABAS */}
          <TabsContent value="gerenciar" className="pt-4">
            <Card className="border-2">
              <CardHeader className="bg-secondary py-3">
                <CardTitle className="flex items-center gap-2 text-secondary-foreground text-base">
                  <Trophy className="h-4 w-4" />
                  Gerenciar babas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {babas.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nenhum baba criado ainda.</p>
                )}
                {babas.map((b) => {
                  const live = isRegistrationLive(b, now);
                  return (
                    <button
                      key={b.id}
                      onClick={() => navigate(`/baba/${b.id}`)}
                      className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{b.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(b.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {b.start_time}
                        </p>
                      </div>
                      <Badge variant={live ? 'default' : 'outline'} className={live ? 'bg-success' : ''}>
                        {live ? 'Aberto' : b.is_open ? 'Em breve' : 'Fechado'}
                      </Badge>
                    </button>
                  );
                })}
                <p className="pt-2 text-xs text-muted-foreground">
                  Abra um baba para editar times, sorteio, premiações e ferramentas de IA.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FINANCEIRO */}
          <TabsContent value="financeiro" className="pt-0">
            <FinancePanel />
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              <Crown className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              O resumo do caixa é exibido publicamente na página inicial para manter a transparência
              com o grupo.
            </p>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
