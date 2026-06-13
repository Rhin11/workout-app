interface Props {
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
}

export default function MealLog({ mealType }: Props) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 font-semibold text-gray-100">{mealType}</h3>
      <p className="text-sm text-gray-500">No entries</p>
    </div>
  );
}
