import { LogOut, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo-familia-baba.png';

export function Header() {
  const { user, profile, isAdmin, signOut } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-secondary border-b border-border shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0">
          <img src={logo} alt="FBFC Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain shrink-0" />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-secondary-foreground leading-tight">FAMILIA BABA</h1>
            <p className="text-xs text-primary">FBFC - Since 2022</p>
          </div>
        </button>

        {user && profile ? (
          <div className="flex items-center gap-2 sm:gap-4">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="hidden sm:flex">
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 h-9 sm:h-10">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border-2 border-primary">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {profile.first_name[0]}{profile.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    {profile.first_name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)}>
                  <User className="h-4 w-4 mr-2" />
                  Meu Perfil
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="sm:hidden">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Button onClick={() => navigate('/auth')} size="sm" className="h-9 sm:h-10">
            <User className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-sm">Entrar</span>
          </Button>
        )}
      </div>
    </header>
  );
}
