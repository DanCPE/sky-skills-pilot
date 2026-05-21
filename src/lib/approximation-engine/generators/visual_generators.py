"""
Visual question generators.
"""

import random
import math
from .base import QuestionGenerator


class MapScaleDistanceGenerator(QuestionGenerator):
    """Generate map scale distance calculation questions"""
    
    def generate(self):
        # Common map scales: 1:50,000 means 1 cm on map = 50,000 cm in reality
        scale_options = [
            (25000, '1:25,000', 0.25),    # 1 cm = 0.25 km
            (50000, '1:50,000', 0.5),     # 1 cm = 0.5 km
            (100000, '1:100,000', 1.0),   # 1 cm = 1 km
            (200000, '1:200,000', 2.0),   # 1 cm = 2 km
            (250000, '1:250,000', 2.5),   # 1 cm = 2.5 km
        ]
        
        scale_value, scale_text, km_per_cm = random.choice(scale_options)
        
        # Distance measured on map (in cm)
        map_distance_cm = round(random.uniform(3.5, 15.0), 1)
        
        # Calculate real distance in kilometers
        exact = map_distance_cm * km_per_cm
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'On a map with scale {scale_text}, you measure {map_distance_cm} cm between two cities. What is the actual distance in kilometers?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Scale {scale_text} means 1 cm = {km_per_cm} km. Distance = {map_distance_cm} cm × {km_per_cm} km/cm = {exact} km'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 1)
            choices[letter] = value
        
        return choices


class MapScaleAreaGenerator(QuestionGenerator):
    """Generate map scale area calculation questions"""
    
    def generate(self):
        # Map scales
        scale_options = [
            (50000, '1:50,000', 0.5),     # 1 cm = 0.5 km
            (100000, '1:100,000', 1.0),   # 1 cm = 1 km
            (200000, '1:200,000', 2.0),   # 1 cm = 2 km
        ]
        
        scale_value, scale_text, km_per_cm = random.choice(scale_options)
        
        # Rectangular area on map (in cm)
        length_cm = random.randint(4, 10)
        width_cm = random.randint(3, 8)
        
        # Calculate real area in square kilometers
        real_length = length_cm * km_per_cm
        real_width = width_cm * km_per_cm
        exact = real_length * real_width
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'On a map with scale {scale_text}, a rectangular field measures {length_cm} cm × {width_cm} cm. What is the actual area in square kilometers?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Real dimensions: {length_cm} cm × {km_per_cm} = {real_length} km and {width_cm} cm × {km_per_cm} = {real_width} km. Area = {real_length} × {real_width} = {exact} km²'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 1)
            choices[letter] = value
        
        return choices


class RightTriangleHeightGenerator(QuestionGenerator):
    """Generate right triangle height problems"""
    
    def generate(self):
        # A ladder problem or building height problem
        scenarios = [
            ('A ladder is placed against a wall', 'ladder'),
            ('A ramp leads up to a platform', 'ramp'),
            ('A cable supports a tower', 'cable'),
        ]
        
        scenario_text, hypotenuse_name = random.choice(scenarios)
        
        # Generate measurements
        hypotenuse = random.choice([10, 12, 15, 20, 25, 30])
        base = random.choice([6, 8, 9, 12, 15, 18])
        
        # Make sure base < hypotenuse
        if base >= hypotenuse:
            base = int(hypotenuse * 0.6)
        
        # Calculate height using Pythagorean theorem
        exact = math.sqrt(hypotenuse**2 - base**2)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'{scenario_text}. The {hypotenuse_name} is {hypotenuse} meters long and the base is {base} meters from the wall. Find the height. Use: height = √(hypotenuse² - base²)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'height = √({hypotenuse}² - {base}²) = √({hypotenuse**2} - {base**2}) = √{hypotenuse**2 - base**2} ≈ {round(exact, 1)} m'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 1)
            choices[letter] = value
        
        return choices


# ============================================================================
# EARTH ROTATION AND TIME ZONE GENERATORS
# ============================================================================

# Global city timezone dictionary (UTC offsets)
CITY_TIMEZONES = {
    # Asia-Pacific
    'Tokyo': ('Japan', 'UTC+9', 9),
    'Seoul': ('South Korea', 'UTC+9', 9),
    'Beijing': ('China', 'UTC+8', 8),
    'Shanghai': ('China', 'UTC+8', 8),
    'Hong Kong': ('Hong Kong', 'UTC+8', 8),
    'Singapore': ('Singapore', 'UTC+8', 8),
    'Bangkok': ('Thailand', 'UTC+7', 7),
    'Jakarta': ('Indonesia', 'UTC+7', 7),
    'Mumbai': ('India', 'UTC+5:30', 5.5),
    'Delhi': ('India', 'UTC+5:30', 5.5),
    'Dubai': ('UAE', 'UTC+4', 4),
    'Sydney': ('Australia', 'UTC+10', 10),
    'Melbourne': ('Australia', 'UTC+10', 10),
    'Auckland': ('New Zealand', 'UTC+12', 12),
    
    # Europe
    'London': ('UK', 'UTC+0', 0),
    'Paris': ('France', 'UTC+1', 1),
    'Berlin': ('Germany', 'UTC+1', 1),
    'Rome': ('Italy', 'UTC+1', 1),
    'Madrid': ('Spain', 'UTC+1', 1),
    'Amsterdam': ('Netherlands', 'UTC+1', 1),
    'Moscow': ('Russia', 'UTC+3', 3),
    'Athens': ('Greece', 'UTC+2', 2),
    'Istanbul': ('Turkey', 'UTC+3', 3),
    
    # Americas
    'New York': ('USA', 'UTC-5', -5),
    'Los Angeles': ('USA', 'UTC-8', -8),
    'Chicago': ('USA', 'UTC-6', -6),
    'San Francisco': ('USA', 'UTC-8', -8),
    'Toronto': ('Canada', 'UTC-5', -5),
    'Vancouver': ('Canada', 'UTC-8', -8),
    'Mexico City': ('Mexico', 'UTC-6', -6),
    'São Paulo': ('Brazil', 'UTC-3', -3),
    'Buenos Aires': ('Argentina', 'UTC-3', -3),
    
    # Africa & Middle East
    'Cairo': ('Egypt', 'UTC+2', 2),
    'Johannesburg': ('South Africa', 'UTC+2', 2),
    'Lagos': ('Nigeria', 'UTC+1', 1),
    'Nairobi': ('Kenya', 'UTC+3', 3),
}


