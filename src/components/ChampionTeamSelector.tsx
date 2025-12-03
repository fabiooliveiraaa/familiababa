import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Loader2, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Registration } from '@/hooks/useBabas';

interface ChampionTeamSelectorProps {
  babaId: string;
  registrations: Registration[];
  onSaved: () => void;
}

export function ChampionTeamSelector({ babaId, registrations, onSaved }: ChampionTeamSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Get only confirmed players with user_id
  const confirmedPlayers = registrations.filter(
    r => r.status === 'confirmado' && r.user_id
  );

  // Initialize selected players from existing champions
  const initializeSelection = () => {
    const champions = registrations
      .filter(r => r.is_champion && r.user_id)
      .map(r => r.user_id as string);
    setSelectedPlayers(champions);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      initializeSelection();
    }
  };

  const togglePlayer = (registrationId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(registrationId)
        ? prev.filter(id => id !== registrationId)
        : [...prev, registrationId]
    );
  };

  const handleSave = async () => {
    setSaving(true);

    // First, reset all is_champion to false for this baba
    const { error: resetError } = await supabase
      .from('registrations')
      .update({ is_champion: false })
      .eq('baba_id', babaId);

    if (resetError) {
      toast({ title: 'Erro ao salvar', description: resetError.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    // Then, set is_champion to true for selected players
    if (selectedPlayers.length > 0) {
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ is_champion: true })
        .eq('baba_id', babaId)
        .in('user_id', selectedPlayers);

      if (updateError) {
        toast({ title: 'Erro ao salvar', description: updateError.message, variant: 'destructive' });
        setSaving(false);
        return;
      }
    }

    toast({ title: 'Time campeão registrado!' });
    setSaving(false);
    setOpen(false);
    onSaved();
  };

  const championCount = registrations.filter(r => r.is_champion).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-9 sm:h-10 text-sm">
          <Trophy className="h-4 w-4 mr-2 text-amber-500" />
          Time Campeão {championCount > 0 && `(${championCount})`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Registrar Time Campeão
          </DialogTitle>
        </DialogHeader>
        
        <p className="text-xs sm:text-sm text-muted-foreground">
          Selecione os jogadores que fizeram parte do time vencedor. Cada vitória vale +5 pontos no ranking.
        </p>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
          {confirmedPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum jogador confirmado neste baba.
            </p>
          ) : (
            confirmedPlayers.map((reg) => (
              <label
                key={reg.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPlayers.includes(reg.user_id!)
                    ? 'bg-amber-500/10 border-amber-500/50'
                    : 'hover:bg-muted'
                }`}
              >
                <Checkbox
                  checked={selectedPlayers.includes(reg.user_id!)}
                  onCheckedChange={() => togglePlayer(reg.user_id!)}
                />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={reg.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {reg.profiles?.first_name?.[0]}{reg.profiles?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium flex-1">
                  {reg.profiles?.first_name} {reg.profiles?.last_name}
                </span>
                {selectedPlayers.includes(reg.user_id!) && (
                  <Trophy className="h-4 w-4 text-amber-500" />
                )}
              </label>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            {selectedPlayers.length} selecionados
          </span>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
