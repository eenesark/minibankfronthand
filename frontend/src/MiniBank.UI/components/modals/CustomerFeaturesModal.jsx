import React, { useState, useEffect } from 'react';
import './Modal.css';
import { featureService } from '../../../MiniBank.Infrastructure';

const FEATURE_ICONS = {
  TIME_DEPOSIT: { icon: 'fa-solid fa-piggy-bank', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  FX_EXCHANGE: { icon: 'fa-solid fa-arrow-right-arrow-left', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  FAST_TRANSFER: { icon: 'fa-solid fa-bolt', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  LOAN_APPLICATION: { icon: 'fa-solid fa-hand-holding-dollar', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  CRYPTO_TRADING: { icon: 'fa-solid fa-coins', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  VIP_CUSTOMER_SUPPORT: { icon: 'fa-solid fa-crown', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' }
};

export default function CustomerFeaturesModal({
  isOpen,
  onClose,
  customer,
  onShowToast
}) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    if (isOpen && customer?.id) {
      loadFeatures();
    }
  }, [isOpen, customer]);

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const data = await featureService.getCustomerFeatures(customer.id);
      setFeatures(Array.isArray(data) ? data : []);
    } catch (err) {
      onShowToast?.(err.message || 'Özellikler yüklenemedi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !customer) return null;

  // Toggle IsEnabled for a single feature locally
  const handleToggle = (featureKey) => {
    setFeatures(prev =>
      prev.map(f => (f.featureKey === featureKey ? { ...f, isEnabled: !f.isEnabled } : f))
    );
  };

  // Update CustomValue locally
  const handleCustomValueChange = (featureKey, val) => {
    setFeatures(prev =>
      prev.map(f => (f.featureKey === featureKey ? { ...f, customValue: val } : f))
    );
  };

  // Quick Action: Enable All
  const handleEnableAll = () => {
    setFeatures(prev => prev.map(f => ({ ...f, isEnabled: true })));
  };

  // Quick Action: Disable All
  const handleDisableAll = () => {
    setFeatures(prev => prev.map(f => ({ ...f, isEnabled: false })));
  };

  // Save all modified features to Backend (Bulk update)
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = features.map(f => ({
        featureKey: f.featureKey,
        isEnabled: Boolean(f.isEnabled),
        customValue: f.customValue ? String(f.customValue).trim() : null
      }));

      await featureService.bulkUpdateCustomerFeatures(customer.id, payload);
      onShowToast?.(`${customer.firstName} ${customer.lastName} için özellikler başarıyla güncellendi!`, 'success');
      onClose();
    } catch (err) {
      onShowToast?.(err.message || 'Özellikler kaydedilemedi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['ALL', ...new Set(features.map(f => f.category).filter(Boolean))];
  const displayedFeatures = filterCategory === 'ALL'
    ? features
    : features.filter(f => f.category === filterCategory);

  const activeCount = features.filter(f => f.isEnabled).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-content-lg"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
              <i className="fa-solid fa-sliders"></i>
            </div>
            <div>
              <h2 className="modal-title">Dinamik Özellik Yönetimi</h2>
              <p className="modal-subtitle">
                Müşteri: <strong style={{ color: '#f3f4f6' }}>{customer.firstName} {customer.lastName}</strong>
                {' '}(No: {customer.customerNumber} • TCKN: {customer.identityNumber})
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div style={{
          padding: '0.85rem 1.5rem',
          background: 'rgba(17, 24, 39, 0.6)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kategori:</span>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  border: filterCategory === cat ? '1px solid #8b5cf6' : '1px solid var(--border-color)',
                  background: filterCategory === cat ? 'rgba(139, 92, 246, 0.25)' : 'rgba(31, 41, 55, 0.4)',
                  color: filterCategory === cat ? '#c4b5fd' : 'var(--text-dim)',
                  cursor: 'pointer',
                  fontWeight: filterCategory === cat ? 700 : 500
                }}
              >
                {cat === 'ALL' ? 'Tümü' : cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontWeight: 600
            }}>
              {activeCount} / {features.length} Aktif
            </span>
            <button
              type="button"
              onClick={handleEnableAll}
              style={{
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Tümünü Aç
            </button>
            <button
              type="button"
              onClick={handleDisableAll}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '0.3rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Tümünü Kapat
            </button>
          </div>
        </div>

        {/* Feature List Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: '#8b5cf6', marginBottom: '0.75rem' }}></i>
              <p>Müşteri özellikleri yükleniyor...</p>
            </div>
          ) : displayedFeatures.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-muted)' }}>
              Özellik bulunamadı.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {displayedFeatures.map(f => {
                const iconInfo = FEATURE_ICONS[f.featureKey] || {
                  icon: 'fa-solid fa-cube',
                  color: '#9ca3af',
                  bg: 'rgba(156, 163, 175, 0.15)'
                };

                return (
                  <div
                    key={f.featureKey}
                    style={{
                      background: f.isEnabled ? 'rgba(31, 41, 55, 0.5)' : 'rgba(17, 24, 39, 0.4)',
                      border: f.isEnabled ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1rem',
                      transition: 'all 0.2s ease',
                      opacity: f.isEnabled ? 1 : 0.72
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      {/* Left: Icon & Title & Description */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1 }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: iconInfo.bg,
                          color: iconInfo.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.15rem',
                          flexShrink: 0
                        }}>
                          <i className={iconInfo.icon}></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>{f.name}</strong>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(55, 65, 81, 0.7)',
                              color: 'var(--text-muted)',
                              fontWeight: 600
                            }}>
                              {f.category}
                            </span>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: f.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: f.isEnabled ? '#34d399' : '#f87171',
                              border: f.isEnabled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                              fontWeight: 700
                            }}>
                              {f.isEnabled ? 'AÇIK / YETKİLİ' : 'KAPALI / ENGELLİ'}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.3rem 0 0 0', lineHeight: 1.4 }}>
                            {f.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: iOS Style Switch Toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <label style={{
                          position: 'relative',
                          display: 'inline-block',
                          width: '48px',
                          height: '26px',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={f.isEnabled}
                            onChange={() => handleToggle(f.featureKey)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: f.isEnabled ? '#10b981' : '#374151',
                            transition: '0.25s',
                            borderRadius: '34px',
                            boxShadow: f.isEnabled ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                          }}>
                            <span style={{
                              position: 'absolute',
                              content: '""',
                              height: '20px',
                              width: '20px',
                              left: f.isEnabled ? '24px' : '3px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              transition: '0.25s',
                              borderRadius: '50%',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}></span>
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Custom Value / Parameter Input (Özel Parametre) */}
                    {f.isEnabled && (
                      <div style={{
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid rgba(75, 85, 99, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <i className="fa-solid fa-sliders" style={{ color: '#a78bfa', fontSize: '0.8rem' }}></i>
                        <span style={{ fontSize: '0.75rem', color: '#c4b5fd', fontWeight: 600, minWidth: '150px' }}>
                          Özel Parametre:
                        </span>
                        <input
                          type="text"
                          value={f.customValue || ''}
                          onChange={e => handleCustomValueChange(f.featureKey, e.target.value)}
                          placeholder={
                            f.featureKey === 'TIME_DEPOSIT'
                              ? 'Örn: +2.5 (Özel faiz bonusu %)'
                              : f.featureKey === 'FAST_TRANSFER'
                              ? 'Örn: 250000 (Özel limit TL)'
                              : f.featureKey === 'FX_EXCHANGE'
                              ? 'Örn: 0.15 (Özel kur indirimi %)'
                              : f.featureKey === 'VIP_CUSTOMER_SUPPORT'
                              ? 'Örn: Ahmet Yılmaz (Özel Temsilci)'
                              : 'İsteğe bağlı özel değer veya limit'
                          }
                          style={{
                            flex: 1,
                            background: 'rgba(17, 24, 39, 0.8)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '6px',
                            padding: '0.4rem 0.65rem',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            outline: 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '1rem 1.5rem' }}>
          <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
            Kapat
          </button>
          <button
            type="button"
            className="btn-submit"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
            }}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-check"></i>
                <span>Değişiklikleri Kaydet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

