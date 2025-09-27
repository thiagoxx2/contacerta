import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { useSuppliers } from '../hooks/useSuppliers';

interface SupplierComboboxProps {
  value: string | null;
  onChange: (supplierId: string | null) => void;
  orgId: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function SupplierCombobox({
  value,
  onChange,
  orgId,
  placeholder = 'Selecione um fornecedor',
  disabled = false,
  required = false
}: SupplierComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string } | null>(null);
  
  const { suppliers, loading, error, setSearch, refetch } = useSuppliers({
    orgId,
    onlyActive: true,
    limit: 50
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualizar busca quando searchTerm muda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, setSearch]);

  // Encontrar fornecedor selecionado
  useEffect(() => {
    if (value && suppliers.length > 0) {
      const supplier = suppliers.find(s => s.id === value);
      if (supplier) {
        setSelectedSupplier({ id: supplier.id, name: supplier.name });
      }
    } else {
      setSelectedSupplier(null);
    }
  }, [value, suppliers]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (supplier: { id: string; name: string }) => {
    setSelectedSupplier(supplier);
    onChange(supplier.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedSupplier(null);
    onChange(null);
    setSearchTerm('');
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (selectedSupplier?.name || '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedSupplier ? selectedSupplier.name : placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
          required={required}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {selectedSupplier && !isOpen && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 mr-1"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }}
            disabled={disabled}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Carregando fornecedores...
            </div>
          )}
          
          {error && (
            <div className="px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          
          {!loading && !error && filteredSuppliers.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor disponível'}
            </div>
          )}
          
          {!loading && !error && filteredSuppliers.map((supplier) => (
            <button
              key={supplier.id}
              type="button"
              onClick={() => handleSelect({ id: supplier.id, name: supplier.name })}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              {supplier.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
