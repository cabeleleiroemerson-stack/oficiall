import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import BottomNav from '../components/BottomNav';
import { MapPin, Filter, Phone, Clock, ExternalLink, Navigation, Info, Target, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function MapPage() {
  const { token } = useContext(AuthContext);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestLocation, setNearestLocation] = useState(null);
  const [showNearestModal, setShowNearestModal] = useState(false);
  
  // Estados para dados da API
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingNearest, setLoadingNearest] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Buscar categorias
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/help-locations/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
    }
  }, []);

  // Buscar locais de ajuda
  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${BACKEND_URL}/api/help-locations`;
      const params = new URLSearchParams();
      
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      if (userLocation) {
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setServices(data.locations);
      } else {
        throw new Error('Erro ao buscar locais');
      }
    } catch (err) {
      setError('Não foi possível carregar os locais de ajuda');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, userLocation]);

  // Buscar local mais próximo
  const findNearestLocation = async (category = null) => {
    if (!userLocation) {
      alert('Por favor, ative sua localização primeiro');
      return;
    }
    
    setLoadingNearest(true);
    try {
      let url = `${BACKEND_URL}/api/help-locations/nearest?lat=${userLocation.lat}&lng=${userLocation.lng}`;
      if (category && category !== 'all') {
        url += `&category=${category}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setNearestLocation(data.nearest);
        setShowNearestModal(true);
      }
    } catch (err) {
      console.error('Erro ao buscar local mais próximo:', err);
      alert('Erro ao buscar local mais próximo');
    } finally {
      setLoadingNearest(false);
    }
  };

  // Obter localização do usuário
  const getUserLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.log('Localização negada:', error);
          setLoadingLocation(false);
          alert('Não foi possível obter sua localização. Por favor, permita o acesso à localização.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLoadingLocation(false);
      alert('Seu navegador não suporta geolocalização');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Tentar obter localização ao carregar a página
  useEffect(() => {
    getUserLocation();
  }, []);

  const openGoogleMaps = (service) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${service.lat},${service.lng}`, '_blank');
  };

  const openServiceDetails = (service) => {
    setSelectedService(service);
    setShowDetails(true);
  };

  // Calcular posição do marcador no mapa baseado em lat/lng
  const getMarkerPosition = (service, index) => {
    // Calcula posição relativa baseada nas coordenadas
    // Centro: Paris (48.8566, 2.3522)
    const centerLat = 48.8566;
    const centerLng = 2.3522;
    
    // Calcula offset em porcentagem (escala ajustada para o mapa)
    const latOffset = (service.lat - centerLat) * 800; // Multiplicador para escala
    const lngOffset = (service.lng - centerLng) * 800;
    
    // Posição central é 50%, ajusta baseado no offset
    const xPos = Math.max(5, Math.min(95, 50 + lngOffset));
    const yPos = Math.max(10, Math.min(90, 50 - latOffset)); // Invertido pois Y cresce para baixo
    
    return { xPos, yPos };
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
          
          {/* Botão de Localização */}
          <div className="flex items-center gap-2 mb-3">
            <Button
              onClick={getUserLocation}
              disabled={loadingLocation}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              {loadingLocation ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <Target size={14} className="mr-2" />
              )}
              {userLocation ? 'Atualizar Localização' : 'Ativar Localização'}
            </Button>
            
            {userLocation && (
              <Button
                onClick={() => findNearestLocation(selectedCategory)}
                disabled={loadingNearest}
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                {loadingNearest ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Navigation size={14} className="mr-2" />
                )}
                Local Mais Próximo
              </Button>
            )}
          </div>
          
          {/* Status da Localização */}
          {userLocation && (
            <div className="text-xs text-white/80 mb-2 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Localização ativa
            </div>
          )}
          
          {/* Filtros por Categoria */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.length > 0 ? (
              categories.map(cat => (
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
                  <span className="text-xs opacity-70">({cat.count})</span>
                </button>
              ))
            ) : (
              // Fallback se categorias ainda estão carregando
              <div className="text-white/70 text-sm">Carregando categorias...</div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 max-w-6xl">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12 min-h-[300px]">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        )}

        {!loading && (
          <>
            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                <AlertCircle className="text-red-500" size={24} />
                <div>
                  <p className="text-red-800 font-medium">{error}</p>
                  <Button
                    onClick={fetchLocations}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            )}

            {/* Mapa Estilizado - SEMPRE VISÍVEL */}
            <div className="relative w-full min-h-[400px] h-[50vh] sm:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden border-4 border-primary/20 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 shadow-2xl mb-4">
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
                  className="absolute z-20"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="relative">
                    <div className="absolute w-16 h-16 bg-blue-400/30 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute w-12 h-12 bg-blue-300/20 rounded-full" style={{ left: '-8px', top: '-8px' }} />
                    <div className="relative w-8 h-8 bg-blue-500 border-4 border-white rounded-full shadow-lg flex items-center justify-center">
                      <Target size={14} className="text-white" />
                    </div>
                    <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap font-bold">
                      Você
                    </div>
                  </div>
                </div>
              )}

              {/* Marcadores dos Serviços */}
              {services.slice(0, 30).map((service, index) => {
                // Distribuir marcadores em grid para visualização
                const gridCols = 6;
                const xPos = 10 + (index % gridCols) * 14;
                const yPos = 10 + Math.floor(index / gridCols) * 18;

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
                    <div className={`absolute w-10 h-10 ${service.color} opacity-20 rounded-full animate-ping`} 
                      style={{ animationDuration: `${2.5 + (index * 0.1) % 2}s`, left: '-5px', top: '-5px' }} />
                    
                    {/* Marcador */}
                    <div className={`relative ${service.color} w-8 h-8 sm:w-10 sm:h-10 rounded-full border-3 border-white shadow-xl flex items-center justify-center text-sm sm:text-lg transform group-hover:scale-125 transition-transform`}>
                      {service.icon}
                    </div>

                    {/* Distância (se disponível) */}
                    {service.distance && (
                      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-gray-800/80 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap">
                        {service.distance} km
                      </div>
                    )}

                    {/* Label - aparece no hover */}
                    <div className="absolute top-full mt-6 left-1/2 transform -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                      <p className="text-xs font-bold text-textPrimary">{service.name}</p>
                      <p className="text-[10px] text-textMuted">{service.address?.substring(0, 30)}...</p>
                    </div>
                  </div>
                );
              })}

              {/* Legenda */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-xl">
                <p className="text-xs font-bold text-textPrimary mb-2">📍 {services.length} Locais</p>
                <div className="flex items-center gap-2 text-xs text-textSecondary">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Sua localização</span>
                </div>
                {!userLocation && (
                  <p className="text-[10px] text-orange-600 mt-1">
                    Ative a localização para ver distâncias
                  </p>
                )}
              </div>

              {/* Indicador de mais locais */}
              {services.length > 30 && (
                <div className="absolute bottom-4 right-4 bg-primary/90 text-white rounded-xl px-3 py-2 text-xs">
                  +{services.length - 30} locais na lista
                </div>
              )}
            </div>

            {/* Lista de Serviços */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {services.map(service => (
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
                        {service.distance && (
                          <p className="flex items-center gap-1 text-primary font-semibold">
                            <Navigation size={12} />
                            {service.distance} km de você
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

            {/* Mensagem se não houver resultados */}
            {services.length === 0 && (
              <div className="text-center py-12">
                <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhum local encontrado para esta categoria</p>
              </div>
            )}
          </>
        )}
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
                  {selectedService.distance && (
                    <div className="flex items-center gap-2">
                      <Navigation size={18} className="text-green-500" />
                      <div>
                        <p className="text-sm font-bold text-textPrimary">Distância</p>
                        <p className="text-sm text-green-600 font-semibold">{selectedService.distance} km de você</p>
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

      {/* Dialog do Local Mais Próximo */}
      <Dialog open={showNearestModal} onOpenChange={setShowNearestModal}>
        <DialogContent className="rounded-3xl max-w-lg">
          {nearestLocation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Target className="text-green-500" size={24} />
                  <span>Local Mais Próximo</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                  <div className={`${nearestLocation.color} w-14 h-14 rounded-full flex items-center justify-center text-3xl`}>
                    {nearestLocation.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-textPrimary">{nearestLocation.name}</h3>
                    <p className="text-green-600 font-semibold text-lg">{nearestLocation.distance} km</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin size={18} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-textPrimary">Endereço</p>
                      <p className="text-sm text-textSecondary">{nearestLocation.address}</p>
                    </div>
                  </div>
                  {nearestLocation.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={18} className="text-primary" />
                      <div>
                        <p className="text-sm font-bold text-textPrimary">Telefone</p>
                        <p className="text-sm text-textSecondary">{nearestLocation.phone}</p>
                      </div>
                    </div>
                  )}
                  {nearestLocation.hours && (
                    <div className="flex items-start gap-2">
                      <Clock size={18} className="text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-textPrimary">Horário</p>
                        <p className="text-sm text-textSecondary">{nearestLocation.hours}</p>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => openGoogleMaps(nearestLocation)}
                  className="w-full rounded-full bg-green-500 hover:bg-green-600 py-6"
                >
                  <Navigation size={20} className="mr-2" />
                  Ir Agora (Google Maps)
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
