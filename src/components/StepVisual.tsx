import { ClipboardList, Droplets, Timer, Wind } from 'lucide-react';
import type { Equipment, Product, ScenarioStep } from '../domain/types';
import { ProductBottle } from './art/Bottle';
import { EquipmentArt } from './art/EquipmentArt';

export function StepVisual({
  step,
  product,
  equipment,
  size = 60,
}: {
  step: ScenarioStep;
  product?: Product;
  equipment?: Equipment;
  size?: number;
}) {
  if ((step.kind === 'prepare' || step.kind === 'apply') && product) return <ProductBottle product={product} size={size} />;
  if (step.kind === 'contact') return <EquipmentArt type="other" size={size} />;
  if (equipment) return <EquipmentArt type={equipment.type} size={size} />;
  const Icon = step.kind === 'rinse' ? Droplets : step.kind === 'dwell' ? Timer : step.kind === 'dry' ? Wind : ClipboardList;
  return (
    <span className={`step-icon k-${step.kind}`} style={{ width: size * 0.8, height: size * 0.8 }}>
      <Icon size={size * 0.4} />
    </span>
  );
}
