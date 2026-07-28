import { useEffect, useState } from 'react';
import { Instagram, ExternalLink, Heart, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppSettings } from '@/hooks/useAppSettings';

// Extend window type for Instagram embed script
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

export function InstagramEmbed() {
  const { getSetting, loading } = useAppSettings();
  const [, setEmbedLoaded] = useState(false);

  const instagramUrl = getSetting('instagram_post_url');

  // Extract post ID from Instagram URL
  const getPostId = (url: string | null): string | null => {
    if (!url) return null;
    const match = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
    return match ? match[2] : null;
  };

  const postId = getPostId(instagramUrl);

  useEffect(() => {
    if (!postId) return;

    const loadInstagramScript = () => {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
        setEmbedLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.onload = () => {
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
        setEmbedLoaded(true);
      };
      document.body.appendChild(script);
    };

    const timer = setTimeout(loadInstagramScript, 100);
    return () => clearTimeout(timer);
  }, [postId]);

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-[360px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!postId) {
    return null;
  }

  return (
    <Card className="relative border-2 overflow-hidden animate-fade-in group transition-all duration-300 hover:shadow-xl">
      {/* Animated gradient border glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-pink-500 to-accent bg-[length:200%_100%] animate-[gradient-x_4s_linear_infinite]" />

      <div className="relative flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-primary/10 via-pink-500/10 to-accent/10">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-full bg-pink-500/40 blur-md animate-pulse" />
          <div className="relative rounded-full bg-gradient-to-tr from-primary via-pink-500 to-accent p-[2px] transition-transform duration-300 group-hover:scale-110">
            <div className="rounded-full bg-card p-2">
              <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm sm:text-base font-bold leading-tight">
            Capa da Semana
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
            O melhor momento do último baba
          </p>
        </div>
        <Heart className="h-4 w-4 text-pink-500 shrink-0 transition-transform duration-300 group-hover:scale-125" />
      </div>

      <CardContent className="p-0">
        <div className="flex justify-center bg-muted/30 transition-colors duration-300 group-hover:bg-muted/50">
          <blockquote
            className="instagram-media"
            data-instgrm-captioned
            data-instgrm-permalink={`https://www.instagram.com/p/${postId}/`}
            data-instgrm-version="14"
            style={{
              background: 'transparent',
              border: 0,
              margin: '0 auto',
              maxWidth: '100%',
              minWidth: '280px',
              padding: 0,
              width: '100%',
            }}
          />
        </div>

        <div className="p-3 border-t flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-pink-500 hover:text-pink-600 hover:bg-pink-500/10 transition-transform duration-200 hover:scale-105"
          >
            <a
              href="https://www.instagram.com/familiababa_"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="h-4 w-4 mr-2" />
              @familiababa_
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
