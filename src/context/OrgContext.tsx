import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

type Role = 'OWNER' | 'ADMIN' | 'TESOURARIA' | 'SECRETARIA' | 'CONTADOR' | 'LEITURA';
type OrgListItem = { orgId: string; name: string; role: Role };

interface OrgContextType {
  activeOrgId: string | null;
  activeOrgName: string | null;
  setActiveOrg: (orgId: string, orgName: string) => void;
  clearActiveOrg: () => void;
  orgs: OrgListItem[];
  refreshOrgs: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [activeOrgName, setActiveOrgName] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<OrgListItem[]>([]);
  const isFetchingRef = useRef(false);

  // simple in-memory cache to avoid duplicate network requests in a session
  const cacheRef = useRef<{ userId: string | null; orgs: OrgListItem[] } | null>(null);

  // Carregar organização ativa do localStorage ao iniciar
  useEffect(() => {
    if (user) {
      const storageKey = `contacerta:org:${user.id}`;
      const storedOrg = localStorage.getItem(storageKey);
      
      if (storedOrg) {
        try {
          const { orgId, orgName } = JSON.parse(storedOrg);
          setActiveOrgId(orgId);
          setActiveOrgName(orgName);
        } catch (error) {
          console.error('Erro ao carregar organização do localStorage:', error);
          localStorage.removeItem(storageKey);
        }
      }
    }
  }, [user]);

  // Função para definir a organização ativa
  const setActiveOrg = (orgId: string, orgName: string) => {
    if (user) {
      const storageKey = `contacerta:org:${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify({ orgId, orgName }));
      setActiveOrgId(orgId);
      setActiveOrgName(orgName);
    }
  };

  // Função para limpar a organização ativa (logout)
  const clearActiveOrg = () => {
    if (user) {
      const storageKey = `contacerta:org:${user.id}`;
      localStorage.removeItem(storageKey);
    }
    setActiveOrgId(null);
    setActiveOrgName(null);
  };

  const refreshOrgs = async () => {
    if (!user) {
      setOrgs([]);
      return;
    }
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      // use cache if available for this user
      if (cacheRef.current && cacheRef.current.userId === user.id && cacheRef.current.orgs.length > 0) {
        setOrgs(cacheRef.current.orgs);
        return;
      }

      const { data, error } = await supabase
        .from('memberships')
        .select('orgId, role, organization:organizations(id,name)')
        .order('organization(name)', { ascending: true });

      if (error) throw error;

      const mapped: OrgListItem[] = (data || [])
        .map((row: any) => {
          const orgId: string = row.orgId;
          const role: Role = row.role;
          const name: string = row.organization?.name ?? '';
          return { orgId, name, role } as OrgListItem;
        })
        .filter((o: OrgListItem) => !!o.orgId && !!o.name);

      setOrgs(mapped);
      cacheRef.current = { userId: user.id, orgs: mapped };

      // Auto selecionar se nenhuma ativa e existir exatamente 1
      if (!activeOrgId && mapped.length === 1) {
        const only = mapped[0];
        setActiveOrg(only.orgId, only.name);
      }
    } catch (e) {
      console.error('Erro ao carregar organizações do usuário:', e);
      setOrgs([]);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Load orgs when user logs in/changes
  useEffect(() => {
    if (user?.id) {
      refreshOrgs();
    } else {
      setOrgs([]);
      setActiveOrgId(null);
      setActiveOrgName(null);
      cacheRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <OrgContext.Provider value={{ activeOrgId, activeOrgName, setActiveOrg, clearActiveOrg, orgs, refreshOrgs }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === null) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}