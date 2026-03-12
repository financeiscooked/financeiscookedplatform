import prisma from '../lib/prisma.js';
import { generateEmbedding, splitTextIntoChunks } from './ragService.js';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Memory Service — agent document CRUD + semantic memory search
// ---------------------------------------------------------------------------

/** Get a single agent document by key */
export async function getDocument(agentId: string, docKey: string) {
  return prisma.agentDocument.findFirst({
    where: { agentId, docKey },
  });
}

/** Create or update an agent document */
export async function upsertDocument(
  agentId: string,
  docType: 'soul' | 'memory' | 'context' | 'daily',
  docKey: string,
  content: string,
) {
  // Check if document already exists
  const existing = await prisma.agentDocument.findFirst({
    where: { agentId, docType, docKey },
  });

  if (existing) {
    return prisma.agentDocument.update({
      where: { id: existing.id },
      data: { content, docType },
    });
  }

  return prisma.agentDocument.create({
    data: { agentId, docType, docKey, content },
  });
}

/** Delete an agent document and its embeddings */
export async function deleteDocument(agentId: string, docKey: string) {
  const doc = await prisma.agentDocument.findFirst({
    where: { agentId, docKey },
  });
  if (!doc) return null;

  // Delete embeddings first, then document
  await prisma.agentMemoryEmbedding.deleteMany({
    where: { docId: doc.id },
  });
  return prisma.agentDocument.delete({
    where: { id: doc.id },
  });
}

/** Search agent memory embeddings using pgvector */
export async function searchMemory(
  agentId: string,
  query: string,
  apiKey: string,
  topK = 5,
): Promise<Array<{ chunkText: string; similarity: number; docId: string }>> {
  try {
    const queryEmbedding = await generateEmbedding(query, apiKey);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    const results = await prisma.$queryRawUnsafe<
      Array<{
        chunk_text: string;
        similarity: number;
        doc_id: string;
      }>
    >(
      `SELECT chunk_text, 1 - (embedding <=> $1::vector) as similarity, doc_id
       FROM agent_memory_embeddings
       WHERE agent_id = $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      embeddingStr,
      agentId,
      topK,
    );

    return results.map((r) => ({
      chunkText: r.chunk_text,
      similarity: r.similarity,
      docId: r.doc_id,
    }));
  } catch (err: any) {
    console.error('Memory search error:', err.message);
    return [];
  }
}

/** Embed a document's content into agent_memory_embeddings */
export async function embedDocument(
  agentId: string,
  docId: string,
  content: string,
  apiKey: string,
): Promise<number> {
  // Delete old embeddings for this doc
  await prisma.agentMemoryEmbedding.deleteMany({
    where: { docId },
  });

  const chunks = splitTextIntoChunks(content, 800, 150);

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i], apiKey);
    const embeddingStr = `[${embedding.join(',')}]`;
    const contentHash = crypto.createHash('md5').update(chunks[i]).digest('hex');

    await prisma.$executeRawUnsafe(
      `INSERT INTO agent_memory_embeddings (id, doc_id, agent_id, chunk_text, embedding, line_start, line_end, content_hash)
       VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, $5, $6, $7)`,
      docId,
      agentId,
      chunks[i],
      embeddingStr,
      i * 10, // approximate line numbers
      (i + 1) * 10,
      contentHash,
    );
  }

  return chunks.length;
}

/** Get memory recall context for context builder */
export async function getMemoryRecall(
  agentId: string,
  userMessage: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const results = await searchMemory(agentId, userMessage, apiKey, 5);
    const relevant = results.filter((r) => r.similarity > 0.3);
    if (relevant.length === 0) return null;

    const parts = relevant.map(
      (r, i) => `[Memory ${i + 1}, relevance: ${(r.similarity * 100).toFixed(1)}%]\n${r.chunkText}`,
    );

    return `\n--- Memory Recall ---\nRelevant memories:\n\n${parts.join('\n\n')}`;
  } catch {
    return null;
  }
}
