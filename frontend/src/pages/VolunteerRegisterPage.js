import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, User, Briefcase, GraduationCap, Shield, Phone, Mail } from 'lucide-react';

const PROFESSIONAL_AREAS = [
  { value: 'legal', label: 'Jurídico', icon: '⚖️', desc: 'Advogado, Assistente Jurídico' },
  { value: 'health', label: 'Saúde', icon: '🏥', desc: 'Médico, Enfermeiro, Psicólogo' },
  { value: 'education', label: 'Educação', icon: '📚', desc: 'Professor, Tutor' },
  { value: 'translation', label: 'Tradução', icon: '🌍', desc: 'Tradutor, Intérprete' },
  { value: 'family', label: 'Família e Social', icon: '👨‍👩‍👧', desc: 'Assistente Social, Mediador' },
  { value: 'employment', label: 'Orientação Profissional', icon: '💼', desc: 'RH, Coach de Carreira' },
  { value: 'housing', label: 'Habitação', icon: '🏠', desc: 'Corretor, Assistente Imobiliário' },
  { value: 'administration', label: 'Administração', icon: '📋', desc: 'Assistente Administrativo' },
  { value: 'finance', label: 'Finanças', icon: '💰', desc: 'Contador, Consultor Financeiro' },
  { value: 'technology', label: 'Tecnologia', icon: '💻', desc: 'Desenvolvedor, Suporte TI' }
];

const HELP_TYPES = [
  'Consultas pontuais',
  'Acompanhamento contínuo',
  'Workshops/Palestras',
  'Revisão de documentos',
  'Orientação remota',
  'Atendimento presencial',
  'Tradução de documentos',
  'Suporte emocional'
];

const HELP_CATEGORIES = [
  { value: 'food', label: 'Alimentação', icon: '🍽️', desc: 'Distribuição de alimentos, refeições' },
  { value: 'legal', label: 'Jurídico', icon: '⚖️', desc: 'Assistência jurídica, documentação' },
  { value: 'health', label: 'Saúde', icon: '🏥', desc: 'Atendimento médico, psicológico' },
  { value: 'housing', label: 'Moradia', icon: '🏠', desc: 'Abrigo, habitação' },
  { value: 'work', label: 'Emprego', icon: '💼', desc: 'Orientação profissional, CV' },
  { value: 'education', label: 'Educação', icon: '📚', desc: 'Cursos, escolarização' },
  { value: 'social', label: 'Apoio Social', icon: '🤝', desc: 'Assistência social, integração' },
  { value: 'clothes', label: 'Roupas', icon: '👕', desc: 'Vestuário, calçados' },
  { value: 'furniture', label: 'Móveis', icon: '🪑', desc: 'Móveis, utensílios domésticos' },
  { value: 'transport', label: 'Transporte', icon: '🚗', desc: 'Ajuda com deslocamento' }
];

export default function VolunteerRegisterPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Etapa 1: Informações Pessoais
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [languages, setLanguages] = useState(['pt', 'fr']);

  // Etapa 2: Área Profissional
  const [professionalArea, setProfessionalArea] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [organization, setOrganization] = useState('');
  const [professionalId, setProfessionalId] = useState('');

  // Etapa 3: Formação e Experiência
  const [education, setEducation] = useState('');
  const [certifications, setCertifications] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [experience, setExperience] = useState('');

  // Etapa 4: Disponibilidade e Contato
  const [availability, setAvailability] = useState('');
  const [helpTypes, setHelpTypes] = useState([]);
  const [helpCategories, setHelpCategories] = useState([]);
  const [linkedin, setLinkedin] = useState('');

  const nextStep = () => {
    if (step === 1) {
      if (!name || !email || !password) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
    }
    if (step === 2) {
      if (!professionalArea) {
        toast.error('Selecione uma área profissional');
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const toggleHelpType = (type) => {
    setHelpTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = async () => {
    if (!availability) {
      toast.error('Informe sua disponibilidade');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          role: 'volunteer',
          languages,
          professional_area: professionalArea,
          professional_specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
          availability,
          experience,
          education,
          certifications: certifications.split(',').map(s => s.trim()).filter(Boolean),
          professional_id: professionalId,
          organization,
          years_experience: yearsExperience,
          help_types: helpTypes,
          phone,
          linkedin
        })
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        toast.success('Cadastro realizado com sucesso!');
        navigate('/volunteers');
      } else {
        toast.error(data.detail || 'Erro ao cadastrar');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, label: 'Pessoal', icon: User },
    { number: 2, label: 'Profissional', icon: Briefcase },
    { number: 3, label: 'Formação', icon: GraduationCap },
    { number: 4, label: 'Disponibilidade', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-4 sm:py-8 px-2 sm:px-4">
      <div className="container mx-auto max-w-4xl">
        <button
          onClick={() => navigate('/auth')}
          className="flex items-center gap-2 text-primary hover:text-primary-hover mb-4 sm:mb-6 font-medium ml-2"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8 md:p-12">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-textPrimary mb-2">
              🤝 Cadastro de Voluntário
            </h1>
            <p className="text-sm sm:text-base text-textSecondary px-2">
              Ajude migrantes com sua expertise profissional
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 sm:mb-10">
            <div className="flex justify-between items-center mb-4">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                const isActive = step === s.number;
                const isCompleted = step > s.number;
                
                return (
                  <React.Fragment key={s.number}>
                    <div className="flex flex-col items-center min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-1 sm:mb-2 transition-all ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isActive 
                            ? 'bg-primary text-white scale-110' 
                            : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? <Check size={20} className="sm:w-6 sm:h-6" /> : <Icon size={20} className="sm:w-6 sm:h-6" />}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-medium text-center ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded ${step > s.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step 1: Informações Pessoais */}
          {step === 1 && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-textPrimary mb-4 sm:mb-6 flex items-center gap-2">
                <User size={24} className="text-primary sm:w-7 sm:h-7" />
                Informações Pessoais
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label className="text-sm sm:text-base font-bold mb-2 flex items-center gap-2">
                    <span className="text-red-500">*</span>
                    Nome Completo
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="rounded-xl h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <Label className="text-sm sm:text-base font-bold mb-2 flex items-center gap-2">
                    <span className="text-red-500">*</span>
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="rounded-xl h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <Label className="text-sm sm:text-base font-bold mb-2 flex items-center gap-2">
                    <span className="text-red-500">*</span>
                    Senha
                  </Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="rounded-xl h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <Label className="text-sm sm:text-base font-bold mb-2">
                    Telefone (Opcional)
                  </Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="rounded-xl h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-bold mb-2">Idiomas que Fala</Label>
                <div className="flex gap-2 flex-wrap">
                  {['pt', 'fr', 'en', 'es', 'ar', 'ru'].map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setLanguages(prev => 
                          prev.includes(lang) 
                            ? prev.filter(l => l !== lang)
                            : [...prev, lang]
                        );
                      }}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        languages.includes(lang)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Área Profissional */}
          {step === 2 && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-textPrimary mb-4 sm:mb-6 flex items-center gap-2">
                <Briefcase size={24} className="text-primary sm:w-7 sm:h-7" />
                Área Profissional
              </h2>

              <div>
                <Label className="text-sm sm:text-base font-bold mb-3 flex items-center gap-2">
                  <span className="text-red-500">*</span>
                  Selecione sua Área de Atuação
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROFESSIONAL_AREAS.map(area => (
                    <button
                      key={area.value}
                      type="button"
                      onClick={() => setProfessionalArea(area.value)}
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left ${
                        professionalArea === area.value
                          ? 'bg-primary text-white border-primary shadow-lg'
                          : 'bg-white border-gray-200 hover:border-primary hover:shadow-md'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{area.icon}</div>
                      <div className={`text-sm sm:text-base font-bold mb-1 ${professionalArea === area.value ? 'text-white' : 'text-textPrimary'}`}>
                        {area.label}
                      </div>
                      <div className={`text-xs sm:text-sm ${professionalArea === area.value ? 'text-white/90' : 'text-textSecondary'}`}>
                        {area.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label className="text-sm sm:text-base font-bold mb-2">
                    Especialidades (separadas por vírgula)
                  </Label>
                  <Input
                    value={specialties}
                    onChange={(e) => setSpecialties(e.target.value)}
                    placeholder="Ex: Direito de Família, Asilo"
                    className="rounded-xl h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <Label className="text-sm sm:text-base font-bold mb-2">
                    Organização/Empresa Atual
                  </Label>
                  <Input
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Nome da organização"
                    className="rounded-xl h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <Label className="text-sm sm:text-base font-bold mb-2">
                    Número de Registro Profissional
                  </Label>
                  <Input
                    value={professionalId}
                    onChange={(e) => setProfessionalId(e.target.value)}
                    placeholder="Ex: OAB, CRM, COREN"
                    className="rounded-xl h-11 sm:h-12 text-sm sm:text-base"
                  />
                  <p className="text-xs text-textMuted mt-1">Opcional, mas aumenta credibilidade</p>
                </div>

                <div>
                  <Label className="text-sm sm:text-base font-bold mb-2">
                    Anos de Experiência
                  </Label>
                  <select
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full h-11 sm:h-12 px-3 border rounded-xl bg-white text-sm sm:text-base"
                  >
                    <option value="">Selecione</option>
                    <option value="0-2">0-2 anos</option>
                    <option value="3-5">3-5 anos</option>
                    <option value="6-10">6-10 anos</option>
                    <option value="11-15">11-15 anos</option>
                    <option value="16+">Mais de 16 anos</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Formação e Experiência */}
          {step === 3 && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-textPrimary mb-4 sm:mb-6 flex items-center gap-2">
                <GraduationCap size={24} className="text-primary sm:w-7 sm:h-7" />
                Formação e Experiência
              </h2>

              <div>
                <Label className="text-base font-bold mb-2">
                  Formação Acadêmica
                </Label>
                <Textarea
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="Ex: Bacharel em Direito - Universidade de Paris
Mestrado em Direitos Humanos - Sorbonne"
                  rows={3}
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label className="text-base font-bold mb-2">
                  Certificações e Cursos (separados por vírgula)
                </Label>
                <Input
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="Ex: Certificado em Direito Internacional, Mediação de Conflitos"
                  className="rounded-xl h-12"
                />
              </div>

              <div>
                <Label className="text-base font-bold mb-2">
                  Experiência Profissional Relevante
                </Label>
                <Textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Descreva sua experiência ajudando migrantes, refugiados ou em sua área de atuação..."
                  rows={5}
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label className="text-base font-bold mb-2">
                  LinkedIn (Opcional)
                </Label>
                <Input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/seu-perfil"
                  className="rounded-xl h-12"
                />
              </div>
            </div>
          )}

          {/* Step 4: Disponibilidade */}
          {step === 4 && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-textPrimary mb-4 sm:mb-6 flex items-center gap-2">
                <Shield size={24} className="text-primary sm:w-7 sm:h-7" />
                Disponibilidade e Tipos de Ajuda
              </h2>

              <div>
                <Label className="text-base font-bold mb-2 flex items-center gap-2">
                  <span className="text-red-500">*</span>
                  Quando você está disponível?
                </Label>
                <Textarea
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="Ex: Segundas e quartas-feiras à noite, Sábados pela manhã"
                  rows={3}
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label className="text-base font-bold mb-3">
                  Tipos de Ajuda que Pode Oferecer
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {HELP_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleHelpType(type)}
                      className={`p-4 rounded-xl border-2 transition-all text-left font-medium ${
                        helpTypes.includes(type)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white border-gray-200 hover:border-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          helpTypes.includes(type) ? 'border-white bg-white' : 'border-gray-300'
                        }`}>
                          {helpTypes.includes(type) && <Check size={16} className="text-primary" />}
                        </div>
                        {type}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-200">
                <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                  <Shield size={20} />
                  Compromisso de Voluntário
                </h3>
                <ul className="text-sm text-textSecondary space-y-2">
                  <li>✓ Oferecer ajuda gratuita e profissional</li>
                  <li>✓ Manter confidencialidade das informações</li>
                  <li>✓ Respeitar a diversidade cultural</li>
                  <li>✓ Responder mensagens em até 48 horas</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 sm:mt-10 pt-4 sm:pt-6 border-t gap-2 sm:gap-4">
            {step > 1 && (
              <Button
                onClick={prevStep}
                variant="outline"
                className="rounded-full px-4 sm:px-8 py-3 sm:py-6 text-sm sm:text-base"
              >
                <ArrowLeft size={18} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Anterior</span>
                <span className="sm:hidden">Voltar</span>
              </Button>
            )}
            {step < 4 ? (
              <Button
                onClick={nextStep}
                className="ml-auto rounded-full px-4 sm:px-8 py-3 sm:py-6 bg-primary hover:bg-primary-hover text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Próximo</span>
                <span className="sm:hidden">Avançar</span>
                <ArrowRight size={18} className="ml-1 sm:ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto rounded-full px-4 sm:px-8 py-3 sm:py-6 bg-green-600 hover:bg-green-700 text-white font-bold text-sm sm:text-base"
              >
                {loading ? 'Cadastrando...' : (
                  <>
                    <Check size={18} className="mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Finalizar Cadastro</span>
                    <span className="sm:hidden">Finalizar</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
