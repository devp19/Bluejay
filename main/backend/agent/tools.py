"""
F1 Race Engineer Tools - Championship Calculator
Pure math tool that combines perfectly with RAG
"""

from typing import Dict, List, Optional


class F1Tools:
    """Tools for F1 championship calculations and strategy"""
    
    RACE_POINTS = {
        1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
        6: 8, 7: 6, 8: 4, 9: 2, 10: 1
    }
    
    SPRINT_POINTS = {
        1: 8, 2: 7, 3: 6, 4: 5, 5: 4,
        6: 3, 7: 2, 8: 1
    }
    
    FASTEST_LAP_POINTS = 1
    
    @staticmethod
    def calculate_championship_scenario(
        driver1_points: int,
        driver2_points: int,
        races_remaining: int,
        sprint_races: int = 0
    ) -> Dict:
        """
        Calculate championship scenarios between two drivers
        
        Args:
            driver1_points: Current points for driver 1 (leader)
            driver2_points: Current points for driver 2 (chaser)
            races_remaining: Number of standard races remaining
            sprint_races: Number of sprint races remaining
            
        Returns:
            dict: Championship analysis including max points, scenarios, and outcomes
        """
        # Calculate maximum points available
        max_race_points = races_remaining * (25 + 1)  # Win + fastest lap
        max_sprint_points = sprint_races * 8  # Sprint win
        total_max_points = max_race_points + max_sprint_points
        
        # Current gap
        points_gap = abs(driver1_points - driver2_points)
        leader = "Driver 1" if driver1_points > driver2_points else "Driver 2"
        chaser = "Driver 2" if leader == "Driver 1" else "Driver 1"
        
        # Can the chaser still win?
        mathematically_possible = points_gap <= total_max_points
        
        # Calculate what chaser needs
        points_needed = points_gap + 1  # Need to be ahead by at least 1
        
        # Best case scenario for chaser: wins everything
        chaser_current = driver2_points if chaser == "Driver 2" else driver1_points
        chaser_best_case = chaser_current + total_max_points
        leader_current = driver1_points if leader == "Driver 1" else driver2_points
        
        # Scenarios
        scenarios = []
        
        # Scenario 1: Chaser wins all remaining races
        if mathematically_possible:
            leader_max_allowed = chaser_best_case - 1
            points_leader_can_score = leader_max_allowed - leader_current
            scenarios.append({
                "scenario": "Chaser wins all remaining races",
                "outcome": "Championship possible",
                "condition": f"Leader must score fewer than {points_leader_can_score} points total"
            })
        else:
            scenarios.append({
                "scenario": "Championship decided",
                "outcome": "Mathematically impossible for chaser to win",
                "condition": f"Gap of {points_gap} points exceeds maximum available {total_max_points}"
            })
        
        # Scenario 2: What if chaser finishes P2 every race?
        chaser_p2_points = races_remaining * 18 + sprint_races * 7
        chaser_p2_total = chaser_current + chaser_p2_points
        
        # Calculate average points needed per race
        avg_points_per_race = points_needed / races_remaining if races_remaining > 0 else 0
        
        return {
            "current_gap": points_gap,
            "leader": leader,
            "chaser": chaser,
            "mathematically_possible": mathematically_possible,
            "races_remaining": races_remaining,
            "sprint_races": sprint_races,
            "maximum_points_available": total_max_points,
            "points_chaser_needs": points_needed,
            "average_points_per_race_needed": round(avg_points_per_race, 1),
            "scenarios": scenarios,
            "analysis": {
                "leader_current": leader_current,
                "chaser_current": chaser_current,
                "chaser_best_case_total": chaser_best_case,
                "leader_max_possible": leader_current + total_max_points
            }
        }
    
    @staticmethod
    def calculate_race_points(
        position: int,
        has_fastest_lap: bool = False,
        is_sprint: bool = False
    ) -> int:
        """
        Calculate points for a finishing position
        
        Args:
            position: Finishing position (1-20)
            has_fastest_lap: Whether driver has fastest lap
            is_sprint: Whether this is a sprint race
            
        Returns:
            int: Points scored
        """
        if is_sprint:
            return F1Tools.SPRINT_POINTS.get(position, 0)
        
        points = F1Tools.RACE_POINTS.get(position, 0)
        
        # Fastest lap point only if finishing in top 10
        if has_fastest_lap and position <= 10:
            points += F1Tools.FASTEST_LAP_POINTS
        
        return points
    
    @staticmethod
    def calculate_points_swing(
        driver1_position: int,
        driver2_position: int,
        driver1_fastest_lap: bool = False,
        driver2_fastest_lap: bool = False
    ) -> Dict:
        """
        Calculate points swing between two drivers in a single race
        
        Args:
            driver1_position: Driver 1 finishing position
            driver2_position: Driver 2 finishing position
            driver1_fastest_lap: Whether driver 1 has fastest lap
            driver2_fastest_lap: Whether driver 2 has fastest lap
            
        Returns:
            dict: Points for each driver and net swing
        """
        d1_points = F1Tools.calculate_race_points(driver1_position, driver1_fastest_lap)
        d2_points = F1Tools.calculate_race_points(driver2_position, driver2_fastest_lap)
        
        swing = d1_points - d2_points
        
        return {
            "driver1_points": d1_points,
            "driver2_points": d2_points,
            "points_swing": swing,
            "advantage": "Driver 1" if swing > 0 else "Driver 2" if swing < 0 else "Equal"
        }
    
    @staticmethod
    def calculate_pit_stop_time_loss(
        pit_lane_length_meters: float,
        pit_lane_speed_limit_kmh: int,
        tire_change_seconds: float = 2.5
    ) -> Dict:
        """
        Calculate time lost during a pit stop
        
        Args:
            pit_lane_length_meters: Length of pit lane in meters
            pit_lane_speed_limit_kmh: Speed limit in km/h
            tire_change_seconds: Time for tire change (typically 2-3 seconds)
            
        Returns:
            dict: Breakdown of pit stop time loss
        """
        # Convert speed to m/s
        speed_ms = pit_lane_speed_limit_kmh / 3.6
        
        # Time spent in pit lane
        pit_lane_time = pit_lane_length_meters / speed_ms
        
        # Total pit stop time
        total_time = pit_lane_time + tire_change_seconds
        
        # Time lost vs staying out (assuming racing speed of ~200 km/h average)
        racing_speed_ms = 200 / 3.6
        time_if_racing = pit_lane_length_meters / racing_speed_ms
        time_loss = total_time - time_if_racing
        
        return {
            "pit_lane_time_seconds": round(pit_lane_time, 2),
            "tire_change_time_seconds": tire_change_seconds,
            "total_pit_stop_time": round(total_time, 2),
            "time_loss_vs_racing": round(time_loss, 2),
            "details": {
                "pit_lane_length_m": pit_lane_length_meters,
                "speed_limit_kmh": pit_lane_speed_limit_kmh,
                "equivalent_distance_lost_m": round(time_loss * racing_speed_ms, 0)
            }
        }