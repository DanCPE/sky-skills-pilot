"""
Base class for all question generators.
Core logic for generating questions and answers.
"""

import random


class QuestionGenerator:
    """
    Base class for question generators.
    
    All question types should inherit from this class and implement
the `generate()` method.
    
    Attributes:
        DIFFICULTY_OFFSETS: Class-level difficulty offsets for choice generation
        CATEGORY: Question category for importance sampling
        QUESTION_TYPE: Specific question type identifier
    """
    
    # Class variable for difficulty offsets (set by DifficultyManager)
    DIFFICULTY_OFFSETS = [-0.40, -0.20, 0, 0.20, 0.40]  # Default: Level 1
    DEFAULT_UNIT = 'units'
    CATEGORY = 'math'
    QUESTION_TYPE = 'generic'
    
    def generate(self):
        """
        Generate a random question.
        
        Must be implemented by subclasses. Should return a dict with:
        - question: str - The question text
        - exact_value: float or str - The exact answer
        - choices: dict - {letter: value} mapping
        - correct_answer: str - The correct choice letter
        - explanation: str - Solution explanation
        - unit: str (optional) - Unit for the answer
        """
        raise NotImplementedError("Subclasses must implement generate()")
    
    def find_closest_choice(self, exact_value, choices):
        """
        Find the choice closest to the exact value.
        
        Args:
            exact_value: The exact answer value
            choices: Dict mapping choice letters to values
            
        Returns:
            str: The letter of the closest choice
        """
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
        """
        Ensure no choice has a unique last digit that could give away the answer.
        
        This prevents students from guessing the correct answer just by looking
        at the last digit of each choice.
        """
        if not choices or correct_choice is None:
            return
        
        target_digit = self._extract_last_digit(choices[correct_choice])
        if sum(1 for value in choices.values() if self._extract_last_digit(value) == target_digit) > 1:
            return
        
        # Find the choice furthest from exact value to modify
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
        """Extract the last digit of a numeric value"""
        return abs(int(value)) % 10
    
    def _infer_decimal_places(self, value):
        """Infer the number of decimal places in a value"""
        text = format(value, 'f').rstrip('0').rstrip('.')
        if '.' in text:
            return len(text.split('.')[1])
        return 0
    
    def get_choice_unit(self):
        """Get the default unit for choices"""
        return getattr(self, 'DEFAULT_UNIT', 'units')
    
    def get_difficulty_offsets(self, exact):
        """
        Get difficulty-adjusted offsets for choice generation.
        
        Args:
            exact: The exact answer value
            
        Returns:
            list: Offset values based on difficulty level
        """
        return [exact * offset for offset in self.DIFFICULTY_OFFSETS]
    
    def _generate_standard_choices(self, exact_value, num_choices=5, unit=None):
        """
        Generate standard choices around an exact value.
        
        Args:
            exact_value: The exact answer
            num_choices: Number of choices to generate (default 5)
            unit: Optional unit string
            
        Returns:
            dict: {letter: value} mapping
        """
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E'][:num_choices]
        
        offsets = self.get_difficulty_offsets(exact_value)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = exact_value + offsets[i]
            
            # Determine appropriate decimal places
            if abs(value) >= 100:
                decimals = 1
            else:
                decimals = 2
            
            value = round(value, decimals)
            choices[letter] = value
        
        return choices
