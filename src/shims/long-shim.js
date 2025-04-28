/**
 * Shim para o módulo 'long'
 * 
 * Este shim adapta o módulo 'long' para funcionar corretamente no contexto ESM,
 * facilitando o uso com a biblioteca libsignal-protocol que requer suporte
 * a inteiros de 64 bits para operações criptográficas.
 * 
 * O Signal Protocol necessita do módulo 'long' para manipular valores inteiros
 * de 64 bits durante as operações de criptografia, garantindo a segurança e
 * integridade das mensagens.
 * 
 * Também cria o namespace global dcodeIO.Long esperado pela biblioteca.
 */

// Implementação mock do Long para garantir compatibilidade ESM
class Long {
  constructor(low, high, unsigned) {
    this.low = low || 0;
    this.high = high || 0;
    this.unsigned = !!unsigned;
  }

  // Métodos básicos necessários para o Signal Protocol
  toNumber() {
    return this.low + this.high * Math.pow(2, 32);
  }

  toString() {
    return this.toNumber().toString();
  }

  toJSON() {
    return this.toString();
  }

  // Factory methods
  static fromNumber(value, unsigned) {
    if (isNaN(value)) value = 0;
    const low = value & 0xFFFFFFFF;
    const high = (value / Math.pow(2, 32)) & 0xFFFFFFFF;
    return new Long(low, high, unsigned);
  }

  static fromString(str, unsigned) {
    const num = parseInt(str, 10);
    return Long.fromNumber(num, unsigned);
  }

  static fromBits(low, high, unsigned) {
    return new Long(low, high, unsigned);
  }

  // Métodos estáticos para valores comuns
  static ZERO = new Long(0, 0, false);
  static UZERO = new Long(0, 0, true);
  static ONE = new Long(1, 0, false);
  static UONE = new Long(1, 0, true);
  static NEG_ONE = new Long(-1, -1, false);
  static MAX_VALUE = new Long(0xFFFFFFFF, 0x7FFFFFFF, false);
  static MIN_VALUE = new Long(0, 0x80000000, false);
}

// Funções auxiliares
const isLong = (obj) => obj instanceof Long;
const fromValue = (val) => {
  if (typeof val === 'number') return Long.fromNumber(val);
  if (typeof val === 'string') return Long.fromString(val);
  if (val instanceof Long) return val;
  return Long.ZERO;
};

// Função getRandomBytes para compatibilidade com curve.js
const getRandomBytes = (len) => {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return bytes;
};

// A inicialização do namespace global foi movida para signal-protocol-setup.js

// Re-exportar o Long para garantir compatibilidade com importações tanto padrão quanto nomeadas
export default Long;
export { Long, isLong, fromValue, getRandomBytes };

// Garantir registro no global dcodeIO (browser/ESM standalone)
if (typeof window !== 'undefined' && window.dcodeIO) {
  window.dcodeIO.Long = Long;
}

