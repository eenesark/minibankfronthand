import React from 'react';
import './Toast.css';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className={`toast-container ${isSuccess ? 'toast-success' : 'toast-error'}`}>
      <div className="toast-icon">
        <i className={isSuccess ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation"}></i>
      </div>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={onClose}>
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
}

