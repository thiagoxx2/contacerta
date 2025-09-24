import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Member, Supplier, Document, CostCenter, Asset } from '../types';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface AppState {
  members: Member[];
  suppliers: Supplier[];
  documents: Document[];
  costCenters: CostCenter[];
  assets: Asset[];
  isLoading: boolean;
  modal: ModalState;
}

type AppAction =
  | { type: 'SET_MEMBERS'; payload: Member[] }
  | { type: 'ADD_MEMBER'; payload: Member }
  | { type: 'UPDATE_MEMBER'; payload: Member }
  | { type: 'DELETE_MEMBER'; payload: string }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  | { type: 'SET_DOCUMENTS'; payload: Document[] }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: Document }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'SET_COST_CENTERS'; payload: CostCenter[] }
  | { type: 'ADD_COST_CENTER'; payload: CostCenter }
  | { type: 'UPDATE_COST_CENTER'; payload: CostCenter }
  | { type: 'DELETE_COST_CENTER'; payload: string }
  | { type: 'SET_ASSETS'; payload: Asset[] }
  | { type: 'ADD_ASSET'; payload: Asset }
  | { type: 'UPDATE_ASSET'; payload: Asset }
  | { type: 'DELETE_ASSET'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SHOW_MODAL'; payload: { title: string; message: string; onConfirm: () => void; } }
  | { type: 'HIDE_MODAL' };

const initialState: AppState = {
  members: [],
  suppliers: [],
  documents: [],
  costCenters: [],
  assets: [],
  isLoading: false,
  modal: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  },
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MEMBERS':
      return { ...state, members: action.payload };
    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.payload] };
    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map(member =>
          member.id === action.payload.id ? action.payload : member
        ),
      };
    case 'DELETE_MEMBER':
      return {
        ...state,
        members: state.members.filter(member => member.id !== action.payload),
      };

    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map(supplier =>
          supplier.id === action.payload.id ? action.payload : supplier
        ),
      };
    case 'DELETE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.filter(supplier => supplier.id !== action.payload),
      };
    
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };
    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] };
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(doc =>
          doc.id === action.payload.id ? action.payload : doc
        ),
      };
    case 'DELETE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter(doc => doc.id !== action.payload),
      };

    case 'SET_COST_CENTERS':
      return { ...state, costCenters: action.payload };
    case 'ADD_COST_CENTER':
      return { ...state, costCenters: [...state.costCenters, action.payload] };
    case 'UPDATE_COST_CENTER':
      return {
        ...state,
        costCenters: state.costCenters.map(cc =>
          cc.id === action.payload.id ? action.payload : cc
        ),
      };
    case 'DELETE_COST_CENTER':
      return {
        ...state,
        costCenters: state.costCenters.filter(cc => cc.id !== action.payload),
      };

    case 'SET_ASSETS':
      return { ...state, assets: action.payload };
    case 'ADD_ASSET':
      return { ...state, assets: [...state.assets, action.payload] };
    case 'UPDATE_ASSET':
      return {
        ...state,
        assets: state.assets.map(asset =>
          asset.id === action.payload.id ? action.payload : asset
        ),
      };
    case 'DELETE_ASSET':
      return {
        ...state,
        assets: state.assets.filter(asset => asset.id !== action.payload),
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SHOW_MODAL':
      return { ...state, modal: { ...action.payload, isOpen: true } };
    case 'HIDE_MODAL':
      return { ...state, modal: { ...state.modal, isOpen: false } };

    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function useConfirm() {
  const { dispatch } = useApp();
  return (options: { title: string; message: string; onConfirm: () => void; }) => {
    dispatch({ type: 'SHOW_MODAL', payload: options });
  };
}
