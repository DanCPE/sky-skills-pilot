"""
Additional question generators.
"""

import random
import math
from .base import QuestionGenerator


class MultiTermAdditionGenerator(QuestionGenerator):
    """Generate multi-term addition questions (3-5 terms)"""
    
    def generate(self):
        num_terms = random.randint(3, 5)
        terms = []
        
        # Generate terms with varying magnitudes
        for i in range(num_terms):
            if random.random() < 0.3:  # 30% chance of larger numbers
                term = random.randint(200, 999)
            else:
                term = random.randint(20, 500)
            terms.append(term)
        
        exact = sum(terms)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        # Format question
        question_text = ' + '.join(str(t) for t in terms) + ' = ?'
        
        return {
            'question': f'Calculate {question_text}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Round each term and add: {" + ".join(str(round(t, -1)) for t in terms)} ≈ {int(exact)}'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = [exact * -0.15, exact * -0.05, exact * 0.02, exact * 0.12, exact * 0.20]
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = int(exact + offsets[i])
            choices[letter] = value
        
        return choices


class TripleMultiplicationGenerator(QuestionGenerator):
    """Generate triple multiplication questions (a × b × c)"""
    
    def generate(self):
        # Generate three numbers with decimals
        a = round(random.uniform(3, 10), 1)
        b = round(random.uniform(3, 10), 1)
        c = round(random.uniform(3, 12), 1)
        
        exact = a * b * c
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate {a} × {b} × {c}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {int(a)}×{int(b)}×{int(c)} = {int(a*b)}×{int(c)} ≈ {int(exact)}'
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


class MixedAddSubGenerator(QuestionGenerator):
    """Generate mixed addition and subtraction questions"""
    
    def generate(self):
        # Generate 2-4 terms with mixed operations
        num_terms = random.randint(3, 4)
        terms = []
        operations = []
        
        # First term is always positive
        first_term = random.randint(500, 5000)
        terms.append(first_term)
        result = first_term
        
        for i in range(num_terms - 1):
            op = random.choice(['+', '-'])
            operations.append(op)
            
            if op == '+':
                term = random.randint(100, 4000)
                terms.append(term)
                result += term
            else:
                term = random.randint(50, 1000)
                terms.append(term)
                result -= term
        
        exact = result
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        # Build question string
        question_parts = [str(terms[0])]
        for i, op in enumerate(operations):
            question_parts.append(f'{op} {terms[i+1]}')
        question_text = ' '.join(question_parts)
        
        return {
            'question': f'Calculate {question_text}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Work left to right with rounding: ≈ {int(exact)}'
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


class VolumeCalculationGenerator(QuestionGenerator):
    """Generate volume calculation questions (cube, rectangular solid, cylinder)"""
    
    def generate(self):
        shape_type = random.choice(['cube', 'rectangular', 'cylinder'])
        
        if shape_type == 'cube':
            side = random.randint(12, 25)
            exact = side ** 3
            question = f'A cube has sides of {side} inches. What is its volume in cubic inches?'
            explanation = f'Volume = side³ = {side}³ = {exact} cubic inches'
            
        elif shape_type == 'rectangular':
            length = random.randint(15, 25)
            width = random.randint(15, 25)
            height = random.randint(15, 25)
            exact = length * width * height
            question = f'A rectangular solid is {length} inches long, {width} inches wide, and {height} inches high. What is its volume in cubic inches?'
            explanation = f'Volume = l×w×h = {length}×{width}×{height} ≈ {exact} cubic inches'
            
        else:  # cylinder
            radius = random.randint(1, 5)
            height = random.randint(30, 50)
            exact = math.pi * (radius ** 2) * height
            question = f'A cylindrical solid is {height} inches high and has a diameter of {radius*2} inches. What is its volume in cubic inches?'
            explanation = f'Volume = πr²h = π×{radius}²×{height} ≈ {int(exact)} cubic inches'
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': question,
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': explanation
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = [exact * -0.15, exact * -0.05, exact * 0.03, exact * 0.12, exact * 0.20]
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = int(exact + offsets[i])
            choices[letter] = value
        
        return choices


class TimeScheduleGenerator(QuestionGenerator):
    """Generate time and schedule calculation questions"""
    
    def generate(self):
        # Work schedule scenario
        start_hour = random.randint(7, 9)
        start_min = random.choice([0, 15, 30, 45])
        
        end_hour = random.randint(16, 18)
        end_min = random.choice([0, 15, 30, 45])
        
        # Calculate work hours per day
        work_minutes = (end_hour * 60 + end_min) - (start_hour * 60 + start_min)
        break_minutes = random.choice([30, 45, 60, 90])
        net_work_minutes = work_minutes - break_minutes
        
        # Number of days
        num_days = random.randint(20, 30)
        
        # Total hours
        exact = (net_work_minutes * num_days) / 60
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        # Format times
        start_time = f"{start_hour}:{start_min:02d} am"
        end_time_suffix = "pm" if end_hour >= 12 else "am"
        display_hour = end_hour if end_hour <= 12 else end_hour - 12
        end_time = f"{display_hour}:{end_min:02d} {end_time_suffix}"
        
        return {
            'question': f'John starts work at {start_time} and finishes at {end_time}. He has {break_minutes} minutes of breaks. How many hours does he work in {num_days} days?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Daily work: {work_minutes} min - {break_minutes} min = {net_work_minutes} min. Total: {net_work_minutes}×{num_days}÷60 ≈ {int(exact)} hours'
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


class BillWithTipGenerator(QuestionGenerator):
    """Generate bill calculation with tip/tax questions"""
    
    def generate(self):
        # Generate bill components
        starters = round(random.uniform(150, 300), 2)
        mains = round(random.uniform(200, 400), 2)
        desserts = round(random.uniform(50, 150), 2)
        
        subtotal = starters + mains + desserts
        
        # Tip/service charge percentage
        tip_percent = random.choice([15, 17, 18, 20])
        
        tip_amount = subtotal * (tip_percent / 100)
        exact = subtotal + tip_amount
        
        # Generate numeric choices first
        numeric_choices = self._generate_numeric_choices(exact)
        correct = self.find_closest_choice(exact, numeric_choices)
        
        # Convert to dollar format for display
        choices = {k: f'${v}' for k, v in numeric_choices.items()}
        
        return {
            'question': f'A restaurant bill is made up as follows: ${starters:.2f} for starters, ${mains:.2f} for main courses, and ${desserts:.2f} for desserts, plus a {tip_percent}% service charge. How much is the bill?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Subtotal: ${int(starters)}+${int(mains)}+${int(desserts)} ≈ ${int(subtotal)}. With {tip_percent}% tip: ${int(subtotal)}×1.{tip_percent} ≈ ${int(exact)}'
        }
    
    def _generate_numeric_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = int(exact + offsets[i])
            choices[letter] = value
        
        return choices


