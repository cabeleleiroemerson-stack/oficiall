import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Check, User, Heart, Shield, MapPin, Loader2 } from 'lucide-react';

const HELP_CATEGORIES = [
  { value: 'food', label: 'Alimentação', icon: '🍽️', desc: 'Distribuição de alimentos, refeições' },
  { value: 'legal', label: 'Jurídico', icon: '⚖️', desc: 'Orientação sobre documentos' },
  { value: 'health', label: 'Saúde', icon: '🏥', desc: 'Acompanhamento médico' },
  { value: 'housing', label: 'Moradia', icon: '🏠', desc: 'Ajuda com habitação' },
  { value: 'work', label: 'Emprego', icon: '💼', desc: 'Orientação profissional' },
  { value: 'education', label: 'Educação', icon: '📚', desc: 'Aulas, cursos, idiomas' },
  { value: 'social', label: 'Apoio Social', icon: '🤝', desc: 'Integração, acolhimento' },
  { value: 'clothes', label: 'Roupas', icon: '👕', desc: 'Doação de vestuário' },
  { value: 'furniture', label: 'Móveis', icon: '🪑', desc: 'Doação de móveis' },
  { value: 'transport', label: 'Transporte', icon: '🚗', desc: 'Ajuda com deslocamento' }
];

const professionalAreas = [
  { value: 'legal', label: 'Jurídico', icon: '⚖️' },
  { value: 'health', label: 'Saúde', icon: '🏥' },
  { value: 'education', label: 'Educação', icon: '📚' },
  { value: 'translation', label: 'Tradução', icon: '🌍' },
  { value: 'family', label: 'Família e Social', icon: '👨‍👩‍👧' },
  { value: 'employment', label: 'Orientação Profissional', icon: '💼' },
  { value: 'housing', label: 'Habitação', icon: '🏠' },
  { value: 'administration', label: 'Administração', icon: '📋' },
  { value: 'finance', label: 'Finanças', icon: '💰' },
  { value: 'technology', label: 'Tecnologia', icon: '💻' }
];

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role');
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState(roleFromUrl || 'migrant');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Categorias selecionadas
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  // Localização
  const [location, setLocation] = useState(null);
  const [showLocation, setShowLocation] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationAddress, setLocationAddress] = useState('');
  
  // Campos para voluntários (cadastro rápido)
  const [professionalArea, setProfessionalArea] = useState('legal');
  const [specialties, setSpecialties] = useState('');
  const [availability, setAvailability] = useState('');
  const [experience, setExperience] = useState('');

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          
          // Tentar obter endereço via Nominatim (OpenStreetMap)
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data.display_name) {
              setLocationAddress(data.display_name);
            }
          } catch (error) {
            console.error('Error getting address:', error);
          }
          
          setLoadingLocation(false);
          toast.success('Localização obtida com sucesso!');
        },
        (error) => {
          setLoadingLocation(false);
          toast.error('Não foi possível obter sua localização');
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLoadingLocation(false);
      toast.error('Geolocalização não suportada pelo navegador');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Se é cadastro de migrante ou helper e está na etapa 1, vai para etapa 2
    if (!isLogin && (role === 'migrant' || role === 'helper') && step === 1) {
      setStep(2);
      return;
    }
    
    // Se é helper e está na etapa 2, vai para etapa 3 (localização)
    if (!isLogin && role === 'helper' && step === 2) {
      if (selectedCategories.length === 0) {
        toast.error('Selecione pelo menos uma categoria que você quer ajudar');
        return;
      }
      setStep(3);
      return;
    }
    
    // Validação para migrantes
    if (!isLogin && role === 'migrant' && selectedCategories.length === 0) {
      toast.error('Selecione pelo menos uma categoria de ajuda que você precisa');
      return;
    }
    
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password }
        : { 
            email, 
            password, 
            name, 
            role, 
            languages: ['pt', 'fr'],
            ...(role === 'migrant' && {
              need_categories: selectedCategories
            }),
            ...(role === 'helper' && {
              help_categories: selectedCategories,
              location: location ? { ...location, address: locationAddress } : null,
              show_location: showLocation
            }),
            ...(role === 'volunteer' && {
              professional_area: professionalArea,
              professional_specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
              availability,
              experience
            })
          };

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        toast.success(isLogin ? 'Login bem-sucedido!' : 'Conta criada com sucesso!');
        navigate('/home');
      } else {
        toast.error(data.detail || 'Erro ao autenticar');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  const getStepTitle = () => {
    if (isLogin) return t('login');
    if (step === 1) return t('register');
    if (step === 2) {
      if (role === 'migrant') return 'O que você precisa?';
      if (role === 'helper') return 'Como você quer ajudar?';
    }
    if (step === 3 && role === 'helper') return 'Sua Localização';
    return t('register');
  };

  const getStepSubtitle = () => {
    if (step === 2 && role === 'migrant') return 'Selecione as áreas em que você precisa de ajuda';
    if (step === 2 && role === 'helper') return 'Selecione as áreas em que você pode oferecer ajuda';
    if (step === 3 && role === 'helper') return 'Compartilhe sua localização para ajudar pessoas próximas';
    return null;
  };

  const getTotalSteps = () => {
    if (role === 'helper') return 3;
    if (role === 'migrant') return 2;
    return 1;
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <button
        onClick={goBack}
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-white/50 transition-all"
        data-testid="back-button"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-8 animate-fade-in" data-testid="auth-form">
        {/* Step indicator for registration */}
        {!isLogin && (role === 'migrant' || role === 'helper') && (
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              {[...Array(getTotalSteps())].map((_, idx) => (
                <React.Fragment key={idx}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    step > idx ? 'bg-primary text-white' : step === idx + 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > idx + 1 ? <Check size={16} /> : idx + 1}
                  </div>
                  {idx < getTotalSteps() - 1 && (
                    <div className={`w-8 h-1 ${step > idx + 1 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-3xl font-heading font-bold text-textPrimary mb-2 text-center">
          {getStepTitle()}
        </h2>
        
        {getStepSubtitle() && (
          <p className="text-center text-textSecondary mb-6">
            {getStepSubtitle()}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Basic Information */}
          {(isLogin || step === 1) && (
            <>
              {!isLogin && (
                <div>
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input
                    id="name"
                    data-testid="name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="rounded-xl"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  data-testid="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  data-testid="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              {!isLogin && (
                <div>
                  <Label>Você é</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      type="button"
                      data-testid="role-migrant"
                      onClick={() => { setRole('migrant'); setSelectedCategories([]); }}
                      className={`py-4 px-3 rounded-xl font-medium transition-all text-sm flex flex-col items-center gap-2 ${
                        role === 'migrant'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <User size={24} />
                      <span>Preciso de Ajuda</span>
                    </button>
                    <button
                      type="button"
                      data-testid="role-helper"
                      onClick={() => { setRole('helper'); setSelectedCategories([]); }}
                      className={`py-4 px-3 rounded-xl font-medium transition-all text-sm flex flex-col items-center gap-2 ${
                        role === 'helper'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Heart size={24} />
                      <span>Quero Ajudar</span>
                    </button>
                  </div>
                </div>
              )}

              {!isLogin && role === 'volunteer' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-xl border-2 border-primary/20">
                  <h3 className="font-bold text-primary flex items-center gap-2">
                    <Shield size={20} />
                    Informações Profissionais
                  </h3>
                  
                  <div>
                    <Label>Área de Atuação</Label>
                    <select
                      value={professionalArea}
                      onChange={(e) => setProfessionalArea(e.target.value)}
                      className="w-full mt-1 p-3 border rounded-xl bg-white"
                    >
                      {professionalAreas.map(area => (
                        <option key={area.value} value={area.value}>
                          {area.icon} {area.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Especialidades (separadas por vírgula)</Label>
                    <Input
                      value={specialties}
                      onChange={(e) => setSpecialties(e.target.value)}
                      placeholder="Ex: Direito de Família, Asilo, Imigração"
                      className="rounded-xl mt-1"
                    />
                  </div>

                  <div>
                    <Label>Disponibilidade</Label>
                    <Input
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="Ex: Fins de semana, Noites"
                      className="rounded-xl mt-1"
                    />
                  </div>

                  <div>
                    <Label>Experiência</Label>
                    <textarea
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="Descreva sua experiência profissional..."
                      rows={3}
                      className="w-full mt-1 p-3 border rounded-xl bg-white"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Categories (for migrants and helpers) */}
          {!isLogin && step === 2 && (role === 'migrant' || role === 'helper') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {HELP_CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCategory(cat.value)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      selectedCategories.includes(cat.value)
                        ? role === 'migrant' 
                          ? 'bg-green-600 text-white border-green-600 shadow-lg'
                          : 'bg-primary text-white border-primary shadow-lg'
                        : 'bg-white border-gray-200 hover:border-primary hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <div>
                        <div className={`text-sm font-bold ${selectedCategories.includes(cat.value) ? 'text-white' : 'text-textPrimary'}`}>
                          {cat.label}
                        </div>
                        <div className={`text-xs ${selectedCategories.includes(cat.value) ? 'text-white/80' : 'text-textSecondary'}`}>
                          {cat.desc}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {selectedCategories.length > 0 && (
                <div className={`p-3 rounded-xl border ${
                  role === 'migrant' 
                    ? 'bg-green-100 border-green-300' 
                    : 'bg-primary/10 border-primary/30'
                }`}>
                  <p className={`text-sm font-medium flex items-center gap-2 ${
                    role === 'migrant' ? 'text-green-800' : 'text-primary'
                  }`}>
                    <Check size={18} />
                    {selectedCategories.length} categoria{selectedCategories.length > 1 ? 's' : ''} selecionada{selectedCategories.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Location (for helpers only) */}
          {!isLogin && step === 3 && role === 'helper' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <MapPin size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-textPrimary">Localização</h3>
                    <p className="text-sm text-textSecondary">Ajude pessoas próximas de você</p>
                  </div>
                </div>

                {!location ? (
                  <Button
                    type="button"
                    onClick={getLocation}
                    disabled={loadingLocation}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loadingLocation ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Obtendo localização...
                      </>
                    ) : (
                      <>
                        <MapPin size={18} className="mr-2" />
                        Obter Minha Localização
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-green-100 rounded-xl p-3 border border-green-300">
                      <p className="text-green-800 text-sm font-medium flex items-center gap-2">
                        <Check size={18} />
                        Localização obtida!
                      </p>
                      {locationAddress && (
                        <p className="text-green-700 text-xs mt-1 line-clamp-2">{locationAddress}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={getLocation}
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl"
                    >
                      Atualizar Localização
                    </Button>
                  </div>
                )}
              </div>

              {/* Opção de mostrar localização */}
              <div className="bg-yellow-50 rounded-2xl p-4 border-2 border-yellow-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="font-medium text-textPrimary">Mostrar minha localização no mapa</p>
                    <p className="text-sm text-textSecondary">
                      Pessoas que precisam de ajuda poderão ver você no mapa de ajudantes próximos
                    </p>
                  </div>
                </label>
              </div>

              <p className="text-xs text-center text-textMuted">
                Você pode alterar essa configuração a qualquer momento no seu perfil
              </p>
            </div>
          )}

          <Button
            type="submit"
            data-testid="submit-button"
            disabled={loading}
            className={`w-full rounded-full py-6 text-lg font-bold ${
              role === 'migrant' && !isLogin
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-primary hover:bg-primary-hover'
            }`}
          >
            {loading ? 'Carregando...' : (
              isLogin ? t('login') : (
                (step < getTotalSteps()) ? 'Próximo' : t('register')
              )
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            data-testid="toggle-auth-mode"
            onClick={() => {
              setIsLogin(!isLogin);
              setStep(1);
              setSelectedCategories([]);
              setLocation(null);
              setShowLocation(false);
            }}
            className="text-textSecondary hover:text-primary transition-colors"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          </button>
        </div>
      </div>
    </div>
  );
}
