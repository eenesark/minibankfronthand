import React, { useState, useRef, useEffect } from 'react';
import './AssistantWidget.css';
import { useAssistant } from '../../../MiniBank.Application';

/**
 * MiniBank Akıllı Asistan (Ugi Benzeri) Arayüz Bileşeni
 * - Garanti BBVA Ugi tarzı sesli ve metin tabanlı akıllı bankacılık
 * - Otomatik sayfa yönlendirme ve parametre uygulama desteği
 */
export default function AssistantWidget({ onNavigate, currentPage = '/dashboard' }) {
  const {
    isOpen,
    toggleOpen,
    setIsOpen,
    messages,
    loading,
    sendMessage,
    isListening,
    startListening,
    stopListening,
    isVoiceEnabled,
    toggleVoice
  } = useAssistant(currentPage);

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Otomatik aşağı kaydırma
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Mesaj Gönderme
  const handleSend = (textToSend = null) => {
    const text = typeof textToSend === 'string' ? textToSend : inputText;
    if (!text || !text.trim() || loading) return;

    sendMessage(text, (actionData) => {
      if (actionData.action === 'NAVIGATE' && actionData.route && onNavigate) {
        onNavigate(actionData.route, actionData.parameters);
      }
    });

    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Sesli Komut (Mikrofon)
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((actionData) => {
        if (actionData.action === 'NAVIGATE' && actionData.route && onNavigate) {
          onNavigate(actionData.route, actionData.parameters);
        }
      });
    }
  };

  // Eylem Butonuna Tıklama (Navigate)
  const handleActionClick = (route, parameters) => {
    if (onNavigate && route) {
      onNavigate(route, parameters);
    }
  };

  return (
    <div className="ugi-fab-container">
      {/* 1. SOHBET PENCERESİ */}
      {isOpen && (
        <div className="ugi-chat-window">
          {/* Başlık (Header) */}
          <div className="ugi-header">
            <div className="ugi-header-info">
              <div className="ugi-avatar">
                <i className="fa-solid fa-robot"></i>
                <span className="ugi-avatar-online"></span>
              </div>
              <div>
                <div className="ugi-title-text">
                  MiniBank Asistan
                  <span className="ugi-tag">UGI</span>
                </div>
                <div className="ugi-subtitle-text">
                  <i className="fa-solid fa-sparkles" style={{ color: '#fbbf24', fontSize: '0.68rem' }}></i>
                  <span>Akıllı Bankacılık Asistanı</span>
                </div>
              </div>
            </div>

            <div className="ugi-header-actions">
              <button
                type="button"
                className="ugi-btn-icon"
                title={isVoiceEnabled ? 'Sesli Okumayı Kapat' : 'Sesli Okumayı Aç'}
                onClick={toggleVoice}
                style={{ color: isVoiceEnabled ? '#34d399' : '#9ca3af' }}
              >
                <i className={isVoiceEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark'}></i>
              </button>

              <button
                type="button"
                className="ugi-btn-icon"
                title="Pencereyi Kapat"
                onClick={() => setIsOpen(false)}
              >
                <i className="fa-solid fa-chevron-down"></i>
              </button>
            </div>
          </div>

          {/* Mesaj Listesi */}
          <div className="ugi-messages-area">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`ugi-message ${isUser ? 'ugi-message-user' : 'ugi-message-assistant'}`}
                >
                  {!isUser && (
                    <div className="ugi-avatar" style={{ width: '28px', height: '28px', fontSize: '0.8rem', flexShrink: 0 }}>
                      <i className="fa-solid fa-robot"></i>
                    </div>
                  )}

                  <div>
                    <div className="ugi-msg-bubble">
                      <p style={{ margin: 0 }}>{m.text}</p>

                      {/* Yönlendirme Eylemi Kartı */}
                      {m.action === 'NAVIGATE' && m.route && (
                        <div className="ugi-action-card">
                          <div style={{ fontSize: '0.74rem', color: '#c4b5fd' }}>
                            <i className="fa-solid fa-arrow-turn-down" style={{ marginRight: '0.35rem' }}></i>
                            İşlem Ekranına Git:
                          </div>
                          <button
                            type="button"
                            className="ugi-action-btn"
                            onClick={() => handleActionClick(m.route, m.parameters)}
                          >
                            <span>Aç</span>
                            <i className="fa-solid fa-chevron-right icon-small"></i>
                          </button>
                        </div>
                      )}

                      {/* Hızlı Öneri Butonları */}
                      {m.quickSuggestions && m.quickSuggestions.length > 0 && (
                        <div className="ugi-suggestions">
                          {m.quickSuggestions.map((sug, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="ugi-chip"
                              onClick={() => handleSend(sug)}
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ugi-msg-time">
                      {new Date(m.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Yazıyor Animasyonu */}
            {loading && (
              <div className="ugi-message ugi-message-assistant">
                <div className="ugi-avatar" style={{ width: '28px', height: '28px', fontSize: '0.8rem', flexShrink: 0 }}>
                  <i className="fa-solid fa-robot"></i>
                </div>
                <div className="ugi-msg-bubble ugi-typing">
                  <span className="ugi-dot"></span>
                  <span className="ugi-dot"></span>
                  <span className="ugi-dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Alt Giriş Barı */}
          <div className="ugi-footer">
            {isListening && (
              <div className="ugi-listening-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="ugi-listening-wave"></span>
                  <span>Sizi dinliyorum, lütfen konuşun...</span>
                </div>
                <button
                  type="button"
                  onClick={stopListening}
                  style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '0.7rem' }}
                >
                  Durdur
                </button>
              </div>
            )}

            <div className="ugi-input-group">
              <input
                type="text"
                className="ugi-input"
                placeholder="Örn: 500 TL transfer yap, döviz kurları..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />

              <button
                type="button"
                className={`ugi-btn-mic ${isListening ? 'ugi-btn-mic-active' : ''}`}
                title={isListening ? 'Dinlemeyi Durdur' : 'Sesli Konuş (Mikrofon)'}
                onClick={handleMicClick}
                disabled={loading}
              >
                <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
              </button>

              <button
                type="button"
                className="ugi-btn-send"
                title="Gönder"
                onClick={() => handleSend()}
                disabled={!inputText.trim() || loading}
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SABİT ASİSTAN AÇMA BUTONU (FAB) */}
      {!isOpen && (
        <div className="ugi-fab-badge" onClick={toggleOpen}>
          <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#fbbf24' }}></i>
          <span>Ugi'ye Sor ✨</span>
        </div>
      )}

      <button
        type="button"
        className="ugi-fab"
        onClick={toggleOpen}
        title="MiniBank Asistan (Ugi)"
      >
        <span className="ugi-fab-pulse"></span>
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-robot'}`}></i>
      </button>
    </div>
  );
}

