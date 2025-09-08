'use client';

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Select from 'react-select';
import './style.scss';

interface ModalCategorySelectorProps {
  dates: Date[];
  onConfirm: (selected: { [date: string]: string[] }) => void;
  onClose: () => void;
}

const listCategory = [
  { title: 'Latest', value: 'Latest' },
  { title: 'Technologies', value: 'Technologies' },
  { title: 'UI/UX', value: 'UI/UX' },
  { title: 'Client guides', value: 'Client guides' },
];

export default function ModalCategorySelector({ dates, onConfirm, onClose }: ModalCategorySelectorProps) {
  const [selectedCategories, setSelectedCategories] = useState<{ [date: string]: string[] }>({});
  const [errors, setErrors] = useState<{ [date: string]: boolean }>({});

  const handleChange = (date: string, selectedOption: { value: string; label: string } | null) => {
    const selectedId = selectedOption ? [selectedOption.value] : [];
    setSelectedCategories((prev) => ({ ...prev, [date]: selectedId }));
    if (selectedId.length > 0) {
      setErrors((prev) => ({ ...prev, [date]: false }));
    }
  };

  const handleConfirm = () => {
    const newErrors: { [date: string]: boolean } = {};
    const missingDates = dates
      .map((d) => d.toISOString().split('T')[0])
      .filter((dateKey) => {
        const arr = selectedCategories[dateKey];
        if (!arr || arr.length === 0) {
          newErrors[dateKey] = true;
          return true;
        }
        return false;
      });

    if (missingDates.length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm(selectedCategories);
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <h2>Select Category for Each Article</h2>
        <div className="modal__list">
          {dates.map((dateObj) => {
            const dateKey = dateObj.toISOString().split('T')[0];
            const hasError = errors[dateKey];
            return (
              <div key={dateKey} className="modal__item">
                <p className={`modal__date ${hasError ? 'error-text' : ''}`}>Article on {dateKey}</p>
                <Select
                  options={listCategory.map((cat) => ({ value: cat.value, label: cat.title }))}
                  onChange={(selected) => handleChange(dateKey, selected)}
                  isClearable={false}
                  classNamePrefix={hasError ? 'select-error' : ''}
                  placeholder={hasError ? 'Category not selected' : 'Select category'}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: hasError ? 'red' : base.borderColor,
                      boxShadow: hasError ? '0 0 0 1px red' : base.boxShadow,
                    }),
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="modal__actions">
          <button onClick={handleConfirm} className="btn btn-primary">Confirm</button>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
