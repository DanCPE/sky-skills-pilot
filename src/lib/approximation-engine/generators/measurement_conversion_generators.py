"""
Additional measurement conversion question generators.
"""

import random
from .base import QuestionGenerator


class CookingVolumeGenerator(QuestionGenerator):
    """Generate cooking volume conversion questions"""
    
    def generate(self):
        conversions = [
            ('cups', 'mL', 240, 'cups', 'mL'),
            ('tablespoons', 'mL', 15, 'tbsp', 'mL'),
            ('teaspoons', 'mL', 5, 'tsp', 'mL'),
            ('cups', 'tablespoons', 16, 'cups', 'tbsp'),
            ('tablespoons', 'teaspoons', 3, 'tbsp', 'tsp'),
            ('fluid ounces', 'mL', 29.57, 'fl oz', 'mL'),
            ('pints', 'mL', 473, 'pints', 'mL'),
        ]
        
        from_unit, to_unit, factor, from_abbr, to_abbr = random.choice(conversions)
        
        # Select appropriate value
        if factor >= 100:
            value = random.choice([1, 2, 3, 4, 5])
        elif factor >= 10:
            value = random.choice([2, 3, 4, 5, 6, 8, 10])
        else:
            value = random.choice([4, 6, 8, 12, 16, 24])
        
        exact = value * factor
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {value} {from_unit} to {to_unit} (1 {from_abbr} = {factor} {to_abbr})',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{value} {from_abbr} × {factor} = {exact} {to_abbr}',
            'unit': to_abbr
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            if exact >= 100:
                value = int(exact + offsets[i])
            else:
                value = round(exact + offsets[i], 1)
            choices[letter] = value
        
        return choices


class DataStorageGenerator(QuestionGenerator):
    """Generate data storage conversion questions"""
    
    def generate(self):
        conversions = [
            ('GB', 'MB', 1024, 'GB', 'MB'),
            ('MB', 'KB', 1024, 'MB', 'KB'),
            ('TB', 'GB', 1024, 'TB', 'GB'),
            ('GB', 'KB', 1048576, 'GB', 'KB'),
        ]
        
        from_unit, to_unit, factor, from_abbr, to_abbr = random.choice(conversions)
        
        # Select appropriate value
        if factor > 1000000:
            value = round(random.uniform(0.5, 2), 1)
        elif factor > 1000:
            value = random.choice([2, 4, 8, 16, 32, 64])
        else:
            value = random.choice([1, 2, 4, 8, 16, 32, 64, 128, 256])
        
        exact = value * factor
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {value} {from_unit} to {to_unit} (1 {from_abbr} = {factor} {to_abbr})',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{value} {from_abbr} × {factor} = {exact} {to_abbr}',
            'unit': to_abbr
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            if exact >= 1000:
                value = int(exact + offsets[i])
            else:
                value = round(exact + offsets[i], 1)
            choices[letter] = value
        
        return choices


class PressureConversionGenerator(QuestionGenerator):
    """Generate pressure conversion questions"""
    
    def generate(self):
        conversions = [
            ('PSI', 'kPa', 6.895, 'PSI', 'kPa'),
            ('bar', 'kPa', 100, 'bar', 'kPa'),
            ('atm', 'kPa', 101.325, 'atm', 'kPa'),
            ('PSI', 'bar', 0.06895, 'PSI', 'bar'),
        ]
        
        from_unit, to_unit, factor, from_abbr, to_abbr = random.choice(conversions)
        
        # Select appropriate value
        if factor >= 100:
            value = random.choice([1, 2, 3, 4, 5])
        elif factor >= 1:
            value = random.choice([10, 15, 20, 25, 30, 32, 35, 40])
        else:
            value = random.choice([20, 25, 30, 32, 35, 40, 45, 50])
        
        exact = value * factor
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {value} {from_unit} to {to_unit} (1 {from_abbr} = {factor} {to_abbr})',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{value} {from_abbr} × {factor} = {exact:.2f} {to_abbr}',
            'unit': to_abbr
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


class EnergyConversionGenerator(QuestionGenerator):
    """Generate energy conversion questions"""
    
    def generate(self):
        conversions = [
            ('calories', 'joules', 4.184, 'cal', 'J'),
            ('kilocalories', 'kilojoules', 4.184, 'kcal', 'kJ'),
            ('kWh', 'joules', 3600000, 'kWh', 'J'),
            ('kWh', 'MJ', 3.6, 'kWh', 'MJ'),
            ('BTU', 'joules', 1055, 'BTU', 'J'),
        ]
        
        from_unit, to_unit, factor, from_abbr, to_abbr = random.choice(conversions)
        
        # Select appropriate value
        if factor >= 1000000:
            value = round(random.uniform(0.5, 3), 1)
        elif factor >= 1000:
            value = random.choice([1, 2, 3, 4, 5])
        elif factor >= 100:
            value = random.choice([5, 10, 15, 20, 25])
        else:
            value = random.choice([100, 200, 300, 500, 1000])
        
        exact = value * factor
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {value} {from_unit} to {to_unit} (1 {from_abbr} = {factor} {to_abbr})',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{value} {from_abbr} × {factor} = {exact} {to_abbr}',
            'unit': to_abbr
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            if exact >= 1000:
                value = int(exact + offsets[i])
            else:
                value = round(exact + offsets[i], 1)
            choices[letter] = value
        
        return choices


class TimeUnitDetailedGenerator(QuestionGenerator):
    """Generate complex time unit conversion questions"""
    
    def generate(self):
        conversions = [
            ('days', 'hours', 24, 'days', 'hours'),
            ('days', 'minutes', 1440, 'days', 'minutes'),
            ('weeks', 'hours', 168, 'weeks', 'hours'),
            ('hours', 'seconds', 3600, 'hours', 'seconds'),
        ]
        
        from_unit, to_unit, factor, from_abbr, to_abbr = random.choice(conversions)
        
        # Select appropriate value
        if factor >= 1000:
            value = random.choice([1, 2, 3, 4, 5])
        elif factor >= 100:
            value = random.choice([2, 3, 4, 5, 7, 10])
        else:
            value = random.choice([3, 5, 7, 10, 14, 21])
        
        exact = value * factor
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {value} {from_unit} to {to_unit}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{value} {from_abbr} × {factor} = {exact} {to_abbr}',
            'unit': to_abbr
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
