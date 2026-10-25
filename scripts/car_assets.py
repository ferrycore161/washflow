"""
Подготовка изображений автомобилей для WASHFLOW.

Вход:  car-src/<assetId>/<color>.png — PNG с прозрачным фоном (ракурс 3/4 спереди),
       car-src/<assetId>/meta.json  — {"source": "...", "license": "..."} (необязательно).
Выход: public/cars/<assetId>/<color>.webp и манифест src/data/carAssets.json.

Единая композиция: машина обрезается по непрозрачным пикселям, вписывается
в холст 960×540 с одинаковыми полями и общей «линией земли», чтобы все модели
стояли одинаково и плавно сменяли друг друга.

    python scripts/car_assets.py            # обработать всё
    python scripts/car_assets.py mazda-6-gj-sedan
"""
import json
import sys
from datetime import date
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'car-src'
OUT = ROOT / 'public' / 'cars'
MANIFEST = ROOT / 'src' / 'data' / 'carAssets.json'
CATALOG = ROOT / 'src' / 'data' / 'vehicleCatalog.ts'

W, H = 960, 540
MAX_W, MAX_H = 900, 470  # габарит машины на холсте
GROUND = 512  # нижняя точка колёс
COLORS = ['graphite', 'black', 'white', 'silver', 'gray', 'blue', 'red', 'green', 'brown', 'beige', 'orange']
BODIES = ['sedan', 'hatchback', 'wagon', 'crossover', 'suv', 'minivan']


def normalize(img: Image.Image, mirror: bool = False) -> Image.Image:
    img = img.convert('RGBA')
    if mirror:  # единое направление: все машины носом влево
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    bbox = img.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
    if not bbox:
        raise ValueError('пустое изображение')
    car = img.crop(bbox)
    k = min(MAX_W / car.width, MAX_H / car.height)
    car = car.resize((round(car.width * k), round(car.height * k)), Image.LANCZOS)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.paste(car, ((W - car.width) // 2, GROUND - car.height), car)
    return canvas


def parse_asset_id(asset_id: str):
    """mazda-6-gj-sedan → (generationId, body, variant)."""
    parts = asset_id.split('-')
    for i, p in enumerate(parts):
        if p in BODIES and i > 0:
            gen = '-'.join(parts[:i])
            variant = '-'.join(parts[i + 1:]) or None
            return gen, p, variant
    raise ValueError(f'в id нет типа кузова: {asset_id}')


def main(only: list[str]):
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8')) if MANIFEST.exists() else {}
    dirs = sorted(d for d in SRC.iterdir() if d.is_dir()) if SRC.exists() else []
    for d in dirs:
        if only and d.name not in only:
            continue
        gen, body, variant = parse_asset_id(d.name)
        meta = json.loads((d / 'meta.json').read_text(encoding='utf-8')) if (d / 'meta.json').exists() else {}
        colors = {}
        size_total = 0
        for c in COLORS:
            f = d / f'{c}.png'
            if not f.exists():
                continue
            out_dir = OUT / d.name
            out_dir.mkdir(parents=True, exist_ok=True)
            out = out_dir / f'{c}.webp'
            img = normalize(Image.open(f), bool(meta.get('mirror')))
            # после отражения возвращаем надписи (эмблемы) в читаемый вид: участки в координатах холста
            for box in meta.get('unmirrorBoxes', []):
                patch = img.crop(tuple(box)).transpose(Image.FLIP_LEFT_RIGHT)
                img.paste(patch, tuple(box[:2]))
            img.save(out, 'WEBP', quality=82, method=6)
            colors[c] = f'cars/{d.name}/{c}.webp'
            size_total += out.stat().st_size
        if not colors:
            print(f'  ! {d.name}: нет PNG')
            continue
        default = meta.get('defaultColor') or ('black' if 'black' in colors else next(iter(colors)))
        manifest[d.name] = {
            'assetId': d.name,
            'generationId': gen,
            'body': body,
            **({'variant': variant} if variant else {}),
            'colors': colors,
            'defaultColor': default,
            'width': W,
            'height': H,
            'source': meta.get('source', ''),
            'license': meta.get('license', ''),
            'createdAt': meta.get('createdAt', date.today().isoformat()),
            **({'mirrored': True} if meta.get('mirror') else {}),
        }
        print(f'  ✓ {d.name}: {len(colors)} цв., {size_total // 1024} КБ')
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'Манифест: {len(manifest)} ассетов')


if __name__ == '__main__':
    main(sys.argv[1:])
