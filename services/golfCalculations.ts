type FlightOption = 'Low' | 'Normal' | 'High';

interface WindFactors {
  headwind: number;
  tailwind: number;
  crosswind: number;
}

const TRAJECTORY_FACTORS: Record<FlightOption, WindFactors> = {
  Low: { headwind: 1.5, tailwind: 0.8, crosswind: 1.2 },
  Normal: { headwind: 2.2, tailwind: 1.2, crosswind: 2.0 },
  High: { headwind: 3.0, tailwind: 1.8, crosswind: 3.2 },
};

const BASE_TEMP = 20;
const TEMP_ADJUSTMENT_STEP = 5;

export interface GolfCalculationResult {
  originalDistance: number;
  windAdjustment: number;
  tempAdjustment: number;
  totalAdjustment: number;
  adjustedDistance: number;
  crosswindDrift: number;
}

export function calculateGolfShot(
  distance: number,
  trajectory: FlightOption,
  windSpeedMs: number,
  headTailWind: number,
  crossWind: number,
  temperature: number
): GolfCalculationResult {
  const factors = TRAJECTORY_FACTORS[trajectory];
  
  let windAdjustment = 0;
  let crosswindDrift = 0;
  
  if (headTailWind > 0) {
    windAdjustment = headTailWind * factors.headwind;
  } else if (headTailWind < 0) {
    windAdjustment = Math.abs(headTailWind) * factors.tailwind * -1;
  }
  
  crosswindDrift = Math.abs(crossWind) * factors.crosswind;
  
  const tempDifference = BASE_TEMP - temperature;
  const tempAdjustment = Math.round((tempDifference / TEMP_ADJUSTMENT_STEP) * 10) / 10;
  
  const totalAdjustment = windAdjustment + tempAdjustment;
  const adjustedDistance = distance + totalAdjustment;
  
  return {
    originalDistance: distance,
    windAdjustment: Math.round(windAdjustment * 10) / 10,
    tempAdjustment: Math.round(tempAdjustment * 10) / 10,
    totalAdjustment: Math.round(totalAdjustment * 10) / 10,
    adjustedDistance: Math.round(adjustedDistance * 10) / 10,
    crosswindDrift: Math.round(crosswindDrift * 10) / 10,
  };
}
