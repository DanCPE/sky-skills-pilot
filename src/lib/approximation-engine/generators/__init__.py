"""
Question generators package for approximation and estimation tests.
Organized by category for better maintainability.
"""

from .base import QuestionGenerator

# Build ALL_GENERATORS list automatically from all imported generators
# This is used by the test orchestrator to select random generators
ALL_GENERATORS = []
from .math_generators import *
from .physics_generators import *
from .motion_generators import *
from .additional_generators import *
from .airline_generators import *
from .visual_generators import *
from .earth_rotation_generators import *
from .financial_generators import *
from .advanced_physics_generators import *
from .geometry_generators import *
from .unit_conversion_generators import *
from .time_calendar_generators import *
from .percentage_ratio_generators import *
from .measurement_conversion_generators import *
from .business_finance_generators import *
from .mixture_concentration_generators import *

__all__ = [
    'QuestionGenerator',
    # Math generators
    'DivisionChainGenerator',
    'ComplexArithmeticGenerator',
    'RevenueEstimationGenerator',
    'SubtractionDivisionGenerator',
    'SquareRootProductGenerator',
    'DistanceSpeedTimeGenerator',
    'PythagoreanGenerator',
    'UnitPriceGenerator',
    'ComplexFractionGenerator',
    'SquareRootEstimationGenerator',
    'PercentageEstimationGenerator',
    'BodyVolumeEstimationGenerator',
    'FractionOfNumberGenerator',
    'SquareNumberGenerator',
    'PercentageOfNumberGenerator',
    'MixedFractionDivisionGenerator',
    'UnitCostGenerator',
    'NestedFractionGenerator',
    # Interpolation and Extrapolation generators
    'LinearInterpolationGenerator',
    'LinearExtrapolationGenerator',
    'TableInterpolationGenerator',
    'NonLinearInterpolationGenerator',
    # Basic arithmetic generators
    'SimpleMultiplicationGenerator',
    'SimpleDivisionGenerator',
    'SimpleAdditionGenerator',
    'SimpleSubtractionGenerator',
    'TwoStepMultiplicationAdditionGenerator',
    'TwoStepMultiplicationSubtractionGenerator',
    'TwoStepDivisionAdditionGenerator',
    'TwoStepDivisionSubtractionGenerator',
    # Physics generators
    'WorkEnergyGenerator',
    'KineticEnergyGenerator',
    'PotentialEnergyGenerator',
    'PowerGenerator',
    'AccelerationGenerator',
    'MomentumGenerator',
    'DensityGenerator',
    'HeatTransferGenerator',
    # Motion generators
    'DisplacementMotionGenerator',
    'FinalVelocityGenerator',
    'VelocitySquaredGenerator',
    'AverageVelocityGenerator',
    # Additional generators
    'MultiTermAdditionGenerator',
    'TripleMultiplicationGenerator',
    'MixedAddSubGenerator',
    'VolumeCalculationGenerator',
    'TimeScheduleGenerator',
    'BillWithTipGenerator',
    # Airline generators
    'NauticalMileConversionGenerator',
    'AltitudeConversionGenerator',
    'SpeedConversionKnotsGenerator',
    'FuelWeightConversionGenerator',
    'FuelVolumeConversionGenerator',
    'TemperatureConversionGenerator',
    'FlightTimeConversionGenerator',
    'FuelConsumptionGenerator',
    'DescentRateGenerator',
    # Visual generators
    'PythagoreanTriangleGenerator',
    'MapScaleDistanceGenerator',
    'MapScaleAreaGenerator',
    'RightTriangleHeightGenerator',
    # Earth rotation generators
    'TimeZoneLongitudeGenerator',
    'EarthRotationSpeedGenerator',
    'LongitudeToTimeGenerator',
    'EarthRotationAngleGenerator',
    'CITY_TIMEZONES',
    # Financial generators
    'DiscountChainGenerator',
    'CurrencyExchangeGenerator',
    'MeanAverageGenerator',
    'PercentageChangeGenerator',
    'UnitRateGenerator',
    # Advanced physics generators
    'ElectricalPowerPVIGenerator',
    'ElectricalPowerI2RGenerator',
    'ElectricalPowerV2RGenerator',
    'OhmsLawVoltageGenerator',
    'OhmsLawCurrentGenerator',
    'OhmsLawResistanceGenerator',
    'PressureGenerator',
    'BuoyancyForceGenerator',
    'CentripetalForceGenerator',
    # Geometry generators
    'CircleAreaGenerator',
    'CircleCircumferenceGenerator',
    'SphereVolumeGenerator',
    'ConeVolumeGenerator',
    'TriangleAreaBaseHeightGenerator',
    'TriangleAreaHeronsGenerator',
    'AngleConversionDegreesToRadiansGenerator',
    'AngleConversionRadiansToDegreesGenerator',
    # Unit conversion generators (Imperial ↔ SI)
    'MilesToKilometersGenerator',
    'InchesToCentimetersGenerator',
    'PoundsToKilogramsGenerator',
    'OuncesToGramsGenerator',
    'YardsToMetersGenerator',
    'QuartsToLitersGenerator',
    'FahrenheitToCelsiusGenerator',
    'CelsiusToFahrenheitGenerator',
    'AcresToHectaresGenerator',
    'MPHToKPHGenerator',
    # Time and calendar generators
    'TimeDurationGenerator',
    'TimeAdditionGenerator',
    'DaysBetweenDatesGenerator',
    'WeekdayCalculationGenerator',
    'AgeCalculationGenerator',
    'TimeUnitConversionGenerator',
    # Percentage and ratio generators
    'PercentageIncreaseGenerator',
    'PercentageDecreaseGenerator',
    'SalesTaxGenerator',
    'RatioMixingGenerator',
    'ProportionScalingGenerator',
    'PercentageOfTotalGenerator',
    'FindOriginalPriceGenerator',
    'TipCalculatorEnhancedGenerator',
    # Measurement conversion generators
    'CookingVolumeGenerator',
    'DataStorageGenerator',
    'PressureConversionGenerator',
    'EnergyConversionGenerator',
    'TimeUnitDetailedGenerator',
    # Business and finance generators
    'ProfitLossGenerator',
    'ProfitPercentageGenerator',
    'SimpleInterestGenerator',
    'CommissionGenerator',
    'MarkupGenerator',
    'BreakevenGenerator',
    # Mixture and concentration generators
    'SolutionMixingGenerator',
    'DilutionGenerator',
    'AlloyMixingGenerator',
    'ConcentrationFromMassGenerator',
]

# Build ALL_GENERATORS list from all Generator classes in this module
import sys
_current_module = sys.modules[__name__]
ALL_GENERATORS = [
    getattr(_current_module, name)
    for name in __all__
    if name.endswith('Generator') and name != 'QuestionGenerator'
]
