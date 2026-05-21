"""
Importance/Difficulty logic for question generation.
Defines difficulty levels and their impact on choice generation.
"""

# Difficulty level definitions
# Offsets represent percentage deviation from exact answer for distractor choices
DIFFICULTY_LEVELS = {
    1: {
        'name': 'Level 1 (Easy)',
        'description': 'Choices spaced at -40%, -20%, 0%, +20%, +40% from exact value',
        'offsets': [-0.40, -0.20, 0, 0.20, 0.40]
    },
    2: {
        'name': 'Level 2 (Medium)',
        'description': 'Choices spaced at -30%, -15%, 0%, +15%, +30% from exact value',
        'offsets': [-0.30, -0.15, 0, 0.15, 0.30]
    },
    3: {
        'name': 'Level 3 (Hard)',
        'description': 'Choices spaced at -20%, -10%, 0%, +10%, +20% from exact value',
        'offsets': [-0.20, -0.10, 0, 0.10, 0.20]
    },
}

# Generator category weights for importance/importance sampling
CATEGORY_WEIGHTS = {
    'math': 0.35,
    'physics': 0.20,
    'geometry': 0.15,
    'unit_conversion': 0.15,
    'financial': 0.10,
    'time_calendar': 0.05,
}

# Question type importance scores (0-10 scale)
QUESTION_TYPE_IMPORTANCE = {
    # High importance (core skills)
    'arithmetic_chain': 9,
    'unit_conversion': 8,
    'percentage': 8,
    'estimation': 9,
    
    # Medium importance
    'physics_formula': 6,
    'geometry': 6,
    'financial': 5,
    
    # Lower importance (specialized)
    'time_zone': 4,
    'advanced_physics': 4,
}


class DifficultyManager:
    """Manages difficulty settings for question generation"""
    
    def __init__(self, level=1, mixed=False):
        self.level = level
        self.mixed = mixed
        self._validate_level()
    
    def _validate_level(self):
        if self.level not in DIFFICULTY_LEVELS:
            raise ValueError(f"Invalid difficulty level: {self.level}. Must be one of {list(DIFFICULTY_LEVELS.keys())}")
    
    def get_offsets(self):
        """Get the difficulty offsets for choice generation"""
        if self.mixed:
            return None  # Caller should cycle through all levels
        return DIFFICULTY_LEVELS[self.level]['offsets']
    
    def get_all_levels(self):
        """Get all available difficulty levels"""
        return sorted(DIFFICULTY_LEVELS.keys())
    
    def get_level_info(self, level=None):
        """Get information about a difficulty level"""
        level = level or self.level
        return DIFFICULTY_LEVELS.get(level)
    
    def set_level(self, level):
        """Change the difficulty level"""
        self.level = level
        self._validate_level()
    
    @staticmethod
    def calculate_time_limit(num_questions, seconds_per_question=13.71):
        """
        Calculate recommended time limit based on question count.
        Default: ~13.71 seconds per question (8 minutes for 35 questions)
        """
        import math
        total_seconds = num_questions * seconds_per_question
        return max(8, math.ceil(total_seconds / 60))


class ImportanceSampler:
    """
    Importance sampling for question selection.
    Allows weighting question types based on their importance.
    """
    
    def __init__(self, custom_weights=None):
        self.weights = custom_weights or CATEGORY_WEIGHTS.copy()
    
    def set_category_weight(self, category, weight):
        """Set weight for a specific category"""
        self.weights[category] = max(0, min(1, weight))
        self._normalize_weights()
    
    def _normalize_weights(self):
        """Normalize weights to sum to 1"""
        total = sum(self.weights.values())
        if total > 0:
            for category in self.weights:
                self.weights[category] /= total
    
    def sample_categories(self, num_questions):
        """
        Sample categories based on their weights.
        Returns a list of category names with length num_questions.
        """
        import random
        categories = list(self.weights.keys())
        weights = [self.weights[cat] for cat in categories]
        return random.choices(categories, weights=weights, k=num_questions)
    
    def get_generator_pool(self, all_generators, num_questions):
        """
        Select generators based on importance weights.
        Returns a list of generator classes.
        """
        import random
        
        # Group generators by category
        by_category = {}
        for gen in all_generators:
            category = getattr(gen, 'CATEGORY', 'math')
            by_category.setdefault(category, []).append(gen)
        
        # Sample categories
        selected_categories = self.sample_categories(num_questions)
        
        # Select generators from each category
        selected = []
        for category in selected_categories:
            available = by_category.get(category, [])
            if available:
                selected.append(random.choice(available))
        
        return selected
