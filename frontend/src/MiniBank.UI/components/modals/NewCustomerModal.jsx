import React, { useState, useEffect } from 'react';
import './Modal.css';

export default function NewCustomerModal({ isOpen, onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    identityNumber: '',
    email: '',
    phoneNumber: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        identityNumber: '',
        email: '',
        phoneNumber: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      identityNumber: '',
      email: '',
      phoneNumber: ''
    });
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      firstName: '',
      lastName: '',
      identityNumber: '',
      email: '',
      phoneNumber: ''
    });
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon modal-icon-blue">
              <i className="fa-solid fa-user-plus"></i>
            </div>
            <div>
              <h3 className="modal-title">Yeni Müşteri & Otomatik Hesap</h3>
              <p className="modal-subtitle">Müşteri açıldığında hesap ve IBAN otomatik üretilir</p>
            </div>
          </div>
          <button className="btn-close" onClick={handleClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="info-alert">
              <i className="fa-solid fa-circle-info"></i>
              <span>
                Yalnızca temel müşteri bilgilerini girin. <strong>Müşteri Numarası</strong>, <strong>Banka Hesabı</strong> ve <strong>IBAN</strong> backend tarafından anında üretilecektir.
              </span>
            </div>

            <div className="form-group-half">
              <div className="form-group">
                <label className="form-label">Ad *</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="Ahmet"
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Soyad *</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Yılmaz"
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">T.C. Kimlik Numarası (11 Hane) *</label>
              <input
                type="text"
                name="identityNumber"
                maxLength="11"
                required
                placeholder="11 haneli kimlik numarası"
                className="form-input font-mono"
                value={formData.identityNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">E-Posta Adresi *</label>
              <input
                type="email"
                name="email"
                required
                placeholder="ornek@minibank.com"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefon Numarası *</label>
              <input
                type="text"
                name="phoneNumber"
                required
                placeholder="+90 555 123 45 67"
                className="form-input"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Vazgeç
            </button>
            <button type="submit" className="btn-submit btn-submit-blue" disabled={loading}>
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>Müşteri ve Hesabı Aç</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

