"""
Math question generators.
"""

import random
import math
from .base import QuestionGenerator


class DivisionChainGenerator(QuestionGenerator):
    """Generate (a ÷ b) ÷ c type questions"""
    
    def generate(self):
        a = round(random.uniform(50, 100), 1)
        b = round(random.uniform(2, 5), 1)
        c = round(random.uniform(4, 8), 1)
        
        exact = (a / b) / c
        
        # Generate choices around the exact value
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Determine the value of ({a} ÷ {b}) ÷ {c}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {a}÷{b} ≈ {int(a/b)}, then ÷{c} ≈ {int(a/b/c)}'
        }
    
    def _generate_choices(self, exact):
        """Generate 5 choices around the exact value"""
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        
        # Generate values with varying distances from exact
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 2)
            choices[letter] = value
        
        return choices


class ComplexArithmeticGenerator(QuestionGenerator):
    """Generate (a × b) ÷ (c + d) type questions"""
    
    def generate(self):
        a = round(random.uniform(10, 20), 1)
        b = round(random.uniform(8, 12), 2)
        c = round(random.uniform(8, 15), 1)
        d = round(random.uniform(2, 5), 2)
        
        exact = (a * b) / (c + d)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Determine the value of ({a} × {b}) ÷ ({c} + {d})',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: ({int(a)}×{int(b)})÷({int(c)}+{int(d)}) ≈ {int(a*b)}÷{int(c+d)} ≈ {int(exact)}'
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


class RevenueEstimationGenerator(QuestionGenerator):
    """Generate revenue/total cost estimation questions"""
    
    def generate(self):
        rows = random.randint(18, 30)
        seats = random.randint(10, 18)
        price = round(random.uniform(8, 15), 2)
        
        exact = rows * seats * price
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        venue_types = ['theater', 'cinema', 'auditorium', 'concert hall']
        venue = random.choice(venue_types)
        
        return {
            'question': f'A {venue} has {rows} rows with {seats} seats each. Each ticket costs ${price}. Estimate the total revenue.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {rows}×{seats} ≈ {round(rows/10)*10}×{seats} = {round(rows/10)*10*seats}, then ×{int(price)} ≈ ${int(exact)}'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = [exact * -0.12, exact * -0.04, exact * 0.02, exact * 0.15, exact * 0.22]
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 2)
            choices[letter] = value
        
        return choices


class SubtractionDivisionGenerator(QuestionGenerator):
    """Generate (a - b) ÷ c type questions"""
    
    def generate(self):
        a = round(random.uniform(10, 20), 1)
        b = round(random.uniform(4, 8), 1)
        c = round(random.uniform(0.5, 1.5), 2)
        
        exact = (a - b) / c
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Determine the value of ({a} - {b}) ÷ {c}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {a}-{b} = {round(a-b, 1)}, then ÷{c} ≈ {int(exact)}'
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


class SquareRootProductGenerator(QuestionGenerator):
    """Generate √(a × b) type questions"""
    
    def generate(self):
        a = round(random.uniform(4, 8), 2)
        b = round(random.uniform(10, 15), 1)
        
        exact = math.sqrt(a * b)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Determine the value of √({a} × {b})',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: √({int(a)}×{int(b)}) = √{int(a*b)} ≈ {int(exact)}'
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


class DistanceSpeedTimeGenerator(QuestionGenerator):
    """Generate distance = speed × time questions"""
    
    def generate(self):
        speed = round(random.uniform(45, 75), 1)
        time = round(random.uniform(5, 10), 1)
        
        exact = speed * time  # in km if speed is km/h and time is h
        
        # Create SI-equivalent mixed-unit choices across distance units
        choices = self.generate_si_equivalent_choices(exact, 'km', 'distance')
        base_factor = self.UNIT_CONVERSIONS['distance']['km']
        exact_normalized = exact * base_factor
        correct = self.find_closest_mixed_unit_choice(exact_normalized, choices)
        
        vehicles = ['bus', 'car', 'train', 'bicycle']
        vehicle = random.choice(vehicles)
        
        return {
            'question': f'A {vehicle} travels at an average speed of {speed} km/h. How far in {time} hours?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {int(speed)}×{int(time)} ≈ {int(exact)} km (answers shown in various SI units)'
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


class PythagoreanGenerator(QuestionGenerator):
    """Generate √(a² + b²) type questions"""
    
    def generate(self):
        a = round(random.uniform(4, 8), 2)
        b = round(random.uniform(10, 15), 2)
        
        exact = math.sqrt(a**2 + b**2)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Determine the value of √({a}² + {b}²)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: √({int(a)}²+{int(b)}²) = √({int(a**2)}+{int(b**2)}) = √{int(a**2 + b**2)} ≈ {int(exact)}'
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


class UnitPriceGenerator(QuestionGenerator):
    """Generate 'how many items can be bought' questions"""
    
    def generate(self):
        total_money = random.choice([100, 120, 150, 200])
        unit_price = round(random.uniform(1.5, 3.5), 1)
        
        exact = total_money / unit_price
        
        choices = self._generate_choices(int(exact))
        correct = self.find_closest_choice(exact, choices)
        
        items = ['pens', 'pencils', 'notebooks', 'erasers', 'markers']
        item = random.choice(items)
        
        return {
            'question': f'How many {item} costing ${unit_price} can be bought with ${total_money}?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {total_money}÷{unit_price} ≈ {int(exact)}'
        }
    
    def _generate_choices(self, exact_int):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        values = [exact_int - 4, exact_int - 2, exact_int, exact_int + 2, exact_int + 3]
        random.shuffle(values)
        
        for i, letter in enumerate(letters):
            choices[letter] = values[i]
        
        return choices


class ComplexFractionGenerator(QuestionGenerator):
    """Generate a / (b × c) type questions"""
    
    def generate(self):
        a = round(random.uniform(50, 70), 2)
        b = round(random.uniform(5, 8), 2)
        c = round(random.uniform(0.4, 0.6), 2)
        
        exact = a / (b * c)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Determine the value of {a} / ({b} × {c})',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {int(a)}÷({int(b)}×{c}) = {int(a)}÷{round(b*c, 1)} ≈ {int(exact)}'
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


class SquareRootEstimationGenerator(QuestionGenerator):
    """Generate √n estimation questions"""
    
    def generate(self):
        # Choose a number that's not a perfect square
        n = random.choice([12, 15, 18, 20, 24, 28, 32, 40, 45, 50])
        
        exact = math.sqrt(n)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Estimate the value of √{n}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'√{n} is between √{int(exact)**2} and √{(int(exact)+1)**2}, closer to {round(exact, 1)}'
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


class PercentageEstimationGenerator(QuestionGenerator):
    """Generate 'which fraction is closest to X%' questions"""
    
    def generate(self):
        target_percent = random.choice([25, 30, 40, 50, 60, 75])
        target_decimal = target_percent / 100
        
        # Generate 5 fractions with varying distances from target
        fractions = []
        for i in range(5):
            offset = random.uniform(-0.05, 0.05) if i == 0 else random.uniform(0.02, 0.08)
            value = target_decimal + offset
            
            # Convert to fraction
            denominator = random.randint(80, 150)
            numerator = int(value * denominator)
            fractions.append((numerator, denominator))
        
        random.shuffle(fractions)
        
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        percentages = {}
        
        for i, letter in enumerate(letters):
            num, den = fractions[i]
            choices[letter] = f'{num}/{den}'
            percentages[letter] = (num / den) * 100
        
        # Find closest to target
        min_diff = float('inf')
        correct = None
        for letter, pct in percentages.items():
            diff = abs(pct - target_percent)
            if diff < min_diff:
                min_diff = diff
                correct = letter
        
        return {
            'question': f'Estimate which choice is closest to {target_percent}%',
            'exact_value': percentages,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Convert each to percentage and compare to {target_percent}%'
        }


class BodyVolumeEstimationGenerator(QuestionGenerator):
    """Generate real-world volume estimation questions"""
    
    def generate(self):
        scenarios = [
            ('Pat sat down into a bath tub full of water', 70, 'Average human body volume'),
            ('a basketball', 7, 'Standard basketball volume'),
            ('a gallon of milk', 4, 'One gallon in liters'),
            ('a car fuel tank', 50, 'Average car fuel tank')
        ]
        
        scenario, correct_value, explanation = random.choice(scenarios)
        
        # Generate choices around correct value
        multipliers = [0.1, 0.5, 1.0, 2.0, 3.0]
        random.shuffle(multipliers)
        
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        for i, letter in enumerate(letters):
            value = int(correct_value * multipliers[i])
            choices[letter] = f'{value} Liters'
        
        correct = self.find_closest_choice(correct_value, 
                                          {k: int(v.split()[0]) for k, v in choices.items()})
        
        return {
            'question': f'If {scenario}, estimate what volume of water would be displaced?',
            'exact_value': 'Estimation',
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{explanation} is approximately {correct_value} liters'
        }


class FractionOfNumberGenerator(QuestionGenerator):
    """Generate (a/b) of c type questions"""
    
    def generate(self):
        numerator = random.randint(5, 12)
        denominator = random.randint(15, 25)
        number = random.randint(50, 100)
        
        exact = (numerator / denominator) * number
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'What is the value of ({numerator}/{denominator}) of {number}?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {numerator}×{number}÷{denominator} ≈ {int(exact)}'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = [exact * -0.15, exact * -0.05, exact * 0.02, exact * 0.10, exact * 0.18]
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 2)
            choices[letter] = value
        
        return choices


class SquareNumberGenerator(QuestionGenerator):
    """Generate a² type questions"""
    
    def generate(self):
        a = round(random.uniform(7, 10), 2)
        
        exact = a ** 2
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'What is the value of {a}²?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {int(a)}² = {int(a)**2}, so {a}² ≈ {int(exact)}'
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


class PercentageOfNumberGenerator(QuestionGenerator):
    """Generate X% of Y type questions"""
    
    def generate(self):
        percentage = random.choice([12, 15, 16, 18, 22, 25])
        number = random.randint(80, 120)
        
        exact = (percentage / 100) * number
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'What is {percentage}% of {number}?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {percentage}% ≈ {percentage/100}, so {percentage/100}×{number} ≈ {int(exact)}'
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


class MixedFractionDivisionGenerator(QuestionGenerator):
    """Generate (a + b/c) / (d/e) type questions"""
    
    def generate(self):
        a = 1
        b = random.randint(3, 5)
        c = random.randint(7, 12)
        d = random.randint(5, 9)
        e = random.randint(10, 15)
        
        exact = (a + b/c) / (d/e)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Determine the value of ({a} + {b}/{c}) / ({d}/{e})',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Calculate: ({a}+{b}/{c})÷({d}/{e}) = ({c+b}/{c})×({e}/{d}) ≈ {round(exact, 1)}'
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


class UnitCostGenerator(QuestionGenerator):
    """Generate cost per item questions with dollar to cent conversion"""
    
    def generate(self):
        quantity = random.choice([12, 24, 36])  # dozen, two dozen, etc.
        total_cost = round(random.uniform(3.0, 8.5), 2)
        
        # Calculate cost per item in dollars
        cost_per_item_dollars = total_cost / quantity
        # Convert to cents
        exact = cost_per_item_dollars * 100
        
        items = ['oranges', 'apples', 'eggs', 'donuts', 'cookies']
        item = random.choice(items)
        quantity_name = 'a dozen' if quantity == 12 else f'{quantity//12} dozen'
        
        choices = self._generate_choices(exact, cost_per_item_dollars)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'{quantity_name.capitalize()} {item} cost ${total_cost}. What is the cost per {item[:-1]} in cents?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'${total_cost}÷{quantity} = ${round(cost_per_item_dollars, 2)}. Convert: ${round(cost_per_item_dollars, 2)} × 100 = {round(exact, 1)} cents'
        }
    
    def _generate_choices(self, exact_cents, cost_dollars):
        """Generate tricky choices with unit conversion mistakes"""
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        
        # Include common mistakes
        mistake_values = [
            cost_dollars,  # Forgot to convert to cents
            cost_dollars * 10,  # Wrong conversion (×10)
            exact_cents,  # Correct answer
            exact_cents / 10,  # Off by factor of 10
            exact_cents * 10  # Off by factor of 10
        ]
        
        random.shuffle(mistake_values)
        for i, letter in enumerate(letters):
            choices[letter] = round(mistake_values[i], 1)
        
        return choices


class NestedFractionGenerator(QuestionGenerator):
    """Generate a / (b + c/d) type questions"""
    
    def generate(self):
        a = round(random.uniform(40, 60), 3)
        b = round(random.uniform(8, 12), 3)
        c = round(random.uniform(30, 40), 2)
        d = round(random.uniform(5, 7), 2)
        
        exact = a / (b + c/d)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Determine the value of {a} / ({b} + {c}/{d})',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {int(a)}÷({int(b)}+{int(c)}÷{int(d)}) = {int(a)}÷({int(b)}+{int(c/d)}) ≈ {int(exact)}'
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

class PythagoreanTriangleGenerator(QuestionGenerator):
    """Generate Pythagorean theorem questions"""
    
    def generate(self):
        # Generate two sides of a right triangle
        side_a = random.choice([3, 4, 5, 6, 8, 9, 12, 15, 20])
        side_b = random.choice([4, 5, 6, 8, 10, 12, 16, 20, 25])
        
        # Calculate hypotenuse
        exact = math.sqrt(side_a**2 + side_b**2)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A right triangle has sides a = {side_a} and b = {side_b}. Find the length of the hypotenuse c using c = √(a² + b²)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'c = √({side_a}² + {side_b}²) = √({side_a**2} + {side_b**2}) = √{side_a**2 + side_b**2} ≈ {round(exact, 1)}'
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


class LinearInterpolationGenerator(QuestionGenerator):
    """Generate linear interpolation questions from data tables"""
    
    def generate(self):
        # Generate a linear relationship y = mx + b
        slope = round(random.uniform(2, 8), 1)
        intercept = round(random.uniform(5, 20), 1)
        
        # Create data points
        x1 = random.randint(10, 20)
        x2 = x1 + random.randint(10, 20)
        x_target = random.randint(x1 + 2, x2 - 2)  # Point to interpolate
        
        y1 = slope * x1 + intercept
        y2 = slope * x2 + intercept
        
        # Linear interpolation formula
        exact = y1 + (y2 - y1) * (x_target - x1) / (x2 - x1)
        
        contexts = [
            ('Temperature (°C)', 'Time (hours)', 'temperature'),
            ('Distance (km)', 'Time (hours)', 'distance'),
            ('Cost ($)', 'Quantity (units)', 'cost'),
            ('Speed (km/h)', 'Time (min)', 'speed'),
            ('Pressure (kPa)', 'Depth (m)', 'pressure'),
        ]
        
        y_label, x_label, var_name = random.choice(contexts)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A table shows {y_label} vs {x_label}:\n  At {x_label[:-1]} = {x1}: {y_label[:-1]} = {round(y1, 1)}\n  At {x_label[:-1]} = {x2}: {y_label[:-1]} = {round(y2, 1)}\nEstimate the {var_name} at {x_label[:-1]} = {x_target} using linear interpolation.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Linear interpolation: {round(y1, 1)} + ({round(y2, 1)} - {round(y1, 1)}) × ({x_target} - {x1}) / ({x2} - {x1}) ≈ {round(exact, 1)}'
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


class LinearExtrapolationGenerator(QuestionGenerator):
    """Generate linear extrapolation questions from data tables"""
    
    def generate(self):
        # Generate a linear relationship y = mx + b
        slope = round(random.uniform(3, 10), 1)
        intercept = round(random.uniform(10, 30), 1)
        
        # Create data points
        x1 = random.randint(5, 15)
        x2 = x1 + random.randint(5, 15)
        x_target = x2 + random.randint(5, 15)  # Point to extrapolate (beyond data)
        
        y1 = slope * x1 + intercept
        y2 = slope * x2 + intercept
        
        # Linear extrapolation using the same formula
        exact = y1 + (y2 - y1) * (x_target - x1) / (x2 - x1)
        
        contexts = [
            ('Sales ($1000s)', 'Month', 'sales'),
            ('Population (1000s)', 'Year', 'population'),
            ('Production (units)', 'Day', 'production'),
            ('Revenue ($)', 'Week', 'revenue'),
            ('Growth (cm)', 'Week', 'growth'),
        ]
        
        y_label, x_label, var_name = random.choice(contexts)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A company tracks {y_label} vs {x_label}:\n  {x_label} {x1}: {y_label[:-1]} = {round(y1, 1)}\n  {x_label} {x2}: {y_label[:-1]} = {round(y2, 1)}\nAssuming the trend continues linearly, estimate the {var_name} at {x_label} {x_target}.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Extrapolation: slope = ({round(y2, 1)} - {round(y1, 1)}) / ({x2} - {x1}) = {round((y2-y1)/(x2-x1), 1)}. At {x_label} {x_target}: {round(y1, 1)} + {round((y2-y1)/(x2-x1), 1)} × ({x_target} - {x1}) ≈ {round(exact, 1)}'
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


class TableInterpolationGenerator(QuestionGenerator):
    """Generate interpolation questions from multi-point data tables"""
    
    def generate(self):
        # Create a table with 4-5 data points
        num_points = random.randint(4, 5)
        
        # Generate x values
        x_start = random.randint(0, 10)
        x_step = random.randint(5, 10)
        x_values = [x_start + i * x_step for i in range(num_points)]
        
        # Generate y values with some pattern (linear with noise)
        base_slope = round(random.uniform(2, 6), 1)
        base_intercept = round(random.uniform(10, 30), 1)
        y_values = [round(base_slope * x + base_intercept + random.uniform(-3, 3), 1) 
                    for x in x_values]
        
        # Choose two adjacent points for interpolation
        idx = random.randint(0, num_points - 2)
        x1, x2 = x_values[idx], x_values[idx + 1]
        y1, y2 = y_values[idx], y_values[idx + 1]
        
        # Target point between them
        x_target = round(x1 + (x2 - x1) * random.uniform(0.3, 0.7), 1)
        
        # Linear interpolation
        exact = y1 + (y2 - y1) * (x_target - x1) / (x2 - x1)
        
        # Format table
        table_str = "\n  ".join([f"x = {x}: y = {y}" for x, y in zip(x_values, y_values)])
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Given the following data table:\n  {table_str}\nEstimate the value of y when x = {x_target} using interpolation.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Use points ({x1}, {y1}) and ({x2}, {y2}). Interpolate: {y1} + ({y2} - {y1}) × ({x_target} - {x1}) / ({x2} - {x1}) ≈ {round(exact, 1)}'
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


class NonLinearInterpolationGenerator(QuestionGenerator):
    """Generate interpolation questions with quadratic patterns"""
    
    def generate(self):
        # Generate a quadratic relationship y = ax² + bx + c
        a = round(random.uniform(0.5, 2), 1)
        b = round(random.uniform(1, 5), 1)
        c = round(random.uniform(5, 15), 1)
        
        # Create data points
        x1 = random.randint(2, 5)
        x2 = x1 + random.randint(3, 6)
        x_target = round(x1 + (x2 - x1) * random.uniform(0.4, 0.6), 1)
        
        y1 = a * x1**2 + b * x1 + c
        y2 = a * x2**2 + b * x2 + c
        y_target = a * x_target**2 + b * x_target + c
        
        # For estimation, use linear interpolation (simpler)
        linear_estimate = y1 + (y2 - y1) * (x_target - x1) / (x2 - x1)
        exact = y_target  # Actual value
        
        contexts = [
            ('Velocity (m/s)', 'Time (s)', 'velocity'),
            ('Height (m)', 'Time (s)', 'height'),
            ('Energy (J)', 'Distance (m)', 'energy'),
            ('Force (N)', 'Displacement (m)', 'force'),
        ]
        
        y_label, x_label, var_name = random.choice(contexts)
        
        choices = self._generate_choices(exact, linear_estimate)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A physics experiment records {y_label} vs {x_label}:\n  At {x_label[:-1]} = {x1}: {y_label[:-1]} = {round(y1, 1)}\n  At {x_label[:-1]} = {x2}: {y_label[:-1]} = {round(y2, 1)}\nEstimate the {var_name} at {x_label[:-1]} = {x_target}.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Using interpolation between the two points: {round(y1, 1)} + ({round(y2, 1)} - {round(y1, 1)}) × ({x_target} - {x1}) / ({x2} - {x1}) ≈ {round(linear_estimate, 1)}, actual ≈ {round(exact, 1)}'
        }
    
    def _generate_choices(self, exact, linear_estimate):
        """Generate choices around both exact and linear estimate"""
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        
        # Mix of values around exact and linear estimate
        base_offsets = self.get_difficulty_offsets(exact)
        values = [exact + offset for offset in base_offsets]
        
        random.shuffle(values)
        for i, letter in enumerate(letters):
            choices[letter] = round(values[i], 1)
        
        return choices


class SimpleMultiplicationGenerator(QuestionGenerator):
    """Generate simple multiplication questions (a × b)"""
    
    def generate(self):
        a = round(random.uniform(15, 95), 1)
        b = round(random.uniform(15, 95), 1)
        
        exact = a * b
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate {a} × {b}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {int(a)} × {int(b)} ≈ {int(exact)}'
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


class SimpleDivisionGenerator(QuestionGenerator):
    """Generate simple division questions (a ÷ b)"""
    
    def generate(self):
        a = round(random.uniform(100, 500), 1)
        b = round(random.uniform(5, 25), 1)
        
        exact = a / b
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate {a} ÷ {b}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {int(a)} ÷ {int(b)} ≈ {int(exact)}'
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


class SimpleAdditionGenerator(QuestionGenerator):
    """Generate simple addition questions (a + b)"""
    
    def generate(self):
        a = round(random.uniform(50, 500), 1)
        b = round(random.uniform(50, 500), 1)
        
        exact = a + b
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate {a} + {b}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {int(a)} + {int(b)} = {int(exact)}'
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


class SimpleSubtractionGenerator(QuestionGenerator):
    """Generate simple subtraction questions (a - b)"""
    
    def generate(self):
        a = round(random.uniform(200, 800), 1)
        b = round(random.uniform(50, 300), 1)
        
        exact = a - b
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate {a} - {b}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: {int(a)} - {int(b)} = {int(exact)}'
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


class TwoStepMultiplicationAdditionGenerator(QuestionGenerator):
    """Generate (a × b) + c type questions"""
    
    def generate(self):
        a = round(random.uniform(10, 30), 1)
        b = round(random.uniform(10, 30), 1)
        c = round(random.uniform(50, 150), 1)
        
        exact = (a * b) + c
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate ({a} × {b}) + {c}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: ({int(a)} × {int(b)}) + {int(c)} = {int(a*b)} + {int(c)} = {int(exact)}'
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


class TwoStepMultiplicationSubtractionGenerator(QuestionGenerator):
    """Generate (a × b) - c type questions"""
    
    def generate(self):
        a = round(random.uniform(15, 35), 1)
        b = round(random.uniform(15, 35), 1)
        c = round(random.uniform(50, 200), 1)
        
        exact = (a * b) - c
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate ({a} × {b}) - {c}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: ({int(a)} × {int(b)}) - {int(c)} = {int(a*b)} - {int(c)} = {int(exact)}'
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


class TwoStepDivisionAdditionGenerator(QuestionGenerator):
    """Generate (a ÷ b) + c type questions"""
    
    def generate(self):
        a = round(random.uniform(200, 500), 1)
        b = round(random.uniform(5, 15), 1)
        c = round(random.uniform(20, 80), 1)
        
        exact = (a / b) + c
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate ({a} ÷ {b}) + {c}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: ({int(a)} ÷ {int(b)}) + {int(c)} ≈ {int(a/b)} + {int(c)} = {int(exact)}'
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


class TwoStepDivisionSubtractionGenerator(QuestionGenerator):
    """Generate (a ÷ b) - c type questions"""
    
    def generate(self):
        a = round(random.uniform(300, 600), 1)
        b = round(random.uniform(5, 15), 1)
        c = round(random.uniform(10, 30), 1)
        
        exact = (a / b) - c
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Calculate ({a} ÷ {b}) - {c}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximate: ({int(a)} ÷ {int(b)}) - {int(c)} ≈ {int(a/b)} - {int(c)} = {int(exact)}'
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


