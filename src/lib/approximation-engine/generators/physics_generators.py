"""
Physics question generators.
"""

import random
import math
from .base import QuestionGenerator


class WorkEnergyGenerator(QuestionGenerator):
    """Generate Work = Force × Distance questions with mixed units"""
    
    def generate(self):
        force = round(random.uniform(15, 35), 1)
        distance = round(random.uniform(6, 15), 1)
        
        exact = force * distance
        
        # Generate mixed unit choices (J, kJ, mJ)
        choices = self.generate_mixed_unit_choices(exact, 'J', 'energy')
        
        # Find correct answer using normalized values
        base_factor = self.UNIT_CONVERSIONS['energy']['J']
        exact_normalized = exact * base_factor
        correct = self.find_closest_mixed_unit_choice(exact_normalized, choices)
        
        return {
            'question': f'A force of {force} N moves an object {distance} m. Calculate the work done using W = F × d.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Work = Force × Distance. Approximate: {int(force)}×{int(distance)} = {int(exact)} J'
        }


class KineticEnergyGenerator(QuestionGenerator):
    """Generate Kinetic Energy = ½mv² questions"""
    
    def generate(self):
        mass = round(random.uniform(3, 8), 1)
        velocity = round(random.uniform(10, 18), 1)
        
        exact = 0.5 * mass * (velocity ** 2)
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A {mass} kg object moves at {velocity} m/s. Calculate the kinetic energy using KE = ½mv².',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'KE = ½mv². Approximate: 0.5×{int(mass)}×{int(velocity)}² = 0.5×{int(mass)}×{int(velocity**2)} = {int(exact)} J',
            'unit': 'J'
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = [exact * -0.15, exact * -0.05, exact * 0.04, exact * 0.12, exact * 0.20]
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 1)
            choices[letter] = value
        
        return choices


class PotentialEnergyGenerator(QuestionGenerator):
    """Generate Potential Energy = mgh questions"""
    
    def generate(self):
        mass = round(random.uniform(10, 25), 1)
        height = round(random.uniform(5, 15), 1)
        g = 9.8
        
        exact = mass * g * height
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A {mass} kg object is at height {height} m (g=9.8 m/s²). Calculate the potential energy using PE = mgh.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'PE = mgh. Approximate: {int(mass)}×10×{int(height)} = {int(mass*10*height)} J',
            'unit': 'J'
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


class PowerGenerator(QuestionGenerator):
    """Generate Power = Work/Time questions"""
    
    def generate(self):
        work = round(random.uniform(800, 1500), 0)
        time = round(random.uniform(15, 35), 1)
        
        exact = work / time
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'{int(work)} J of work is done in {time} seconds. Calculate the power using P = W/t.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Power = Work/Time. Approximate: {int(work)}÷{int(time)} ≈ {int(exact)} W',
            'unit': 'W'
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


class AccelerationGenerator(QuestionGenerator):
    """Generate Acceleration = (v_final - v_initial)/time questions"""
    
    def generate(self):
        v_initial = round(random.uniform(8, 18), 1)
        v_final = round(random.uniform(22, 35), 1)
        time = round(random.uniform(4, 8), 1)
        
        exact = (v_final - v_initial) / time
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A car accelerates from {v_initial} m/s to {v_final} m/s in {time} seconds. Calculate the acceleration using a = Δv/t.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'a = Δv/t. Approximate: ({int(v_final)}-{int(v_initial)})÷{int(time)} = {int(v_final-v_initial)}÷{int(time)} ≈ {round(exact, 1)} m/s²',
            'unit': 'm/s²'
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


class MomentumGenerator(QuestionGenerator):
    """Generate Momentum = mass × velocity questions"""
    
    def generate(self):
        mass = round(random.uniform(2.5, 8), 1)
        velocity = round(random.uniform(12, 22), 1)
        
        exact = mass * velocity
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        return {
            'question': f'A {mass} kg object moves at {velocity} m/s. Calculate the momentum using p = mv.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Momentum = mass × velocity. Approximate: {int(mass)}×{int(velocity)} = {int(exact)} kg·m/s',
            'unit': 'kg·m/s'
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


class DensityGenerator(QuestionGenerator):
    """Generate Density = mass/volume questions"""
    
    def generate(self):
        mass = round(random.uniform(35, 65), 1)
        volume = round(random.uniform(8, 18), 1)
        
        exact = mass / volume
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        units = [('kg', 'L', 'kg/L'), ('g', 'cm³', 'g/cm³')]
        mass_unit, vol_unit, density_unit = random.choice(units)
        
        return {
            'question': f'A {mass} {mass_unit} object has volume {volume} {vol_unit}. Calculate the density using ρ = m/V.',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Density = mass/volume. Approximate: {int(mass)}÷{int(volume)} ≈ {round(exact, 1)} {density_unit}',
            'unit': density_unit
        }
    
    def _generate_choices(self, exact):
        choices = {}
        letters = ['A', 'B', 'C', 'D', 'E']
        offsets = [exact * -0.15, exact * -0.05, exact * 0.04, exact * 0.13, exact * 0.22]
        random.shuffle(offsets)
        
        for i, letter in enumerate(letters):
            value = round(exact + offsets[i], 2)
            choices[letter] = value
        
        return choices


class HeatTransferGenerator(QuestionGenerator):
    """Generate Q = mcΔT (heat transfer) questions"""
    
    def generate(self):
        # Materials with specific heat capacities (J/g°C)
        materials = [
            ('water', 4.18),
            ('aluminum', 0.90),
            ('copper', 0.39),
            ('iron', 0.45),
            ('glass', 0.84),
            ('ice', 2.09),
            ('ethanol', 2.44),
        ]
        
        material, specific_heat = random.choice(materials)
        
        # Mass in grams
        mass = random.choice([50, 100, 150, 200, 250, 300, 500, 1000])
        
        # Temperature change
        temp_change = random.choice([5, 10, 15, 20, 25, 30, 40, 50])
        
        # Calculate heat: Q = mcΔT
        exact = mass * specific_heat * temp_change
        
        choices = self._generate_choices(exact)
        correct = self.find_closest_choice(exact, choices)
        
        # Create question context
        contexts = [
            f'How much heat is required to raise the temperature of {mass} g of {material} by {temp_change}°C?',
            f'Calculate the heat energy needed to warm {mass} g of {material} from 20°C to {20 + temp_change}°C.',
            f'{mass} g of {material} is heated, causing a temperature increase of {temp_change}°C. Calculate the heat absorbed.',
        ]
        
        question = random.choice(contexts)
        
        return {
            'question': f'{question} Use Q = mcΔT (c = {specific_heat} J/g°C)',
            'exact_value': exact,
            'choices': choices,
            'correct_answer': correct,
            'explanation': f'Q = mcΔT = {mass} g × {specific_heat} J/g°C × {temp_change}°C ≈ {int(exact)} J',
            'unit': 'J'
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


