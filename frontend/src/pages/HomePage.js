import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import BottomNav from '../components/BottomNav';
import { Plus, MapPin, User, Clock, MessageCircle, Image as ImageIcon, MessageSquare, Send, X, Filter, Info, ExternalLink, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const RESOURCES_INFO = {
  work: {
    icon: '💼',
    title: 'Recursos para Emprego',
    items: [
      { name: 'France Travail', desc: 'Serviço público para encontrar emprego', link: 'https://www.francetravail.fr' },
      { name: 'ENIC-NARIC', desc: 'Reconhecimento de diplomas', link: 'https://www.france-education-international.fr' },
      { name: 'Mission Locale', desc: 'Para jovens 16-25 anos' }
    ]
  },
  housing: {
    icon: '🏠',
    title: 'Recursos para Moradia',
    items: [
      { name: 'SAMU Social - 115', desc: 'Emergência 24/7 gratuito', urgent: true },
      { name: 'Logement Social (HLM)', desc: 'Aluguel adaptado aos rendimentos', link: 'https://www.demande-logement-social.gouv.fr' },
      { name: 'France Terre d\'Asile', desc: '24 Rue Marc Seguin, 75018 Paris • 01 53 04 39 99' }
    ]
  },
  legal: {
    icon: '⚖️',
    title: 'Assistência Jurídica',
    items: [
      { name: 'La Cimade', desc: 'Assistência jurídica gratuita • 176 Rue de Grenelle, 75007 Paris' },
      { name: 'GISTI', desc: 'Direitos dos estrangeiros • 3 Villa Marcès, 75011 Paris' },
      { name: 'OFPRA', desc: 'Asilo e proteção' }
    ]
  },
  health: {
    icon: '🏥',
    title: 'Recursos de Saúde',
    items: [
      { name: 'SAMU - 15', desc: 'Emergências médicas', urgent: true },
      { name: 'PASS', desc: 'Atendimento gratuito • Hôpital Saint-Louis' },
      { name: 'AME', desc: 'Cobertura de saúde gratuita' }
    ]
  },
  food: {
    icon: '🍽️',
    title: 'Alimentação',
    items: [
      { name: 'Restaurants du Cœur', desc: 'Refeições gratuitas • 42 Rue Championnet, 75018' },
      { name: 'Secours Catholique', desc: 'Distribuição de alimentos • 15 Rue de Maubeuge, 75009' },
      { name: 'Croix-Rouge', desc: 'Alimentos e produtos básicos' }
    ]
  },
  education: {
    icon: '📚',
    title: 'Educação',
    items: [
      { name: 'CASNAV', desc: 'Escolarização de crianças • 12 Boulevard d\'Indochine, 75019' },
      { name: 'Universidades', desc: 'Programas especiais para refugiados' },
      { name: 'ENIC-NARIC', desc: 'Validação de diplomas' }
    ]
  },
  social: {
    icon: '🤝',
    title: 'Apoio Social',
    items: [
      { name: 'Emmaüs Solidarité', desc: 'Apoio social • 4 Rue des Amandiers, 75020' },
      { name: 'CAF', desc: 'Ajuda financeira', link: 'https://www.caf.fr' },
      { name: 'France Bénévolat', desc: 'Voluntariado' }
    ]
  },
  clothes: {
    icon: '👕',
    title: 'Roupas',
    items: [
      { name: 'Croix-Rouge Vestiaire', desc: 'Roupas gratuitas • 43 Rue de Valmy, 93100' },
      { name: 'Emmaüs', desc: 'Roupas e calçados a preços baixos' },
      { name: 'Secours Catholique', desc: 'Vestiários sociais' }
    ]
  },
  furniture: {
    icon: '🪑',
    title: 'Móveis',
    items: [
      { name: 'Emmaüs', desc: 'Móveis acessíveis' },
      { name: 'Ressourceries', desc: 'Móveis de segunda mão' },
      { name: 'Donnons.org', desc: 'Doações online', link: 'https://donnons.org' }
    ]
  },
  transport: {
    icon: '🚗',
    title: 'Transporte',
    items: [
      { name: 'Navigo', desc: 'Tarifas reduzidas disponíveis' },
      { name: 'Mob\'In France', desc: 'Formação para carteira de motorista' },
      { name: 'Vélib\'', desc: 'Bicicletas públicas' }
    ]
  }
};

export default function HomePage() {
  const { user, token } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [selectedResourceCategory, setSelectedResourceCategory] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [newPost, setNewPost] = useState({
    type: user?.role === 'migrant' ? 'need' : 'offer',
    category: 'food',
    title: '',
    description: '',
    images: [],
    location: null
  });
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [commentingOn, setCommentingOn] = useState(null);
  const [advertisements, setAdvertisements] = useState([]);

  const categories = [
    { value: 'food', label: t('food'), color: 'bg-green-100 text-green-700 border-green-200', icon: '🍽️' },
    { value: 'legal', label: t('legal'), color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '⚖️' },
    { value: 'health', label: t('health'), color: 'bg-red-100 text-red-700 border-red-200', icon: '🏥' },
    { value: 'housing', label: t('housing'), color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🏠' },
    { value: 'work', label: t('work'), color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '💼' },
    { value: 'education', label: t('education'), color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '📚' },
    { value: 'social', label: t('social'), color: 'bg-pink-100 text-pink-700 border-pink-200', icon: '🤝' },
    { value: 'clothes', label: 'Roupas', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '👕' },
    { value: 'furniture', label: 'Móveis', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: '🪑' },
    { value: 'transport', label: 'Transporte', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: '🚗' }
  ];

  useEffect(() => {
    fetchPosts();
    fetchAdvertisements();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, categoryFilter, typeFilter]);

  const fetchAdvertisements = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/sidebar-content`);
      if (response.ok) {
        const data = await response.json();
        setAdvertisements(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching sidebar content:', error);
      // Fallback para anúncios simples
      try {
        const fallbackResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/advertisements`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setAdvertisements(fallbackData);
        }
      } catch (e) {
        console.error('Fallback also failed:', e);
      }
    }
  };

  const filterPosts = () => {
    let filtered = posts;
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === typeFilter);
    }
    
    setFilteredPosts(filtered);
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/posts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data.filter(p => !p.is_auto_response));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.title || !newPost.description) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
      });

      if (response.ok) {
        toast.success('Post criado!');
        if (newPost.type === 'need') {
          toast.info('📩 Verifique suas mensagens para recursos úteis!', { duration: 5000 });
        }
        setShowCreatePost(false);
        setNewPost({ type: user?.role === 'migrant' ? 'need' : 'offer', category: 'food', title: '', description: '', images: [], location: null });
        fetchPosts();
      }
    } catch (error) {
      toast.error('Erro ao criar post');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error('Imagem muito grande! Máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPost({...newPost, images: [...(newPost.images || []), reader.result]});
        toast.success('Foto adicionada!');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => {
    const newImages = newPost.images.filter((_, idx) => idx !== index);
    setNewPost({...newPost, images: newImages});
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      toast.info('Obtendo localização...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewPost({
            ...newPost,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Localização atual'
            }
          });
          toast.success('Localização adicionada!');
        },
        (error) => {
          console.error('Geolocation error:', error);
          if (error.code === 1) {
            toast.error('Permissão de localização negada. Ative nas configurações do navegador.');
          } else if (error.code === 2) {
            toast.error('Localização indisponível. Verifique sua conexão.');
          } else if (error.code === 3) {
            toast.error('Tempo esgotado ao obter localização. Tente novamente.');
          } else {
            toast.error('Erro ao obter localização. Tente novamente.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      toast.error('Seu navegador não suporta geolocalização');
    }
  };

  const fetchComments = async (postId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/posts/${postId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setComments(prev => ({...prev, [postId]: data}));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const toggleComments = (postId) => {
    const isShowing = showComments[postId];
    setShowComments(prev => ({...prev, [postId]: !isShowing}));
    if (!isShowing && !comments[postId]) {
      fetchComments(postId);
    }
  };

  const addComment = async (postId) => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: newComment })
      });

      if (response.ok) {
        setNewComment('');
        setCommentingOn(null);
        fetchComments(postId);
        toast.success('Comentário adicionado!');
      }
    } catch (error) {
      toast.error('Erro ao adicionar comentário');
    }
  };

  const openResourcesModal = (category) => {
    setSelectedResourceCategory(category);
    setShowResourcesModal(true);
  };

  const getCategoryStyle = (category) => {
    return categories.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-700';
  };

  const getCategoryIcon = (category) => {
    return categories.find(c => c.value === category)?.icon || '📝';
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="home-page">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 glassmorphism">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-heading font-bold text-textPrimary mb-4">Feed</h1>
          
          <div className="flex gap-3 overflow-x-auto pb-2">
            <Button
              onClick={() => setCategoryFilter('all')}
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full whitespace-nowrap ${categoryFilter === 'all' ? 'bg-primary text-white' : ''}`}
            >
              <Filter size={16} className="mr-1" />
              Todos
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                variant={categoryFilter === cat.value ? 'default' : 'outline'}
                size="sm"
                className={`rounded-full whitespace-nowrap ${categoryFilter === cat.value ? 'bg-primary text-white' : ''}`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => setTypeFilter('all')}
              variant={typeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full ${typeFilter === 'all' ? 'bg-primary text-white' : ''}`}
            >
              Todos
            </Button>
            <Button
              onClick={() => setTypeFilter('need')}
              variant={typeFilter === 'need' ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full ${typeFilter === 'need' ? 'bg-green-600 text-white' : ''}`}
            >
              Precisa de Ajuda
            </Button>
            <Button
              onClick={() => setTypeFilter('offer')}
              variant={typeFilter === 'offer' ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full ${typeFilter === 'offer' ? 'bg-primary text-white' : ''}`}
            >
              Oferece Ajuda
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl overflow-x-hidden">
        <div className="flex gap-4">
          {/* Sidebar Esquerda - Anúncios e Vagas (visível apenas em desktop) */}
          <div className="hidden lg:block w-80 flex-shrink-0 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto scroll-container pr-2">
            {/* Header da Sidebar */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-4 shadow-lg">
              <h3 className="font-bold text-sm">📢 Oportunidades & Inspiração</h3>
              <p className="text-xs text-white/80 mt-1">Vagas de emprego e mensagens para você</p>
            </div>

            {/* Renderizar todos os itens da sidebar */}
            {advertisements.map((item, idx) => {
              // Vaga de Emprego
              if (item.type === 'job' || item.item_type === 'job') {
                return (
                  <div key={item.id || idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md overflow-hidden border-2 border-blue-200 hover:border-blue-400 transition-all">
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="w-full h-28 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-1 bg-blue-600 text-white rounded-full">💼 VAGA</span>
                        {item.source && (
                          <span className="text-xs text-blue-600">{item.source}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-textPrimary mb-1 line-clamp-2">{item.title}</h3>
                      <p className="text-xs text-textSecondary mb-3">{item.content}</p>
                      {item.link_url && (
                        <a 
                          href={item.link_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors"
                        >
                          {item.link_text || 'Ver Vaga'} →
                        </a>
                      )}
                    </div>
                  </div>
                );
              }
              
              // Anúncio de Doação
              if (item.type === 'donation') {
                return (
                  <div key={item.id || idx} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-md overflow-hidden border-2 border-orange-200">
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="w-full h-36 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-1 bg-orange-500 text-white rounded-full">❤️ DOAÇÃO</span>
                      </div>
                      <h3 className="font-bold text-sm text-textPrimary mb-2">{item.title}</h3>
                      <p className="text-xs text-textSecondary leading-relaxed mb-3">{item.content}</p>
                      {item.link_url && (
                        <a 
                          href={item.link_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block w-full text-center py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors"
                        >
                          {item.link_text || 'Doar Agora'} →
                        </a>
                      )}
                    </div>
                  </div>
                );
              }
              
              // Mensagem de Motivação
              if (item.type === 'motivation') {
                return (
                  <div key={item.id || idx} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="w-full h-28 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-sm text-textPrimary mb-2">{item.title}</h3>
                      <p className="text-xs text-textSecondary leading-relaxed">{item.content}</p>
                    </div>
                  </div>
                );
              }

              // Patrocinado
              return (
                <div key={item.id || idx} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-md overflow-hidden border border-purple-200">
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.title} 
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-1 bg-purple-500 text-white rounded-full">📢 PATROCINADO</span>
                    </div>
                    <h3 className="font-bold text-sm text-textPrimary mb-2">{item.title}</h3>
                    <p className="text-xs text-textSecondary leading-relaxed mb-3">{item.content}</p>
                    {item.link_url && (
                      <a 
                        href={item.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-full text-center py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-sm transition-colors"
                      >
                        {item.link_text || 'Saiba Mais'} →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Link para mais vagas */}
            <a 
              href="https://rozgarline.me/jobs/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-4 text-center hover:shadow-lg transition-all"
            >
              <span className="font-bold">🔍 Ver Todas as Vagas</span>
              <p className="text-xs text-white/80 mt-1">Acesse RozgarLine para mais oportunidades</p>
            </a>
          </div>

          {/* Conteúdo Principal - Feed */}
          <div className="flex-1 max-w-2xl mx-auto">
        <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
          <DialogTrigger asChild>
            <Button 
              data-testid="create-post-button"
              className="w-full rounded-full py-6 mb-6 bg-primary hover:bg-primary-hover text-white font-bold shadow-lg"
            >
              <Plus size={20} className="mr-2" />
              {user?.role === 'migrant' ? 'Preciso de Ajuda' : 'Oferecer Ajuda'}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-w-2xl max-h-[85vh] flex flex-col" data-testid="create-post-dialog">
            <DialogHeader className="pb-4 border-b flex-shrink-0">
              <DialogTitle className="text-2xl font-heading">
                {newPost.type === 'need' ? '🆘 Preciso de Ajuda' : '🤝 Quero Ajudar'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para publicar
              </DialogDescription>
            </DialogHeader>
            <div 
              className="flex-1 overflow-y-scroll px-2 py-2 scroll-container" 
              style={{ 
                maxHeight: 'calc(85vh - 200px)',
                scrollbarWidth: 'thin',
                scrollbarColor: '#1CA9C9 #f1f1f1'
              }}
            >
              <div className="space-y-6 pr-2">
                {/* Categoria */}
                <div className="bg-gray-50 p-5 rounded-2xl">
                  <Label className="text-base font-bold mb-3 block">📂 Selecione a Categoria</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setNewPost({...newPost, category: cat.value})}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          newPost.category === cat.value
                            ? 'bg-primary text-white border-primary shadow-lg scale-105'
                            : 'bg-white border-gray-200 hover:border-primary hover:shadow-md'
                        }`}
                      >
                        <div className="text-2xl mb-2">{cat.icon}</div>
                        <div className={`font-bold text-sm ${newPost.category === cat.value ? 'text-white' : 'text-textPrimary'}`}>
                          {cat.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Título */}
                <div className="bg-white border-2 border-gray-200 p-5 rounded-2xl">
                  <Label className="text-base font-bold mb-3 block flex items-center gap-2">
                    <span className="text-2xl">✏️</span>
                    <span>Título do Pedido</span>
                  </Label>
                  <Input
                    data-testid="post-title-input"
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    placeholder="Ex: Preciso de roupas de inverno"
                    className="rounded-xl h-12 text-base"
                  />
                  <p className="text-xs text-textMuted mt-2">Seja claro e específico</p>
                </div>
                
                {/* Descrição */}
                <div className="bg-white border-2 border-gray-200 p-5 rounded-2xl">
                  <Label className="text-base font-bold mb-3 block flex items-center gap-2">
                    <span className="text-2xl">📝</span>
                    <span>Detalhes</span>
                  </Label>
                  <Textarea
                    data-testid="post-description-input"
                    value={newPost.description}
                    onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                    rows={5}
                    placeholder="Descreva em detalhes: tamanhos, quantidades, quando precisa, etc..."
                    className="rounded-xl text-base"
                  />
                  <p className="text-xs text-textMuted mt-2">Quanto mais detalhes, melhor!</p>
                </div>

                {/* Mídia e Localização */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-5 rounded-2xl space-y-4">
                  <Label className="text-base font-bold block flex items-center gap-2">
                    <span className="text-2xl">📎</span>
                    <span>Adicionar Mais Informações (Opcional)</span>
                  </Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      type="button"
                      data-testid="add-image-button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="h-14 rounded-xl border-2 bg-white hover:bg-blue-50 hover:border-primary"
                    >
                      <ImageIcon size={20} className="mr-2" />
                      <span className="font-bold">Adicionar Fotos</span>
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      data-testid="add-location-button"
                      onClick={getLocation}
                      variant="outline"
                      className="h-14 rounded-xl border-2 bg-white hover:bg-blue-50 hover:border-primary"
                    >
                      <MapPin size={20} className="mr-2" />
                      <span className="font-bold">Localização</span>
                    </Button>
                  </div>

                  {newPost.images && newPost.images.length > 0 && (
                    <div className="bg-white p-3 rounded-xl">
                      <p className="text-sm font-bold text-textPrimary mb-3">Fotos adicionadas:</p>
                      <div className="flex gap-2 flex-wrap">
                        {newPost.images.map((img, idx) => (
                          <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 group">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {newPost.location && (
                    <div className="p-4 bg-green-100 rounded-xl flex items-center gap-3 border-2 border-green-300">
                      <div className="bg-green-500 p-2 rounded-full">
                        <MapPin size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-800">Localização adicionada</p>
                        <p className="text-xs text-green-700">Sua localização será compartilhada</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 px-1 flex-shrink-0 bg-white">
              <Button 
                data-testid="submit-post-button"
                onClick={createPost} 
                className="w-full rounded-full py-6 text-lg font-bold bg-primary hover:bg-primary-hover shadow-lg"
              >
                📢 Publicar Agora
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Recursos */}
        <Dialog open={showResourcesModal} onOpenChange={setShowResourcesModal}>
          <DialogContent className="rounded-3xl max-w-2xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading flex items-center gap-2">
                {selectedResourceCategory && RESOURCES_INFO[selectedResourceCategory]?.icon}
                {selectedResourceCategory && RESOURCES_INFO[selectedResourceCategory]?.title}
              </DialogTitle>
              <DialogDescription>
                Organizações e serviços que podem ajudar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-140px)]">
              {selectedResourceCategory && RESOURCES_INFO[selectedResourceCategory]?.items.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border-2 ${item.urgent ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-textPrimary">{item.name}</h3>
                    {item.urgent && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        URGENTE
                      </span>
                    )}
                  </div>
                  <p className="text-textSecondary mb-2">{item.desc}</p>
                  {item.link && (
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary font-medium hover:underline"
                    >
                      <ExternalLink size={16} />
                      Acessar site
                    </a>
                  )}
                </div>
              ))}
              <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <p className="text-sm text-textSecondary">
                  <strong>💡 Dica:</strong> Visite{' '}
                  <a href="https://refugies.info" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Refugies.info
                  </a>{' '}
                  para mais recursos e informações atualizadas.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="text-center py-12 text-textMuted">Carregando...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-textMuted" data-testid="no-posts-message">
            {categoryFilter !== 'all' || typeFilter !== 'all' ? 'Nenhum post encontrado com esses filtros.' : 'Nenhum post ainda. Seja o primeiro!'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div 
                key={post.id} 
                data-testid="post-card"
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card card-hover overflow-hidden"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-textPrimary">{post.user?.name}</p>
                      <p className="text-sm text-textMuted capitalize">{post.user?.role}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryStyle(post.category)} flex items-center gap-1`}>
                    <span>{getCategoryIcon(post.category)}</span>
                    {categories.find(c => c.value === post.category)?.label}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-textPrimary mb-2 break-words">{post.title}</h3>
                <p className="text-sm sm:text-base text-textSecondary mb-3 leading-relaxed break-words">{post.description}</p>

                {post.images && post.images.length > 0 && (
                  <div className={`mb-3 ${post.images.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
                    {post.images.map((img, idx) => (
                      <div key={idx} className={`${post.images.length === 1 ? 'w-full' : ''} rounded-2xl overflow-hidden bg-gray-100`}>
                        <img 
                          src={img} 
                          alt="" 
                          className={`w-full ${post.images.length === 1 ? 'max-h-[500px] object-contain' : 'h-48 object-cover'} rounded-2xl`}
                          onClick={() => window.open(img, '_blank')}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {post.location && (
                  <div className="flex items-center gap-2 text-sm text-textMuted mb-3 p-2 bg-blue-50 rounded-lg">
                    <MapPin size={16} className="text-primary" />
                    <span>{post.location.address || 'Localização disponível'}</span>
                  </div>
                )}

                {/* Info do Post - Mobile Friendly */}
                <div className="border-t pt-3 mt-3 space-y-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-textMuted flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(post.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {post.type === 'need' && (
                      <span className="text-green-600 font-medium text-xs">Precisa de ajuda</span>
                    )}
                    {post.type === 'offer' && (
                      <span className="text-primary font-medium text-xs">Oferece ajuda</span>
                    )}
                  </div>
                  
                  {/* Botões em Grid Responsivo */}
                  <div className="grid grid-cols-2 sm:flex gap-2">
                    {post.type === 'need' && (
                      <Button
                        onClick={() => openResourcesModal(post.category)}
                        size="sm"
                        variant="outline"
                        className="rounded-full border-primary text-primary hover:bg-primary hover:text-white text-xs sm:text-sm px-3 py-2 w-full sm:w-auto"
                      >
                        <Info size={14} className="sm:mr-1" />
                        <span className="hidden sm:inline ml-1">Ver Recursos</span>
                        <span className="sm:hidden ml-1">Recursos</span>
                      </Button>
                    )}
                    <Button
                      onClick={() => toggleComments(post.id)}
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs sm:text-sm px-3 py-2 w-full sm:w-auto"
                    >
                      <MessageSquare size={14} className="sm:mr-1" />
                      <span className="ml-1">{showComments[post.id] ? 'Ocultar' : 'Comentários'}</span>
                    </Button>
                    {post.user_id !== user.id && post.can_help && (
                      <Button
                        onClick={() => navigate(`/direct-chat/${post.user_id}`)}
                        size="sm"
                        className="rounded-full bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm px-3 py-2 w-full sm:w-auto col-span-2 sm:col-span-1"
                      >
                        <MessageCircle size={14} className="sm:mr-1" />
                        <span className="ml-1">Conversar</span>
                      </Button>
                    )}
                  </div>
                </div>

                {showComments[post.id] && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    {comments[post.id] && comments[post.id].length > 0 ? (
                      comments[post.id].map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-2xl">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-textPrimary">{comment.user?.name}</p>
                            <p className="text-sm text-textSecondary">{comment.comment}</p>
                            <p className="text-xs text-textMuted mt-1">
                              {new Date(comment.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-textMuted text-center py-2">Nenhum comentário ainda</p>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Input
                        placeholder="Escreva um comentário..."
                        value={commentingOn === post.id ? newComment : ''}
                        onChange={(e) => {
                          setCommentingOn(post.id);
                          setNewComment(e.target.value);
                        }}
                        className="rounded-full"
                        data-testid="comment-input"
                      />
                      <Button
                        onClick={() => addComment(post.id)}
                        disabled={!newComment.trim()}
                        size="sm"
                        className="rounded-full bg-primary hover:bg-primary-hover text-white"
                        data-testid="submit-comment-button"
                      >
                        <Send size={16} />
                      </Button>
                    </div>
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
