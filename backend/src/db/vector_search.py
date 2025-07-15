"""
Vector search utilities for RAG system optimization
"""
from sqlmodel import Session, select, text
from typing import List, Optional
from ..chunk.model import Chunk


class VectorSearch:
    """Optimized vector search operations for RAG system"""
    
    def __init__(self, session: Session):
        self.session = session
    
    def similarity_search_cosine(
        self, 
        query_vector: List[float], 
        limit: int = 5,
        similarity_threshold: Optional[float] = None,
        file_ids: Optional[List[str]] = None
    ) -> List[Chunk]:
        """
        Search for similar chunks using cosine similarity
        
        Args:
            query_vector: The embedding vector to search for
            limit: Maximum number of results to return
            similarity_threshold: Minimum similarity score (0-1, higher = more similar)
            file_ids: Optional list of file IDs to restrict search to
        """
        query = select(Chunk).order_by(Chunk.vector.cosine_distance(query_vector))
        
        # Add file filter if specified
        if file_ids:
            query = query.where(Chunk.file_id.in_(file_ids))
        
        # Add similarity threshold if specified
        if similarity_threshold is not None:
            # Convert similarity threshold to distance threshold
            # cosine_distance = 1 - cosine_similarity
            distance_threshold = 1 - similarity_threshold
            query = query.where(Chunk.vector.cosine_distance(query_vector) <= distance_threshold)
        
        query = query.limit(limit)
        return self.session.exec(query).all()
    
    def similarity_search_l2(
        self, 
        query_vector: List[float], 
        limit: int = 5,
        distance_threshold: Optional[float] = None,
        file_ids: Optional[List[str]] = None
    ) -> List[Chunk]:
        """
        Search for similar chunks using L2 (Euclidean) distance
        
        Args:
            query_vector: The embedding vector to search for
            limit: Maximum number of results to return
            distance_threshold: Maximum L2 distance (lower = more similar)
            file_ids: Optional list of file IDs to restrict search to
        """
        query = select(Chunk).order_by(Chunk.vector.l2_distance(query_vector))
        
        if file_ids:
            query = query.where(Chunk.file_id.in_(file_ids))
        
        if distance_threshold is not None:
            query = query.where(Chunk.vector.l2_distance(query_vector) <= distance_threshold)
        
        query = query.limit(limit)
        return self.session.exec(query).all()
    
    def similarity_search_with_score(
        self, 
        query_vector: List[float], 
        limit: int = 5,
        use_cosine: bool = True
    ) -> List[tuple[Chunk, float]]:
        """
        Search for similar chunks and return with similarity scores
        
        Returns:
            List of tuples (chunk, similarity_score)
        """
        if use_cosine:
            # For cosine: similarity = 1 - distance
            query = text("""
                SELECT *, (1 - (vector <=> :query_vector)) as similarity_score
                FROM "Chunk"
                ORDER BY vector <=> :query_vector
                LIMIT :limit
            """)
        else:
            # For L2: return negative distance as score (higher = better)
            query = text("""
                SELECT *, -(vector <-> :query_vector) as similarity_score
                FROM "Chunk"
                ORDER BY vector <-> :query_vector
                LIMIT :limit
            """)
        
        result = self.session.exec(
            query, 
            {"query_vector": query_vector, "limit": limit}
        ).all()
        
        chunks_with_scores = []
        for row in result:
            # Convert row to Chunk object (excluding the score)
            chunk_data = {
                "id": row.id,
                "content": row.content,
                "vector": row.vector,
                "file_id": row.file_id,
                "created_at": row.created_at,
                "updated_at": row.updated_at
            }
            chunk = Chunk(**chunk_data)
            chunks_with_scores.append((chunk, row.similarity_score))
        
        return chunks_with_scores
    
    def optimize_search_parameters(self):
        """
        Set optimal search parameters for pgvector indexes
        Call this before performing searches for better performance
        """
        # Optimize for HNSW indexes
        self.session.exec(text("SET hnsw.ef_search = 64"))
        
        # Optimize for IVFFlat indexes (if using)
        self.session.exec(text("SET ivfflat.probes = 20"))
    
    def get_index_stats(self) -> dict:
        """Get statistics about vector indexes for monitoring performance"""
        stats = {}
        
        # Check if indexes exist
        index_query = text("""
            SELECT indexname, tablename 
            FROM pg_indexes 
            WHERE tablename = 'Chunk' 
            AND indexname LIKE '%vector%'
        """)
        indexes = self.session.exec(index_query).all()
        stats["indexes"] = [{"name": idx.indexname, "table": idx.tablename} for idx in indexes]
        
        # Get table statistics
        table_stats = text("""
            SELECT 
                schemaname,
                tablename,
                n_tup_ins as inserts,
                n_tup_upd as updates,
                n_tup_del as deletes,
                n_live_tup as live_tuples,
                n_dead_tup as dead_tuples
            FROM pg_stat_user_tables 
            WHERE tablename = 'Chunk'
        """)
        table_result = self.session.exec(table_stats).first()
        if table_result:
            stats["table_stats"] = {
                "live_tuples": table_result.live_tuples,
                "dead_tuples": table_result.dead_tuples,
                "inserts": table_result.inserts,
                "updates": table_result.updates,
                "deletes": table_result.deletes
            }
        
        return stats


# Example usage for RAG system
def rag_search_example(session: Session, query_embedding: List[float]):
    """Example of how to use vector search in a RAG system"""
    vector_search = VectorSearch(session)
    
    # Optimize search parameters
    vector_search.optimize_search_parameters()
    
    # Find top 5 most similar chunks
    similar_chunks = vector_search.similarity_search_cosine(
        query_vector=query_embedding,
        limit=5,
        similarity_threshold=0.7  # Only return chunks with >70% similarity
    )
    
    # Get results with similarity scores
    chunks_with_scores = vector_search.similarity_search_with_score(
        query_vector=query_embedding,
        limit=5
    )
    
    # Extract content for RAG context
    context_texts = [chunk.content for chunk in similar_chunks]
    
    return {
        "chunks": similar_chunks,
        "chunks_with_scores": chunks_with_scores,
        "context": "\n\n".join(context_texts)
    }
