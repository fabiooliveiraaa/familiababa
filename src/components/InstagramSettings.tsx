import { useState, useEffect } from 'react';
import { Instagram, Save, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppSettings } from '@/hooks/useAppSettings';

export function InstagramSettings() {
  const { getSetting, updateSetting, loading } = useAppSettings();
  const [postUrl, setPostUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const currentUrl = getSetting('instagram_post_url');
    if (currentUrl) {
      setPostUrl(currentUrl);
    }
  }, [getSetting]);

  const handleSave = async () => {
    setSaving(true);
    await updateSetting('instagram_post_url', postUrl || null);
    setSaving(false);
  };

  const isValidInstagramUrl = (url: string) => {
    if (!url) return true; // Empty is valid (removes the embed)
    return url.includes('instagram.com/p/') || url.includes('instagram.com/reel/');
  };

  return (
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-orange-500/10">
        <CardTitle className="flex items-center gap-2 text-secondary-foreground">
          <Instagram className="h-5 w-5 text-pink-500" />
          Capa da Semana (Instagram)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="instagram-url">Link do Post do Instagram</Label>
          <Input
            id="instagram-url"
            placeholder="https://www.instagram.com/p/ABC123..."
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Cole o link de uma publicação ou reel do Instagram para exibir como "Capa da Semana" na página inicial.
          </p>
          {postUrl && !isValidInstagramUrl(postUrl) && (
            <p className="text-xs text-destructive">
              URL inválida. Use um link no formato: instagram.com/p/... ou instagram.com/reel/...
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSave} 
            disabled={saving || loading || (postUrl !== '' && !isValidInstagramUrl(postUrl))}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            asChild
          >
            <a 
              href="https://www.instagram.com/familiababa_" 
              target="_blank" 
              rel="noopener noreferrer"
              title="Abrir Instagram"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg space-y-1">
          <p><strong>Como obter o link:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Abra o post no Instagram</li>
            <li>Clique nos 3 pontos (...) no canto superior</li>
            <li>Selecione "Copiar link"</li>
            <li>Cole aqui e salve</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
