/**
 * Shim para o módulo ByteBuffer
 * 
 * Este shim implementa funcionalidades mínimas do ByteBuffer necessárias
 * para o funcionamento do Signal Protocol.
 * 
 * A biblioteca libsignal-protocol espera encontrar o ByteBuffer no namespace
 * global.dcodeIO.ByteBuffer, e este shim garante que essa expectativa seja atendida.
 */

// Importar a classe Long do nosso shim
import Long from './long-shim.js';

/**
 * Implementação simplificada do ByteBuffer
 */
class ByteBuffer {
  constructor(buffer) {
    if (buffer instanceof ArrayBuffer) {
      this.buffer = buffer;
      this.view = new DataView(buffer);
      this.array = new Uint8Array(buffer);
      this.offset = 0;
      this.limit = buffer.byteLength;
      this.markedOffset = -1;
    } else if (typeof buffer === 'number') {
      // Capacity constructor
      this.buffer = new ArrayBuffer(buffer);
      this.view = new DataView(this.buffer);
      this.array = new Uint8Array(this.buffer);
      this.offset = 0;
      this.limit = buffer;
      this.markedOffset = -1;
    } else {
      // Default empty buffer
      this.buffer = new ArrayBuffer(0);
      this.view = new DataView(this.buffer);
      this.array = new Uint8Array(this.buffer);
      this.offset = 0;
      this.limit = 0;
      this.markedOffset = -1;
    }
  }

  /**
   * Cria um novo ByteBuffer com a capacidade especificada
   */
  static allocate(capacity) {
    return new ByteBuffer(capacity);
  }

  /**
   * Envolve um ArrayBuffer em um ByteBuffer
   */
  static wrap(buffer) {
    if (buffer instanceof Uint8Array) {
      return new ByteBuffer(buffer.buffer);
    }
    return new ByteBuffer(buffer);
  }

  /**
   * Concatena vários ByteBuffers ou ArrayBuffers em um só
   */
  static concat(buffers) {
    if (!Array.isArray(buffers) || buffers.length === 0) {
      return new ByteBuffer(0);
    }

    // Calculate total length
    let totalLength = 0;
    for (let i = 0; i < buffers.length; i++) {
      const buf = buffers[i];
      if (buf instanceof ByteBuffer) {
        totalLength += buf.limit;
      } else if (buf instanceof ArrayBuffer) {
        totalLength += buf.byteLength;
      } else if (buf instanceof Uint8Array) {
        totalLength += buf.byteLength;
      }
    }

    // Create new buffer and copy data
    const result = new ByteBuffer(totalLength);
    let offset = 0;
    
    for (let i = 0; i < buffers.length; i++) {
      const buf = buffers[i];
      if (buf instanceof ByteBuffer) {
        const data = new Uint8Array(buf.toArrayBuffer());
        result.array.set(data, offset);
        offset += buf.limit;
      } else if (buf instanceof ArrayBuffer) {
        const data = new Uint8Array(buf);
        result.array.set(data, offset);
        offset += buf.byteLength;
      } else if (buf instanceof Uint8Array) {
        result.array.set(buf, offset);
        offset += buf.byteLength;
      }
    }
    
    return result;
  }

  /**
   * Converte o ByteBuffer para um ArrayBuffer
   */
  toArrayBuffer() {
    return this.buffer.slice(0, this.limit);
  }

  /**
   * Converte o ByteBuffer para uma string
   */
  toString(encoding) {
    const decoder = new TextDecoder(encoding || 'utf-8');
    return decoder.decode(this.array.subarray(0, this.limit));
  }

  /**
   * Referência para a classe Long
   */
  static Long = Long;
}

// A inicialização do namespace global foi movida para signal-protocol-setup.js

// Exportar para uso como módulo ES
export default ByteBuffer;
export { ByteBuffer };

// Garantir registro no global dcodeIO (browser/ESM standalone)
if (typeof window !== 'undefined' && window.dcodeIO) {
  window.dcodeIO.ByteBuffer = ByteBuffer;
}

