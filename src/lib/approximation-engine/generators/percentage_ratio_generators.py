"""
Percentage and ratio question generators.
"""

import random
from .base import QuestionGenerator


class PercentageIncreaseGenerator(QuestionGenerator):
    """Generate percentage increase calculation questions"""
    
    def generate(self):
        original = random.choice([50, 80, 100, 120, 150, 200, 250, 300, 500, 1000])
        increase_pct = random.choice([10, 15, 20, 25, 30, 40, 50])
        
        new_value = original * (1 + increase_pct / 100)
        exact = increase_pct
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A price increased from ${original} to ${new_value:.0f}. What is the percentage increase?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Increase = ${new_value:.0f} - ${original} = ${new_value - original:.0f}. Percentage = ({new_value - original:.0f}/{original}) × 100 = {exact}%',
            'unit': '%'
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


class PercentageDecreaseGenerator(QuestionGenerator):
    """Generate percentage decrease calculation questions"""
    
    def generate(self):
        original = random.choice([100, 150, 200, 300, 500, 1000, 2000, 5000])
        decrease_pct = random.choice([10, 15, 20, 25, 30, 35, 40])
        
        new_value = original * (1 - decrease_pct / 100)
        exact = decrease_pct
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Population decreased from {original} to {new_value:.0f}. What is the percentage decrease?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Decrease = {original} - {new_value:.0f} = {original - new_value:.0f}. Percentage = ({original - new_value:.0f}/{original}) × 100 = {exact}%',
            'unit': '%'
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


class SalesTaxGenerator(QuestionGenerator):
    """Generate sales tax calculation questions"""
    
    def generate(self):
        price = random.choice([50, 75, 100, 120, 150, 200, 250, 300, 500])
        tax_rate = random.choice([5, 6, 7, 8, 9, 10])
        
        exact = price * (1 + tax_rate / 100)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'An item costs ${price} before tax. With {tax_rate}% sales tax, what is the final price?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Tax = ${price} × {tax_rate}% = ${price * tax_rate / 100:.2f}. Total = ${price} + ${price * tax_rate / 100:.2f} = ${exact:.2f}',
            'unit': '$'
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


class RatioMixingGenerator(QuestionGenerator):
    """Generate ratio mixing questions"""
    
    def generate(self):
        # Ratio like 3:2, 4:1, 5:3, etc.
        ratio_a = random.choice([2, 3, 4, 5])
        ratio_b = random.choice([1, 2, 3])
        
        if ratio_a == ratio_b:
            ratio_b = 1
        
        total_amount = random.choice([50, 60, 80, 100, 120, 150])
        
        # Calculate amount of first component
        total_parts = ratio_a + ratio_b
        exact = (ratio_a / total_parts) * total_amount
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Mix two paints in ratio {ratio_a}:{ratio_b}. If you need {total_amount}L total, how much of the first paint?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Total parts = {ratio_a} + {ratio_b} = {total_parts}. First paint = ({ratio_a}/{total_parts}) × {total_amount} = {exact:.1f}L',
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


class ProportionScalingGenerator(QuestionGenerator):
    """Generate proportion scaling questions (recipe scaling)"""
    
    def generate(self):
        original_servings = random.choice([4, 6, 8])
        new_servings = random.choice([10, 12, 15, 18, 20, 24])
        
        ingredient_amount = random.choice([2, 3, 4, 5, 6, 8])
        
        exact = (ingredient_amount * new_servings) / original_servings
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A recipe for {original_servings} people uses {ingredient_amount} cups of flour. How much flour for {new_servings} people?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Flour needed = {ingredient_amount} × ({new_servings}/{original_servings}) = {ingredient_amount} × {new_servings/original_servings:.2f} = {exact:.1f} cups',
            'unit': 'cups'
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


class PercentageOfTotalGenerator(QuestionGenerator):
    """Generate 'what percentage' questions"""
    
    def generate(self):
        total = random.choice([100, 120, 150, 180, 200, 250, 300, 400, 500])
        percentage = random.choice([10, 15, 20, 25, 30, 40, 50, 60, 75])
        
        part = (percentage / 100) * total
        exact = percentage
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'{part:.0f} is what percentage of {total}?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Percentage = ({part:.0f}/{total}) × 100 = {exact}%',
            'unit': '%'
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


class FindOriginalPriceGenerator(QuestionGenerator):
    """Generate reverse percentage questions (find original price)"""
    
    def generate(self):
        discount_pct = random.choice([10, 15, 20, 25, 30, 40])
        sale_price = random.choice([60, 80, 100, 120, 150, 200, 240])
        
        # Calculate original price
        exact = sale_price / (1 - discount_pct / 100)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'After a {discount_pct}% discount, an item costs ${sale_price}. What was the original price?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Original = ${sale_price} ÷ (1 - {discount_pct/100}) = ${sale_price} ÷ {1 - discount_pct/100} = ${exact:.2f}',
            'unit': '$'
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


class TipCalculatorEnhancedGenerator(QuestionGenerator):
    """Generate tip calculation questions"""
    
    def generate(self):
        bill = random.choice([25, 35, 45, 50, 60, 75, 80, 100, 120, 150])
        tip_pct = random.choice([15, 18, 20, 22, 25])
        
        exact = bill * (1 + tip_pct / 100)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Restaurant bill is ${bill}. Adding {tip_pct}% tip, what is the total?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Tip = ${bill} × {tip_pct}% = ${bill * tip_pct / 100:.2f}. Total = ${bill} + ${bill * tip_pct / 100:.2f} = ${exact:.2f}',
            'unit': '$'
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
