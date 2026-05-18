"""
Base class for all question generators.
"""

import random

class QuestionGenerator:
    """Base class for question generators"""
    
    # Class variable for difficulty offsets (set by TestGenerator)
    DIFFICULTY_OFFSETS = [-0.40, -0.20, 0, 0.20, 0.40]  # Default: Level 1
    DEFAULT_UNIT = 'units'
    
    # Unit conversion families
    # Factors represent: how many base units (smallest) = 1 of this unit
    # Base unit is the smallest in each family
    UNIT_CONVERSIONS = {
        'distance': {  # Base: mm
            'km': 1000000,    # 1 km = 1,000,000 mm
            'm': 1000,        # 1 m = 1,000 mm
            'cm': 10,         # 1 cm = 10 mm
            'mm': 1           # 1 mm = 1 mm (base)
        },
        'small_distance': {  # Base: mm (for geometry - no km)
            'm': 1000,        # 1 m = 1,000 mm
            'cm': 10,         # 1 cm = 10 mm
            'mm': 1           # 1 mm = 1 mm (base)
        },
        'energy': {  # Base: mJ
            'kJ': 1000000,    # 1 kJ = 1,000,000 mJ
            'J': 1000,        # 1 J = 1,000 mJ
            'mJ': 1           # 1 mJ = 1 mJ (base)
        },
        'power': {  # Base: mW
            'kW': 1000000,    # 1 kW = 1,000,000 mW
            'W': 1000,        # 1 W = 1,000 mW
            'mW': 1           # 1 mW = 1 mW (base)
        },
        'area': {  # Base: mm²
            'm²': 1000000,    # 1 m² = 1,000,000 mm²
            'cm²': 100,       # 1 cm² = 100 mm²
            'mm²': 1          # 1 mm² = 1 mm² (base)
        },
        'volume': {  # Base: mm³
            'm³': 1000000000,     # 1 m³ = 1,000,000,000 mm³
            'cm³': 1000,          # 1 cm³ = 1,000 mm³
            'mm³': 1              # 1 mm³ = 1 mm³ (base)
        },
        'mass': {  # Base: mg
            'kg': 1000000,    # 1 kg = 1,000,000 mg
            'g': 1000,        # 1 g = 1,000 mg
            'mg': 1           # 1 mg = 1 mg (base)
        },
        'time': {  # Base: s
            'h': 3600,        # 1 h = 3,600 s
            'min': 60,        # 1 min = 60 s
            's': 1            # 1 s = 1 s (base)
        },
        'force': {  # Base: mN
            'kN': 1000000,    # 1 kN = 1,000,000 mN
            'N': 1000,        # 1 N = 1,000 mN
            'mN': 1           # 1 mN = 1 mN (base)
        }
    }
    
    def generate(self):
        """Generate a random question. Must be implemented by subclasses."""
        raise NotImplementedError
    
    def find_closest_choice(self, exact_value, choices):
        """Find the choice closest to the exact value"""
        min_diff = float('inf')
        correct = None
        for choice, value in choices.items():
            diff = abs(value - exact_value)
            if diff < min_diff:
                min_diff = diff
                correct = choice
        self._ensure_non_unique_last_digit(choices, correct, exact_value)
        return correct
    
    def _ensure_non_unique_last_digit(self, choices, correct_choice, exact_value):
        if not choices or correct_choice is None:
            return
        target_digit = self._extract_last_digit(choices[correct_choice])
        if sum(1 for value in choices.values() if self._extract_last_digit(value) == target_digit) > 1:
            return
        candidate_key = None
        candidate_diff = -1.0
        for key, value in choices.items():
            if key == correct_choice:
                continue
            diff = abs(value - exact_value)
            if diff > candidate_diff:
                candidate_diff = diff
                candidate_key = key
        if candidate_key is None:
            return
        original_value = choices[candidate_key]
        original_digit = self._extract_last_digit(original_value)
        adjustment = (target_digit - original_digit) % 10
        if adjustment > 5:
            adjustment -= 10
        if adjustment == 0:
            adjustment = 10 if target_digit != original_digit else 0
        if adjustment == 0:
            return
        decimals = self._infer_decimal_places(original_value)
        adjusted_value = original_value + adjustment
        if decimals > 0:
            adjusted_value = round(adjusted_value, decimals)
        else:
            adjusted_value = round(adjusted_value)
        if abs(adjusted_value - choices[correct_choice]) < 1e-9:
            adjusted_value += 10 if adjustment > 0 else -10
            if decimals > 0:
                adjusted_value = round(adjusted_value, decimals)
            else:
                adjusted_value = round(adjusted_value)
        choices[candidate_key] = adjusted_value
    
    def _extract_last_digit(self, value):
        return abs(int(value)) % 10
    
    def _infer_decimal_places(self, value):
        text = format(value, 'f').rstrip('0').rstrip('.')
        if '.' in text:
            return len(text.split('.')[1])
        return 0
    
    def get_choice_unit(self):
        return getattr(self, 'DEFAULT_UNIT', 'units')

    def get_difficulty_offsets(self, exact):
        """Get difficulty-adjusted offsets for choice generation"""
        return [exact * offset for offset in self.DIFFICULTY_OFFSETS]
    
    def generate_mixed_unit_choices(self, exact_value, base_unit, unit_family, num_choices=5):
        """
        Generate choices with mixed units from the same family.
        
        Args:
            exact_value: The exact answer in base unit
            base_unit: The base unit (e.g., 'J', 'km', 'cm²')
            unit_family: The unit family key (e.g., 'energy', 'distance', 'area')
            num_choices: Number of choices to generate (default 5)
            
        Returns:
            dict: {choice_letter: {'value': numeric_value, 'unit': unit_string}}
        """
        if unit_family not in self.UNIT_CONVERSIONS:
            # Fallback to single unit if family not defined
            return self._generate_single_unit_choices(exact_value, base_unit, num_choices)
        
        conversions = self.UNIT_CONVERSIONS[unit_family]
        if base_unit not in conversions:
            # Fallback if base unit not in conversions
            return self._generate_single_unit_choices(exact_value, base_unit, num_choices)
        
        # Get base conversion factor
        base_factor = conversions[base_unit]
        
        # Convert exact value to base unit (normalized)
        exact_normalized = exact_value * base_factor
        
        # Generate offset values in normalized space
        offsets = self.get_difficulty_offsets(exact_normalized)
        random.shuffle(offsets)
        
        # Select units to use (mix of different units)
        available_units = list(conversions.keys())
        
        # Ensure we have at least 2-3 different units in choices
        selected_units = []
        for _ in range(num_choices):
            if len(selected_units) < 2 or random.random() < 0.4:
                # Pick a different unit
                unit = random.choice(available_units)
            else:
                # Reuse an existing unit
                unit = random.choice(selected_units)
            selected_units.append(unit)
        
        random.shuffle(selected_units)
        
        # Generate choices
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        
        for i, letter in enumerate(letters[:num_choices]):
            offset_value = exact_normalized + offsets[i]
            unit = selected_units[i]
            factor = conversions[unit]
            
            # Convert to selected unit
            value_in_unit = offset_value / factor
            
            # Determine appropriate decimal places based on magnitude
            if abs(value_in_unit) >= 1000:
                decimals = 0
            elif abs(value_in_unit) >= 100:
                decimals = 1
            elif abs(value_in_unit) >= 10:
                decimals = 1
            else:
                decimals = 2
            
            value_in_unit = round(value_in_unit, decimals)
            
            choices[letter] = {
                'value': value_in_unit,
                'unit': unit,
                'normalized': offset_value  # For finding correct answer
            }
        
        return choices
    
    def generate_si_equivalent_choices(self, exact_value, base_unit, unit_family, num_choices=5):
        """
        Generate choices that use different SI units, with exactly one correct
        equivalent conversion and the rest as plausible but incorrect conversions.
        The correctness is determined using normalized values in the family's base unit.
        """
        if unit_family not in self.UNIT_CONVERSIONS:
            return self._generate_single_unit_choices(exact_value, base_unit, num_choices)
        conversions = self.UNIT_CONVERSIONS[unit_family]
        if base_unit not in conversions:
            return self._generate_single_unit_choices(exact_value, base_unit, num_choices)
        base_factor = conversions[base_unit]
        exact_normalized = exact_value * base_factor
        available_units = list(conversions.keys())
        # Prefer common triad if present
        preferred = {
            'distance': ['km', 'm', 'cm', 'mm'],
            'energy': ['kJ', 'J', 'mJ'],
            'power': ['kW', 'W', 'mW'],
            'mass': ['kg', 'g', 'mg'],
            'time': ['h', 'min', 's'],
            'force': ['kN', 'N', 'mN'],
            'area': ['m²', 'cm²', 'mm²'],
            'volume': ['m³', 'cm³', 'mm³']
        }.get(unit_family, [])
        unit_pool = [u for u in preferred if u in conversions] or available_units
        # Select target units for choices
        selected_units = []
        for _ in range(num_choices):
            # ensure at least two different units appear
            if len(set(selected_units)) < 2 or random.random() < 0.5:
                selected_units.append(random.choice(unit_pool))
            else:
                selected_units.append(random.choice(selected_units))
        # Prepare error factors for distractors
        error_factors = [10, 0.1, 1000, 0.001, 2, 0.5]
        random.shuffle(error_factors)
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        # Position of the correct answer
        correct_index = random.randrange(min(num_choices, len(letters)))
        for i, letter in enumerate(letters[:num_choices]):
            unit = selected_units[i]
            factor = conversions[unit]
            if i == correct_index:
                normalized = exact_normalized
            else:
                ef = error_factors[(i) % len(error_factors)]
                normalized = exact_normalized * ef
            value_in_unit = normalized / factor
            # Determine decimals based on magnitude
            abs_v = abs(value_in_unit)
            if abs_v >= 1000:
                decimals = 0
            elif abs_v >= 100:
                decimals = 1
            elif abs_v >= 10:
                decimals = 1
            else:
                decimals = 2
            value_in_unit = round(value_in_unit, decimals)
            choices[letter] = {
                'value': value_in_unit,
                'unit': unit,
                'normalized': normalized
            }
        return choices
    
    def _generate_single_unit_choices(self, exact_value, unit, num_choices=5):
        """Fallback: generate choices with single unit"""
        offsets = self.get_difficulty_offsets(exact_value)
        random.shuffle(offsets)
        
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        
        for i, letter in enumerate(letters[:num_choices]):
            value = exact_value + offsets[i]
            
            # Determine decimals
            if abs(value) >= 100:
                decimals = 1
            else:
                decimals = 2
            
            value = round(value, decimals)
            
            choices[letter] = {
                'value': value,
                'unit': unit,
                'normalized': value
            }
        
        return choices
    
    def find_closest_mixed_unit_choice(self, exact_normalized, choices):
        """Find the choice closest to exact value (using normalized values)"""
        min_diff = float('inf')
        correct = None
        
        for choice, data in choices.items():
            diff = abs(data['normalized'] - exact_normalized)
            if diff < min_diff:
                min_diff = diff
                correct = choice
        
        return correct
