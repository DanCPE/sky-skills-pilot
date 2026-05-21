"""
Earth rotation and time zone question generators.
Includes questions about longitude, time zones, rotation speed, and angles.
"""

import random
from .base import QuestionGenerator


# Global city timezone dictionary (UTC offsets)
# Format: 'City': ('Country', 'UTC String', UTC Offset Hours)
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


class TimeZoneLongitudeGenerator(QuestionGenerator):
    """Generate time difference to longitude angle conversion questions"""
    
    def generate(self):
        # Select two random cities
        cities = list(CITY_TIMEZONES.keys())
        city1, city2 = random.sample(cities, 2)
        
        # Get timezone info
        country1, tz1_str, tz1 = CITY_TIMEZONES[city1]
        country2, tz2_str, tz2 = CITY_TIMEZONES[city2]
        
        # Calculate time difference
        time_diff = abs(tz1 - tz2)
        
        # Skip if time difference is too small (less than 1 hour)
        if time_diff < 1:
            # Try again with different cities
            city1, city2 = random.sample(cities, 2)
            country1, tz1_str, tz1 = CITY_TIMEZONES[city1]
            country2, tz2_str, tz2 = CITY_TIMEZONES[city2]
            time_diff = abs(tz1 - tz2)
        
        # Calculate longitude difference: 15° per hour
        exact = time_diff * 15
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        # Create vibrant question with context
        question_templates = [
            f'When it\'s noon in {city1} ({tz1_str}), what is the approximate longitude difference to {city2} ({tz2_str})? They have a {time_diff}-hour time difference. (Use: 15° per hour)',
            f'{city1}, {country1} and {city2}, {country2} are separated by {time_diff} time zones. What is their longitude difference in degrees? (Use: 15° per hour)',
            f'A flight from {city1} to {city2} crosses {time_diff} time zones. What is the approximate longitude difference between these cities? (Use: 15° per hour)',
            f'Calculate the longitude difference: {city1} ({tz1_str}) and {city2} ({tz2_str}) have {time_diff} hours time difference. (Use: 15° per hour)',
        ]
        
        question = random.choice(question_templates)
        
        return {
            'question': question,
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{city1} is at {tz1_str} and {city2} is at {tz2_str}. Time difference = {time_diff} hours. Earth rotates 15°/hour, so longitude difference = {time_diff} × 15° = {exact}°'
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


class EarthRotationSpeedGenerator(QuestionGenerator):
    """Generate Earth rotation speed at different latitudes questions using cos(latitude)"""
    
    def generate(self):
        import math
        
        # Different latitudes
        latitudes = [30, 45, 60]
        latitude = random.choice(latitudes)
        
        # Equatorial speed
        equatorial_speed = 1674  # km/h
        
        # Calculate using formula: Speed = Equatorial Speed × cos(latitude)
        latitude_rad = math.radians(latitude)
        exact = equatorial_speed * math.cos(latitude_rad)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        # Create explanation with approximation hint
        cos_approx = {
            30: ('0.87', '0.9'),
            45: ('0.71', '0.7'),
            60: ('0.5', '0.5'),
        }
        
        cos_exact, cos_round = cos_approx[latitude]
        approx_calc = int(equatorial_speed * float(cos_round))
        
        return {
            'question': f'Calculate Earth\'s rotation speed at {latitude}° latitude. Use: Speed = 1,674 km/h × cos({latitude}°)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Speed = 1,674 × cos({latitude}°) ≈ 1,674 × {cos_round} ≈ {approx_calc} km/h (exact: {int(exact)} km/h)'
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


class LongitudeToTimeGenerator(QuestionGenerator):
    """Generate longitude difference to time difference conversion questions"""
    
    def generate(self):
        # Generate random longitude differences (multiples of 15 for clean answers)
        longitude_multiples = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180]
        longitude_diff = random.choice(longitude_multiples)
        
        # Calculate time difference: 1 hour per 15°
        exact = longitude_diff / 15
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Two cities are separated by {longitude_diff}° of longitude. What is their time difference in hours? (Earth rotates 15° per hour)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Time difference = {longitude_diff}° ÷ 15°/hour = {exact} hours'
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


class EarthRotationAngleGenerator(QuestionGenerator):
    """Generate angle of Earth rotation in given time questions"""
    
    def generate(self):
        # Various time periods
        time_periods = [
            (1, 'hour', 15),
            (2, 'hours', 30),
            (3, 'hours', 45),
            (4, 'hours', 60),
            (6, 'hours', 90),
            (8, 'hours', 120),
            (12, 'hours', 180),
            (30, 'minutes', 7.5),
            (45, 'minutes', 11.25),
            (90, 'minutes', 22.5),
        ]
        
        time_value, time_unit, angle = random.choice(time_periods)
        
        exact = angle
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'How many degrees does Earth rotate in {time_value} {time_unit}? (Earth completes 360° in 24 hours)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Earth rotates 360° in 24 hours = 15°/hour. In {time_value} {time_unit}: {exact}°'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 2)
            choices[letter] = value
        
        return choices
