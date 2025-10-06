"""
F1 Race Engineer Voice Agent - Adrian
Combines championship calculations with RAG over sporting regulations
"""

import logging
from livekit.agents import (
    Agent,
    AgentSession,
    RunContext,
    function_tool,
)
from livekit.plugins import openai, silero
from agent.tools import F1Tools
from agent.rag_pipeline import F1TechnicalRAG

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class F1RaceEngineerAgent(Agent):
    """Adrian - Your F1 Race Engineer AI"""

    def __init__(self, rag_pipeline: F1TechnicalRAG):
        self.rag_pipeline = rag_pipeline
        self.f1_tools = F1Tools()

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
4. search_f1_regulations - For FIA regulation queries

When discussing regulations (points system, pit lane rules, etc.), use the search_f1_regulations tool. Reference specific articles when they appear.

CONVERSATION STYLE:
- Keep responses concise but informative (30-60 seconds of speech)
- Use technical jargon appropriately but explain when needed
- Show enthusiasm for clever strategies
- Ask clarifying questions when needed for calculations

Remember: You're a race engineer. Be precise, strategic, and always support your analysis with data.
"""

        # Initialize WITHOUT tools - let decorators handle registration
        super().__init__(
            instructions=agent_instructions,
        )

    @function_tool()
    async def search_f1_regulations(
        self, context: RunContext, query: str
    ) -> str:
        """
        Search the FIA F1 Sporting and Technical Regulations for specific information.

        Args:
            query: The user's question about F1 regulations, rules, procedures, or technical requirements

        Returns:
            Relevant information from the FIA regulations
        """
        try:
            logger.info(f"Searching F1 regulations for: {query}")

            # Use RAG pipeline to get context
            context_info = self.rag_pipeline.get_context_for_agent(query)

            if context_info and "No relevant information found" not in context_info:
                return f"Based on the FIA F1 Regulations: {context_info}"
            else:
                return (
                    "I couldn't find specific information about that in the current FIA regulations. "
                    "Could you rephrase your question or ask about a different aspect of F1 regulations?"
                )

        except Exception as e:
            logger.error(f"Error searching F1 regulations: {e}")
            return (
                f"I encountered an error while searching the regulations: {str(e)}. "
                "Please try rephrasing your question."
            )

    @function_tool()
    async def calculate_championship_scenario(
        self,
        context: RunContext,
        driver1_points: int,
        driver2_points: int,
        races_remaining: int,
        sprint_races: int = 0,
    ) -> str:
        """
        Calculate championship scenarios between two drivers.

        Args:
            driver1_points: Current points for driver 1
            driver2_points: Current points for driver 2
            races_remaining: Number of races remaining in season
            sprint_races: Number of sprint races remaining (default 0)

        Returns:
            Championship scenario analysis
        """
        logger.info(
            f"Championship calculator: D1={driver1_points}, D2={driver2_points}, "
            f"Races={races_remaining}, Sprints={sprint_races}"
        )

        result = self.f1_tools.calculate_championship_scenario(
            driver1_points, driver2_points, races_remaining, sprint_races
        )

        response = (
            f"Championship Analysis:\n"
            f"Current gap: {result['current_gap']} points\n"
            f"Races remaining: {result['races_remaining']}\n"
            f"Maximum points available: {result['maximum_points_available']}\n\n"
        )

        if result.get("scenarios"):
            s0 = result["scenarios"][0]
            response += (
                f"{s0['scenario']}: {s0['outcome']}\n"
                f"{s0['condition']}\n\n"
            )

        response += (
            "The championship is "
            f"{'still possible' if result['mathematically_possible'] else 'already decided'}."
        )

        return response

    @function_tool()
    async def calculate_points_swing(
        self,
        context: RunContext,
        driver1_position: int,
        driver2_position: int,
        driver1_fastest_lap: bool = False,
        driver2_fastest_lap: bool = False,
    ) -> str:
        """
        Calculate points difference between two finishing positions.

        Args:
            driver1_position: Finishing position for driver 1
            driver2_position: Finishing position for driver 2
            driver1_fastest_lap: Whether driver 1 gets fastest lap point
            driver2_fastest_lap: Whether driver 2 gets fastest lap point

        Returns:
            Points swing analysis
        """
        logger.info(
            f"Points swing: P{driver1_position} "
            f"(FL={driver1_fastest_lap}) vs P{driver2_position} (FL={driver2_fastest_lap})"
        )

        result = self.f1_tools.calculate_points_swing(
            driver1_position,
            driver2_position,
            driver1_fastest_lap,
            driver2_fastest_lap,
        )

        response = (
            "Points Analysis:\n"
            f"Driver 1 (P{driver1_position}): {result['driver1_points']} points\n"
            f"Driver 2 (P{driver2_position}): {result['driver2_points']} points\n"
            f"Points swing: {abs(result['points_swing'])} points in favor of {result['advantage']}"
        )

        return response

    @function_tool()
    async def calculate_pit_stop_time_loss(
        self,
        context: RunContext,
        pit_lane_length_meters: float,
        pit_lane_speed_limit_kmh: int,
        tire_change_seconds: float = 2.5,
    ) -> str:
        """
        Calculate time loss from a pit stop at a given circuit.

        Args:
            pit_lane_length_meters: Length of pit lane in meters
            pit_lane_speed_limit_kmh: Speed limit in pit lane (km/h)
            tire_change_seconds: Time for tire change (default 2.5s)

        Returns:
            Pit stop time loss analysis
        """
        logger.info(
            f"Pit stop calc: {pit_lane_length_meters}m @ {pit_lane_speed_limit_kmh}km/h, "
            f"tire change {tire_change_seconds}s"
        )

        result = self.f1_tools.calculate_pit_stop_time_loss(
            pit_lane_length_meters, pit_lane_speed_limit_kmh, tire_change_seconds
        )

        response = (
            "Pit Stop Analysis:\n"
            f"Pit lane time: {result['pit_lane_time_seconds']} seconds\n"
            f"Tire change: {result['tire_change_time_seconds']} seconds\n"
            f"Total pit stop time: {result['total_pit_stop_time']} seconds\n"
            f"Time lost vs racing: {result['time_loss_vs_racing']} seconds"
        )

        return response


class VoiceAgent:
    """Main F1 Voice Agent orchestrator"""

    def __init__(self, ctx, rag_pipeline: F1TechnicalRAG):
        self.ctx = ctx
        self.room = ctx.room
        self.rag_pipeline = rag_pipeline
        logger.info("F1 Voice Agent initialized")

    async def run(self, participant):
        """Run the voice agent for a participant"""
        try:
            logger.info("Starting F1 Race Engineer agent - Adrian")

            # Create agent session
            session = AgentSession(
                # Speech-to-Text - OpenAI Whisper
                stt=openai.STT(model="whisper-1"),
                # Large Language Model
                llm=openai.LLM(model="gpt-4o-mini", temperature=0.7),
                # Text-to-Speech
                tts=openai.TTS(voice="echo"),
                # Voice Activity Detection
                vad=silero.VAD.load(),
            )

            # Create the F1 agent
            f1_agent = F1RaceEngineerAgent(self.rag_pipeline)

            # Start the session
            await session.start(
                room=self.room,
                agent=f1_agent,
            )

            # Initial greeting
            await session.generate_reply(
                instructions=(
                    "Greet the user as Adrian, the F1 Race Engineer, and ask how you can help "
                    "them with F1 regulations, championship scenarios, or race strategy today."
                )
            )

            logger.info("Voice agent is now active and listening")

            # Keep the session running - don't close it
            # The session will close automatically when the room disconnects

        except Exception as e:
            logger.error(f"Error in F1 voice agent: {e}")
            raise