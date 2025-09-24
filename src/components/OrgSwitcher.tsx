import React from 'react';
import { ChevronDown, Check, PlusCircle, Settings } from 'lucide-react';
import { useOrg } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OrgSwitcher() {
  const { user } = useAuth();
  const { activeOrgId, activeOrgName, setActiveOrg, orgs, refreshOrgs } = useOrg();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const controlId = React.useId();

  const handleToggle = async () => {
    if (!open) {
      setError(null);
      setLoading(true);
      try {
        await refreshOrgs();
      } catch (e: any) {
        setError('Não foi possível carregar suas organizações.');
      } finally {
        setLoading(false);
      }
    }
    setOpen((v) => !v);
  };

  React.useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target) && buttonRef.current && !buttonRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSelect = (orgId: string, name: string) => {
    setActiveOrg(orgId, name);
    setOpen(false);
    // navigate to /app or refresh current route
    if (location.pathname.startsWith('/app')) {
      // force re-navigation to trigger data reloads listening to org
      navigate('/app', { replace: false });
    } else {
      navigate('/app');
    }
  };

  const emptyState = !loading && (orgs?.length ?? 0) === 0;

  return (
    <div className="px-4 py-3">
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={controlId}
          onClick={handleToggle}
          className="w-full flex items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="block truncate" title={activeOrgName ?? undefined}>
              {activeOrgName ?? (user ? 'Selecione uma organização' : 'Não autenticado')}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>

        {open && (
          <div
            ref={panelRef}
            id={controlId}
            role="listbox"
            tabIndex={-1}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg focus:outline-none"
          >
            <div className="max-h-80 overflow-auto">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Minhas organizações</div>

              {loading && (
                <div className="px-3 py-2 text-sm text-gray-500">Carregando...</div>
              )}

              {error && (
                <div className="mx-3 mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}

              {!loading && !error && orgs && orgs.map((o) => (
                <button
                  key={o.orgId}
                  role="option"
                  aria-selected={activeOrgId === o.orgId}
                  onClick={() => handleSelect(o.orgId, o.name)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 ${activeOrgId === o.orgId ? 'bg-blue-50 text-blue-700' : 'text-gray-800'}`}
                >
                  <span className="flex min-w-0 flex-col items-start">
                    <span className="truncate" title={o.name}>{o.name}</span>
                    <span className="text-xs text-gray-500">{o.role}</span>
                  </span>
                  {activeOrgId === o.orgId && <Check className="h-4 w-4" />}
                </button>
              ))}

              {emptyState && (
                <div className="px-3 py-3 text-sm text-gray-600">
                  Nenhuma organização encontrada.
                  <button
                    onClick={() => { setOpen(false); navigate('/create-org'); }}
                    className="ml-1 text-blue-600 hover:underline"
                  >
                    Criar nova organização
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200">
              <button
                onClick={() => { setOpen(false); navigate('/select-org'); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                Gerenciar/Selecionar…
              </button>
              <button
                onClick={() => { setOpen(false); navigate('/create-org'); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <PlusCircle className="h-4 w-4" />
                Criar nova organização
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


