// src/components/AdvancedEventFields.jsx

import React from 'react'

export default function AdvancedEventFields({ values, onChange }) {
    return (
        <div
            style={{
                marginTop: '1rem',
                padding: '1rem',
                border: '1px solid #d7deea',
                borderRadius: '12px',
                background: '#f8fafc'
            }}
        >
            <div className="event-form-grid">
                <div className="event-form-field event-form-field-full">
                    <label htmlFor="description">Descripción</label>
                    <textarea
                        id="description"
                        rows={4}
                        value={values.description}
                        onChange={(e) => onChange('description', e.target.value)}
                        placeholder="Descripción opcional del evento"
                    />
                </div>

                <div className="event-form-field">
                    <label htmlFor="status">Status ICS</label>
                    <select
                        id="status"
                        value={values.status}
                        onChange={(e) => onChange('status', e.target.value)}
                    >
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="TENTATIVE">TENTATIVE</option>
                        <option value="CANCELLED">CANCELLED</option>
                    </select>
                </div>

                <div className="event-form-field">
                    <label htmlFor="uid">UID manual</label>
                    <input
                        id="uid"
                        type="text"
                        value={values.uid}
                        onChange={(e) => onChange('uid', e.target.value)}
                        placeholder="Opcional. Si se deja vacío, se genera automáticamente."
                    />
                </div>

                <div className="event-form-field event-form-field-full">
                    <label htmlFor="productId">PRODID</label>
                    <input
                        id="productId"
                        type="text"
                        value={values.productId}
                        onChange={(e) => onChange('productId', e.target.value)}
                        placeholder="-//Santiago Haspert Piaggio//Calendar ICS//EN"
                    />
                </div>

                <div className="event-form-field event-form-field-full">
                    <label htmlFor="categories">Categorías</label>
                    <input
                        id="categories"
                        type="text"
                        value={values.categories}
                        onChange={(e) => onChange('categories', e.target.value)}
                        placeholder="Ej: gaming, steam, amigos"
                    />
                </div>

                <div className="event-form-field event-form-field-full">
                    <label htmlFor="notes">Notas internas</label>
                    <textarea
                        id="notes"
                        rows={3}
                        value={values.notes}
                        onChange={(e) => onChange('notes', e.target.value)}
                        placeholder="Notas opcionales para incluir en el DESCRIPTION del ICS"
                    />
                </div>
            </div>
        </div>
    )
}