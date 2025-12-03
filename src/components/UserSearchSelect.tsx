import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface UserSearchSelectProps {
  onSelect: (profile: Profile) => void;
  excludeUserIds?: string[];
  placeholder?: string;
}

export function UserSearchSelect({ onSelect, excludeUserIds = [], placeholder = "Digite o nome..." }: UserSearchSelectProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (search.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
        .limit(10);

      if (!error && data) {
        const filtered = data.filter(p => !excludeUserIds.includes(p.id));
        setResults(filtered);
      }
      setLoading(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search, excludeUserIds]);

  const handleSelect = (profile: Profile) => {
    onSelect(profile);
    setSearch('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        className="w-full"
      />
      
      {showResults && (search.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {search.length < 2 ? 'Digite pelo menos 2 letras' : 'Nenhum usuário encontrado'}
            </div>
          ) : (
            results.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleSelect(profile)}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent text-left transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {profile.first_name[0]}{profile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {profile.first_name} {profile.last_name}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
