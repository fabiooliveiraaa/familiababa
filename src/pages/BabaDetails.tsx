import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, Users, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { PlayerList } from '@/components/PlayerList';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { PlayerPosition } from '@/types/baba';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function BabaDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { babas, currentUser, registerForBaba, toggleBabaOpen } = useApp();
  const [selectedPosition, setSelectedPosition] = useState<PlayerPosition>('linha');

  const baba = babas.find((b) => b.id === id);

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

  const linhaCount = baba.registrations.filter((r) => r.position === 'linha').length;
  const goleiroCount = baba.registrations.filter((r) => r.position === 'goleiro').length;
  const paidCount = baba.registrations.filter((r) => r.status === 'pago' || r.status === 'confirmado').length;
  const confirmedCount = baba.registrations.filter((r) => r.status === 'confirmado').length;

  const isUserRegistered = currentUser && baba.registrations.some((r) => r.oderId === currentUser.id);
  const isAdmin = currentUser?.role === 'admin';

  const canRegister = () => {
    if (!baba.isOpen) return false;
    if (isUserRegistered) return false;
    if (selectedPosition === 'linha' && linhaCount >= baba.maxLinhaPlayers) return false;
    if (selectedPosition === 'goleiro' && goleiroCount >= baba.maxGoleiros) return false;
    return true;
  };

  const handleRegister = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    registerForBaba(baba.id, currentUser.id, selectedPosition);
    toast({
      title: 'Inscrição realizada!',
      description: `Você foi inscrito como ${selectedPosition === 'linha' ? 'jogador de linha' : 'goleiro'}.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Info Card */}
          <Card className="lg:col-span-1 border-2">
            <CardHeader className="bg-secondary">
              <div className="flex items-center justify-between">
                <CardTitle className="text-secondary-foreground">{baba.title}</CardTitle>
                <Badge variant={baba.isOpen ? 'default' : 'secondary'} className={baba.isOpen ? 'bg-success' : ''}>
                  {baba.isOpen ? 'Aberto' : 'Fechado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {format(baba.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span>{baba.time}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{baba.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">R$ {baba.price.toFixed(2)}</span>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Vagas
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">{linhaCount}/{baba.maxLinhaPlayers}</p>
                    <p className="text-xs text-muted-foreground">Linha</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">{goleiroCount}/{baba.maxGoleiros}</p>
                    <p className="text-xs text-muted-foreground">Goleiros</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold">Status Geral</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-warning/20 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-warning-foreground">{paidCount}</p>
                    <p className="text-xs text-muted-foreground">Pagos</p>
                  </div>
                  <div className="bg-success/20 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-success">{confirmedCount}</p>
                    <p className="text-xs text-muted-foreground">Confirmados</p>
                  </div>
                </div>
              </div>

              {currentUser && !isAdmin && (
                <div className="border-t pt-4 space-y-3">
                  {isUserRegistered ? (
                    <div className="bg-success/20 p-4 rounded-lg text-center">
                      <p className="font-semibold text-success">✓ Você está inscrito!</p>
                    </div>
                  ) : baba.isOpen ? (
                    <>
                      <Select value={selectedPosition} onValueChange={(v) => setSelectedPosition(v as PlayerPosition)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Posição" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linha" disabled={linhaCount >= baba.maxLinhaPlayers}>
                            Jogador de Linha {linhaCount >= baba.maxLinhaPlayers && '(Cheio)'}
                          </SelectItem>
                          <SelectItem value="goleiro" disabled={goleiroCount >= baba.maxGoleiros}>
                            Goleiro {goleiroCount >= baba.maxGoleiros && '(Cheio)'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button className="w-full btn-glow" onClick={handleRegister} disabled={!canRegister()}>
                        Inscrever-se
                      </Button>
                    </>
                  ) : (
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Inscrições fechadas</p>
                    </div>
                  )}
                </div>
              )}

              {isAdmin && (
                <div className="border-t pt-4">
                  <Button
                    variant={baba.isOpen ? 'destructive' : 'default'}
                    className="w-full"
                    onClick={() => toggleBabaOpen(baba.id)}
                  >
                    {baba.isOpen ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" /> Fechar Inscrições
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 mr-2" /> Abrir Inscrições
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="lg:col-span-2 border-2">
            <CardHeader>
              <CardTitle>Lista de Inscritos</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerList 
                registrations={baba.registrations} 
                babaId={baba.id}
                isAdmin={isAdmin}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
