"""
Advanced choice generation logic.
Handles mixed units, SI conversions, and distractor generation.
"""

import random
from typing import Dict, Any, Optional


# Unit conversion families
# Factors represent: how many base units (smallest) = 1 of this unit
UNIT_CONVERSIONS = {
    'distance': {  # Base: mm
        'km': 1000000,
        'm': 1000,
        'cm': 10,
        'mm': 1
    },
    'small_distance': {  # Base: mm (for geometry - no km)
        'm': 1000,
        'cm': 10,
        'mm': 1
    },
    'energy': {  # Base: mJ
        'kJ': 1000000,
        'J': 1000,
        'mJ': 1
    },
    'power': {  # Base: mW
        'kW': 1000000,
        'W': 1000,
        'mW': 1
    },
    'area': {  # Base: mm²
        'm²': 1000000,
        'cm²': 100,
        'mm²': 1
    },
    'volume': {  # Base: mm³
        'm³': 1000000000,
        'cm³': 1000,
        'mm³': 1,
        'L': 1000000,  # 1 L = 1,000,000 mm³ = 1000 cm³
        'mL': 1000,    # 1 mL = 1 cm³
    },
    'mass': {  # Base: mg
        'kg': 1000000,
        'g': 1000,
        'mg': 1
    },
    'time': {  # Base: s
        'h': 3600,
        'min': 60,
        's': 1
    },
    'force': {  # Base: mN
        'kN': 1000000,
        'N': 1000,
        'mN': 1
    },
    'pressure': {  # Base: Pa
        'kPa': 1000,
        'Pa': 1,
    },
    'speed': {  # Base: m/s
        'km/h': 0.277778,  # 1 km/h = 1000/3600 m/s
        'm/s': 1,
    },
}


class ChoiceGenerator:
    """
    Generates answer choices with various strategies.
    """
    
    def __init__(self, difficulty_offsets=None):
        self.difficulty_offsets = difficulty_offsets or [-0.40, -0.20, 0, 0.20, 0.40]
    
    def set_difficulty_offsets(self, offsets):
        """Update the difficulty offsets for choice generation"""
        self.difficulty_offsets = offsets
    
    def get_offsets_for_value(self, exact_value):
        """Get difficulty-adjusted offsets for a specific value"""
        return [exact_value * offset for offset in self.difficulty_offsets]
    
    def generate_simple_choices(self, exact_value, num_choices=5, 
                                unit=None, decimals=None) -> Dict[str, Any]:
        """
        Generate simple numeric choices around exact value.
        
        Args:
            exact_value: The exact answer
            num_choices: Number of choices (default 5)
            unit: Optional unit string
            decimals: Number of decimal places (auto-detected if None)
            
        Returns:
            dict: {letter: value} or {letter: {'value': val, 'unit': unit}}
        """
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E'][:num_choices]
        
        offsets = self.get_offsets_for_value(exact_value)
        random.shuffle(offsets)
        
        # Determine decimal places
        if decimals is None:
            if abs(exact_value) >= 100:
                decimals = 1
            else:
                decimals = 2
        
        for i, letter in enumerate(letters):
            value = round(exact_value + offsets[i], decimals)
            
            if unit:
                choices[letter] = {'value': value, 'unit': unit}
            else:
                choices[letter] = value
        
        return choices
    
    def generate_mixed_unit_choices(self, exact_value, base_unit, 
                                    unit_family, num_choices=5) -> Dict[str, Dict[str, Any]]:
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
        if unit_family not in UNIT_CONVERSIONS:
            return self.generate_simple_choices(exact_value, num_choices, base_unit)
        
        conversions = UNIT_CONVERSIONS[unit_family]
        if base_unit not in conversions:
            return self.generate_simple_choices(exact_value, num_choices, base_unit)
        
        base_factor = conversions[base_unit]
        exact_normalized = exact_value * base_factor
        
        # Generate offset values in normalized space
        offsets = self.get_offsets_for_value(exact_normalized)
        random.shuffle(offsets)
        
        # Select units to use (mix of different units)
        available_units = list(conversions.keys())
        selected_units = []
        
        for _ in range(num_choices):
            if len(selected_units) < 2 or random.random() < 0.4:
                unit = random.choice(available_units)
            else:
                unit = random.choice(selected_units)
            selected_units.append(unit)
        
        random.shuffle(selected_units)
        
        # Generate choices
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E'][:num_choices]
        
        for i, letter in enumerate(letters):
            offset_value = exact_normalized + offsets[i]
            unit = selected_units[i]
            factor = conversions[unit]
            
            # Convert to selected unit
            value_in_unit = offset_value / factor
            
            # Determine appropriate decimal places
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
                'normalized': offset_value
            }
        
        return choices
    
    def generate_si_equivalent_choices(self, exact_value, base_unit,
                                       unit_family, num_choices=5) -> Dict[str, Dict[str, Any]]:
        """
        Generate choices with different SI units, exactly one correct conversion.
        
        The correct answer is placed at a random position. Distractors use
        different units with incorrect conversions.
        
        Args:
            exact_value: The exact answer in base unit
            base_unit: The base unit (e.g., 'km', 'J', 'kg')
            unit_family: The unit family key
            num_choices: Number of choices to generate
            
        Returns:
            dict: {letter: {'value': val, 'unit': unit, 'normalized': val_in_base}}
        """
        if unit_family not in UNIT_CONVERSIONS:
            return self.generate_simple_choices(exact_value, num_choices, base_unit)
        
        conversions = UNIT_CONVERSIONS[unit_family]
        if base_unit not in conversions:
            return self.generate_simple_choices(exact_value, num_choices, base_unit)
        
        base_factor = conversions[base_unit]
        exact_normalized = exact_value * base_factor
        
        # Preferred unit order for each family
        preferred = {
            'distance': ['km', 'm', 'cm', 'mm'],
            'energy': ['kJ', 'J', 'mJ'],
            'power': ['kW', 'W', 'mW'],
            'mass': ['kg', 'g', 'mg'],
            'time': ['h', 'min', 's'],
            'force': ['kN', 'N', 'mN'],
            'area': ['m²', 'cm²', 'mm²'],
            'volume': ['m³', 'cm³', 'L', 'mL'],
            'pressure': ['kPa', 'Pa'],
            'speed': ['km/h', 'm/s'],
        }.get(unit_family, [])
        
        available_units = list(conversions.keys())
        unit_pool = [u for u in preferred if u in conversions] or available_units
        
        # Select target units for choices
        selected_units = []
        for _ in range(num_choices):
            if len(set(selected_units)) < 2 or random.random() < 0.5:
                selected_units.append(random.choice(unit_pool))
            else:
                selected_units.append(random.choice(selected_units))
        
        # Error factors for distractors
        error_factors = [10, 0.1, 1000, 0.001, 2, 0.5]
        random.shuffle(error_factors)
        
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E'][:num_choices]
        
        # Random position for correct answer
        correct_index = random.randrange(num_choices)
        
        for i, letter in enumerate(letters):
            unit = selected_units[i]
            factor = conversions[unit]
            
            if i == correct_index:
                normalized = exact_normalized
            else:
                ef = error_factors[i % len(error_factors)]
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
    
    def find_correct_answer(self, exact_value, choices, use_normalized=False):
        """
        Find the correct answer from choices.
        
        Args:
            exact_value: The exact answer value
            choices: Dict of choices
            use_normalized: If True, use 'normalized' key for comparison (mixed units)
            
        Returns:
            str: The letter of the correct choice
        """
        min_diff = float('inf')
        correct = None
        
        for choice, data in choices.items():
            if use_normalized and isinstance(data, dict):
                value = data.get('normalized', data.get('value', 0))
            elif isinstance(data, dict):
                value = data.get('value', 0)
            else:
                value = data
            
            diff = abs(value - exact_value)
            if diff < min_diff:
                min_diff = diff
                correct = choice
        
        return correct
