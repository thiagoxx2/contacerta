import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useSuppliers } from '../hooks/useSuppliers';

interface SupplierComboboxProps {
  value?: string;
  onChange?: (supplierId?: string) => void;
  orgId?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Combobox para pesquisar/selecionar fornecedores já cadastrados no Supabase.
 * - Sem criação inline (CRUD é feito na página dedicada).
 * - Resiliente a orgId ausente e resultados vazios.
 */
export default function SupplierCombobox({
  value,
  onChange,
  orgId,
  placeholder = 'Selecione um fornecedor',
  disabled = false,
  required = false,
}: SupplierComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string } | null>(null);

  const { suppliers = [], loading, error, setSearch, refetch } = useSuppliers({
    orgId: orgId || '',
    onlyActive: true,
    limit: 50,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualizar busca (debounced no hook) quando o termo muda
  useEffect(() => {
    if (!orgId) return;
    setSearch(searchTerm);
  }, [searchTerm, setSearch, orgId]);

  // Ajustar item selecionado quando value ou lista mudarem
  useEffect(() => {
    const list = Array.isArray(suppliers) ? suppliers : [];
    if (value && list.length > 0) {
      const found = list.find((s) => s.id === value);
      if (found) {
        setSelectedSupplier({ id: found.id, name: found.name });
        return;
      }
    }
    if (!value) {
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
    onChange?.(supplier.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedSupplier(null);
    onChange?.(undefined);
    setSearchTerm('');
  };

  const list = Array.isArray(suppliers) ? suppliers : [];
  const term = (searchTerm || '').toLowerCase();
  const filtered = list.filter((s) => (s?.name || '').toLowerCase().includes(term));

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
          value={isOpen ? searchTerm : selectedSupplier?.name || ''}
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
              // opcional: se reabrir, pode refazer fetch
              if (!isOpen) refetch().catch(() => void 0);
            }}
            disabled={disabled}
            className="p-1 text-gray-400 hover:text-gray-600"
            aria-label="Abrir lista de fornecedores"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Carregando fornecedores...</div>
          )}

          {error && !loading && (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              {term ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor disponível'}
            </div>
          )}

          {!loading &&
            !error &&
            filtered.map((supplier) => (
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
