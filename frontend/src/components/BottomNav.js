import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Search, User, Settings, Users } from 'lucide-react';
import { AuthContext } from '../App';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const navItems = [
    { icon: Home, label: 'Home', path: '/home', testId: 'nav-home' },
    { icon: Users, label: 'Voluntários', path: '/volunteers', testId: 'nav-volunteers' },
    { icon: MessageCircle, label: 'Chat AI', path: '/chat', testId: 'nav-chat' },
    { icon: Search, label: 'Serviços', path: '/services', testId: 'nav-services' },
    { icon: User, label: 'Perfil', path: '/profile', testId: 'nav-profile' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ icon: Settings, label: 'Admin', path: '/admin', testId: 'nav-admin' });
  }

  return (
    <div className="bottom-nav h-16 flex items-center justify-around px-4" data-testid="bottom-navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            data-testid={item.testId}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all ${
              isActive
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
