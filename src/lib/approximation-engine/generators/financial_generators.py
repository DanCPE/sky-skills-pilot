"""
Financial and rate question generators.
"""

import random
from .base import QuestionGenerator


class DiscountChainGenerator(QuestionGenerator):
    """Generate multiple discount application questions"""
    
    def generate(self):
        original_price = random.choice([100, 150, 200, 250, 300, 400, 500, 800, 1000])
        
        # Generate 2-3 discounts
        num_discounts = random.choice([2, 3])
        discounts = []
        
        for _ in range(num_discounts):
            discount = random.choice([10, 15, 20, 25, 30])
            discounts.append(discount)
        
        # Calculate final price
        price = original_price
        for discount in discounts:
            price = price * (1 - discount/100)
        
        exact = price
        
        # Generate numeric choices first
        numeric_choices = self._generate_numeric_choices(exact)
        correct = self.find_closest_choice(exact, numeric_choices)
        
        # Convert to dollar format for display
        choices = {k: f'${v}' for k, v in numeric_choices.items()}
        
        # Format discount chain
        discount_text = ', then '.join([f'{d}% off' for d in discounts])
        
        return {
            'question': f'An item originally costs ${original_price}. Apply discounts: {discount_text}. What is the final price?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Apply sequentially: ${original_price} → ' + ' → '.join([f'${round(original_price * (1 - sum(discounts[:i+1])/100), 2)}' for i in range(len(discounts))]) + f' ≈ ${round(exact, 2)}'
        }
    
    def _generate_numeric_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 2)
            choices[letter] = value
        
        return choices


class CurrencyExchangeGenerator(QuestionGenerator):
    """Generate currency exchange questions"""
    
    def generate(self):
        # Extensive currency pairs with approximate rates (as of 2024)
        exchanges = [
            # USD to major currencies
            ('USD', 'EUR', 0.92, 'US Dollars', 'Euros'),
            ('USD', 'GBP', 0.79, 'US Dollars', 'British Pounds'),
            ('USD', 'JPY', 149.5, 'US Dollars', 'Japanese Yen'),
            ('USD', 'CHF', 0.88, 'US Dollars', 'Swiss Francs'),
            ('USD', 'CAD', 1.36, 'US Dollars', 'Canadian Dollars'),
            ('USD', 'AUD', 1.52, 'US Dollars', 'Australian Dollars'),
            ('USD', 'NZD', 1.65, 'US Dollars', 'New Zealand Dollars'),
            
            # USD to Asian currencies
            ('USD', 'THB', 35.2, 'US Dollars', 'Thai Baht'),
            ('USD', 'CNY', 7.24, 'US Dollars', 'Chinese Yuan'),
            ('USD', 'HKD', 7.83, 'US Dollars', 'Hong Kong Dollars'),
            ('USD', 'SGD', 1.34, 'US Dollars', 'Singapore Dollars'),
            ('USD', 'MYR', 4.68, 'US Dollars', 'Malaysian Ringgit'),
            ('USD', 'IDR', 15650, 'US Dollars', 'Indonesian Rupiah'),
            ('USD', 'PHP', 56.2, 'US Dollars', 'Philippine Peso'),
            ('USD', 'VND', 24500, 'US Dollars', 'Vietnamese Dong'),
            ('USD', 'KRW', 1320, 'US Dollars', 'South Korean Won'),
            ('USD', 'TWD', 31.5, 'US Dollars', 'Taiwan Dollars'),
            ('USD', 'INR', 83.2, 'US Dollars', 'Indian Rupees'),
            
            # USD to Middle East currencies
            ('USD', 'AED', 3.67, 'US Dollars', 'UAE Dirham'),
            ('USD', 'SAR', 3.75, 'US Dollars', 'Saudi Riyal'),
            ('USD', 'QAR', 3.64, 'US Dollars', 'Qatari Riyal'),
            ('USD', 'ILS', 3.72, 'US Dollars', 'Israeli Shekel'),
            
            # USD to Latin American currencies
            ('USD', 'MXN', 17.2, 'US Dollars', 'Mexican Pesos'),
            ('USD', 'BRL', 5.02, 'US Dollars', 'Brazilian Real'),
            ('USD', 'ARS', 350, 'US Dollars', 'Argentine Pesos'),
            ('USD', 'CLP', 920, 'US Dollars', 'Chilean Pesos'),
            ('USD', 'COP', 4100, 'US Dollars', 'Colombian Pesos'),
            
            # USD to African currencies
            ('USD', 'ZAR', 18.5, 'US Dollars', 'South African Rand'),
            ('USD', 'EGP', 30.9, 'US Dollars', 'Egyptian Pounds'),
            ('USD', 'NGN', 775, 'US Dollars', 'Nigerian Naira'),
            
            # USD to European currencies
            ('USD', 'SEK', 10.8, 'US Dollars', 'Swedish Krona'),
            ('USD', 'NOK', 10.6, 'US Dollars', 'Norwegian Krone'),
            ('USD', 'DKK', 6.88, 'US Dollars', 'Danish Krone'),
            ('USD', 'PLN', 4.02, 'US Dollars', 'Polish Zloty'),
            ('USD', 'CZK', 23.1, 'US Dollars', 'Czech Koruna'),
            ('USD', 'HUF', 360, 'US Dollars', 'Hungarian Forint'),
            ('USD', 'TRY', 32.5, 'US Dollars', 'Turkish Lira'),
            ('USD', 'RUB', 92.5, 'US Dollars', 'Russian Rubles'),
            
            # Reverse conversions (major currencies to USD)
            ('EUR', 'USD', 1.09, 'Euros', 'US Dollars'),
            ('GBP', 'USD', 1.27, 'British Pounds', 'US Dollars'),
            ('JPY', 'USD', 0.0067, 'Japanese Yen', 'US Dollars'),
            ('CAD', 'USD', 0.74, 'Canadian Dollars', 'US Dollars'),
            ('AUD', 'USD', 0.66, 'Australian Dollars', 'US Dollars'),
            ('CHF', 'USD', 1.14, 'Swiss Francs', 'US Dollars'),
            
            # EUR to other currencies
            ('EUR', 'GBP', 0.86, 'Euros', 'British Pounds'),
            ('EUR', 'JPY', 162.5, 'Euros', 'Japanese Yen'),
            ('EUR', 'CHF', 0.96, 'Euros', 'Swiss Francs'),
            ('EUR', 'THB', 38.3, 'Euros', 'Thai Baht'),
            
            # GBP to other currencies
            ('GBP', 'EUR', 1.16, 'British Pounds', 'Euros'),
            ('GBP', 'JPY', 189.2, 'British Pounds', 'Japanese Yen'),
            ('GBP', 'THB', 44.7, 'British Pounds', 'Thai Baht'),
        ]
        
        from_curr, to_curr, rate, from_name, to_name = random.choice(exchanges)
        
        # Amount to convert (adjust based on typical currency values)
        if to_curr in ['IDR', 'VND', 'COP', 'KRW', 'CLP', 'HUF', 'NGN', 'ARS']:
            # Very high value currencies - use smaller amounts
            amount = random.choice([50, 100, 200, 500, 1000])
        elif to_curr in ['JPY', 'THB', 'PHP', 'TWD', 'INR', 'RUB', 'EGP', 'TRY', 'ZAR', 'MXN', 'CZK', 'SEK', 'NOK']:
            # High value currencies
            amount = random.choice([100, 200, 500, 1000, 2000])
        else:
            # Standard currencies
            amount = random.choice([100, 250, 500, 750, 1000, 1500, 2000])
        
        exact = amount * rate
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {amount} {from_curr} to {to_curr} using exchange rate: 1 {from_curr} = {rate} {to_curr}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{amount} × {rate} ≈ {round(exact, 2)} {to_curr}',
            'unit': to_curr
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


class MeanAverageGenerator(QuestionGenerator):
    """Generate mean/average calculation questions"""
    
    def generate(self):
        # Generate 4-7 numbers
        num_values = random.randint(4, 7)
        
        # Generate values in a reasonable range
        values = []
        base = random.choice([10, 20, 50, 100])
        spread = random.choice([5, 10, 20, 30])
        
        for _ in range(num_values):
            value = random.randint(base - spread, base + spread)
            values.append(value)
        
        exact = sum(values) / len(values)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        # Create context
        contexts = [
            ('test scores', 'points'),
            ('daily temperatures', '°C'),
            ('sales figures', 'dollars'),
            ('delivery times', 'minutes'),
            ('product ratings', 'stars'),
        ]
        
        context, unit = random.choice(contexts)
        values_str = ', '.join(str(v) for v in values)
        
        return {
            'question': f'Calculate the average of these {context}: {values_str}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Sum: {sum(values)} ÷ {len(values)} = {round(exact, 2)} {unit}'
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


class PercentageChangeGenerator(QuestionGenerator):
    """Generate percentage increase/decrease questions"""
    
    def generate(self):
        # Choose increase or decrease
        change_type = random.choice(['increase', 'decrease'])
        
        original = random.choice([50, 100, 150, 200, 250, 300, 500, 1000])
        
        if change_type == 'increase':
            new_value = original + random.randint(10, int(original * 0.5))
        else:
            new_value = original - random.randint(10, int(original * 0.4))
        
        # Calculate percentage change
        exact = ((new_value - original) / original) * 100
        
        # Generate numeric choices first
        numeric_choices = self._generate_numeric_choices(exact)
        correct = self.find_closest_choice(exact, numeric_choices)
        
        # Convert to percentage format for display
        choices = {k: f'{v}%' for k, v in numeric_choices.items()}
        
        # Create context
        contexts = [
            ('stock price', '$'),
            ('population', 'people'),
            ('sales', 'units'),
            ('temperature', '°C'),
            ('revenue', '$'),
        ]
        
        context, unit = random.choice(contexts)
        
        return {
            'question': f'A {context} changed from {original} to {new_value}. Calculate the percentage change.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Change: ({new_value} - {original}) / {original} × 100 = {round(exact, 1)}%'
        }
    
    def _generate_numeric_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 1)
            choices[letter] = value
        
        return choices


class UnitRateGenerator(QuestionGenerator):
    """Generate unit rate calculation questions"""
    
    def generate(self):
        rate_types = [
            ('cost', 'items', '$', 'item'),
            ('distance', 'time', 'km', 'hour'),
            ('speed', 'time', 'm', 'second'),
            ('production', 'time', 'units', 'day'),
            ('fuel consumption', 'distance', 'liters', '100 km'),
        ]
        
        rate_type, per_unit, unit, per = random.choice(rate_types)
        
        if rate_type == 'cost':
            total = round(random.uniform(10, 50), 2)
            quantity = random.randint(3, 15)
        elif rate_type == 'distance':
            total = random.randint(100, 500)
            quantity = random.randint(2, 8)
        elif rate_type == 'speed':
            total = random.randint(50, 200)
            quantity = random.randint(5, 20)
        elif rate_type == 'production':
            total = random.randint(500, 3000)
            quantity = random.randint(5, 20)
        else:  # fuel consumption
            total = round(random.uniform(30, 80), 1)
            quantity = random.randint(400, 800)
        
        exact = total / quantity
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        if rate_type == 'cost':
            question = f'{quantity} {per_unit} cost ${total}. What is the cost per {per}?'
        elif rate_type == 'fuel consumption':
            question = f'A car uses {total} {unit} for {quantity} km. What is the consumption per {per}?'
        else:
            question = f'{total} {unit} in {quantity} {per_unit}. Calculate the rate per {per}.'
        
        return {
            'question': question,
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{total} ÷ {quantity} = {round(exact, 2)} {unit}/{per}'
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
