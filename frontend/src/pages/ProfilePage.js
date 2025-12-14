import React, { useContext, useState } from 'react';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import BottomNav from '../components/BottomNav';
import { User, Mail, Globe, LogOut, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [useDisplayName, setUseDisplayName] = useState(user?.use_display_name || false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const saveDisplayName = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          display_name: displayName,
          use_display_name: useDisplayName
        })
      });

      if (response.ok) {
        toast.success('Nome fictício atualizado!');
        setShowEditDialog(false);
        window.location.reload();
      }
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="profile-page">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 glassmorphism">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-heading font-bold text-textPrimary">{t('profile')}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="bg-white rounded-3xl p-8 shadow-card space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User size={48} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center">
                <h2 className="text-2xl font-heading font-bold text-textPrimary" data-testid="user-name">
                  {user?.use_display_name && user?.display_name ? user.display_name : user?.name}
                </h2>
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                  <DialogTrigger asChild>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
                      <Edit size={18} className="text-primary" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl">
                    <DialogHeader>
                      <DialogTitle>Nome Fictício (Privacidade)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome Fictício</Label>
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Ex: Maria S., João A."
                          className="rounded-xl mt-2"
                        />
                        <p className="text-xs text-textMuted mt-2">
                          Este nome aparecerá nos posts em vez do seu nome real
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={useDisplayName}
                          onChange={(e) => setUseDisplayName(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                        <Label>Usar nome fictício nos posts</Label>
                      </div>
                      <Button
                        onClick={saveDisplayName}
                        className="w-full rounded-full py-6 bg-primary hover:bg-primary-hover"
                      >
                        Salvar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {user?.use_display_name && user?.display_name && (
                <p className="text-xs text-textMuted">Nome fictício ativo</p>
              )}
              <p className="text-textMuted capitalize" data-testid="user-role">
                {user?.role === 'migrant' ? t('migrant') : user?.role === 'helper' ? t('helper') : user?.role}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-4">
            <div className="flex items-center gap-3 text-textSecondary">
              <Mail size={20} />
              <span data-testid="user-email">{user?.email}</span>
            </div>
            {user?.languages && user.languages.length > 0 && (
              <div className="flex items-center gap-3 text-textSecondary">
                <Globe size={20} />
                <div className="flex gap-2">
                  {user.languages.map(lang => (
                    <span key={lang} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {lang.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {user?.bio && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-textPrimary mb-2">Sobre</h3>
              <p className="text-textSecondary leading-relaxed">{user.bio}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-6">
            <Button
              data-testid="logout-button"
              onClick={handleLogout}
              variant="outline"
              className="w-full rounded-full py-6 text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut size={20} className="mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
