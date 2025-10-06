"""
F1 Race Engineer - LiveKit Agent Entry Point
Initializes RAG pipeline and starts the voice agent
"""

import asyncio
import logging
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import JobContext, WorkerOptions, cli

from agent.voice_agent import VoiceAgent
from agent.rag_pipeline import initialize_rag_pipeline

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize RAG pipeline once at startup (expensive operation)
logger.info("="*60)
logger.info("Initializing F1 Race Engineer - Adrian")
logger.info("="*60)

try:
    rag_pipeline = initialize_rag_pipeline()
    logger.info("RAG pipeline ready")
except Exception as e:
    logger.error(f"Failed to initialize RAG pipeline: {e}")
    logger.error("Make sure the F1 regulations PDF is in backend/data/")
    logger.error(f"Expected location: backend/data/fia2026.pdf")
    raise


async def entrypoint(ctx: JobContext):
    """
    Main entry point for the LiveKit agent.
    Called when a participant joins the room.
    
    Args:
        ctx: JobContext provided by LiveKit
    """
    logger.info(f"Agent connecting to room: {ctx.room.name}")
    
    # Connect to the LiveKit room
    await ctx.connect()
    logger.info("Connected to room")

    # Wait for the first participant to join
    participant = await ctx.wait_for_participant()
    logger.info(f"👤 Participant joined: {participant.identity}")

    # Initialize and run the voice agent with RAG
    agent = VoiceAgent(ctx, rag_pipeline)
    
    try:
        await agent.run(participant)
        logger.info("Voice agent started successfully")
    except Exception as e:
        logger.error(f"Error running voice agent: {e}")
        raise


if __name__ == "__main__":
    logger.info("Starting LiveKit worker...")
    logger.info("Waiting for participants to join...")
    
    # Run the agent worker
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )