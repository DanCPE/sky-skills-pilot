"""
Mixture and concentration question generators.
"""

import random
from .base import QuestionGenerator


class SolutionMixingGenerator(QuestionGenerator):
    """Generate solution mixing questions"""
    
    def generate(self):
        # Two solutions with different concentrations
        conc1 = random.choice([20, 30, 40, 50])
        conc2 = random.choice([60, 70, 80, 90])
        
        vol1 = random.choice([100, 150, 200, 250, 300])
        vol2 = random.choice([100, 150, 200, 250, 300])
        
        # Calculate final concentration
        total_solute = (conc1 / 100) * vol1 + (conc2 / 100) * vol2
        total_volume = vol1 + vol2
        exact = (total_solute / total_volume) * 100
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Mix {vol1}mL of {conc1}% solution with {vol2}mL of {conc2}% solution. What is the final concentration?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Total solute = {vol1}×{conc1/100} + {vol2}×{conc2/100} = {total_solute:.0f}mL. Final % = ({total_solute:.0f}/{total_volume}) × 100 = {exact:.1f}%',
            'unit': '%'
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


class DilutionGenerator(QuestionGenerator):
    """Generate dilution questions"""
    
    def generate(self):
        initial_volume = random.choice([200, 300, 500, 1000])
        initial_conc = random.choice([60, 70, 80, 90])
        final_conc = random.choice([30, 40, 50])
        
        # Calculate water needed
        # initial_volume × initial_conc = final_volume × final_conc
        final_volume = (initial_volume * initial_conc) / final_conc
        exact = final_volume - initial_volume
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Dilute {initial_volume}mL of {initial_conc}% solution to {final_conc}%. How much water to add?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Final volume = ({initial_volume}×{initial_conc})/{final_conc} = {final_volume:.0f}mL. Water = {final_volume:.0f} - {initial_volume} = {exact:.0f}mL',
            'unit': 'mL'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 0)
            choices[letter] = int(value)
        
        return choices


class AlloyMixingGenerator(QuestionGenerator):
    """Generate alloy/metal mixing questions"""
    
    def generate(self):
        # Mix two alloys to get target percentage
        alloy1_pct = random.choice([30, 40, 50])
        alloy2_pct = random.choice([60, 70, 80])
        target_pct = random.choice([50, 55, 60, 65])
        
        # Make sure target is between the two
        if target_pct <= alloy1_pct or target_pct >= alloy2_pct:
            target_pct = (alloy1_pct + alloy2_pct) // 2
        
        total_weight = random.choice([100, 200, 500, 1000])
        
        # Calculate weight of first alloy needed
        # Let x = weight of alloy1, then (total - x) = weight of alloy2
        # x * alloy1_pct + (total - x) * alloy2_pct = total * target_pct
        # Solving for x:
        exact = ((alloy2_pct - target_pct) / (alloy2_pct - alloy1_pct)) * total_weight
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'Mix {alloy1_pct}% copper alloy with {alloy2_pct}% copper alloy to get {total_weight}kg of {target_pct}% copper. How much of the {alloy1_pct}% alloy?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Using alligation method: {exact:.0f}kg of {alloy1_pct}% alloy',
            'unit': 'kg'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = self.get_difficulty_offsets(exact)
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 0)
            choices[letter] = int(value)
        
        return choices


class ConcentrationFromMassGenerator(QuestionGenerator):
    """Generate concentration calculation from mass questions"""
    
    def generate(self):
        solute_mass = random.choice([10, 15, 20, 25, 30, 40, 50])  # grams
        solution_volume = random.choice([200, 250, 500, 1000])  # mL
        
        # Calculate concentration in g/L
        exact = (solute_mass / solution_volume) * 1000
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'{solute_mass}g of salt dissolved in {solution_volume}mL of water. What is the concentration in g/L?',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Concentration = ({solute_mass}g / {solution_volume}mL) × 1000 = {exact:.0f} g/L',
            'unit': 'g/L'
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
