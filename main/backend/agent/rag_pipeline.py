"""
RAG Pipeline for F1 Sporting Regulations
Handles PDF loading, chunking, embedding, and retrieval
"""

import os
import logging
from typing import List, Dict
from pathlib import Path

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class F1TechnicalRAG:
    """RAG system for F1 Sporting/Technical Regulations"""
    
    def __init__(self, pdf_path: str = "data/fia2026.pdf"):
        """
        Initialize the RAG pipeline
        
        Args:
            pdf_path: Path to the F1 regulations PDF
        """
        self.pdf_path = pdf_path
        self.embeddings = OpenAIEmbeddings()
        self.vectorstore = None
        self.retriever = None
        
        # Check if PDF exists
        if not Path(pdf_path).exists():
            logger.error(f"PDF not found at {pdf_path}")
            raise FileNotFoundError(
                f"Please place the F1 regulations PDF at {pdf_path}\n"
                f"Current working directory: {os.getcwd()}"
            )
        
        logger.info(f"Initializing RAG pipeline with PDF: {pdf_path}")
    
    def load_and_process_pdf(self):
        """Load PDF, split into chunks, and create embeddings"""
        logger.info("Loading PDF...")
        
        # Load PDF
        loader = PyPDFLoader(self.pdf_path)
        documents = loader.load()
        
        logger.info(f"Loaded {len(documents)} pages from PDF")
        
        # Split into chunks
        # Using smaller chunks for more precise retrieval
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,  # ~250 words per chunk
            chunk_overlap=200,  # Overlap to maintain context
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
        chunks = text_splitter.split_documents(documents)
        logger.info(f"Split into {len(chunks)} chunks")
        
        # Create vector store
        logger.info("Creating embeddings and vector store (this may take a minute)...")
        self.vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory="./chroma_db"  # Persist to disk
        )
        
        # Create retriever
        self.retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 4}  # Retrieve top 4 most relevant chunks
        )
        
        logger.info("RAG pipeline initialized successfully!")
        
        return self
    
    def query(self, question: str) -> Dict[str, any]:
        """
        Query the regulations
        
        Args:
            question: User's question about F1 regulations
            
        Returns:
            dict: Contains answer and source documents
        """
        if not self.retriever:
            raise ValueError("RAG pipeline not initialized. Call load_and_process_pdf() first.")
        
        logger.info(f"Querying: {question}")
        
        # Retrieve relevant documents
        relevant_docs = self.retriever.get_relevant_documents(question)
        
        # Format context from retrieved documents
        context = "\n\n".join([
            f"[Source: Page {doc.metadata.get('page', 'unknown')}]\n{doc.page_content}"
            for doc in relevant_docs
        ])
        
        logger.info(f"Retrieved {len(relevant_docs)} relevant chunks")
        
        return {
            "context": context,
            "sources": relevant_docs,
            "num_sources": len(relevant_docs)
        }
    
    def get_context_for_agent(self, question: str) -> str:
        """
        Get formatted context for the voice agent
        
        Args:
            question: User's question
            
        Returns:
            str: Formatted context string ready for LLM
        """
        try:
            result = self.query(question)
            
            if result["num_sources"] == 0:
                return "No relevant information found in the regulations."
            
            # Format for agent consumption
            formatted_context = f"""
Based on the FIA F1 Regulations, here is the relevant information:

{result['context']}

Use this information to answer the user's question accurately, citing specific articles when possible.
"""
            return formatted_context
            
        except Exception as e:
            logger.error(f"Error retrieving context: {e}")
            return f"Error accessing regulations: {str(e)}"


def initialize_rag_pipeline(pdf_path: str = "data/fia2026.pdf") -> F1TechnicalRAG:
    """
    Initialize and return the RAG pipeline (called once at startup)
    
    Args:
        pdf_path: Path to F1 regulations PDF
        
    Returns:
        F1TechnicalRAG: Initialized RAG pipeline
    """
    rag = F1TechnicalRAG(pdf_path)
    
    # Check if vector store already exists
    if Path("./chroma_db").exists():
        logger.info("Loading existing vector store...")
        rag.vectorstore = Chroma(
            persist_directory="./chroma_db",
            embedding_function=rag.embeddings
        )
        rag.retriever = rag.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 4}
        )
        logger.info("Vector store loaded from disk!")
    else:
        logger.info("Creating new vector store...")
        rag.load_and_process_pdf()
    
    return rag


# Test function (optional - for debugging)
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    # Initialize RAG
    rag = initialize_rag_pipeline()
    
    # Test query
    test_question = "What is the points system for F1 races?"
    result = rag.query(test_question)
    
    print("\n" + "="*50)
    print(f"Question: {test_question}")
    print("="*50)
    print(f"\nRetrieved {result['num_sources']} relevant chunks:")
    print("\n" + result['context'])