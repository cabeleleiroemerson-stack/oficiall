import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import BottomNav from '../components/BottomNav';
import { Search, User, MessageCircle, Star, Briefcase, Clock, Languages, GraduationCap, Shield, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PROFESSIONAL_AREAS = [
  { value: 'legal', label: 'Jurídico', icon: '⚖️', desc: 'Advogados, assistentes jurídicos' },
  { value: 'health', label: 'Saúde', icon: '🏥', desc: 'Médicos, enfermeiros, psicólogos' },
  { value: 'education', label: 'Educação', icon: '📚', desc: 'Professores, tutores' },
  { value: 'translation', label: 'Tradução', icon: '🌍', desc: 'Tradutores, intérpretes' },
  { value: 'family', label: 'Família e Social', icon: '👨‍👩‍👧', desc: 'Assistentes sociais, mediadores' },
  { value: 'employment', label: 'Orientação Profissional', icon: '💼', desc: 'RH, orientadores de carreira' },
  { value: 'housing', label: 'Habitação', icon: '🏠', desc: 'Assistentes imobiliários' },
  { value: 'administration', label: 'Administração', icon: '📋', desc: 'Ajuda com documentos' },
  { value: 'finance', label: 'Finanças', icon: '💰', desc: 'Contadores, consultores financeiros' },
  { value: 'technology', label: 'Tecnologia', icon: '💻', desc: 'TI, suporte técnico' }
];

export default function VolunteersPage() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');

  useEffect(() => {
    fetchVolunteers();
  }, []);

  useEffect(() => {
    filterVolunteers();
  }, [volunteers, searchTerm, areaFilter]);

  const fetchVolunteers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/volunteers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVolunteers(data);
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVolunteers = () => {
    let filtered = volunteers;

    if (areaFilter !== 'all') {
      filtered = filtered.filter(v => v.professional_area === areaFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.professional_specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredVolunteers(filtered);
  };

  const getAreaInfo = (area) => {
    return PROFESSIONAL_AREAS.find(a => a.value === area) || { icon: '👤', label: area };
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="volunteers-page">
      <div className="bg-gradient-to-br from-primary to-secondary text-white py-6 sm:py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">🤝 Profissionais Voluntários</h1>
          <p className="text-sm sm:text-base text-white/90 mb-4 sm:mb-6">Conecte-se com profissionais que oferecem ajuda gratuita</p>
          
          <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                data-testid="search-volunteers"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou especialidade..."
                className="pl-10 rounded-xl bg-white"
              />
            </div>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-full sm:w-64 rounded-xl bg-white">
                <SelectValue placeholder="Todas as áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                {PROFESSIONAL_AREAS.map(area => (
                  <SelectItem key={area.value} value={area.value}>
                    <span className="mr-2">{area.icon}</span>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Categorias Rápidas */}
      <div className="bg-white border-b py-4 px-4 overflow-x-auto">
        <div className="flex gap-2 container mx-auto max-w-4xl">
          <Button
            onClick={() => setAreaFilter('all')}
            variant={areaFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className={`rounded-full whitespace-nowrap ${areaFilter === 'all' ? 'bg-primary text-white' : ''}`}
          >
            Todos
          </Button>
          {PROFESSIONAL_AREAS.slice(0, 5).map(area => (
            <Button
              key={area.value}
              onClick={() => setAreaFilter(area.value)}
              variant={areaFilter === area.value ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full whitespace-nowrap ${areaFilter === area.value ? 'bg-primary text-white' : ''}`}
            >
              <span className="mr-1">{area.icon}</span>
              {area.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {loading ? (
          <div className="text-center py-12 text-textMuted">Carregando voluntários...</div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-textMuted text-lg">
              {volunteers.length === 0 
                ? 'Nenhum voluntário cadastrado ainda' 
                : 'Nenhum voluntário encontrado com esses filtros'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVolunteers.map((volunteer) => {
              const areaInfo = getAreaInfo(volunteer.professional_area);
              return (
                <div 
                  key={volunteer.id}
                  data-testid="volunteer-card"
                  className="bg-white rounded-3xl p-6 shadow-card card-hover border-2 border-transparent hover:border-primary"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <User size={32} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-textPrimary mb-1">
                        {volunteer.display_name && volunteer.use_display_name 
                          ? volunteer.display_name 
                          : volunteer.name}
                      </h3>
                      <div className="flex items-center gap-2 text-primary font-medium mb-2">
                        <span className="text-2xl">{areaInfo.icon}</span>
                        <span>{areaInfo.label}</span>
                      </div>
                    </div>
                  </div>

                  {volunteer.professional_specialties && volunteer.professional_specialties.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-bold text-textPrimary mb-2 flex items-center gap-1">
                        <Star size={16} />
                        Especialidades:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {volunteer.professional_specialties.map((spec, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1 bg-blue-50 text-primary text-sm rounded-full border border-primary/20"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {volunteer.education && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-xl">
                      <p className="text-sm font-bold text-primary mb-1 flex items-center gap-1">
                        <GraduationCap size={16} />
                        Formação:
                      </p>
                      <p className="text-sm text-textSecondary whitespace-pre-line">{volunteer.education}</p>
                    </div>
                  )}

                  {volunteer.certifications && volunteer.certifications.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-bold text-textPrimary mb-2 flex items-center gap-1">
                        <Shield size={16} />
                        Certificações:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {volunteer.certifications.map((cert, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {volunteer.organization && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-textSecondary">
                      <Building size={16} />
                      <span>{volunteer.organization}</span>
                    </div>
                  )}

                  {volunteer.years_experience && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-textSecondary">
                      <Clock size={16} />
                      <span>{volunteer.years_experience} de experiência</span>
                    </div>
                  )}

                  {volunteer.professional_id && (
                    <div className="mb-3 p-2 bg-green-50 rounded-lg flex items-center gap-2">
                      <Shield size={16} className="text-green-600" />
                      <span className="text-xs font-medium text-green-700">
                        Registro: {volunteer.professional_id}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-textMuted mb-4">
                    {volunteer.availability && (
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {volunteer.availability}
                      </span>
                    )}
                    {volunteer.languages && volunteer.languages.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Languages size={16} />
                        {volunteer.languages.join(', ').toUpperCase()}
                      </span>
                    )}
                  </div>

                  <Button
                    data-testid="contact-volunteer-button"
                    onClick={() => navigate(`/direct-chat/${volunteer.id}`)}
                    className="w-full rounded-full bg-primary hover:bg-primary-hover text-white font-bold"
                  >
                    <MessageCircle size={18} className="mr-2" />
                    Entrar em Contato
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 text-center border-2 border-primary/20">
          <h3 className="text-2xl font-heading font-bold text-textPrimary mb-3">
            Você é um profissional?
          </h3>
          <p className="text-textSecondary mb-6 max-w-2xl mx-auto">
            Cadastre-se como voluntário e ajude migrantes com sua expertise profissional. 
            Faça a diferença na vida de quem precisa!
          </p>
          <Button
            onClick={() => navigate('/volunteer-register')}
            size="lg"
            className="rounded-full px-8 py-6 text-lg font-bold bg-primary hover:bg-primary-hover"
          >
            🌟 Cadastrar como Voluntário
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
