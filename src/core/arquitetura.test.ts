import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Guarda automatizada dos princípios I e VI da constituição.
 *
 * Estes testes não checam comportamento: checam que a arquitetura não erodiu.
 * São a diferença entre "combinamos de não importar React no core" e "não dá
 * para importar React no core".
 */

const RAIZ_CORE = join(process.cwd(), 'src', 'core');

function arquivosDeProducao(dir: string): string[] {
  const encontrados: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      encontrados.push(...arquivosDeProducao(caminho));
      continue;
    }
    if (extname(entrada.name) !== '.ts') continue;
    if (entrada.name.endsWith('.test.ts')) continue;
    encontrados.push(caminho);
  }
  return encontrados;
}

const arquivos = arquivosDeProducao(RAIZ_CORE);

describe('src/core não conhece a camada visual (princípio I)', () => {
  it('encontra arquivos para inspecionar', () => {
    expect(arquivos.length).toBeGreaterThan(0);
  });

  it.each(arquivos)('%s não importa React nem Recharts', (caminho) => {
    const conteudo = readFileSync(caminho, 'utf8');
    expect(conteudo).not.toMatch(/from\s+['"]react(-dom)?['"]/);
    expect(conteudo).not.toMatch(/from\s+['"]recharts['"]/);
    expect(conteudo).not.toMatch(/require\(['"]react(-dom)?['"]\)/);
  });
});

describe('arredondamento mora num lugar só (princípio VI)', () => {
  const foraDeFormatacao = arquivos.filter(
    (caminho) => !caminho.endsWith('formatacao.ts'),
  );

  it.each(foraDeFormatacao)(
    '%s não chama toFixed nem Intl.NumberFormat',
    (caminho) => {
      const conteudo = readFileSync(caminho, 'utf8');
      expect(conteudo).not.toContain('toFixed');
      expect(conteudo).not.toContain('Intl.NumberFormat');
      expect(conteudo).not.toContain('Math.round');
    },
  );
});
