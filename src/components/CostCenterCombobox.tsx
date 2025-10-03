import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useCostCentersCombobox } from '../hooks/useCostCentersCombobox';

interface CostCenterComboboxProps {
  value?: string;
  onChange?: (id?: string) => void;
  orgId?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Combobox para pesquisar/selecionar centros de custo já cadastrados no Supabase.
 * - Sem criação inline (CRUD é feito na página dedicada).
 * - Resiliente a orgId ausente e resultados vazios.
 */
export default function CostCenterCombobox({
  value,
  onChange,
  orgId,
  placeholder = 'Selecione um centro de custo',
  disabled = false,
  required = false,
}: CostCenterComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCostCenter, setSelectedCostCenter] = useState<{ id: string; name: string } | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const { items = [], loading, error, search, setSearch } = useCostCentersCombobox({
    orgId: orgId || '',
    limit: 50,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Atualizar busca (debounced no hook) quando o termo muda
  useEffect(() => {
    if (!orgId) return;
    setSearch(searchTerm);
  }, [searchTerm, setSearch, orgId]);

  // Ajustar item selecionado quando value ou lista mudarem
  useEffect(() => {
    const list = Array.isArray(items) ? items : [];
    if (value && list.length > 0) {
      const found = list.find((item) => item.id === value);
      if (found) {
        setSelectedCostCenter({ id: found.id, name: found.name });
        return;
      }
    }
    if (!value) {
      setSelectedCostCenter(null);
    }
  }, [value, items]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manipulação de teclado para acessibilidade
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
        return;
      }
      return;
    }

    const filtered = getFilteredItems();
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev < filtered.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filtered.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          handleSelect(filtered[highlightedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, highlightedIndex]);

  // Função para obter itens filtrados
  const getFilteredItems = useCallback(() => {
    const list = Array.isArray(items) ? items : [];
    const term = (searchTerm || '').toLowerCase();
    return list.filter((item) => (item?.name || '').toLowerCase().includes(term));
  }, [items, searchTerm]);

  const handleSelect = (costCenter: { id: string; name: string }) => {
    setSelectedCostCenter(costCenter);
    onChange?.(costCenter.id);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    setSelectedCostCenter(null);
    onChange?.(undefined);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const filtered = getFilteredItems();

  // Se não houver orgId, evita fetch e mostra placeholder desabilitado
  if (!orgId) {
    return (
      <select
        disabled
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
      >
        <option>Carregando organização...</option>
      </select>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : selectedCostCenter?.name || ''}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedCostCenter ? selectedCostCenter.name : placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
          required={required}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        <div className="absolute inset-y-0 right-0 flex items-center">
          {selectedCostCenter && !isOpen && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 mr-1"
              disabled={disabled}
              aria-label="Limpar seleção"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen((o) => !o);
              if (!isOpen) inputRef.current?.focus();
            }}
            disabled={disabled}
            className="p-1 text-gray-400 hover:text-gray-600"
            aria-label="Abrir lista de centros de custo"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div 
          ref={listRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
          aria-label="Lista de centros de custo"
        >
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Carregando centros de custo...</div>
          )}

          {error && !loading && (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? 'Nenhum centro de custo encontrado' : 'Nenhum centro de custo disponível'}
            </div>
          )}

          {!loading &&
            !error &&
            filtered.map((costCenter, index) => (
              <button
                key={costCenter.id}
                type="button"
                onClick={() => handleSelect({ id: costCenter.id, name: costCenter.name })}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  index === highlightedIndex ? 'bg-blue-100 text-blue-900' : ''
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                {costCenter.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
