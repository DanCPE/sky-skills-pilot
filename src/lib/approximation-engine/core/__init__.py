"""
Core logic for question generation.

This module contains the essential logic for:
- Difficulty management and importance sampling
- Choice generation strategies (simple, mixed units, SI equivalents)

Note: QuestionGenerator base class is in generators.base
"""

from .difficulty import DifficultyManager, ImportanceSampler, DIFFICULTY_LEVELS
from .choices import ChoiceGenerator, UNIT_CONVERSIONS

__all__ = [
    'DifficultyManager',
    'ImportanceSampler',
    'ChoiceGenerator',
    'DIFFICULTY_LEVELS',
    'UNIT_CONVERSIONS',
]
