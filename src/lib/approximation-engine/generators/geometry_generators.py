"""
Geometry and trigonometry question generators with formulas.
"""

import random
import math
from .base import QuestionGenerator


class CircleAreaGenerator(QuestionGenerator):
    """Generate circle area questions using A = πr² with mixed units"""
    
    def generate(self):
        # Choose whether to give radius or diameter
        give_diameter = random.choice([True, False])
        
        if give_diameter:
            diameter = random.choice([4, 6, 8, 10, 12, 14, 16, 18, 20])
            radius = diameter / 2
            question = f'Calculate the area of a circle using A = πr². Diameter = {diameter} cm'
        else:
            radius = random.choice([2, 3, 4, 5, 6, 7, 8, 9, 10])
            question = f'Calculate the area of a circle using A = πr². Radius = {radius} cm'
        
        exact = math.pi * (radius ** 2)
        
        # Generate mixed unit choices (cm², m², mm²)
        choices = self.generate_mixed_unit_choices(exact, 'cm²', 'area')
        
        # Find correct answer using normalized values
        base_factor = self.UNIT_CONVERSIONS['area']['cm²']
        exact_normalized = exact * base_factor
        correct = self.find_closest_mixed_unit_choice(exact_normalized, choices)
        
        return {
            'question': question,
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'A = πr² = π × {radius}² ≈ 3.14 × {radius**2} ≈ {round(exact, 1)} cm²'
        }


class CircleCircumferenceGenerator(QuestionGenerator):
    """Generate circle circumference questions using C = 2πr with mixed units"""
    
    def generate(self):
        # Choose whether to give radius or diameter
        give_diameter = random.choice([True, False])
        
        if give_diameter:
            diameter = random.choice([4, 6, 8, 10, 12, 14, 16, 18, 20, 25, 30])
            radius = diameter / 2
            question = f'Calculate the circumference of a circle using C = 2πr. Diameter = {diameter} cm'
        else:
            radius = random.choice([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15])
            question = f'Calculate the circumference of a circle using C = 2πr. Radius = {radius} cm'
        
        exact = 2 * math.pi * radius
        
        # Generate mixed unit choices (cm, m, mm) - use small_distance to avoid km
        choices = self.generate_mixed_unit_choices(exact, 'cm', 'small_distance')
        
        # Find correct answer using normalized values
        base_factor = self.UNIT_CONVERSIONS['small_distance']['cm']
        exact_normalized = exact * base_factor
        correct = self.find_closest_mixed_unit_choice(exact_normalized, choices)
        
        return {
            'question': question,
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'C = 2πr = 2 × π × {radius} ≈ 2 × 3.14 × {radius} ≈ {round(exact, 1)} cm'
        }


class SphereVolumeGenerator(QuestionGenerator):
    """Generate sphere volume questions using V = 4/3πr³"""
    
    def generate(self):
        radius = random.choice([2, 3, 4, 5, 6, 7, 8, 9, 10])
        
        exact = (4/3) * math.pi * (radius ** 3)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate the volume of a sphere using V = 4/3πr³. Radius = {radius} cm',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'V = 4/3πr³ = 4/3 × π × {radius}³ ≈ 1.33 × 3.14 × {radius**3} ≈ {round(exact, 1)} cm³',
            'unit': 'cm³'
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


class ConeVolumeGenerator(QuestionGenerator):
    """Generate cone volume questions using V = 1/3πr²h"""
    
    def generate(self):
        radius = random.choice([3, 4, 5, 6, 7, 8, 10])
        height = random.choice([5, 8, 10, 12, 15, 18, 20])
        
        exact = (1/3) * math.pi * (radius ** 2) * height
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate the volume of a cone using V = 1/3πr²h. Radius = {radius} cm, Height = {height} cm',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'V = 1/3πr²h = 1/3 × π × {radius}² × {height} ≈ 0.33 × 3.14 × {radius**2} × {height} ≈ {round(exact, 1)} cm³',
            'unit': 'cm³'
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


class TriangleAreaBaseHeightGenerator(QuestionGenerator):
    """Generate triangle area questions using A = 1/2 × base × height"""
    
    def generate(self):
        base = random.choice([4, 6, 8, 10, 12, 14, 16, 18, 20])
        height = random.choice([3, 5, 7, 9, 11, 13, 15])
        
        exact = 0.5 * base * height
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate the area of a triangle using A = 1/2 × base × height. Base = {base} cm, Height = {height} cm',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'A = 1/2 × base × height = 0.5 × {base} × {height} = {round(exact, 1)} cm²',
            'unit': 'cm²'
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


class TriangleAreaHeronsGenerator(QuestionGenerator):
    """Generate triangle area questions using Heron's formula: A = √(s(s-a)(s-b)(s-c))"""
    
    def generate(self):
        # Generate valid triangle sides
        # Use common Pythagorean triples or near-triangles
        triangles = [
            (3, 4, 5),
            (5, 12, 13),
            (8, 15, 17),
            (7, 24, 25),
            (6, 8, 10),
            (9, 12, 15),
            (5, 5, 6),
            (5, 5, 8),
            (7, 7, 10),
            (8, 8, 12),
        ]
        
        a, b, c = random.choice(triangles)
        
        # Calculate using Heron's formula
        s = (a + b + c) / 2  # semi-perimeter
        exact = math.sqrt(s * (s - a) * (s - b) * (s - c))
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate the area of a triangle using Heron\'s formula: A = √(s(s-a)(s-b)(s-c)) where s = (a+b+c)/2. Sides: a = {a} cm, b = {b} cm, c = {c} cm',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Semi-perimeter s = ({a}+{b}+{c})/2 = {s}. A = √({s}×{s-a}×{s-b}×{s-c}) ≈ {round(exact, 1)} cm²',
            'unit': 'cm²'
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


class AngleConversionDegreesToRadiansGenerator(QuestionGenerator):
    """Generate angle conversion from degrees to radians"""
    
    def generate(self):
        # Common angles
        degrees = random.choice([30, 45, 60, 90, 120, 135, 150, 180, 210, 270, 360])
        
        exact = degrees * (math.pi / 180)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {degrees}° to radians using: radians = degrees × π/180',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{degrees}° × π/180 = {degrees} × 3.14/180 ≈ {round(exact, 3)} radians',
            'unit': 'rad'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 3)
            choices[letter] = value
        
        return choices


class AngleConversionRadiansToDegreesGenerator(QuestionGenerator):
    """Generate angle conversion from radians to degrees"""
    
    def generate(self):
        # Common radian values
        radian_fractions = [
            (1, 6, 'π/6'),
            (1, 4, 'π/4'),
            (1, 3, 'π/3'),
            (1, 2, 'π/2'),
            (2, 3, '2π/3'),
            (3, 4, '3π/4'),
            (1, 1, 'π'),
            (3, 2, '3π/2'),
            (2, 1, '2π'),
        ]
        
        numerator, denominator, display = random.choice(radian_fractions)
        radians = (numerator / denominator) * math.pi
        
        exact = radians * (180 / math.pi)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {display} radians to degrees using: degrees = radians × 180/π',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{display} × 180/π ≈ {round(radians, 3)} × 180/3.14 ≈ {round(exact, 1)}°',
            'unit': '°'
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
