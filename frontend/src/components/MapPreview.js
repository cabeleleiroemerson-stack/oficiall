import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

export default function MapPreview({ location, size = 'medium' }) {
  if (!location || !location.lat || !location.lng) return null;

  const { lat, lng, address } = location;
  
  // URLs do Google Maps
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${lat},${lng}&zoom=15`;
  const directUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  
  const sizeClasses = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64'
  };

  return (
    <div className="w-full space-y-2">
      <div className={`${sizeClasses[size] || sizeClasses.medium} rounded-2xl overflow-hidden border-2 border-blue-200 relative`}>
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={embedUrl}
          allowFullScreen
          loading="lazy"
        />
      </div>
      
      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MapPin size={16} className="text-primary flex-shrink-0" />
          <span className="text-sm text-textSecondary truncate">
            {address || 'Localização compartilhada'}
          </span>
        </div>
        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:text-primary-hover text-sm font-medium whitespace-nowrap ml-2"
        >
          Abrir Mapa
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
