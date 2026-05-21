"""
Advanced physics question generators with formulas.
"""

import random
import math
from .base import QuestionGenerator


class ElectricalPowerPVIGenerator(QuestionGenerator):
    """Generate P = VI electrical power questions"""
    
    def generate(self):
        voltage = random.choice([12, 24, 110, 120, 220, 240])
        current = round(random.uniform(0.5, 10), 1)
        
        exact = voltage * current
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate electrical power using P = VI. Voltage = {voltage} V, Current = {current} A',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'P = VI = {voltage} × {current} = {round(exact, 1)} W',
            'unit': 'W'
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


class ElectricalPowerI2RGenerator(QuestionGenerator):
    """Generate P = I²R electrical power questions"""
    
    def generate(self):
        current = round(random.uniform(2, 8), 1)
        resistance = random.choice([5, 10, 15, 20, 25, 30, 40, 50])
        
        exact = (current ** 2) * resistance
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate electrical power using P = I²R. Current = {current} A, Resistance = {resistance} Ω',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'P = I²R = {current}² × {resistance} = {round(current**2, 1)} × {resistance} = {round(exact, 1)} W',
            'unit': 'W'
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


class ElectricalPowerV2RGenerator(QuestionGenerator):
    """Generate P = V²/R electrical power questions"""
    
    def generate(self):
        voltage = random.choice([12, 24, 48, 110, 120, 220, 240])
        resistance = random.choice([10, 20, 30, 40, 50, 100])
        
        exact = (voltage ** 2) / resistance
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate electrical power using P = V²/R. Voltage = {voltage} V, Resistance = {resistance} Ω',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'P = V²/R = {voltage}² / {resistance} = {voltage**2} / {resistance} = {round(exact, 1)} W',
            'unit': 'W'
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


class OhmsLawVoltageGenerator(QuestionGenerator):
    """Generate V = IR Ohm's Law questions"""
    
    def generate(self):
        current = round(random.uniform(0.5, 5), 1)
        resistance = random.choice([10, 15, 20, 25, 30, 40, 50, 100])
        
        exact = current * resistance
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate voltage using V = IR (Ohm\'s Law). Current = {current} A, Resistance = {resistance} Ω',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'V = IR = {current} × {resistance} = {round(exact, 1)} V',
            'unit': 'V'
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


class OhmsLawCurrentGenerator(QuestionGenerator):
    """Generate I = V/R Ohm's Law questions"""
    
    def generate(self):
        voltage = random.choice([12, 24, 48, 110, 120, 220, 240])
        resistance = random.choice([10, 20, 30, 40, 50, 100, 200])
        
        exact = voltage / resistance
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate current using I = V/R (Ohm\'s Law). Voltage = {voltage} V, Resistance = {resistance} Ω',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'I = V/R = {voltage} / {resistance} = {round(exact, 2)} A',
            'unit': 'A'
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


class OhmsLawResistanceGenerator(QuestionGenerator):
    """Generate R = V/I Ohm's Law questions"""
    
    def generate(self):
        voltage = random.choice([12, 24, 48, 110, 120, 220])
        current = round(random.uniform(0.5, 5), 1)
        
        exact = voltage / current
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate resistance using R = V/I (Ohm\'s Law). Voltage = {voltage} V, Current = {current} A',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'R = V/I = {voltage} / {current} = {round(exact, 1)} Ω',
            'unit': 'Ω'
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


class PressureGenerator(QuestionGenerator):
    """Generate P = F/A pressure questions"""
    
    def generate(self):
        force = random.choice([100, 200, 300, 500, 800, 1000, 1500, 2000])
        area = round(random.uniform(0.5, 5), 1)
        
        exact = force / area
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate pressure using P = F/A. Force = {force} N, Area = {area} m²',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'P = F/A = {force} / {area} = {round(exact, 1)} Pa',
            'unit': 'Pa'
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


class BuoyancyForceGenerator(QuestionGenerator):
    """Generate F = ρVg buoyancy force questions (Archimedes principle) with mixed units"""
    
    def generate(self):
        # Density in kg/m³
        densities = [
            ('water', 1000),
            ('seawater', 1025),
            ('oil', 900),
            ('mercury', 13600),
        ]
        
        fluid, density = random.choice(densities)
        volume = round(random.uniform(0.1, 2), 2)  # m³
        g = 9.8  # m/s²
        
        exact = density * volume * g
        
        # Generate mixed unit choices (N, kN, mN)
        choices = self.generate_mixed_unit_choices(exact, 'N', 'force')
        
        # Find correct answer using normalized values
        base_factor = self.UNIT_CONVERSIONS['force']['N']
        exact_normalized = exact * base_factor
        correct = self.find_closest_mixed_unit_choice(exact_normalized, choices)
        
        return {
            'question': f'Calculate buoyancy force using F = ρVg (Archimedes principle). Object volume = {volume} m³ submerged in {fluid} (ρ = {density} kg/m³, g = 9.8 m/s²)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'F = ρVg = {density} × {volume} × 9.8 ≈ {round(exact, 1)} N'
        }


class CentripetalForceGenerator(QuestionGenerator):
    """Generate F = mv²/r centripetal force questions"""
    
    def generate(self):
        mass = round(random.uniform(2, 10), 1)
        velocity = random.choice([5, 8, 10, 12, 15, 20])
        radius = round(random.uniform(2, 10), 1)
        
        exact = (mass * velocity ** 2) / radius
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate centripetal force using F = mv²/r. Mass = {mass} kg, Velocity = {velocity} m/s, Radius = {radius} m',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'F = mv²/r = {mass} × {velocity}² / {radius} = {mass} × {velocity**2} / {radius} ≈ {round(exact, 1)} N',
            'unit': 'N'
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
