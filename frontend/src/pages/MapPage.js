import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import BottomNav from '../components/BottomNav';
import { MapPin, Filter, Phone, Clock, ExternalLink, Navigation, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

const WATIZAT_SERVICES = [
  { 
    id: 1, 
    name: 'Secours Catholique', 
    category: 'food',
    address: '15 Rue de Maubeuge, 75009 Paris',
    lat: 48.8766, 
    lng: 2.3389,
    phone: '01 45 49 73 00',
    hours: 'Seg-Sex: 9h-17h',
    icon: '🍽️',
    color: 'bg-green-500'
  },
  { 
    id: 2, 
    name: 'La Cimade', 
    category: 'legal',
    address: '176 Rue de Grenelle, 75007 Paris',
    lat: 48.8566, 
    lng: 2.3145,
    phone: '01 40 08 05 34',
    hours: 'Ter-Qui: 14h-18h',
    icon: '⚖️',
    color: 'bg-blue-500'
  },
  { 
    id: 3, 
    name: 'PASS - Hôpital Saint-Louis', 
    category: 'health',
    address: '1 Avenue Claude Vellefaux, 75010 Paris',
    lat: 48.8720, 
    lng: 2.3693,
    phone: '01 42 49 49 49',
    hours: 'Seg-Sex: 8h30-17h',
    icon: '🏥',
    color: 'bg-red-500'
  },
  { 
    id: 4, 
    name: 'France Terre d\'Asile', 
    category: 'housing',
    address: '24 Rue Marc Seguin, 75018 Paris',
    lat: 48.8975, 
    lng: 2.3589,
    phone: '01 53 04 39 99',
    hours: 'Seg-Sex: 9h-18h',
    icon: '🏠',
    color: 'bg-purple-500'
  },
  { 
    id: 5, 
    name: 'Pôle Emploi International', 
    category: 'work',
    address: '48 Boulevard de la Bastille, 75012 Paris',
    lat: 48.8530, 
    lng: 2.3689,
    phone: '39 49',
    hours: 'Seg-Sex: 8h30-16h30',
    icon: '💼',
    color: 'bg-yellow-500'
  },
  { 
    id: 6, 
    name: 'CASNAV', 
    category: 'education',
    address: '12 Boulevard d\'Indochine, 75019 Paris',
    lat: 48.8767, 
    lng: 2.3889,
    phone: '01 44 62 39 36',
    hours: 'Seg-Sex: 9h-17h',
    icon: '📚',
    color: 'bg-indigo-500'
  },
  { 
    id: 7, 
    name: 'Emmaüs Solidarité', 
    category: 'social',
    address: '4 Rue des Amandiers, 75020 Paris',
    lat: 48.8641, 
    lng: 2.3889,
    phone: '01 43 58 24 52',
    hours: 'Seg-Sex: 10h-18h',
    icon: '🤝',
    color: 'bg-pink-500'
  },
  { 
    id: 8, 
    name: 'Croix-Rouge Française', 
    category: 'social',
    address: '43 Rue de Valmy, 93100 Montreuil',
    lat: 48.8634, 
    lng: 2.4426,
    phone: '01 48 51 96 00',
    hours: 'Qua e Sex: 14h-17h',
    icon: '👕',
    color: 'bg-orange-500'
  },
  { 
    id: 9, 
    name: 'Restaurants du Coeur', 
    category: 'food',
    address: '42 Rue Championnet, 75018 Paris',
    lat: 48.8947, 
    lng: 2.3479,
    phone: '01 53 32 23 23',
    hours: 'Seg-Sex: 11h30-13h30',
    icon: '🍽️',
    color: 'bg-green-500'
  },
  { 
    id: 10, 
    name: 'GISTI', 
    category: 'legal',
    address: '3 Villa Marcès, 75011 Paris',
    lat: 48.8634, 
    lng: 2.3806,
    phone: '01 43 14 84 84',
    hours: 'Seg-Sex: 14h-18h',
    icon: '⚖️',
    color: 'bg-blue-500'
  }
];

const CATEGORIES = [
  { value: 'all', label: 'Todos', icon: '🗺️' },
  { value: 'food', label: 'Alimentação', icon: '🍽️' },
  { value: 'legal', label: 'Jurídico', icon: '⚖️' },
  { value: 'health', label: 'Saúde', icon: '🏥' },
  { value: 'housing', label: 'Moradia', icon: '🏠' },
  { value: 'work', label: 'Trabalho', icon: '💼' },
  { value: 'education', label: 'Educação', icon: '📚' },
  { value: 'social', label: 'Social', icon: '🤝' }
];

export default function MapPage() {
  const { token } = useContext(AuthContext);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Tentar obter localização do usuário
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Localização negada')
      );
    }
  }, []);

  const filteredServices = selectedCategory === 'all' 
    ? WATIZAT_SERVICES 
    : WATIZAT_SERVICES.filter(s => s.category === selectedCategory);

  const centerLat = 48.8566; // Paris centro
  const centerLng = 2.3522;

  const openGoogleMaps = (service) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${service.lat},${service.lng}`, '_blank');
  };

  const openServiceDetails = (service) => {
    setSelectedService(service);
    setShowDetails(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="map-page">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-4 px-4 sticky top-0 z-20">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-xl sm:text-2xl font-heading font-bold mb-3 flex items-center gap-2">
            <MapPin size={24} />
            Mapa de Ajuda - Paris
          </h1>
          
          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-1 px-3 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-white text-primary shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 max-w-6xl">
        {/* Mapa Estilizado */}
        <div className="relative w-full h-[500px] sm:h-[600px] rounded-3xl overflow-hidden border-4 border-primary/20 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 shadow-2xl mb-4">
          {/* Grid de fundo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(to right, #1CA9C9 1px, transparent 1px),
                linear-gradient(to bottom, #1CA9C9 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px'
            }} />
          </div>

          {/* Elementos de rua decorativos */}
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 500 500">
            {/* Linhas simulando ruas */}
            <line x1="0" y1="150" x2="500" y2="150" stroke="#1CA9C9" strokeWidth="3" />
            <line x1="0" y1="350" x2="500" y2="350" stroke="#1CA9C9" strokeWidth="3" />
            <line x1="150" y1="0" x2="150" y2="500" stroke="#1CA9C9" strokeWidth="3" />
            <line x1="350" y1="0" x2="350" y2="500" stroke="#1CA9C9" strokeWidth="3" />
            <circle cx="250" cy="250" r="100" stroke="#1CA9C9" strokeWidth="2" fill="none" />
          </svg>

          {/* Localização do usuário */}
          {userLocation && (
            <div 
              className="absolute z-10"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="relative">
                <div className="absolute w-16 h-16 bg-blue-400/30 rounded-full animate-ping" />
                <div className="relative w-8 h-8 bg-blue-500 border-4 border-white rounded-full shadow-lg flex items-center justify-center">
                  <Navigation size={16} className="text-white" />
                </div>
              </div>
            </div>
          )}

          {/* Marcadores dos Serviços */}
          {filteredServices.map((service, index) => {
            // Calcular posição relativa no mapa
            const xPos = 20 + (index % 5) * 15;
            const yPos = 15 + Math.floor(index / 5) * 20;

            return (
              <div
                key={service.id}
                className="absolute z-10 cursor-pointer group"
                style={{
                  left: `${xPos}%`,
                  top: `${yPos}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => openServiceDetails(service)}
              >
                {/* Círculo de pulso */}
                <div className={`absolute w-12 h-12 ${service.color} opacity-20 rounded-full animate-ping`} 
                  style={{ animationDuration: `${2 + index * 0.2}s` }} />
                
                {/* Marcador */}
                <div className={`relative ${service.color} w-10 h-10 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-lg transform group-hover:scale-125 transition-transform`}>
                  {service.icon}
                </div>

                {/* Label - aparece no hover */}
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  <p className="text-xs font-bold text-textPrimary">{service.name}</p>
                  <p className="text-[10px] text-textMuted">{service.category}</p>
                </div>
              </div>
            );
          })}

          {/* Legenda */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-xl">
            <p className="text-xs font-bold text-textPrimary mb-2">📍 {filteredServices.length} Locais</p>
            <div className="flex items-center gap-2 text-xs text-textSecondary">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Sua localização</span>
            </div>
          </div>
        </div>

        {/* Lista de Serviços */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredServices.map(service => (
            <div
              key={service.id}
              className="bg-white rounded-2xl p-4 shadow-card hover:shadow-xl transition-all border-2 border-transparent hover:border-primary cursor-pointer"
              onClick={() => openServiceDetails(service)}
            >
              <div className="flex items-start gap-3">
                <div className={`${service.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0`}>
                  {service.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-textPrimary text-sm sm:text-base mb-1">{service.name}</h3>
                  <div className="space-y-1 text-xs text-textSecondary">
                    <p className="flex items-center gap-1 truncate">
                      <MapPin size={12} />
                      {service.address}
                    </p>
                    {service.phone && (
                      <p className="flex items-center gap-1">
                        <Phone size={12} />
                        {service.phone}
                      </p>
                    )}
                    {service.hours && (
                      <p className="flex items-center gap-1">
                        <Clock size={12} />
                        {service.hours}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  openGoogleMaps(service);
                }}
                size="sm"
                className="w-full mt-3 rounded-full bg-primary hover:bg-primary-hover text-white"
              >
                <Navigation size={14} className="mr-2" />
                Como Chegar
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="rounded-3xl max-w-lg">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`${selectedService.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
                    {selectedService.icon}
                  </div>
                  <span>{selectedService.name}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin size={18} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-textPrimary">Endereço</p>
                      <p className="text-sm text-textSecondary">{selectedService.address}</p>
                    </div>
                  </div>
                  {selectedService.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={18} className="text-primary" />
                      <div>
                        <p className="text-sm font-bold text-textPrimary">Telefone</p>
                        <p className="text-sm text-textSecondary">{selectedService.phone}</p>
                      </div>
                    </div>
                  )}
                  {selectedService.hours && (
                    <div className="flex items-start gap-2">
                      <Clock size={18} className="text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-textPrimary">Horário</p>
                        <p className="text-sm text-textSecondary">{selectedService.hours}</p>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => openGoogleMaps(selectedService)}
                  className="w-full rounded-full bg-primary hover:bg-primary-hover py-6"
                >
                  <Navigation size={20} className="mr-2" />
                  Abrir Navegação no Google Maps
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
