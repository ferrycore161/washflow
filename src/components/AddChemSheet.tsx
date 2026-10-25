import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Sheet, SheetHeader, VolumeStepper, toast } from './ui';
import { ProductBottle } from './art/Bottle';
import { useStore } from '../store/useStore';
import { formatVolume } from '../domain/dilution';
import type { OwnedChemical, Product } from '../domain/types';

const COMMON_PACKAGES = [500, 750, 1000, 5000];

/** Добавление средства в «Мою химию» или правка остатка. */
export function AddChemSheet({
  product,
  editing,
  onClose,
}: {
  product: Product | null;
  editing?: OwnedChemical | null;
  onClose: () => void;
}) {
  const { addOwned, updateOwned } = useStore();
  const packages = product?.packages.length ? product.packages : COMMON_PACKAGES;
  const [pkg, setPkg] = useState(editing?.packageMl ?? packages[0]);
  const [remaining, setRemaining] = useState(editing?.remainingMl ?? packages[0]);
  const [full, setFull] = useState(!editing);

  useEffect(() => {
    if (!product) return;
    const p = editing?.packageMl ?? (product.packages[0] || 1000);
    setPkg(p);
    setRemaining(editing?.remainingMl ?? p);
    setFull(!editing);
  }, [product, editing]);

  if (!product) return null;

  const save = () => {
    const rem = full ? pkg : Math.min(remaining, pkg);
    if (editing) {
      updateOwned(editing.id, { packageMl: pkg, remainingMl: rem });
      toast('Остаток обновлён');
    } else {
      addOwned(product.id, pkg, rem);
      toast(`${product.name} — в «Моей химии»`);
    }
    onClose();
  };

  return (
    <Sheet open={!!product} onClose={onClose} label="Объём упаковки">
      <SheetHeader title={editing ? 'Остаток средства' : 'В мою химию'} onClose={onClose} />
      <div className="row" style={{ marginBottom: 18 }}>
        <ProductBottle product={product} size={88} />
        <div>
          <div className="muted" style={{ fontSize: 13.5 }}>{product.brand}</div>
          <div className="h2">{product.name}</div>
          <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>{product.subtitle}</div>
        </div>
      </div>

      <div className="field">
        <span>Объём упаковки</span>
        <div className="chips" style={{ margin: 0, padding: 0 }}>
          {packages.map((p) => (
            <button
              key={p}
              className="chip"
              aria-pressed={pkg === p}
              onClick={() => {
                setPkg(p);
                if (remaining > p) setRemaining(p);
              }}
            >
              {formatVolume(p)}
            </button>
          ))}
        </div>
        <VolumeStepper value={pkg} onChange={(v) => setPkg(v)} step={50} min={50} max={30000} label="Объём упаковки" />
        <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>
          Это объём флакона с концентратом — не путайте с объёмом распылителя.
        </span>
      </div>

      <div className="seg" style={{ marginTop: 16 }} role="group" aria-label="Состояние упаковки">
        <button aria-pressed={full} onClick={() => setFull(true)}>Полная</button>
        <button aria-pressed={!full} onClick={() => setFull(false)}>Начатая</button>
      </div>
      {!full && (
        <div className="field" style={{ marginTop: 12 }}>
          <span>Сколько осталось</span>
          <VolumeStepper value={remaining} onChange={setRemaining} step={50} min={0} max={pkg} label="Остаток" />
        </div>
      )}

      <button className="btn btn-primary block" style={{ marginTop: 22, minHeight: 58 }} onClick={save} data-testid="confirm-add-chem">
        <Check size={20} /> {editing ? 'Сохранить' : 'Добавить'}
      </button>
    </Sheet>
  );
}
