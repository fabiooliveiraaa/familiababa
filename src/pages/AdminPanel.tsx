import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Clock, MapPin, DollarSign, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/Header';
import { useBabas } from '@/hooks/useBabas';
import { useAuthContext } from '@/contexts/AuthContext';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuthContext();
  const { createBaba } = useBabas();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    price: '',
    maxLinhaPlayers: '24',
    maxGoleiros: '3',
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
    
    await createBaba({
      title: formData.title,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      price: parseFloat(formData.price),
      max_linha_players: parseInt(formData.maxLinhaPlayers),
      max_goleiros: parseInt(formData.maxGoleiros),
      is_open: true,
      created_by: user.id,
    });

    setFormData({
      title: '',
      date: '',
      time: '',
      location: '',
      price: '',
      maxLinhaPlayers: '24',
      maxGoleiros: '3',
    });
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

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

              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horário
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
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
      </main>
    </div>
  );
}
