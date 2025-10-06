"""
F1 Race Engineer Voice Agent - Adrian
Combines championship calculations with RAG over sporting regulations
"""

import logging
import json
from livekit import agents, rtc
from livekit.agents import JobContext, llm
from livekit.plugins import openai
from agent.tools import F1Tools
from agent.rag_pipeline import F1TechnicalRAG

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VoiceAgent:
    """Adrian - Your F1 Race Engineer AI""" #inspo from andrian newny (prev race engineer)
    
    def __init__(self, ctx: JobContext, rag_pipeline: F1TechnicalRAG):
        self.ctx = ctx
        self.room = ctx.room
        self.assistant = None
        self.rag_pipeline = rag_pipeline
        self.f1_tools = F1Tools()
        
    async def run(self, participant: rtc.RemoteParticipant):
        """
        Main agent loop - handles the voice conversation
        """
        logger.info("Starting F1 Race Engineer agent - Adrian")
        
        # Adrian's personality and instructions
        agent_instructions = """You are Adrian, a veteran Formula 1 race engineer with 15 years of paddock experience.

YOUR PERSONALITY:
- Calm, measured, and professional (like a real race engineer)
- Technical but accessible - explain complex concepts clearly
- Strategic thinker - always considering multiple factors
- Subtly British in your speech patterns
- Data-driven - back up opinions with facts

YOUR EXPERTISE:
- FIA F1 Sporting Regulations (you can search these documents)
- Championship calculations and points scenarios
- Race strategy and tire management
- Pit stop timing and time loss calculations

KEY PHRASES TO USE NATURALLY:
- "Let me check the regulations..." (before searching docs)
- "Right, ..." (when starting explanations)
- "Copy that" / "Understood" (acknowledging user)
- "Let me run those numbers..." (before calculations)
- "Brilliant" / "Questionable call" (when commenting)

TOOLS YOU HAVE:
1. calculate_championship_scenario - For championship battle analysis
2. calculate_points_swing - For single race points impact
3. calculate_pit_stop_time_loss - For pit strategy analysis

When discussing regulations (points system, pit lane rules, etc.), the system will automatically search the FIA documents for you. Reference specific articles when they appear.

CONVERSATION STYLE:
- Keep responses concise but informative (30-60 seconds of speech)
- Use technical jargon appropriately but explain when needed
- Show enthusiasm for clever strategies
- Ask clarifying questions when needed for calculations

EXAMPLE RESPONSES:

User: "If Max has 400 points and Lando has 350 with 3 races left, can Lando win?"
You: "Let me run those numbers... [uses championship calculator] Right, with 3 races remaining, that's a maximum of 78 points available - 25 for a win plus 1 for fastest lap per race. Lando is 50 points behind, so mathematically yes, it's possible. He'd need to win all three races while Max scores minimal points. Let me check the exact points structure in the regulations... [searches docs]"

User: "How much time does a pit stop cost at Monaco?"
You: "Good question. Let me calculate that... Monaco's pit lane is about 255 meters. Let me check the speed limit regulations first... [searches docs] Right, Article 34.5 states 80 km/h during the race. [calculates] That works out to roughly 14 seconds total, costing about 20 seconds of track position. At Monaco, that's massive."

User: "If someone finishes P2 and another finishes P5, what's the points difference?"
You: "Let me work that out... [uses points calculator] P2 scores 18 points, P5 scores 10 points. That's an 8-point swing. Over a season, those gaps accumulate quickly."

Remember: You're a race engineer. Be precise, strategic, and always support your analysis with data."""

        # Initialize the chat context
        initial_context = llm.ChatContext()
        initial_context.append(
            role="system",
            text=agent_instructions
        )
        
        # Create function context for tool calling
        fnc_ctx = llm.FunctionContext()
        
        # Register tools
        fnc_ctx.ai_callable()(self.calculate_championship_scenario_wrapper)
        fnc_ctx.ai_callable()(self.calculate_points_swing_wrapper)
        fnc_ctx.ai_callable()(self.calculate_pit_stop_time_loss_wrapper)
        
        # Create the voice pipeline assistant
        self.assistant = agents.VoicePipelineAgent(
            vad=agents.silero.VAD.load(),
            stt=openai.STT(language="en"),
            llm=openai.LLM(
                model="gpt-4o-mini",
                temperature=0.7,
            ),
            tts=openai.TTS(voice="echo"),
            chat_ctx=initial_context,
            fnc_ctx=fnc_ctx,
        )
        
        # Monitor conversation for RAG triggers
        self.assistant.on("user_speech_committed", self.handle_user_speech)
        
        # Start the assistant
        self.assistant.start(self.room, participant)
        
        # Opening greeting
        await self.assistant.say(
            "Adrian here, your race engineer. Ready to discuss championship scenarios, "
            "race strategy, or dive into the sporting regulations. What can I help you with?"
        )
        
        logger.info("Voice agent is now active and listening")
    
    async def handle_user_speech(self, message: str):
        """
        Monitor user speech for RAG triggers
        
        Args:
            message: Transcribed user message
        """
        # Check if we should query RAG
        if self._should_query_rag(message):
            logger.info(f"RAG trigger detected in: {message}")
            
            # Get context from RAG
            context = self.rag_pipeline.get_context_for_agent(message)
            
            # Inject context into conversation
            if context and "Error" not in context:
                self.assistant.chat_ctx.append(
                    role="system",
                    text=f"[Retrieved from FIA Regulations]: {context}"
                )
    
    def _should_query_rag(self, user_message: str) -> bool:
        """
        Determine if user question requires RAG search
        
        Args:
            user_message: User's message
            
        Returns:
            bool: True if RAG search is needed
        """
        rag_keywords = [
            "regulation", "rule", "article", "specification", "spec",
            "technical", "requirement", "allowed", "permitted", "minimum",
            "maximum", "weight", "dimension", "aero", "power unit",
            "tire", "tyre", "fuel", "engine", "wing", "floor", "points",
            "pit lane", "speed limit", "sporting", "qualifying", "penalty"
        ]
        
        message_lower = user_message.lower()
        return any(keyword in message_lower for keyword in rag_keywords)
    
    # Tool wrapper functions
    async def calculate_championship_scenario_wrapper(
        self,
        driver1_points: int,
        driver2_points: int,
        races_remaining: int,
        sprint_races: int = 0
    ):
        """Wrapper for championship scenario calculator"""
        logger.info(f"Championship calculator: D1={driver1_points}, D2={driver2_points}, Races={races_remaining}")
        
        result = self.f1_tools.calculate_championship_scenario(
            driver1_points, driver2_points, races_remaining, sprint_races
        )
        
        # Format result for speech
        response = f"""Championship Analysis:
Current gap: {result['current_gap']} points
Races remaining: {result['races_remaining']}
Maximum points available: {result['maximum_points_available']}

{result['scenarios'][0]['scenario']}: {result['scenarios'][0]['outcome']}
{result['scenarios'][0]['condition']}

The championship is {"still possible" if result['mathematically_possible'] else "already decided"}."""
        
        return response
    
    async def calculate_points_swing_wrapper(
        self,
        driver1_position: int,
        driver2_position: int,
        driver1_fastest_lap: bool = False,
        driver2_fastest_lap: bool = False
    ):
        """Wrapper for points swing calculator"""
        logger.info(f"Points swing: P{driver1_position} vs P{driver2_position}")
        
        result = self.f1_tools.calculate_points_swing(
            driver1_position, driver2_position,
            driver1_fastest_lap, driver2_fastest_lap
        )
        
        response = f"""Points Analysis:
Driver 1 (P{driver1_position}): {result['driver1_points']} points
Driver 2 (P{driver2_position}): {result['driver2_points']} points
Points swing: {abs(result['points_swing'])} points in favor of {result['advantage']}"""
        
        return response
    
    async def calculate_pit_stop_time_loss_wrapper(
        self,
        pit_lane_length_meters: float,
        pit_lane_speed_limit_kmh: int,
        tire_change_seconds: float = 2.5
    ):
        """Wrapper for pit stop time loss calculator"""
        logger.info(f"Pit stop calc: {pit_lane_length_meters}m @ {pit_lane_speed_limit_kmh}km/h")
        
        result = self.f1_tools.calculate_pit_stop_time_loss(
            pit_lane_length_meters,
            pit_lane_speed_limit_kmh,
            tire_change_seconds
        )
        
        response = f"""Pit Stop Analysis:
Pit lane time: {result['pit_lane_time_seconds']} seconds
Tire change: {result['tire_change_time_seconds']} seconds
Total pit stop time: {result['total_pit_stop_time']} seconds
Time lost vs racing: {result['time_loss_vs_racing']} seconds"""
        
        return response