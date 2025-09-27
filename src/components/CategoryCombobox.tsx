import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import { useFinanceCategories } from '../hooks/useFinanceCategories';
import { useOrg } from '../context/OrgContext';
import { getFinanceKindFromDocumentType } from '../services/categoryService';

interface CategoryComboboxProps {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  documentType: 'payable' | 'receivable';
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function CategoryCombobox({
  value,
  onChange,
  documentType,
  placeholder,
  required = false,
  error
}: CategoryComboboxProps) {
  const { activeOrgId } = useOrg();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const comboboxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const financeKind = getFinanceKindFromDocumentType(documentType);
  
  const {
    items: categories,
    loading,
    error: serviceError,
    setQuery,
    createCategory,
    clearError
  } = useFinanceCategories({
    orgId: activeOrgId,
    financeKind
  });

  // Atualizar input quando value mudar (para edição)
  useEffect(() => {
    if (value && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat.id === value);
      if (selectedCategory && selectedCategory.name !== selectedCategoryName) {
        setSelectedCategoryName(selectedCategory.name);
        setInputValue(selectedCategory.name);
      }
    } else if (!value && selectedCategoryName) {
      // Só limpa se não há categoria selecionada E há um nome selecionado
      setSelectedCategoryName('');
      setInputValue('');
    }
  }, [value, categories, selectedCategoryName]);

  // Buscar categorias quando input mudar (com debounce)
  useEffect(() => {
    setQuery(inputValue);
  }, [inputValue, setQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Se limpar completamente o input, limpar seleção
    if (!newValue.trim()) {
      onChange(null);
      setSelectedCategoryName('');
    } else {
      // Se está digitando algo diferente da categoria selecionada, limpar seleção
      if (selectedCategoryName && newValue !== selectedCategoryName) {
        onChange(null);
        setSelectedCategoryName('');
      }
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    clearError();
  };

  const handleInputBlur = () => {
    // Delay para permitir clique em opções
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleSelectCategory = (categoryId: string, categoryName: string) => {
    onChange(categoryId);
    setSelectedCategoryName(categoryName);
    setInputValue(categoryName);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleCreateCategory = async () => {
    if (!inputValue.trim()) return;

    try {
      const newCategory = await createCategory(inputValue.trim());
      handleSelectCategory(newCategory.id, newCategory.name);
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
    }
  };

  const handleClear = () => {
    onChange(null);
    setSelectedCategoryName('');
    setInputValue('');
    inputRef.current?.focus();
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showCreateOption = inputValue.trim() && 
    !filteredCategories.some(cat => 
      cat.name.toLowerCase() === inputValue.toLowerCase()
    );

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={comboboxRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder || `Ex: ${documentType === 'payable' ? 'Aluguel' : 'Dízimo'}`}
          className={`w-full px-3 py-2 pr-20 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          required={required}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500 flex items-center">
              <Search className="w-4 h-4 mr-2 animate-spin" />
              Carregando categorias...
            </div>
          )}

          {serviceError && (
            <div className="px-3 py-2 text-sm text-red-600">
              {serviceError}
            </div>
          )}

          {!loading && !serviceError && filteredCategories.length === 0 && !showCreateOption && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Nenhuma categoria encontrada
            </div>
          )}

          {filteredCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleSelectCategory(category.id, category.name)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              {category.name}
            </button>
          ))}

          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateCategory}
              className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar "{inputValue}" como {documentType === 'payable' ? 'Despesa' : 'Receita'}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
