// components/AddRecipeForm.tsx
'use client';
import { useState } from 'react';

export default function AddRecipeForm() {
  const [user, setUser] = useState('');
  const [ingredients, setIngredients] = useState([{ fdcId: null, ingredient: '', amount: '', unit: '' }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Update a specific ingredient row field
  const handleIngredientChange = (index: number, field: string, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  // Add a new blank ingredient row
  const addIngredientRow = () => {
    setIngredients([...ingredients, { fdcId: null, ingredient: '', amount: '', unit: '' }]);
  };

  // Remove a specific ingredient row
  const removeIngredientRow = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const searchIngredient = async (query: string) => {
    try {
      const res = await fetch(`/api/recipes?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        // Adjust according to the API's response structure; for instance:
        setSuggestions(data.foods || []); 
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error searching ingredient:', error);
      setSuggestions([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate user ID is a number
    const userInt = parseInt(user, 10);
    if (isNaN(userInt)) {
      setError('User must be a valid number.');
      setLoading(false);
      return;
    }

    // Prepare arrays for ingredients, USDA IDs, amounts, and units
    const ingredientNames = ingredients.map(row => row.ingredient);
    const fdcIds = ingredients.map(row => row.fdcId);
    const amounts = ingredients.map(row => parseFloat(row.amount));
    const units = ingredients.map(row => row.unit);

    // Basic validation: no empty fields allowed
    if (
      ingredientNames.some(name => !name) ||
      amounts.some(a => isNaN(a)) ||
      units.some(unit => !unit)
    ) {
      setError('Please fill out all ingredient fields correctly.');
      setLoading(false);
      return;
    }

    // Submit the form to our API endpoint
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: userInt,
        ingredients: ingredientNames,
        fdcIds,
        amounts,
        units
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      setError(errorData.error || 'Error inserting recipe.');
    } else {
      // Optionally clear the form or trigger a refresh of the recipes list
      setUser('');
      setIngredients([{ fdcId: null, ingredient: '', amount: '', unit: '' }]);
      setError('');
      // For Next.js App Router, you could use a refresh action here.
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <h2 className="text-lg font-bold">Add New Recipe</h2>
      {error && <div className="text-red-600">{error}</div>}
      <div>
        <label className="block font-semibold">User ID:</label>
        <input
          type="number"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>
      <div>
        <h3 className="font-semibold">Ingredients</h3>
        {ingredients.map((row, index) => (
          <div key={index} className="flex flex-col">
            <div className="flex space-x-2 items-center py-2">
              <input
                type="text"
                placeholder="Search Ingredient"
                value={row.ingredient}
                onChange={(e) => {
                  const value = e.target.value;
                  handleIngredientChange(index, 'ingredient', value);
                  setActiveRow(index);
                  if (value.length > 2) {
                    searchIngredient(value);
                  } else {
                    setSuggestions([]);
                  }
                }}
                className="border p-2 rounded"
              />
              <input
                type="number"
                step="any"
                placeholder="Amount"
                value={row.amount}
                onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Unit"
                value={row.unit}
                onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                className="border p-2 rounded"
              />
              <button type="button" onClick={() => removeIngredientRow(index)} className="text-red-600">
                Remove
              </button>
            </div>
            {activeRow === index && suggestions.length > 0 && (
              <div className="border bg-gray-50 shadow max-h-40 overflow-y-auto text-gray-900">
                {suggestions.map((suggestion: any) => (
                  <div
                    key={suggestion.fdcId}
                    onClick={() => {
                      handleIngredientChange(index, 'ingredient', suggestion.description);
                      handleIngredientChange(index, 'fdcId', suggestion.fdcId);
                      setSuggestions([]);
                      setActiveRow(null);
                    }}
                    className="p-2 hover:bg-gray-300 cursor-pointer"
                  >
                    {suggestion.description}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <button type="button" onClick={addIngredientRow} className="text-blue-600 mt-2">
          Add Ingredient
        </button>
      </div>
      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
        {loading ? 'Submitting...' : 'Submit Recipe'}
      </button>
    </form>
  );
}
