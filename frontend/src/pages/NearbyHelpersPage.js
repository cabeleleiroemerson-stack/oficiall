import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import BottomNav from '../components/BottomNav';
import { MapPin, Navigation, User, Phone, MessageCircle, Loader2, Filter, X, RefreshCw, Building2, Clock, ExternalLink } from 'lucide-react';
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

const CATEGORY_COLORS = {
  food: '#22c55e',
  health: '#ef4444',
  legal: '#3b82f6',
  housing: '#a855f7',
  clothes: '#f97316',
  social: '#ec4899',
  education: '#6366f1',
  work: '#eab308'
};

export default function NearbyHelpersPage() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  
  const [myLocation, setMyLocation] = useState(null);
  const [nearbyHelpers, setNearbyHelpers] = useState([]);
  const [helpLocations, setHelpLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedHelper, setSelectedHelper] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [radius, setRadius] = useState(10);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'helpers', 'locations'

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
      fetchHelpLocations();
    }
  }, [myLocation, selectedCategory, radius]);

  useEffect(() => {
    if (myLocation && window.L && mapRef.current) {
      initMap();
    }
  }, [myLocation, nearbyHelpers, helpLocations, viewMode]);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchHelpLocations = async () => {
    if (!myLocation) return;
    
    try {
      let url = `${process.env.REACT_APP_BACKEND_URL}/api/help-locations?lat=${myLocation.lat}&lng=${myLocation.lng}`;
      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`;
      }
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        // Filter by radius
        const filtered = data.locations.filter(loc => loc.distance <= radius);
        setHelpLocations(filtered);
      }
    } catch (error) {
      console.error('Error fetching help locations:', error);
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

    // Add helper markers (if viewMode includes helpers)
    if (viewMode === 'all' || viewMode === 'helpers') {
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
            setSelectedLocation(null);
          });

          markersRef.current.push(marker);
        }
      });
    }

    // Add help location markers (if viewMode includes locations)
    if (viewMode === 'all' || viewMode === 'locations') {
      helpLocations.forEach((location, index) => {
        const color = CATEGORY_COLORS[location.category] || '#6b7280';
        const locationIcon = window.L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: ${color}; width: 32px; height: 32px; border-radius: 8px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px;">${location.icon || '📍'}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = window.L.marker([location.lat, location.lng], { icon: locationIcon })
          .addTo(map);

        marker.bindPopup(`
          <div style="text-align: center; min-width: 180px;">
            <strong style="font-size: 13px;">${location.name}</strong><br/>
            <span style="color: #666; font-size: 11px;">📍 ${location.address}</span><br/>
            ${location.phone ? `<span style="color: #666; font-size: 11px;">📞 ${location.phone}</span><br/>` : ''}
            ${location.hours ? `<span style="color: #666; font-size: 11px;">🕐 ${location.hours}</span><br/>` : ''}
            <span style="color: #22c55e; font-size: 12px; font-weight: bold;">${location.distance} km</span>
          </div>
        `);

        marker.on('click', () => {
          setSelectedLocation(location);
          setSelectedHelper(null);
        });

        markersRef.current.push(marker);
      });
    }

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

  const openGoogleMaps = (location) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`, '_blank');
  };

  const totalResults = (viewMode === 'all' ? nearbyHelpers.length + helpLocations.length : 
                       viewMode === 'helpers' ? nearbyHelpers.length : helpLocations.length);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-6 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <MapPin size={28} />
            Ajuda Próxima
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Encontre voluntários e locais de ajuda perto de você
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl">
          {/* View Mode Toggle */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                viewMode === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🌐 Todos
            </button>
            <button
              onClick={() => setViewMode('helpers')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                viewMode === 'helpers' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🤝 Voluntários ({nearbyHelpers.length})
            </button>
            <button
              onClick={() => setViewMode('locations')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                viewMode === 'locations' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🏢 Locais de Ajuda ({helpLocations.length})
            </button>
          </div>

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
              onClick={() => {
                fetchNearbyHelpers();
                fetchHelpLocations();
              }}
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

      <div className="container mx-auto max-w-4xl px-2 sm:px-4 py-4">
        {/* Map - Sempre visível no topo */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-4">
          {loadingLocation ? (
            <div className="h-[300px] sm:h-[350px] flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Loader2 size={32} className="animate-spin text-primary mx-auto mb-2" />
                <p className="text-gray-600">Obtendo sua localização...</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} className="h-[300px] sm:h-[350px] w-full" style={{ minHeight: '300px' }} />
          )}
          
          {/* Map Legend */}
          <div className="p-3 bg-gray-50 border-t">
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                <span>Você</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow"></div>
                <span>Voluntários</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-green-500 border-2 border-white shadow"></div>
                <span>Locais de Ajuda</span>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-textPrimary">
                {loading ? 'Buscando...' : `${totalResults} resultado${totalResults !== 1 ? 's' : ''} encontrado${totalResults !== 1 ? 's' : ''}`}
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 size={32} className="animate-spin text-primary mx-auto" />
              </div>
            ) : totalResults === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border">
                <MapPin size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Nenhum resultado encontrado nesta área</p>
                <p className="text-sm text-gray-400 mt-1">Tente aumentar o raio de busca</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {/* Help Locations */}
                {(viewMode === 'all' || viewMode === 'locations') && helpLocations.map(location => (
                  <div
                    key={location.id}
                    className={`bg-white rounded-2xl p-4 border-2 transition-all cursor-pointer ${
                      selectedLocation?.id === location.id ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-gray-200'
                    }`}
                    onClick={() => {
                      setSelectedLocation(location);
                      setSelectedHelper(null);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                        style={{ backgroundColor: CATEGORY_COLORS[location.category] + '20' }}
                      >
                        {location.icon || '📍'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-textPrimary text-sm truncate">{location.name}</h3>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                            {location.distance} km
                          </span>
                        </div>
                        <p className="text-xs text-textSecondary mt-1 truncate">
                          📍 {location.address}
                        </p>
                        {location.hours && (
                          <p className="text-xs text-textSecondary mt-0.5 truncate">
                            🕐 {location.hours}
                          </p>
                        )}
                        <span 
                          className="inline-block text-xs px-2 py-0.5 rounded-full mt-2"
                          style={{ 
                            backgroundColor: CATEGORY_COLORS[location.category] + '20',
                            color: CATEGORY_COLORS[location.category]
                          }}
                        >
                          {getCategoryInfo(location.category).icon} {getCategoryInfo(location.category).label}
                        </span>
                      </div>
                    </div>
                    
                    {selectedLocation?.id === location.id && (
                      <div className="mt-3 pt-3 border-t flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            openGoogleMaps(location);
                          }}
                          size="sm"
                          className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600"
                        >
                          <Navigation size={16} className="mr-1" />
                          Como Chegar
                        </Button>
                        {location.phone && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${location.phone}`);
                            }}
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                          >
                            <Phone size={16} />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Helpers */}
                {(viewMode === 'all' || viewMode === 'helpers') && nearbyHelpers.map(helper => (
                  <div
                    key={helper.id}
                    className={`bg-white rounded-2xl p-4 border-2 transition-all cursor-pointer ${
                      selectedHelper?.id === helper.id ? 'border-orange-500 shadow-lg' : 'border-transparent hover:border-gray-200'
                    }`}
                    onClick={() => {
                      setSelectedHelper(helper);
                      setSelectedLocation(null);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
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
                          {helper.role === 'volunteer' ? '🤝 Voluntário Profissional' : '🤝 Ajudante'}
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
                          className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600"
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
