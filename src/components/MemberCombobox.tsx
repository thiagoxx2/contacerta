import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { listMembersByOrg } from '../services/memberService';

interface MemberComboboxProps {
  value?: string;
  onChange?: (memberId?: string) => void;
  orgId?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Combobox para pesquisar/selecionar membros já cadastrados no Supabase.
 * - Sem criação inline (CRUD é feito na página dedicada).
 * - Resiliente a orgId ausente e resultados vazios.
 */
export default function MemberCombobox({
  value,
  onChange,
  orgId,
  placeholder = 'Selecione um membro',
  disabled = false,
  required = false,
}: MemberComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce para busca
  useEffect(() => {
    if (!orgId) return;
    
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await listMembersByOrg(orgId, searchTerm, 50);
        if (error) {
          setError('Erro ao carregar membros');
          setMembers([]);
        } else {
          setMembers(data || []);
        }
      } catch (err) {
        setError('Erro ao carregar membros');
        setMembers([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [orgId, searchTerm]);

  // Ajustar item selecionado quando value ou lista mudarem
  useEffect(() => {
    if (value && members.length > 0) {
      const found = members.find((m) => m.id === value);
      if (found) {
        setSelectedMember({ id: found.id, name: found.name });
        return;
      }
    }
    if (!value) {
      setSelectedMember(null);
    }
  }, [value, members]);

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

    const filtered = getFilteredMembers();
    
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

  // Função para obter membros filtrados
  const getFilteredMembers = useCallback(() => {
    const term = (searchTerm || '').toLowerCase();
    return members.filter((m) => (m?.name || '').toLowerCase().includes(term));
  }, [members, searchTerm]);

  const handleSelect = (member: { id: string; name: string }) => {
    setSelectedMember(member);
    onChange?.(member.id);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    setSelectedMember(null);
    onChange?.(undefined);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const filtered = getFilteredMembers();

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
          value={isOpen ? searchTerm : selectedMember?.name || ''}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedMember ? selectedMember.name : placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
          required={required}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        <div className="absolute inset-y-0 right-0 flex items-center">
          {selectedMember && !isOpen && (
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
            aria-label="Abrir lista de membros"
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
          aria-label="Lista de membros"
        >
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Carregando membros...</div>
          )}

          {error && !loading && (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro disponível'}
            </div>
          )}

          {!loading &&
            !error &&
            filtered.map((member, index) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelect({ id: member.id, name: member.name })}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  index === highlightedIndex ? 'bg-blue-100 text-blue-900' : ''
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                {member.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
