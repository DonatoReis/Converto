/**
 * Shim para o módulo mocha-bytebuffer
 * 
 * Este é um shim vazio que serve como placeholder para o módulo mocha-bytebuffer,
 * que é referenciado em algumas dependências mas não é realmente necessário
 * para o funcionamento do aplicativo.
 * 
 * O Vite é configurado para substituir as importações de 'mocha-bytebuffer'
 * por este shim para evitar erros durante o build.
 */

// Exporta um objeto vazio como placeholder
const ByteBufferShim = {
  // Métodos vazios que podem ser necessários
  allocate: () => ({}),
  wrap: () => ({}),
  // Adicione outros métodos mock conforme necessário
};

// Export default e nomeado para compatibilidade
export default ByteBufferShim;
export const ByteBuffer = ByteBufferShim;

