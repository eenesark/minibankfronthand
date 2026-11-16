import { useState, useCallback, useRef, useEffect } from 'react';
import { assistantService } from '../../MiniBank.Infrastructure';

/**
 * MiniBank Akıllı Asistan (Ugi Benzeri) Hook'u
 * - Doğal dil bankacılık chat yönetimi
 * - Sesli komut dinleme (Web Speech Recognition)
 * - Sesli yanıt okuma (SpeechSynthesis TTS)
 * - Sayfa yönlendirme ve parametre uygulama eylemleri
 */
export function useAssistant(initialCurrentPage = '/dashboard') {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  const [messages, setMessages] = useState([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: 'Merhaba! Ben MiniBank Asistan. Para transferi, döviz kurları veya hesap işlemlerinizde size nasıl yardımcı olabilirim?',
      action: 'INFO',
      route: null,
      quickSuggestions: ['Para Gönder', 'Döviz Kurları', 'Hesaplarım', 'Vadeli Mevduat'],
      timestamp: new Date()
    }
  ]);

  const recognitionRef = useRef(null);

  // Sesli Yanıt (Text-to-Speech)
  const speakReply = useCallback((text) => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel(); // Önceki okumayı durdur
      const cleanText = text.replace(/<[^>]*>?/gm, ''); // HTML temizle
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Türkçe ses seçimi
      const voices = window.speechSynthesis.getVoices();
      const trVoice = voices.find(v => v.lang.startsWith('tr'));
      if (trVoice) {
        utterance.voice = trVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Sesli okuma hatası:', e);
    }
  }, [isVoiceEnabled]);

  // Mesaj Gönderme
  const sendMessage = useCallback(async (userText, onActionCallback = null) => {
    const trimmed = (userText || '').trim();
    if (!trimmed || loading) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await assistantService.chat(trimmed, initialCurrentPage);

      const assistantMsg = {
        id: `ast_${Date.now()}`,
        sender: 'assistant',
        text: result.reply,
        action: result.action,
        route: result.route,
        parameters: result.parameters,
        quickSuggestions: result.quickSuggestions || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Sesli yanıt ver
      speakReply(result.reply);

      // Otomatik yönlendirme veya parametre eylemini tetikle
      if (onActionCallback && typeof onActionCallback === 'function') {
        onActionCallback({
          action: result.action,
          route: result.route,
          parameters: result.parameters,
          reply: result.reply
        });
      }
    } catch (err) {
      const errorMsg = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: err.message || 'Üzgünüm, şu an bağlantıda bir sorun oluştu. Lütfen tekrar dener misiniz?',
        action: 'INFO',
        route: null,
        quickSuggestions: ['Para Gönder', 'Hesaplarım', 'Döviz Kurları'],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading, initialCurrentPage, speakReply]);

  // Sesli Komut Dinleme (Microphone / STT)
  const startListening = useCallback((onActionCallback = null) => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tarayıcınız sesli komut özelliğini desteklemiyor. Google Chrome veya Microsoft Edge kullanabilirsiniz.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognition();
      rec.lang = 'tr-TR';
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          sendMessage(transcript, onActionCallback);
        }
      };

      rec.onerror = (event) => {
        console.warn('Ses tanıma hatası:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.warn('Mikrofon başlatılamadı:', e);
      setIsListening(false);
    }
  }, [sendMessage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Component unmount olduğunda ses sentezini temizle
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isOpen,
    setIsOpen,
    toggleOpen: () => setIsOpen(prev => !prev),
    messages,
    loading,
    sendMessage,
    isListening,
    startListening,
    stopListening,
    isVoiceEnabled,
    toggleVoice: () => {
      setIsVoiceEnabled(prev => {
        if (prev && typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        return !prev;
      });
    }
  };
}

