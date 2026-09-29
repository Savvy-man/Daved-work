import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export default function SearchableSelect({ options, placeholder, value, onChange, labelKey = 'name', valueKey = 'id' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown if operator clicks outside the container
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync displayed search text with selected value alterations
  const selectedOption = options.find(opt => String(opt[valueKey]) === String(value));
  
  const filteredOptions = options.filter(opt =>
    opt[labelKey]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Clickable Display Input Field Area */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500/20"
      >
        <span className={selectedOption ? "text-slate-900 font-medium" : "text-slate-400"}>
          {selectedOption ? selectedOption[labelKey] : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Floating Dropdown Filter Panel Card Block */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-1.5 space-y-1">
          {/* Inner Search Bar Parameter Input field */}
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Type to narrow down choices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-md pl-8 pr-3 py-1.5 text-xs outline-none focus:bg-slate-100/50"
            />
          </div>

          {/* Render Filtered Options Result Grid Items */}
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-xs text-center text-slate-400 font-medium">No matches found.</div>
          ) : (
            filteredOptions.map((opt) => {
              const optId = String(opt[valueKey]);
              const isSelected = String(value) === optId;

              return (
                <div
                  key={optId}
                  onClick={() => {
                    onChange(optId);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-xs font-medium px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{opt[labelKey]}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
