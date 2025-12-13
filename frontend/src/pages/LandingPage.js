import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HandHeart, HeartHandshake, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'pt', label: 'PT' },
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' }
  ];

  return (
    <div className="min-h-screen gradient-bg">
      <div className="absolute top-6 right-6 flex gap-2" data-testid="language-selector">
        {languages.map(lang => (
          <button
            key={lang.code}
            data-testid={`lang-${lang.code}`}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              i18n.language === lang.code
                ? 'bg-primary text-white'
                : 'bg-white/70 text-gray-700 hover:bg-white'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <div className="container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-card">
              <Globe size={64} className="text-primary" />
            </div>
          </div>

          <h1 
            className="text-5xl md:text-7xl font-heading font-bold text-textPrimary mb-6"
            data-testid="landing-title"
          >
            {t('welcome')}
          </h1>
          
          <p className="text-xl md:text-2xl text-textSecondary mb-12 max-w-2xl mx-auto leading-relaxed">
            Conectando migrantes e ajudantes em Paris. Encontre apoio, ofereça ajuda, construa comunidade.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div 
              className="bg-white rounded-3xl p-8 shadow-card card-hover cursor-pointer"
              onClick={() => navigate('/auth?role=migrant')}
              data-testid="need-help-card"
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-2xl">
                  <HandHeart size={48} className="text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-heading font-bold text-textPrimary mb-3">
                {t('needHelp')}
              </h2>
              <p className="text-textSecondary">
                Encontre ajuda com trabalho, moradia, alimentação, serviços jurídicos e mais.
              </p>
            </div>

            <div 
              className="bg-white rounded-3xl p-8 shadow-card card-hover cursor-pointer"
              onClick={() => navigate('/auth?role=helper')}
              data-testid="want-to-help-card"
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-orange-100 rounded-2xl">
                  <HeartHandshake size={48} className="text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-heading font-bold text-textPrimary mb-3">
                {t('wantToHelp')}
              </h2>
              <p className="text-textSecondary">
                Ofereça seu apoio, compartilhe recursos e faça a diferença na vida de alguém.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-textMuted mb-4">Já tem uma conta?</p>
            <Button 
              data-testid="login-button"
              onClick={() => navigate('/auth')}
              variant="outline"
              className="rounded-full px-8 py-6 text-lg"
            >
              {t('login')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
