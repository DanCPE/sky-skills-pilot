"""
Time and calendar question generators.
"""

import random
from .base import QuestionGenerator


class TimeDurationGenerator(QuestionGenerator):
    """Generate time duration calculation questions"""
    
    def generate(self):
        # Generate start time
        start_hour = random.choice([7, 8, 9, 10, 11, 13, 14, 15])
        start_min = random.choice([0, 15, 30, 45])
        
        # Generate duration (2-8 hours)
        duration_hours = random.randint(2, 8)
        duration_mins = random.choice([0, 15, 30, 45])
        
        # Calculate end time
        end_hour = start_hour + duration_hours
        end_min = start_min + duration_mins
        
        if end_min >= 60:
            end_hour += 1
            end_min -= 60
        
        # Calculate exact duration in minutes
        exact = duration_hours * 60 + duration_mins
        
        # Format times
        start_period = "AM" if start_hour < 12 else "PM"
        end_period = "AM" if end_hour < 12 else "PM"
        
        start_display = start_hour if start_hour <= 12 else start_hour - 12
        end_display = end_hour if end_hour <= 12 else end_hour - 12
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A meeting starts at {start_display}:{start_min:02d} {start_period} and ends at {end_display}:{end_min:02d} {end_period}. How long is the meeting?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Duration = {duration_hours}h {duration_mins}min = {duration_hours * 60} + {duration_mins} = {exact} minutes',
            'unit': 'min'
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


class TimeAdditionGenerator(QuestionGenerator):
    """Generate time addition questions (add duration to start time)"""
    
    def generate(self):
        # Start time
        start_hour = random.choice([8, 9, 10, 11, 13, 14, 15, 16])
        start_min = random.choice([0, 15, 30, 45])
        
        # Duration to add
        add_hours = random.randint(2, 6)
        add_mins = random.choice([15, 30, 45])
        
        # Calculate end time
        end_hour = start_hour + add_hours
        end_min = start_min + add_mins
        
        if end_min >= 60:
            end_hour += 1
            end_min -= 60
        
        # Convert to 12-hour format for answer
        exact = end_hour * 100 + end_min  # Store as HHMM for comparison
        
        start_period = "AM" if start_hour < 12 else "PM"
        start_display = start_hour if start_hour <= 12 else start_hour - 12
        
        choices = self._generate_choices(end_hour, end_min)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A flight departs at {start_display}:{start_min:02d} {start_period}. Flight duration is {add_hours}h {add_mins}min. What is the arrival time?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{start_hour}:{start_min:02d} + {add_hours}h {add_mins}min = {end_hour}:{end_min:02d}',
            'unit': ''
        }
    
    def _generate_choices(self, correct_hour, correct_min):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        
        # Generate time variations
        time_options = []
        for hour_offset in [-2, -1, 0, 1, 2]:
            for min_offset in [-30, -15, 0, 15, 30]:
                h = correct_hour + hour_offset
                m = correct_min + min_offset
                if m < 0:
                    h -= 1
                    m += 60
                elif m >= 60:
                    h += 1
                    m -= 60
                if 0 <= h <= 23:
                    time_options.append((h, m))
        
        # Select 5 unique times
        selected = random.sample(time_options, min(5, len(time_options)))
        
        for i, letter in enumerate(letters):
            h, m = selected[i]
            period = "AM" if h < 12 else "PM"
            display_h = h if h <= 12 else h - 12
            if display_h == 0:
                display_h = 12
            choices[letter] = h * 100 + m  # Store as HHMM
        
        return choices


class DaysBetweenDatesGenerator(QuestionGenerator):
    """Generate days between dates calculation questions"""
    
    def generate(self):
        months = [
            ('January', 31), ('February', 28), ('March', 31), ('April', 30),
            ('May', 31), ('June', 30), ('July', 31), ('August', 31),
            ('September', 30), ('October', 31), ('November', 30), ('December', 31)
        ]
        
        # Select two different months
        month1_idx = random.randint(0, 10)
        month2_idx = random.randint(month1_idx + 1, 11)
        
        month1_name, month1_days = months[month1_idx]
        month2_name, month2_days = months[month2_idx]
        
        # Random days
        day1 = random.randint(1, month1_days)
        day2 = random.randint(1, month2_days)
        
        # Calculate approximate days between
        days_in_between = sum(m[1] for m in months[month1_idx:month2_idx])
        exact = days_in_between - day1 + day2
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Approximately how many days from {month1_name} {day1} to {month2_name} {day2}?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Approximately {exact} days',
            'unit': 'days'
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


class WeekdayCalculationGenerator(QuestionGenerator):
    """Generate weekday calculation questions"""
    
    def generate(self):
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        start_day_idx = random.randint(0, 6)
        start_day = days_of_week[start_day_idx]
        
        # Number of days to add (multiples of 7 plus remainder)
        weeks = random.randint(3, 10)
        extra_days = random.randint(1, 6)
        total_days = weeks * 7 + extra_days
        
        # Calculate end day
        end_day_idx = (start_day_idx + extra_days) % 7
        end_day = days_of_week[end_day_idx]
        
        choices = self._generate_choices(days_of_week, end_day)
        # Find which letter has the correct day
        correct = [letter for letter, day in choices.items() if day == end_day][0]
        
        return {
            'question': f'Today is {start_day}. What day of the week will it be in {total_days} days?',
            'exact_value': end_day,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{total_days} days = {weeks} weeks + {extra_days} days. {start_day} + {extra_days} days = {end_day}',
            'unit': ''
        }
    
    def _generate_choices(self, days_of_week, correct_day):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        
        # Ensure correct answer is included
        selected_days = [correct_day]
        
        # Add 4 more random days
        other_days = [day for day in days_of_week if day != correct_day]
        selected_days.extend(random.sample(other_days, 4))
        
        # Shuffle
        random.shuffle(selected_days)
        
        for i, letter in enumerate(letters):
            choices[letter] = selected_days[i]
        
        return choices


class AgeCalculationGenerator(QuestionGenerator):
    """Generate age calculation questions"""
    
    def generate(self):
        current_year = 2024
        birth_year = random.randint(1960, 2010)
        
        exact = current_year - birth_year
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A person was born in {birth_year}. How old are they in {current_year}?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{current_year} - {birth_year} = {exact} years old',
            'unit': 'years'
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


class TimeUnitConversionGenerator(QuestionGenerator):
    """Generate time unit conversion questions"""
    
    def generate(self):
        conversions = [
            ('hours', 'minutes', 60, 'h', 'min'),
            ('minutes', 'seconds', 60, 'min', 's'),
            ('hours', 'seconds', 3600, 'h', 's'),
            ('days', 'hours', 24, 'days', 'h'),
            ('weeks', 'days', 7, 'weeks', 'days'),
            ('days', 'minutes', 1440, 'days', 'min'),
        ]
        
        from_unit, to_unit, factor, from_abbr, to_abbr = random.choice(conversions)
        
        # Select appropriate value based on conversion
        if factor >= 1000:
            value = round(random.uniform(0.5, 3), 1)
        elif factor >= 100:
            value = random.randint(1, 10)
        elif factor >= 10:
            value = round(random.uniform(1, 20), 1)
        else:
            value = random.randint(1, 30)
        
        exact = value * factor
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Convert {value} {from_unit} to {to_unit}',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'{value} {from_abbr} × {factor} = {exact} {to_abbr}',
            'unit': to_abbr
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            if exact >= 100:
                value = int(exact + offsets[i])
            else:
                value = round(exact + offsets[i], 1)
            choices[letter] = value
        
        return choices
