"""
Unit conversion question generators (Imperial ↔ SI).
"""

import random
from .base import QuestionGenerator


class MilesToKilometersGenerator(QuestionGenerator):
    """Generate miles to kilometers conversion questions"""
    
    def generate(self):
        # 1 mile = 1.60934 km
        miles = random.choice([5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200])
        
        exact = miles * 1.60934
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {miles} miles to kilometers (1 mile = 1.609 km)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{miles} miles × 1.6 ≈ {miles} × 1.6 = {round(miles * 1.6, 1)} km (actual: {round(exact, 1)} km)',
            'unit': 'km'
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


class InchesToCentimetersGenerator(QuestionGenerator):
    """Generate inches to centimeters conversion questions"""
    
    def generate(self):
        # 1 inch = 2.54 cm
        inches = random.choice([6, 8, 10, 12, 15, 18, 20, 24, 30, 36, 48, 60])
        
        exact = inches * 2.54
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {inches} inches to centimeters (1 inch = 2.54 cm)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{inches} in × 2.5 ≈ {round(inches * 2.5, 1)} cm (actual: {round(exact, 1)} cm)',
            'unit': 'cm'
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


class PoundsToKilogramsGenerator(QuestionGenerator):
    """Generate pounds to kilograms conversion questions"""
    
    def generate(self):
        # 1 pound = 0.453592 kg
        pounds = random.choice([10, 20, 25, 50, 75, 100, 150, 200, 250, 500])
        
        exact = pounds * 0.453592
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {pounds} pounds to kilograms (1 lb = 0.454 kg)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{pounds} lb × 0.45 ≈ {round(pounds * 0.45, 1)} kg (actual: {round(exact, 1)} kg)',
            'unit': 'kg'
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


class OuncesToGramsGenerator(QuestionGenerator):
    """Generate ounces to grams conversion questions"""
    
    def generate(self):
        # 1 ounce = 28.3495 grams
        ounces = random.choice([2, 4, 6, 8, 10, 12, 16, 20, 24, 32])
        
        exact = ounces * 28.3495
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {ounces} ounces to grams (1 oz = 28.35 g)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{ounces} oz × 28 ≈ {ounces * 28} g (actual: {round(exact, 1)} g)',
            'unit': 'g'
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


class YardsToMetersGenerator(QuestionGenerator):
    """Generate yards to meters conversion questions"""
    
    def generate(self):
        # 1 yard = 0.9144 meters
        yards = random.choice([10, 25, 50, 75, 100, 150, 200, 300, 500])
        
        exact = yards * 0.9144
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {yards} yards to meters (1 yard = 0.914 m)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{yards} yd × 0.9 ≈ {round(yards * 0.9, 1)} m (actual: {round(exact, 1)} m)',
            'unit': 'm'
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


class QuartsToLitersGenerator(QuestionGenerator):
    """Generate quarts to liters conversion questions"""
    
    def generate(self):
        # 1 US quart = 0.946353 liters
        quarts = random.choice([2, 4, 6, 8, 10, 12, 16, 20, 24, 32])
        
        exact = quarts * 0.946353
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {quarts} quarts to liters (1 qt = 0.946 L)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{quarts} qt × 0.95 ≈ {round(quarts * 0.95, 1)} L (actual: {round(exact, 1)} L)',
            'unit': 'L'
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


class FahrenheitToCelsiusGenerator(QuestionGenerator):
    """Generate Fahrenheit to Celsius conversion questions"""
    
    def generate(self):
        # C = (F - 32) × 5/9
        fahrenheit = random.choice([32, 50, 68, 77, 86, 95, 104, 113, 122, 140, 212])
        
        exact = (fahrenheit - 32) * 5 / 9
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {fahrenheit}°F to Celsius (C = (F - 32) × 5/9)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'({fahrenheit} - 32) × 5/9 = {fahrenheit - 32} × 0.56 ≈ {round(exact, 1)}°C',
            'unit': '°C'
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


class CelsiusToFahrenheitGenerator(QuestionGenerator):
    """Generate Celsius to Fahrenheit conversion questions"""
    
    def generate(self):
        # F = C × 9/5 + 32
        celsius = random.choice([0, 10, 15, 20, 25, 30, 35, 37, 40, 50, 100])
        
        exact = celsius * 9 / 5 + 32
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {celsius}°C to Fahrenheit (F = C × 9/5 + 32)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{celsius} × 1.8 + 32 = {round(celsius * 1.8, 1)} + 32 = {round(exact, 1)}°F',
            'unit': '°F'
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


class AcresToHectaresGenerator(QuestionGenerator):
    """Generate acres to hectares conversion questions"""
    
    def generate(self):
        # 1 acre = 0.404686 hectares
        acres = random.choice([1, 2, 5, 10, 20, 25, 50, 100, 150, 200])
        
        exact = acres * 0.404686
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {acres} acres to hectares (1 acre = 0.405 ha)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{acres} acres × 0.4 ≈ {round(acres * 0.4, 1)} ha (actual: {round(exact, 1)} ha)',
            'unit': 'ha'
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


class MPHToKPHGenerator(QuestionGenerator):
    """Generate miles per hour to kilometers per hour conversion questions"""
    
    def generate(self):
        # 1 mph = 1.60934 km/h
        mph = random.choice([20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80])
        
        exact = mph * 1.60934
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A car travels at {mph} mph. Convert to km/h (1 mph = 1.609 km/h)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{mph} mph × 1.6 ≈ {round(mph * 1.6, 1)} km/h (actual: {round(exact, 1)} km/h)',
            'unit': 'km/h'
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
