import React, { useState, useEffect } from 'react';
import './Modal.css';

export default function EditCustomerModal({
  isOpen,
  onClose,
  customer,
  onSubmit,
  loading
}) {
  const [formData, setFormData] = useState({
    customerNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        customerNumber: customer.customerNumber || '',
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phoneNumber: customer.phoneNumber || ''
      });
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(customer.id, formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon modal-icon-amber">
              <i className="fa-solid fa-user-pen"></i>
            </div>
            <div>
              <h3 className="modal-title">Müşteri Bilgilerini Güncelle</h3>
              <p className="modal-subtitle">PUT /api/Customers/{customer.id}</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Müşteri Numarası (Manuel Düzenlenebilir)</label>
              <input
                type="text"
                name="customerNumber"
                className="form-input font-mono"
                value={formData.customerNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group-half">
              <div className="form-group">
                <label className="form-label">Ad *</label>
                <input
                  type="text"
                  name="firstName"
                  required
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
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">E-Posta Adresi *</label>
              <input
                type="email"
                name="email"
                required
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
                className="form-input"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              İptal
            </button>
            <button type="submit" className="btn-submit btn-submit-amber" disabled={loading}>
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Güncelleniyor...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Değişiklikleri Kaydet (PUT)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

