import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HandHeart, HeartHandshake, Globe, Shield, Award, Users } from 'lucide-react';
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
      {/* Language Selector */}
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

      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="max-w-5xl mx-auto text-center animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-card">
              <Globe size={64} className="text-primary" />
            </div>
          </div>

          {/* Title */}
          <h1 
            className="text-5xl md:text-7xl font-heading font-bold text-textPrimary mb-6"
            data-testid="landing-title"
          >
            {t('welcome')}
          </h1>
          
          <p className="text-xl md:text-2xl text-textSecondary mb-12 max-w-2xl mx-auto leading-relaxed">
            Conectando migrantes e ajudantes em Paris. Encontre apoio, ofereça ajuda, construa comunidade.
          </p>

          {/* 3 Cards em linha */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {/* Card 1: Preciso de Ajuda */}
            <div 
              className="bg-white rounded-3xl p-6 shadow-card card-hover cursor-pointer border-2 border-transparent hover:border-green-400 transition-all"
              onClick={() => navigate('/auth?role=migrant')}
              data-testid="need-help-card"
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-2xl">
                  <HandHeart size={40} className="text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-heading font-bold text-textPrimary mb-2">
                {t('needHelp')}
              </h2>
              <p className="text-sm text-textSecondary mb-4">
                Encontre ajuda com trabalho, moradia, alimentação, serviços jurídicos e mais.
              </p>
              <Button 
                className="w-full rounded-full bg-green-600 hover:bg-green-700 text-white"
              >
                Começar
              </Button>
            </div>

            {/* Card 2: Quero Ajudar */}
            <div 
              className="bg-white rounded-3xl p-6 shadow-card card-hover cursor-pointer border-2 border-transparent hover:border-orange-400 transition-all"
              onClick={() => navigate('/auth?role=helper')}
              data-testid="want-to-help-card"
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-orange-100 rounded-2xl">
                  <HeartHandshake size={40} className="text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-heading font-bold text-textPrimary mb-2">
                {t('wantToHelp')}
              </h2>
              <p className="text-sm text-textSecondary mb-4">
                Ofereça seu apoio, compartilhe recursos e faça a diferença na vida de alguém.
              </p>
              <Button 
                className="w-full rounded-full bg-primary hover:bg-primary-hover text-white"
              >
                Começar
              </Button>
            </div>

            {/* Card 3: Voluntário Profissional */}
            <div 
              className="bg-white rounded-3xl p-6 shadow-card card-hover cursor-pointer border-2 border-transparent hover:border-blue-400 transition-all"
              onClick={() => navigate('/volunteer-register')}
              data-testid="volunteer-card"
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-2xl">
                  <Shield size={40} className="text-blue-600" />
                </div>
              </div>
              <h2 className="text-xl font-heading font-bold text-textPrimary mb-2">
                Voluntário Profissional
              </h2>
              <p className="text-sm text-textSecondary mb-4">
                Advogados, médicos e outros profissionais oferecendo serviços voluntários.
              </p>
              <Button 
                className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Cadastrar
              </Button>
            </div>
          </div>

          {/* Login button */}
          <div className="mb-12">
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

      {/* Info Section */}
      <div className="bg-white/50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-heading font-bold text-textPrimary mb-8 text-center">
              Como Funciona
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-bold text-textPrimary mb-2">Cadastre-se</h3>
                <p className="text-sm text-textSecondary">
                  Crie sua conta e selecione as áreas de interesse
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-bold text-textPrimary mb-2">Conecte-se</h3>
                <p className="text-sm text-textSecondary">
                  Encontre pessoas que precisam ou oferecem ajuda
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-bold text-textPrimary mb-2">Ajude</h3>
                <p className="text-sm text-textSecondary">
                  Converse, compartilhe recursos e construa comunidade
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-textMuted text-sm">
            © 2025 Watizat - Plataforma de apoio a migrantes
          </p>
        </div>
      </div>
    </div>
  );
}
