/**
 * Helpers para mapeamento de status entre UI e banco de dados
 */

export type UiAssetStatus = 'in_use' | 'in_storage' | 'in_maintenance' | 'disposed';
export type DbAssetStatus = 'IN_USE' | 'IN_STORAGE' | 'IN_MAINTENANCE' | 'DISPOSED';

/**
 * Mapeia status da UI para o banco de dados
 */
export function mapUiToDbStatus(s: UiAssetStatus): DbAssetStatus {
  switch (s) {
    case 'in_use': return 'IN_USE';
    case 'in_storage': return 'IN_STORAGE';
    case 'in_maintenance': return 'IN_MAINTENANCE';
    case 'disposed': return 'DISPOSED';
    default:
      throw new Error(`Status UI inválido: ${s}`);
  }
}

/**
 * Mapeia status do banco de dados para a UI
 */
export function mapDbToUiStatus(s: DbAssetStatus): UiAssetStatus {
  switch (s) {
    case 'IN_USE': return 'in_use';
    case 'IN_STORAGE': return 'in_storage';
    case 'IN_MAINTENANCE': return 'in_maintenance';
    case 'DISPOSED': return 'disposed';
    default:
      throw new Error(`Status DB inválido: ${s}`);
  }
}
