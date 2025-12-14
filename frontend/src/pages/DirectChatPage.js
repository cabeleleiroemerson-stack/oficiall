import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Send, User, MapPin, Image as ImageIcon, Video, Paperclip, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function DirectChatPage() {
  const { userId } = useParams();
  const { user: currentUser, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [canChat, setCanChat] = useState(true);
  const [chatRestrictionReason, setChatRestrictionReason] = useState('');
  const messagesEndRef = useRef(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    fetchOtherUser();
    checkCanChat();
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchOtherUser = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOtherUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const checkCanChat = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/can-chat/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCanChat(data.can_chat);
        if (!data.can_chat) {
          setChatRestrictionReason(data.reason);
        }
      }
    } catch (error) {
      console.error('Error checking chat permission:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageData = {}) => {
    if (!input.trim() && !messageData.location && !messageData.media) return;

    setSending(true);
    try {
      const payload = {
        to_user_id: userId,
        message: input || (messageData.location ? '📍 Localização compartilhada' : '📎 Mídia compartilhada'),
        ...messageData
      };

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setInput('');
        setShowMediaOptions(false);
        fetchMessages();
      } else {
        toast.error('Erro ao enviar mensagem');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setSending(false);
    }
  };

  const sendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendMessage({
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          });
          toast.success('Localização enviada!');
        },
        () => toast.error('Erro ao obter localização')
      );
    }
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10000000) {
        toast.error('Arquivo muito grande! Máximo 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        sendMessage({
          media: [reader.result],
          media_type: type
        });
        toast.success(`${type === 'image' ? 'Foto' : 'Vídeo'} enviado!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="direct-chat-page">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 glassmorphism">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="p-2 hover:bg-gray-100 rounded-full transition-all"
              data-testid="back-button"
            >
              <ArrowLeft size={24} />
            </button>
            {otherUser && (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-heading font-bold text-textPrimary" data-testid="other-user-name">
                    {otherUser.name}
                  </h1>
                  <p className="text-sm text-textMuted capitalize">{otherUser.role}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-4">
          {!canChat ? (
            <div className="text-center py-12" data-testid="chat-restricted">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 max-w-md mx-auto">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={32} className="text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-yellow-800 mb-2">Chat Restrito</h3>
                <p className="text-yellow-700 text-sm mb-4">
                  Você não pode conversar com este usuário porque não se comprometeu a ajudar nas categorias de necessidades que ele postou.
                </p>
                <p className="text-yellow-600 text-xs">
                  Para conversar, atualize seu perfil e adicione mais categorias de ajuda.
                </p>
                <Button
                  onClick={() => navigate('/profile')}
                  className="mt-4 rounded-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Atualizar Perfil
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-12 text-textMuted">Carregando mensagens...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-textMuted" data-testid="no-messages">
              Nenhuma mensagem ainda. Comece a conversa!
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isCurrentUser = msg.from_user_id === currentUser.id;
              return (
                <div 
                  key={idx}
                  data-testid={`message-${isCurrentUser ? 'sent' : 'received'}`}
                  className={`flex gap-3 animate-fade-in ${
                    isCurrentUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isCurrentUser && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={18} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${
                    isCurrentUser ? 'chat-bubble-user' : 'chat-bubble-ai'
                  }`}>
                    <div className="px-4 py-3">
                      {msg.location && (
                        <div className="mb-2 p-2 bg-white/20 rounded-lg flex items-center gap-2">
                          <MapPin size={16} />
                          <a 
                            href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm underline"
                          >
                            Ver no mapa
                          </a>
                        </div>
                      )}
                      {msg.media && msg.media.length > 0 && (
                        <div className="mb-2">
                          {msg.media_type === 'image' ? (
                            <img src={msg.media[0]} alt="" className="rounded-lg max-w-full max-h-64 object-cover" />
                          ) : (
                            <video src={msg.media[0]} controls className="rounded-lg max-w-full max-h-64" />
                          )}
                        </div>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {isCurrentUser && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={18} className="text-white" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {canChat && (
        <div className="border-t border-gray-100 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            {showMediaOptions && (
              <div className="flex gap-2 mb-3 p-3 bg-gray-50 rounded-2xl">
                <Button
                  data-testid="send-location-button"
                  onClick={sendLocation}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                >
                  <MapPin size={18} className="mr-2" />
                  Localização
                </Button>
                <Button
                  data-testid="send-image-button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                >
                  <ImageIcon size={18} className="mr-2" />
                  Foto
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  className="hidden"
                />
                <Button
                  data-testid="send-video-button"
                  onClick={() => videoInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                >
                  <Video size={18} className="mr-2" />
                  Vídeo
                </Button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, 'video')}
                  className="hidden"
                />
              </div>
            )}
            <div className="flex gap-3">
              <Button
                data-testid="toggle-media-button"
                onClick={() => setShowMediaOptions(!showMediaOptions)}
                variant="outline"
                className="rounded-full w-12 h-12 p-0 flex-shrink-0"
              >
                <Paperclip size={20} />
              </Button>
              <Textarea
                data-testid="message-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                rows={1}
              className="rounded-2xl resize-none"
            />
            <Button
              data-testid="send-message-button"
              onClick={() => sendMessage()}
              disabled={sending || !input.trim()}
              className="rounded-full w-12 h-12 p-0 bg-primary hover:bg-primary-hover flex-shrink-0"
            >
              <Send size={20} />
            </Button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
