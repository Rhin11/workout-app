import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  EMPTY_NUTRITION,
  formatNutritionValue,
  NUTRITION_FIELDS,
  type Nutrition,
} from '../../constants/nutrition';
import { lookupBarcode, scaleNutrition, searchFood, type FoodResult } from '../../services/foodApi';
import type { MealType } from '../../store/macroStore';
import { loadQuagga, type QuaggaResult } from '../../utils/loadQuagga';

type Tab = 'search' | 'barcode' | 'manual';

interface Props {
  meal: MealType;
  date: string;
  onClose: () => void;
  onAdd: (entry: {
    meal: MealType;
    foodName: string;
    servingGrams: number;
  } & Nutrition) => void;
}

type ServingUnit = 'serving' | 'gram' | 'ounce' | 'hundred';

const OUNCE_IN_GRAMS = 28.35;

function ConfirmView({
  food,
  onBack,
  onConfirm,
}: {
  food: FoodResult;
  onBack: () => void;
  onConfirm: (grams: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<ServingUnit>(food.serving ? 'serving' : 'gram');

  const gramsPerUnit = (u: ServingUnit): number => {
    switch (u) {
      case 'serving':
        return food.serving?.grams ?? 1;
      case 'ounce':
        return OUNCE_IN_GRAMS;
      case 'hundred':
        return 100;
      case 'gram':
      default:
        return 1;
    }
  };

  const grams = quantity * gramsPerUnit(unit);
  const scaled = scaleNutrition(food.per100g, grams);

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-gray-400 hover:text-gray-200">
        ← Back
      </button>
      <h3 className="font-medium text-gray-100">{food.name}</h3>
      <div>
        <span className="mb-1 block text-xs font-medium text-gray-400">Amount</span>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(0, Number(e.target.value) || 0))}
            className="w-24 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-indigo-500 focus:outline-none"
            aria-label="Quantity"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as ServingUnit)}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-indigo-500 focus:outline-none"
            aria-label="Unit"
          >
            {food.serving && <option value="serving">serving ({food.serving.label})</option>}
            <option value="gram">gram (g)</option>
            <option value="ounce">ounce (oz)</option>
            <option value="hundred">100 g</option>
          </select>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {NUTRITION_FIELDS.map(({ key, label, unit }) => (
          <div key={key}>
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="text-sm text-gray-200">
              {formatNutritionValue(key, scaled[key])} {unit}
            </dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={() => onConfirm(grams)}
        className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white hover:bg-indigo-400"
      >
        Add to {food.name}
      </button>
    </div>
  );
}

export default function AddFoodModal({ meal, date, onClose, onAdd }: Props) {
  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);

  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const detectedHandlerRef = useRef<((result: QuaggaResult) => void) | null>(null);

  const [manualName, setManualName] = useState('');
  const [manualGrams, setManualGrams] = useState(100);
  const [manualNutrition, setManualNutrition] = useState<Nutrition>({ ...EMPTY_NUTRITION });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (tab !== 'search' || selectedFood) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearchError(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const items = await searchFood(trimmed);
        setResults(items);
      } catch {
        setSearchError('Search failed. Check your connection and try again.');
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query, tab, selectedFood]);

  const stopScanner = useCallback(() => {
    if (window.Quagga && detectedHandlerRef.current) {
      window.Quagga.offDetected(detectedHandlerRef.current);
      detectedHandlerRef.current = null;
      window.Quagga.stop();
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleBarcodeLookup = async (code: string) => {
    setBarcodeLoading(true);
    setBarcodeError(null);
    try {
      const result = await lookupBarcode(code);
      if (!result) {
        setBarcodeError(`No product found for barcode ${code}`);
        return;
      }
      setSelectedFood(result);
    } catch {
      setBarcodeError('Barcode lookup failed. Check your connection and try again.');
    } finally {
      setBarcodeLoading(false);
    }
  };

  const startScan = async () => {
    setBarcodeError(null);
    stopScanner();

    try {
      const Quagga = await loadQuagga();
      if (!scannerRef.current) return;

      setScanning(true);

      await new Promise<void>((resolve, reject) => {
        Quagga.init(
          {
            inputStream: {
              name: 'Live',
              type: 'LiveStream',
              target: scannerRef.current,
              constraints: {
                facingMode: 'environment',
              },
            },
            decoder: {
              readers: ['ean_reader', 'upc_reader', 'code_128_reader'],
            },
            locate: true,
          },
          (err) => {
            if (err) reject(err);
            else resolve();
          },
        );
      });

      const onDetected = (result: QuaggaResult) => {
        const code = result.codeResult?.code;
        if (!code) return;
        stopScanner();
        void handleBarcodeLookup(code);
      };

      detectedHandlerRef.current = onDetected;
      Quagga.onDetected(onDetected);
      Quagga.start();
    } catch {
      stopScanner();
      setBarcodeError('Camera access denied or unavailable. Enter a barcode manually below.');
    }
  };

  const confirmFood = (food: FoodResult, grams: number) => {
    onAdd({
      meal,
      foodName: food.name,
      servingGrams: grams,
      ...scaleNutrition(food.per100g, grams),
    });
    onClose();
  };

  const confirmManual = () => {
    const name = manualName.trim() || 'Custom food';
    onAdd({
      meal,
      foodName: name,
      servingGrams: manualGrams,
      ...manualNutrition,
    });
    onClose();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'search', label: 'Search' },
    { id: 'barcode', label: 'Barcode' },
    { id: 'manual', label: 'Manual' },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 normal-case"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Add food to ${meal}`}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-800 p-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Add food</h2>
            <p className="text-xs text-gray-500">
              {meal} · {date}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {!selectedFood && (
          <div className="flex border-b border-gray-800">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (tab === 'barcode' && t.id !== 'barcode') stopScanner();
                  setTab(t.id);
                  setBarcodeError(null);
                }}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'border-b-2 border-indigo-500 text-indigo-300'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {selectedFood ? (
            <ConfirmView
              food={selectedFood}
              onBack={() => setSelectedFood(null)}
              onConfirm={(grams) => confirmFood(selectedFood, grams)}
            />
          ) : tab === 'search' ? (
            <div className="space-y-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search foods (e.g. banana)"
                autoFocus
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
              />
              {searchLoading && <p className="text-sm text-gray-500">Searching…</p>}
              {searchError && <p className="text-sm text-red-400">{searchError}</p>}
              {!searchLoading && !searchError && query.trim() && results.length === 0 && (
                <p className="text-sm text-gray-500">No foods found — try a different term</p>
              )}
              <ul className="divide-y divide-gray-800">
                {results.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedFood(item)}
                      className="flex w-full items-center justify-between gap-2 py-3 text-left hover:bg-gray-800/50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-gray-100">{item.name}</span>
                        {item.brandOwner && (
                          <span className="block truncate text-xs text-gray-500">
                            {item.brandOwner}
                          </span>
                        )}
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs text-gray-500">
                          {Math.round(item.per100g.calories)} kcal/100g
                        </span>
                        {item.dataType && (
                          <span className="rounded-full border border-gray-700 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                            {item.dataType}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : tab === 'barcode' ? (
            <div className="space-y-4">
              <div
                ref={scannerRef}
                className={`relative overflow-hidden rounded-lg bg-black ${scanning ? 'min-h-48' : 'hidden'}`}
              />
              {!scanning && (
                <button
                  type="button"
                  onClick={() => void startScan()}
                  disabled={barcodeLoading}
                  className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
                >
                  Scan barcode
                </button>
              )}
              {scanning && (
                <button
                  type="button"
                  onClick={stopScanner}
                  className="w-full rounded-lg border border-gray-700 py-2 text-sm text-gray-400 hover:bg-gray-800"
                >
                  Stop scanning
                </button>
              )}
              {barcodeLoading && <p className="text-sm text-gray-500">Looking up product…</p>}
              {barcodeError && <p className="text-sm text-red-400">{barcodeError}</p>}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400">
                  Or enter barcode manually
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 3017620422003"
                    className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-indigo-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        void handleBarcodeLookup(input.value);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                      void handleBarcodeLookup(input.value);
                    }}
                    className="shrink-0 rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    Look up
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-400">Food name</span>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Homemade smoothie"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-indigo-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-400">Serving (grams)</span>
                <input
                  type="number"
                  min={1}
                  value={manualGrams}
                  onChange={(e) => setManualGrams(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100 focus:border-indigo-500 focus:outline-none"
                />
              </label>
              <p className="text-xs font-medium text-gray-400">Nutrition (for this serving)</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {NUTRITION_FIELDS.map(({ key, label, unit }) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs text-gray-500">
                      {label} ({unit})
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={key === 'calories' ? 1 : 0.1}
                      value={manualNutrition[key]}
                      onChange={(e) =>
                        setManualNutrition((prev) => ({
                          ...prev,
                          [key]: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={confirmManual}
                className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white hover:bg-indigo-400"
              >
                Add food
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
