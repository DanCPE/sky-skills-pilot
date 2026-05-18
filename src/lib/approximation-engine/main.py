"""
Main orchestrator for question generation.
This is the entry point for generating tests - no PDF or CLI dependencies.
"""

import random
from typing import List, Dict, Any, Optional
from datetime import datetime

from core import DifficultyManager
from generators import ALL_GENERATORS, QuestionGenerator


class TestGenerator:
    """
    Main test generator orchestrator.
    
    This class coordinates:
    - Difficulty management
    - Question selection (with optional importance sampling)
    - Question generation
    - Result formatting
    
    Example:
        generator = TestGenerator(num_questions=35, difficulty_level=2)
        test_data = generator.generate_test()
    """
    
    def __init__(
        self,
        num_questions: int = 35,
        difficulty_level: int = 1,
        mixed_difficulty: bool = False,
        generator_pool: Optional[List[type]] = None
    ):
        """
        Initialize the test generator.
        
        Args:
            num_questions: Number of questions to generate (default 35)
            difficulty_level: 1=Easy, 2=Medium, 3=Hard (default 1)
            mixed_difficulty: If True, cycle through all difficulty levels
            generator_pool: List of generator classes to use (default: ALL_GENERATORS)
        """
        self.num_questions = num_questions
        self.difficulty_manager = DifficultyManager(difficulty_level, mixed_difficulty)
        self.generator_pool = generator_pool or ALL_GENERATORS
        
        # Set global difficulty offsets
        if not mixed_difficulty:
            QuestionGenerator.DIFFICULTY_OFFSETS = self.difficulty_manager.get_offsets()
    
    def generate_test(self) -> Dict[str, Any]:
        """
        Generate a complete test with questions.
        
        Returns:
            dict: Test data containing:
                - questions: List of question dictionaries
                - metadata: Test metadata (timestamp, settings, etc.)
                - summary: Summary statistics
        """
        questions = []
        
        # Select generators randomly from pool
        selected_generators = self._select_generators_randomly()
        
        # Generate questions
        if self.difficulty_manager.mixed:
            questions = self._generate_mixed_difficulty(selected_generators)
        else:
            questions = self._generate_single_difficulty(selected_generators)
        
        # Build result
        return {
            'questions': questions,
            'metadata': self._build_metadata(),
            'summary': self._build_summary(questions)
        }
    
    def _select_generators_randomly(self) -> List[type]:
        """Randomly select generators from the pool"""
        pool = self.generator_pool.copy()
        
        # Select random generator classes
        selected = random.sample(
            pool,
            min(self.num_questions, len(pool))
        )
        
        # If we need more questions than generator types, allow repeats
        while len(selected) < self.num_questions:
            selected.append(random.choice(pool))
        
        # Shuffle to randomize order
        random.shuffle(selected)
        
        return selected[:self.num_questions]
    
    def _generate_single_difficulty(self, generators: List[type]) -> List[Dict]:
        """Generate questions at a single difficulty level"""
        questions = []
        
        for generator_class in generators:
            generator = generator_class()
            question = generator.generate()
            question['difficulty_level'] = self.difficulty_manager.level
            questions.append(question)
        
        return questions
    
    def _generate_mixed_difficulty(self, generators: List[type]) -> List[Dict]:
        """Generate questions with mixed difficulty levels"""
        questions = []
        levels = self.difficulty_manager.get_all_levels()
        
        for i, generator_class in enumerate(generators):
            # Cycle through difficulty levels
            level = levels[i % len(levels)]
            
            # Set difficulty offsets for this question
            offsets = self.difficulty_manager.get_level_info(level)['offsets']
            QuestionGenerator.DIFFICULTY_OFFSETS = offsets
            
            generator = generator_class()
            question = generator.generate()
            question['difficulty_level'] = level
            questions.append(question)
        
        return questions
    
    def _build_metadata(self) -> Dict[str, Any]:
        """Build test metadata"""
        return {
            'timestamp': datetime.now().isoformat(),
            'num_questions': self.num_questions,
            'difficulty_level': self.difficulty_manager.level,
            'mixed_difficulty': self.difficulty_manager.mixed,
            'time_limit_minutes': self.difficulty_manager.calculate_time_limit(
                self.num_questions
            )
        }
    
    def _build_summary(self, questions: List[Dict]) -> Dict[str, Any]:
        """Build summary statistics"""
        # Count by difficulty
        difficulty_counts = {}
        for q in questions:
            level = q.get('difficulty_level', 1)
            difficulty_counts[level] = difficulty_counts.get(level, 0) + 1
        
        # Count by category
        category_counts = {}
        for q in questions:
            cat = q.get('category', 'unknown')
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        # Build answer key
        answer_key = [
            {
                'question_num': i + 1,
                'answer': q['correct_answer'],
                'exact_value': q.get('exact_value')
            }
            for i, q in enumerate(questions)
        ]
        
        return {
            'total_questions': len(questions),
            'difficulty_distribution': difficulty_counts,
            'answer_key': answer_key
        }


def generate_test(
    num_questions: int = 35,
    difficulty_level: int = 1,
    mixed_difficulty: bool = False
) -> Dict[str, Any]:
    """
    Convenience function to generate a test.
    
    Args:
        num_questions: Number of questions
        difficulty_level: 1=Easy, 2=Medium, 3=Hard
        mixed_difficulty: Mix all difficulty levels
        
    Returns:
        dict: Complete test data
    """
    generator = TestGenerator(
        num_questions=num_questions,
        difficulty_level=difficulty_level,
        mixed_difficulty=mixed_difficulty
    )
    return generator.generate_test()


# Example usage
if __name__ == '__main__':
    # Generate a test with 10 questions at medium difficulty
    test = generate_test(num_questions=10, difficulty_level=2)
    
    # Print basic info
    print(f"Generated {test['metadata']['num_questions']} questions")
    print(f"Time limit: {test['metadata']['time_limit_minutes']} minutes")
    print(f"Difficulty: Level {test['metadata']['difficulty_level']}")
    
    # Print answer key
    print("\nAnswer Key:")
    for item in test['summary']['answer_key']:
        print(f"  Q{item['question_num']}: {item['answer']}")
    
    # Print first question as example
    if test['questions']:
        q = test['questions'][0]
        print(f"\nExample Question 1:")
        print(f"  {q['question']}")
        print(f"  Choices: {q['choices']}")
        print(f"  Answer: {q['correct_answer']}")
