import { getDb, generateId } from './schema.ts';

export type VectorRecord = {
  id: string;
  ref_type: string;
  ref_id: string;
  embedding: Float32Array;
  model: string;
  created_at: number;
};

type VectorRow = {
  id: string;
  ref_type: string;
  ref_id: string;
  embedding: ArrayBuffer;
  model: string;
  created_at: number;
};

/**
 * Parse vector row from database, converting BLOB to Float32Array
 */
function parseVector(row: VectorRow): VectorRecord {
  return {
    ...row,
    embedding: new Float32Array(row.embedding),
  };
}

/**
 * Store a vector embedding for a reference entity or fact
 */
export function storeVector(
  ref_type: string,
  ref_id: string,
  embedding: Float32Array,
  model: string
): VectorRecord {
  const db = getDb();
  const id = generateId();
  const now = Date.now();

  // Convert Float32Array to Buffer for SQLite BLOB storage
  const buffer = Buffer.from(embedding.buffer);

  const stmt = db.prepare(
    'INSERT INTO vectors (id, ref_type, ref_id, embedding, model, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  stmt.run(id, ref_type, ref_id, buffer, model, now);

  return {
    id,
    ref_type,
    ref_id,
    embedding,
    model,
    created_at: now,
  };
}

/**
 * Find similar vectors using cosine similarity
 *
 * This implementation uses manual cosine similarity calculation.
 * For production with large datasets, integrate sqlite-vec extension
 * which provides optimized vector similarity search with HNSW indexing.
 *
 * See: https://github.com/asg017/sqlite-vec
 *
 * Example with sqlite-vec:
 * SELECT ref_type, ref_id, vec_distance_cosine(embedding, ?) as similarity
 * FROM vectors
 * ORDER BY similarity DESC
 * LIMIT ?
 */

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const av = a[i]!;
    const bv = b[i]!;
    dotProduct += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Convert ArrayBuffer to Float32Array
 */
function bufferToFloat32(buffer: ArrayBuffer): Float32Array {
  return new Float32Array(buffer);
}

export function findSimilar(
  embedding: Float32Array,
  limit: number = 10
): Array<{ ref_type: string; ref_id: string; similarity: number }> {
  const db = getDb();

  // Fetch all vectors from database
  const stmt = db.prepare('SELECT id, ref_type, ref_id, embedding, model, created_at FROM vectors');
  const rows = stmt.all() as VectorRow[];

  if (rows.length === 0) return [];

  // Calculate similarity for each vector
  const results: Array<{ ref_type: string; ref_id: string; similarity: number }> = [];

  for (const row of rows) {
    const storedEmbedding = bufferToFloat32(row.embedding);
    const similarity = cosineSimilarity(embedding, storedEmbedding);
    results.push({
      ref_type: row.ref_type,
      ref_id: row.ref_id,
      similarity,
    });
  }

  // Sort by similarity (highest first) and limit results
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, limit);
}

/**
 * Delete all vectors for a given reference
 */
export function deleteVectors(ref_type: string, ref_id: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM vectors WHERE ref_type = ? AND ref_id = ?');
  stmt.run(ref_type, ref_id);
}
