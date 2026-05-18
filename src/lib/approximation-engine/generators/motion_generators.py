"""
Motion question generators.
"""

import random
import math
from .base import QuestionGenerator


class DisplacementMotionGenerator(QuestionGenerator):
    """Generate s = ut + ½at² questions with mixed units"""
    
    def generate(self):
        u = round(random.uniform(5, 20), 1)  # Initial velocity
        a = round(random.uniform(1, 5), 1)   # Acceleration
        t = round(random.uniform(3, 8), 1)   # Time
        
        exact = u * t + 0.5 * a * (t ** 2)
        
        # Generate mixed unit choices (m, cm, km)
        choices = self.generate_mixed_unit_choices(exact, 'm', 'distance')
        
        # Find correct answer using normalized values
        base_factor = self.UNIT_CONVERSIONS['distance']['m']
        exact_normalized = exact * base_factor
        correct = self.find_closest_mixed_unit_choice(exact_normalized, choices)
        
        return {
            'question': f'An object with initial velocity {u} m/s accelerates at {a} m/s² for {t} seconds. Calculate the displacement using s = ut + ½at².',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f's = ut + ½at². Approximate: {int(u)}×{int(t)} + 0.5×{int(a)}×{int(t)}² = {int(u*t)} + {int(0.5*a*t**2)} = {int(exact)} m'
        }


class FinalVelocityGenerator(QuestionGenerator):
    """Generate v = u + at questions"""
    
    def generate(self):
        u = round(random.uniform(5, 25), 1)  # Initial velocity
        a = round(random.uniform(2, 8), 1)   # Acceleration
        t = round(random.uniform(3, 10), 1)  # Time
        
        exact = u + a * t
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'An object starts at {u} m/s and accelerates at {a} m/s² for {t} seconds. Calculate the final velocity using v = u + at (in m/s).',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'v = u + at. Approximate: {int(u)} + {int(a)}×{int(t)} = {int(u)} + {int(a*t)} = {int(exact)} m/s'
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


class VelocitySquaredGenerator(QuestionGenerator):
    """Generate v² = u² + 2as questions"""
    
    def generate(self):
        u = round(random.uniform(8, 20), 1)   # Initial velocity
        a = round(random.uniform(2, 6), 1)    # Acceleration
        s = round(random.uniform(15, 40), 1)  # Displacement
        
        v_squared = u**2 + 2 * a * s
        exact = math.sqrt(v_squared)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'An object with initial velocity {u} m/s accelerates at {a} m/s² over {s} m. Calculate the final velocity using v² = u² + 2as (in m/s).',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'v² = u² + 2as, then v = √(u² + 2as). Approximate: √({int(u)}² + 2×{int(a)}×{int(s)}) = √({int(u**2)} + {int(2*a*s)}) = √{int(v_squared)} ≈ {int(exact)} m/s'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = [exact * -0.15, exact * -0.05, exact * 0.04, exact * 0.12, exact * 0.20]
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 1)
            choices[letter] = value
        
        return choices


class AverageVelocityGenerator(QuestionGenerator):
    """Generate average velocity = (u + v)/2 questions"""
    
    def generate(self):
        u = round(random.uniform(10, 25), 1)  # Initial velocity
        v = round(random.uniform(30, 60), 1)  # Final velocity
        
        exact = (u + v) / 2
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'An object accelerates uniformly from {u} m/s to {v} m/s. Calculate the average velocity using v_avg = (u + v)/2 (in m/s).',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Average velocity = (u + v)/2. Approximate: ({int(u)} + {int(v)})/2 = {int(u+v)}/2 = {int(exact)} m/s'
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


