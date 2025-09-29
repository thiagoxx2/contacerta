# Padrão de Defaults e Triggers no Banco de Dados

## Contexto

Para evitar erros 23502 (null value in column) e simplificar o código da aplicação, implementamos defaults automáticos e triggers para gerenciar campos de sistema como `id`, `createdAt` e `updatedAt`.

## Padrão Implementado

### Campos com Defaults Automáticos

- **`id`**: `gen_random_uuid()` - Gera UUID automaticamente
- **`createdAt`**: `timezone('utc', now())` - Timestamp de criação em UTC
- **`updatedAt`**: `timezone('utc', now())` - Timestamp de atualização em UTC

### Trigger de Atualização

- **Função**: `set_updated_at()` - Atualiza `updatedAt` automaticamente em UPDATEs
- **Trigger**: `trg_{table}_set_updated_at` - Aplicado em cada tabela

## Tabelas com Padrão Aplicado

- ✅ `suppliers` - Implementado
- ✅ `cost_centers` - Implementado (corrigido no código)
- ⏳ `ministries` - Verificar se precisa de defaults
- ⏳ `categories` - Verificar se precisa de defaults  
- ⏳ `members` - Verificar se precisa de defaults

## Regras para Desenvolvedores

### ❌ NÃO FAZER

```typescript
// ❌ NÃO gerar id manualmente
const id = crypto.randomUUID();

// ❌ NÃO enviar createdAt/updatedAt
const payload = {
  id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // ... outros campos
};
```

### ✅ FAZER

```typescript
// ✅ Apenas campos de negócio
const payload = {
  orgId: activeOrgId,
  name: formData.name,
  type: 'PF',
  // ... outros campos de negócio
};
```

## Verificação de Novos Módulos

Antes de implementar um novo módulo:

1. **Verificar se a tabela tem defaults**:
   ```sql
   SELECT column_name, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'sua_tabela' 
   AND column_name IN ('id', 'createdAt', 'updatedAt');
   ```

2. **Se não tiver, aplicar o padrão**:
   ```sql
   ALTER TABLE "sua_tabela"
     ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
     ALTER COLUMN "createdAt" SET DEFAULT timezone('utc', now()),
     ALTER COLUMN "updatedAt" SET DEFAULT timezone('utc', now());
   ```

3. **Criar trigger se necessário**:
   ```sql
   CREATE TRIGGER trg_sua_tabela_set_updated_at
     BEFORE UPDATE ON "sua_tabela"
     FOR EACH ROW 
     EXECUTE FUNCTION set_updated_at();
   ```

## Benefícios

- ✅ Elimina erros 23502/23503/23505 relacionados a campos de sistema
- ✅ Simplifica payloads da aplicação
- ✅ Garante consistência de timestamps
- ✅ Reduz código boilerplate
- ✅ Centraliza lógica de sistema no banco

## Migração de Tabelas Existentes

Para aplicar o padrão em tabelas existentes:

1. Criar migration SQL
2. Aplicar defaults e triggers
3. Remover geração manual de `id`/`createdAt`/`updatedAt` no código
4. Testar criação/atualização de registros
