import { useEffect, useState } from 'react';
import { Instagram, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [embedLoaded, setEmbedLoaded] = useState(false);
  
  const instagramUrl = getSetting('instagram_post_url');

  // Extract post ID from Instagram URL
  const getPostId = (url: string | null): string | null => {
    if (!url) return null;
    
    // Match patterns like /p/ABC123/ or /reel/ABC123/
    const match = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
    return match ? match[2] : null;
  };

  const postId = getPostId(instagramUrl);

  useEffect(() => {
    if (!postId) return;

    // Load Instagram embed script
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

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadInstagramScript, 100);
    return () => clearTimeout(timer);
  }, [postId]);

  if (loading) {
    return (
      <Card className="border-2">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!postId) {
    return null; // Don't show anything if no Instagram URL is configured
  }

  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-orange-500/10 pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Instagram className="h-5 w-5 text-pink-500" />
          Capa da Semana
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex justify-center bg-muted/30">
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
              width: '100%'
            }}
          />
        </div>
        
        <div className="p-3 border-t flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-pink-500 hover:text-pink-600 hover:bg-pink-500/10"
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
