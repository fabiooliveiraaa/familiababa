import { useEffect, useState } from 'react';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Baba } from '@/hooks/useBabas';

function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  baba: Baba | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<Baba>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function EditBabaDialog({ baba, open, onOpenChange, onSave, onDelete }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    price: '',
    max_linha_players: '24',
    max_goleiros: '3',
    pix_key: '',
    registration_opens_at: '',
    is_open: true,
  });

  useEffect(() => {
    if (!baba) return;
    setForm({
      title: baba.title ?? '',
      date: baba.date ?? '',
      start_time: baba.start_time ?? '',
      end_time: baba.end_time ?? '',
      location: baba.location ?? '',
      price: String(baba.price ?? ''),
      max_linha_players: String(baba.max_linha_players ?? 24),
      max_goleiros: String(baba.max_goleiros ?? 3),
      pix_key: baba.pix_key ?? '',
      registration_opens_at: toLocalInput(baba.registration_opens_at),
      is_open: baba.is_open ?? true,
    });
  }, [baba]);

  if (!baba) return null;

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(baba.id, {
      title: form.title,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location,
      price: parseFloat(form.price) || 0,
      max_linha_players: parseInt(form.max_linha_players) || 0,
      max_goleiros: parseInt(form.max_goleiros) || 0,
      pix_key: form.pix_key || null,
      registration_opens_at: form.registration_opens_at
        ? new Date(form.registration_opens_at).toISOString()
        : null,
      is_open: form.is_open,
    } as Partial<Baba>);
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!confirm('Excluir este baba? Essa ação não pode ser desfeita.')) return;
    setSaving(true);
    const ok = await onDelete(baba.id);
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar baba</DialogTitle>
          <DialogDescription className="text-xs">
            Alterações valem para todos os inscritos imediatamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="e-title">Título</Label>
            <Input id="e-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="e-date">Data</Label>
            <Input id="e-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="e-start">Início</Label>
              <Input id="e-start" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-end">Fim</Label>
              <Input id="e-end" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="e-location">Local</Label>
            <Input id="e-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="e-price">Valor (R$)</Label>
              <Input id="e-price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-pix">Chave PIX</Label>
              <Input id="e-pix" value={form.pix_key} onChange={(e) => setForm({ ...form, pix_key: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="e-linha">Vagas linha</Label>
              <Input id="e-linha" type="number" value={form.max_linha_players} onChange={(e) => setForm({ ...form, max_linha_players: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-gk">Vagas goleiro</Label>
              <Input id="e-gk" type="number" value={form.max_goleiros} onChange={(e) => setForm({ ...form, max_goleiros: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-3">
            <Label htmlFor="e-opens">Abertura das inscrições</Label>
            <Input
              id="e-opens"
              type="datetime-local"
              value={form.registration_opens_at}
              onChange={(e) => setForm({ ...form, registration_opens_at: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Vazio = inscrições abertas desde já.</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Inscrições habilitadas</p>
              <p className="text-xs text-muted-foreground">Desative para encerrar o baba.</p>
            </div>
            <Switch checked={form.is_open} onCheckedChange={(v) => setForm({ ...form, is_open: v })} />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleDelete} disabled={saving} className="w-full text-destructive sm:w-auto">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
