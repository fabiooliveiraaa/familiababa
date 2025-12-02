import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useApp } from '@/contexts/AppContext';
import logo from '@/assets/logo-familia-baba.png';

export default function Login() {
  const navigate = useNavigate();
  const { users, setCurrentUser } = useApp();

  const handleLogin = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-border shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <img src={logo} alt="FBFC Logo" className="h-24 w-24 object-contain mx-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">FAMILIA BABA</CardTitle>
          <CardDescription>
            Selecione seu perfil para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <Button
              key={user.id}
              variant="outline"
              className="w-full justify-start h-14 text-left hover:bg-primary/10 hover:border-primary"
              onClick={() => handleLogin(user.id)}
            >
              <Avatar className="h-10 w-10 mr-3 border-2 border-primary/30">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-muted-foreground">
                  {user.role === 'admin' ? 'Administrador' : 'Jogador'}
                </p>
              </div>
              {user.role === 'admin' && (
                <Shield className="h-4 w-4 text-primary" />
              )}
            </Button>
          ))}
          
          <p className="text-xs text-center text-muted-foreground pt-4">
            Em breve: cadastro completo com email e senha
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
