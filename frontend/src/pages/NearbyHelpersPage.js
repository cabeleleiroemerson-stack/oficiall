import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import BottomNav from '../components/BottomNav';
import { MapPin, Navigation, User, Phone, MessageCircle, Loader2, Filter, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const HELP_CATEGORIES = [
  { value: 'all', label: 'Todas as categorias', icon: '🌐' },
  { value: 'food', label: 'Alimentação', icon: '🍽️' },
  { value: 'legal', label: 'Jurídico', icon: '⚖️' },
  { value: 'health', label: 'Saúde', icon: '🏥' },
  { value: 'housing', label: 'Moradia', icon: '🏠' },
  { value: 'work', label: 'Emprego', icon: '💼' },
  { value: 'education', label: 'Educação', icon: '📚' },
  { value: 'social', label: 'Apoio Social', icon: '🤝' },
  { value: 'clothes', label: 'Roupas', icon: '👕' },
  { value: 'furniture', label: 'Móveis', icon: '🪑' },
  { value: 'transport', label: 'Transporte', icon: '🚗' }
];

export default function NearbyHelpersPage() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  
  const [myLocation, setMyLocation] = useState(null);
  const [nearbyHelpers, setNearbyHelpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedHelper, setSelectedHelper] = useState(null);
  const [radius, setRadius] = useState(10);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        getMyLocation();
      };
      document.body.appendChild(script);
    } else {
      getMyLocation();
    }
  }, []);

  useEffect(() => {
    if (myLocation) {
      fetchNearbyHelpers();
    }
  }, [myLocation, selectedCategory, radius]);

  useEffect(() => {
    if (myLocation && window.L && mapRef.current) {
      initMap();
    }
  }, [myLocation, nearbyHelpers]);

  const getMyLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMyLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Default to Paris center
          setMyLocation({ lat: 48.8566, lng: 2.3522 });
          setLoadingLocation(false);
          toast.error('Não foi possível obter sua localização. Usando Paris como padrão.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setMyLocation({ lat: 48.8566, lng: 2.3522 });
      setLoadingLocation(false);
    }
  };

  const fetchNearbyHelpers = async () => {
    if (!myLocation) return;
    
    setLoading(true);
    try {
      const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/helpers-nearby?lat=${myLocation.lat}&lng=${myLocation.lng}&radius=${radius}${categoryParam}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setNearbyHelpers(data);
      }
    } catch (error) {
      console.error('Error fetching nearby helpers:', error);
      toast.error('Erro ao buscar ajudantes próximos');
    } finally {
      setLoading(false);
    }
  };

  const initMap = () => {
    if (!window.L || !mapRef.current) return;

    // Clear existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Clear markers
    markersRef.current = [];

    // Create map
    const map = window.L.map(mapRef.current).setView([myLocation.lat, myLocation.lng], 13);
    mapInstanceRef.current = map;

    // Add tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add my location marker
    const myIcon = window.L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    window.L.marker([myLocation.lat, myLocation.lng], { icon: myIcon })
      .addTo(map)
      .bindPopup('<strong>Você está aqui</strong>');

    // Add helper markers
    nearbyHelpers.forEach((helper, index) => {
      if (helper.location && helper.location.lat && helper.location.lng) {
        const helperIcon = window.L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: #f97316; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px;">🤝</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = window.L.marker([helper.location.lat, helper.location.lng], { icon: helperIcon })
          .addTo(map);

        const categories = helper.help_categories?.map(cat => {
          const catInfo = HELP_CATEGORIES.find(c => c.value === cat);
          return catInfo ? catInfo.icon : '';
        }).join(' ') || '';

        marker.bindPopup(`
          <div style="text-align: center; min-width: 150px;">
            <strong>${helper.name}</strong><br/>
            <span style="color: #666; font-size: 12px;">${helper.role === 'volunteer' ? 'Voluntário Profissional' : 'Ajudante'}</span><br/>
            <span style="font-size: 16px;">${categories}</span><br/>
            <span style="color: #22c55e; font-size: 12px;">${helper.distance} km</span>
          </div>
        `);

        marker.on('click', () => {
          setSelectedHelper(helper);
        });

        markersRef.current.push(marker);
      }
    });

    // Add radius circle
    window.L.circle([myLocation.lat, myLocation.lng], {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      radius: radius * 1000
    }).addTo(map);
  };

  const getCategoryInfo = (value) => {
    return HELP_CATEGORIES.find(c => c.value === value) || { icon: '📝', label: value };
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-6 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <MapPin size={28} />
            Ajudantes Próximos
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Encontre pessoas que podem te ajudar perto de você
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-xl bg-white text-sm"
              >
                {HELP_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Raio:</span>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="p-2 border rounded-xl bg-white text-sm"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
            <Button
              onClick={fetchNearbyHelpers}
              variant="outline"
              size="sm"
              className="rounded-xl"
            >
              <RefreshCw size={16} className="mr-1" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-4">
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Map */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {loadingLocation ? (
              <div className="h-[400px] flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin text-primary mx-auto mb-2" />
                  <p className="text-gray-600">Obtendo sua localização...</p>
                </div>
              </div>
            ) : (
              <div ref={mapRef} className="h-[400px] w-full" />
            )}
          </div>

          {/* List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-textPrimary">
                {loading ? 'Buscando...' : `${nearbyHelpers.length} ajudante${nearbyHelpers.length !== 1 ? 's' : ''} encontrado${nearbyHelpers.length !== 1 ? 's' : ''}`}
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 size={32} className="animate-spin text-primary mx-auto" />
              </div>
            ) : nearbyHelpers.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border">
                <MapPin size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Nenhum ajudante encontrado nesta área</p>
                <p className="text-sm text-gray-400 mt-1">Tente aumentar o raio de busca</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {nearbyHelpers.map(helper => (
                  <div
                    key={helper.id}
                    className={`bg-white rounded-2xl p-4 border-2 transition-all cursor-pointer ${
                      selectedHelper?.id === helper.id ? 'border-primary shadow-lg' : 'border-transparent hover:border-gray-200'
                    }`}
                    onClick={() => setSelectedHelper(helper)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">{helper.name?.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-textPrimary truncate">{helper.name}</h3>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            {helper.distance} km
                          </span>
                        </div>
                        <p className="text-sm text-textSecondary">
                          {helper.role === 'volunteer' ? 'Voluntário Profissional' : 'Ajudante'}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {helper.help_categories?.slice(0, 4).map(cat => {
                            const catInfo = getCategoryInfo(cat);
                            return (
                              <span
                                key={cat}
                                className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                                title={catInfo.label}
                              >
                                {catInfo.icon} {catInfo.label}
                              </span>
                            );
                          })}
                          {helper.help_categories?.length > 4 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                              +{helper.help_categories.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {selectedHelper?.id === helper.id && (
                      <div className="mt-3 pt-3 border-t flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/direct-chat/${helper.id}`);
                          }}
                          size="sm"
                          className="flex-1 rounded-xl bg-primary hover:bg-primary-hover"
                        >
                          <MessageCircle size={16} className="mr-1" />
                          Conversar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
