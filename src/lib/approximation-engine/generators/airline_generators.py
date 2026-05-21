"""
Airline question generators.
"""

import random
from .base import QuestionGenerator


class NauticalMileConversionGenerator(QuestionGenerator):
    """Generate nautical miles to kilometers conversion questions"""
    
    def generate(self):
        # 1 nautical mile = 1.852 km
        nautical_miles = random.choice([50, 100, 150, 200, 250, 300, 350, 500, 750, 1000])
        
        exact = nautical_miles * 1.852
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {nautical_miles} nautical miles to kilometers (1 NM = 1.852 km)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{nautical_miles} NM × 1.852 ≈ {nautical_miles} × 2 = {nautical_miles * 2} km (actual: {int(exact)} km)',
            'unit': 'km'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = int(exact + offsets[i])
            choices[letter] = value
        
        return choices


class AltitudeConversionGenerator(QuestionGenerator):
    """Generate feet to meters conversion questions"""
    
    def generate(self):
        # 1 foot = 0.3048 meters
        feet = random.choice([5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000])
        
        exact = feet * 0.3048
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'An aircraft is cruising at {feet:,} feet. Convert to meters (1 ft = 0.3048 m)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{feet} ft × 0.3 ≈ {int(feet * 0.3)} m (actual: {int(exact)} m)',
            'unit': 'm'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = int(exact + offsets[i])
            choices[letter] = value
        
        return choices


class SpeedConversionKnotsGenerator(QuestionGenerator):
    """Generate knots to km/h conversion questions"""
    
    def generate(self):
        # 1 knot = 1.852 km/h
        knots = random.choice([100, 150, 200, 250, 300, 350, 400, 450, 500])
        
        exact = knots * 1.852
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'An aircraft travels at {knots} knots. Convert to km/h (1 knot = 1.852 km/h)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{knots} knots × 1.852 ≈ {knots} × 2 = {knots * 2} km/h (actual: {int(exact)} km/h)',
            'unit': 'km/h'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = int(exact + offsets[i])
            choices[letter] = value
        
        return choices


class FuelWeightConversionGenerator(QuestionGenerator):
    """Generate pounds to kilograms conversion questions"""
    
    def generate(self):
        # 1 pound = 0.453592 kg
        pounds = random.choice([1000, 2000, 3000, 5000, 8000, 10000, 15000, 20000])
        
        exact = pounds * 0.453592
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Fuel weight is {pounds:,} pounds. Convert to kilograms (1 lb = 0.454 kg)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{pounds} lb × 0.45 ≈ {int(pounds * 0.45)} kg (actual: {int(exact)} kg)',
            'unit': 'kg'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = int(exact + offsets[i])
            choices[letter] = value
        
        return choices


class FuelVolumeConversionGenerator(QuestionGenerator):
    """Generate gallons to liters conversion questions"""
    
    def generate(self):
        # 1 US gallon = 3.78541 liters
        gallons = random.choice([500, 1000, 1500, 2000, 2500, 3000, 4000, 5000])
        
        exact = gallons * 3.78541
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Fuel tank capacity is {gallons:,} gallons. Convert to liters (1 gal = 3.785 L)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{gallons} gal × 3.8 ≈ {gallons} × 4 = {gallons * 4} L (actual: {int(exact)} L)',
            'unit': 'L'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = int(exact + offsets[i])
            choices[letter] = value
        
        return choices


class TemperatureConversionGenerator(QuestionGenerator):
    """Generate temperature conversion questions (Celsius, Fahrenheit, Kelvin, Rømer)"""
    
    def generate(self):
        # Choose conversion type
        conversions = [
            ('C_to_F', 'Celsius', 'Fahrenheit', '°C', '°F'),
            ('F_to_C', 'Fahrenheit', 'Celsius', '°F', '°C'),
            ('C_to_K', 'Celsius', 'Kelvin', '°C', 'K'),
            ('K_to_C', 'Kelvin', 'Celsius', 'K', '°C'),
            ('C_to_R', 'Celsius', 'Rømer', '°C', '°Rø'),
            ('R_to_C', 'Rømer', 'Celsius', '°Rø', '°C'),
        ]
        
        conv_type, from_name, to_name, from_unit, to_unit = random.choice(conversions)
        
        # Generate appropriate temperature value
        if conv_type == 'C_to_F':
            value = random.choice([-40, -30, -20, -10, 0, 10, 15, 20, 25, 30, 35, 40])
            exact = (value * 9/5) + 32
            formula = 'F = C × 1.8 + 32'
            approx = f'{value}°C × 2 + 32 ≈ {value * 2 + 32}°F'
        elif conv_type == 'F_to_C':
            value = random.choice([-40, -20, 0, 32, 50, 68, 86, 100, 120])
            exact = (value - 32) * 5/9
            formula = 'C = (F - 32) × 5/9'
            approx = f'({value}°F - 32) ÷ 2 ≈ {(value - 32) // 2}°C'
        elif conv_type == 'C_to_K':
            value = random.choice([-40, -20, -10, 0, 10, 20, 25, 30, 40, 100])
            exact = value + 273.15
            formula = 'K = C + 273.15'
            approx = f'{value}°C + 273 ≈ {value + 273} K'
        elif conv_type == 'K_to_C':
            value = random.choice([233, 253, 263, 273, 283, 293, 298, 303, 313, 373])
            exact = value - 273.15
            formula = 'C = K - 273.15'
            approx = f'{value} K - 273 ≈ {value - 273}°C'
        elif conv_type == 'C_to_R':
            value = random.choice([-40, -20, -10, 0, 10, 20, 25, 30, 40, 60])
            exact = (value * 21/40) + 7.5
            formula = 'Rø = C × 21/40 + 7.5'
            approx = f'{value}°C × 0.5 + 7.5 ≈ {value * 0.5 + 7.5}°Rø'
        else:  # R_to_C
            value = random.choice([0, 7.5, 15, 20, 25, 30, 35, 40])
            exact = (value - 7.5) * 40/21
            formula = 'C = (Rø - 7.5) × 40/21'
            approx = f'({value}°Rø - 7.5) × 2 ≈ {(value - 7.5) * 2}°C'
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        context = random.choice([
            f'Outside air temperature is {value}{from_unit}.',
            f'The temperature reads {value}{from_unit}.',
            f'Temperature measurement: {value}{from_unit}.',
        ])
        
        return {
            'question': f'{context} Convert to {to_name}. ({formula})',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{approx} (actual: {round(exact, 1)}{to_unit})'
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


class FlightTimeConversionGenerator(QuestionGenerator):
    """Generate flight time and distance calculations"""
    
    def generate(self):
        # Distance = Speed × Time
        speed_knots = random.choice([250, 300, 350, 400, 450, 500])
        time_hours = round(random.uniform(1.5, 5.0), 1)
        
        exact = speed_knots * time_hours
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'An aircraft flies at {speed_knots} knots for {time_hours} hours. Calculate distance in nautical miles.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Distance = Speed × Time = {speed_knots} × {time_hours} ≈ {int(exact)} NM',
            'unit': 'NM'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = int(exact + offsets[i])
            choices[letter] = value
        
        return choices


class FuelConsumptionGenerator(QuestionGenerator):
    """Generate fuel consumption rate questions"""
    
    def generate(self):
        # Fuel consumption in gallons per hour
        consumption_rate = random.choice([200, 250, 300, 350, 400, 500, 600])
        flight_hours = round(random.uniform(2.0, 6.0), 1)
        
        exact = consumption_rate * flight_hours
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'An aircraft consumes {consumption_rate} gallons/hour. How much fuel for a {flight_hours}-hour flight?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Fuel needed = {consumption_rate} gal/hr × {flight_hours} hr ≈ {int(exact)} gallons',
            'unit': 'gal'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = int(exact + offsets[i])
            choices[letter] = value
        
        return choices


class DescentRateGenerator(QuestionGenerator):
    """Generate descent rate calculation questions"""
    
    def generate(self):
        # Calculate descent rate in feet per minute
        altitude_loss = random.choice([5000, 8000, 10000, 12000, 15000, 18000, 20000])
        time_minutes = random.choice([10, 12, 15, 18, 20, 25, 30])
        
        exact = altitude_loss / time_minutes
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Descending from {altitude_loss:,} feet in {time_minutes} minutes. Calculate descent rate in feet/minute.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Descent rate = {altitude_loss} ft ÷ {time_minutes} min ≈ {int(exact)} ft/min',
            'unit': 'ft/min'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = int(exact + offsets[i])
            choices[letter] = value
        
        return choices


