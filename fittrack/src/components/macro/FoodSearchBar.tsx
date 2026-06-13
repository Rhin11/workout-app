interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function FoodSearchBar({ value, onChange, placeholder = 'Search food...' }: Props) {
  return (
    <div className="px-4 py-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}
