#!/usr/bin/env python3
"""JSON adapter for the approximation question engine."""

import argparse
import json
import sys
from typing import Any, Dict, Optional

from main import generate_test


DIFFICULTY_LEVELS = {
    "easy": 1,
    "medium": 2,
    "hard": 3,
}


def format_number(value: Any) -> str:
    if isinstance(value, bool):
        return str(value)

    if isinstance(value, int):
        return str(value)

    if abs(value - round(value)) < 1e-9:
        return str(int(round(value)))

    text = f"{value:.4f}".rstrip("0").rstrip(".")
    return text


def format_choice(value: Any, fallback_unit: Optional[str] = None) -> str:
    if isinstance(value, dict):
        choice_value = value.get("value")
        unit = value.get("unit") or fallback_unit
    else:
        choice_value = value
        unit = fallback_unit

    if isinstance(choice_value, (int, float)):
        text = format_number(choice_value)
    else:
        text = str(choice_value)

    return f"{text} {unit}".strip() if unit else text


def normalize_question(raw_question: Dict[str, Any], index: int) -> Dict[str, Any]:
    choices = raw_question.get("choices", {})
    unit = raw_question.get("unit")
    correct_letter = raw_question.get("correct_answer")
    correct_value = choices.get(correct_letter)

    return {
        "id": f"approx_{index}_{correct_letter}",
        "prompt": raw_question.get("question", ""),
        "options": [format_choice(value, unit) for value in choices.values()],
        "correctAnswer": format_choice(correct_value, unit),
        "correctChoice": correct_letter,
        "exactValue": raw_question.get("exact_value"),
        "unit": unit,
        "category": raw_question.get("category", "approximation"),
        "questionType": raw_question.get("question_type", "estimation"),
        "difficulty": {
            1: "easy",
            2: "medium",
            3: "hard",
        }.get(raw_question.get("difficulty_level"), "easy"),
        "explanation": raw_question.get("explanation", ""),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=10)
    parser.add_argument("--difficulty", choices=["easy", "medium", "hard", "mixed"], default="easy")
    args = parser.parse_args()

    mixed = args.difficulty == "mixed"
    difficulty_level = 1 if mixed else DIFFICULTY_LEVELS[args.difficulty]
    quiz = generate_test(
        num_questions=args.count,
        difficulty_level=difficulty_level,
        mixed_difficulty=mixed,
    )

    output = {
        "questions": [
            normalize_question(question, index)
            for index, question in enumerate(quiz.get("questions", []), start=1)
        ],
        "metadata": quiz.get("metadata", {}),
        "summary": quiz.get("summary", {}),
    }

    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
