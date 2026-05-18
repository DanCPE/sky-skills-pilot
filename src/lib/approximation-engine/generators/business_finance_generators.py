"""
Business and finance question generators.
"""

import random
from .base import QuestionGenerator


class ProfitLossGenerator(QuestionGenerator):
    """Generate profit/loss calculation questions"""
    
    def generate(self):
        cost = random.choice([50, 80, 100, 120, 150, 200, 250, 300, 500])
        profit_pct = random.choice([10, 15, 20, 25, 30, 40, 50])
        
        selling_price = cost * (1 + profit_pct / 100)
        exact = selling_price - cost
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Buy an item for ${cost}, sell for ${selling_price:.0f}. What is the profit?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Profit = ${selling_price:.0f} - ${cost} = ${exact:.0f}',
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


class ProfitPercentageGenerator(QuestionGenerator):
    """Generate profit percentage calculation questions"""
    
    def generate(self):
        cost = random.choice([100, 150, 200, 250, 300, 400, 500])
        profit_pct = random.choice([10, 15, 20, 25, 30, 40, 50])
        
        selling_price = cost * (1 + profit_pct / 100)
        exact = profit_pct
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Cost is ${cost}, selling price is ${selling_price:.0f}. What is the profit percentage?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Profit = ${selling_price:.0f} - ${cost} = ${selling_price - cost:.0f}. Profit % = ({selling_price - cost:.0f}/{cost}) × 100 = {exact}%',
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


class SimpleInterestGenerator(QuestionGenerator):
    """Generate simple interest calculation questions (I = PRT)"""
    
    def generate(self):
        principal = random.choice([1000, 2000, 5000, 10000, 15000, 20000])
        rate = random.choice([3, 4, 5, 6, 7, 8])
        time = random.choice([2, 3, 4, 5])
        
        exact = principal * (rate / 100) * time
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate simple interest: Principal ${principal}, Rate {rate}% per year, Time {time} years (I = PRT)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'I = PRT = ${principal} × {rate/100} × {time} = ${exact:.0f}',
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


class CommissionGenerator(QuestionGenerator):
    """Generate commission calculation questions"""
    
    def generate(self):
        sales = random.choice([2000, 3000, 5000, 8000, 10000, 15000, 20000])
        commission_pct = random.choice([5, 8, 10, 12, 15])
        
        exact = sales * (commission_pct / 100)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A salesperson makes ${sales} in sales with {commission_pct}% commission. How much commission earned?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Commission = ${sales} × {commission_pct}% = ${sales} × {commission_pct/100} = ${exact:.0f}',
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


class MarkupGenerator(QuestionGenerator):
    """Generate markup calculation questions"""
    
    def generate(self):
        cost = random.choice([40, 60, 80, 100, 120, 150, 200])
        markup_pct = random.choice([25, 30, 40, 50, 60, 75, 100])
        
        exact = cost * (1 + markup_pct / 100)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A store buys an item for ${cost} and applies {markup_pct}% markup. What is the selling price?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Markup = ${cost} × {markup_pct}% = ${cost * markup_pct / 100:.0f}. Selling price = ${cost} + ${cost * markup_pct / 100:.0f} = ${exact:.0f}',
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


class BreakevenGenerator(QuestionGenerator):
    """Generate breakeven point calculation questions"""
    
    def generate(self):
        fixed_cost = random.choice([500, 1000, 1500, 2000, 3000, 5000])
        profit_per_unit = random.choice([5, 10, 15, 20, 25, 30, 50])
        
        exact = fixed_cost / profit_per_unit
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Fixed costs are ${fixed_cost}, profit per unit is ${profit_per_unit}. How many units to break even?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Breakeven units = ${fixed_cost} ÷ ${profit_per_unit} = {exact:.0f} units',
            'unit': 'units'
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
