'use client';
import { useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';

type RecipeRowProps = {
  recipe: {
    id: number;
    user: number;
    ingredients: string[];
    amounts: number[];
    units: string[];
  };
};

export default function RecipeRow({ recipe }: RecipeRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState({
    amounts: [...recipe.amounts],
    units: [...recipe.units]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New state for scaling feature
  const [isScaling, setIsScaling] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  
  const handleEditToggle = () => {
    if (isEditing) {
      // If we're exiting edit mode without saving, reset to original values
      setEditedRecipe({
        amounts: [...recipe.amounts],
        units: [...recipe.units]
      });
    }
    setIsEditing(!isEditing);
    
    // Exit scaling mode if entering edit mode
    if (!isEditing) {
      setIsScaling(false);
    }
  };

  const handleScaleToggle = () => {
    setIsScaling(!isScaling);
    
    // Reset scale factor when toggling
    if (!isScaling) {
      setScaleFactor(1);
    }
    
    // Exit edit mode if entering scaling mode
    if (!isScaling) {
      setIsEditing(false);
    }
  };

  const handleScaleFactorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setScaleFactor(value);
    }
  };

  // Get scaled amount for display
  const getScaledAmount = (originalAmount: number) => {
    return (originalAmount * scaleFactor).toFixed(2);
  };

  const handleAmountChange = (index: number, value: string) => {
    const newAmounts = [...editedRecipe.amounts];
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      newAmounts[index] = numValue;
      setEditedRecipe({ ...editedRecipe, amounts: newAmounts });
    }
  };

  const handleUnitChange = (index: number, value: string) => {
    const newUnits = [...editedRecipe.units];
    newUnits[index] = value;
    setEditedRecipe({ ...editedRecipe, units: newUnits });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('Sending update request:', {
        id: recipe.id,
        amounts: editedRecipe.amounts,
        units: editedRecipe.units
      });
      
      const response = await fetch('/api/recipes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: recipe.id,
          amounts: editedRecipe.amounts,
          units: editedRecipe.units,
        }),
      });

      const result = await response.json();
      console.log('PATCH response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update recipe');
      }

      if (result.warning) {
        setError(result.warning);
      } else {
        // Success - exit edit mode
        setIsEditing(false);
        
        // Update local recipe data if available in response
        if (result.data && result.data.length > 0) {
          const updatedRecipe = result.data[0];
          // Update local state with server data
          setEditedRecipe({
            amounts: updatedRecipe.amounts,
            units: updatedRecipe.units
          });
        }
      }
    } catch (err: any) {
      console.error('Error updating recipe:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TableRow>
      <TableCell>{recipe.id}</TableCell>
      <TableCell>{recipe.user}</TableCell>
      <TableCell>
        <div className="space-y-2">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Ingredients:</h3>
            <div className="flex gap-2">
              {/* Scale Recipe UI */}
              {isScaling ? (
                <>
                  <div className="flex items-center gap-2">
                    <label htmlFor={`scale-${recipe.id}`} className="text-sm">Scale:</label>
                    <input
                      id={`scale-${recipe.id}`}
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={scaleFactor}
                      onChange={handleScaleFactorChange}
                      className="border rounded px-1 py-0.5 w-16 text-sm"
                    />
                  </div>
                  <button 
                    onClick={handleScaleToggle}
                    className="px-3 py-1.5 rounded text-sm bg-gray-600 text-white hover:bg-gray-700"
                  >
                    Reset
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleScaleToggle}
                  className="px-3 py-1.5 rounded text-sm bg-purple-600 text-white hover:bg-purple-700"
                >
                  Scale Recipe
                </button>
              )}
              
              {/* Edit button */}
              <button 
                onClick={handleEditToggle}
                className={`px-3 py-1.5 rounded text-sm ${
                  isEditing 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              
              {/* Save button (when editing) */}
              {isEditing && (
                <button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
          
          <ul className="list-disc list-inside space-y-1">
            {recipe.ingredients.map((ingredient: string, index: number) => (
              <li key={index} className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <span>{ingredient}</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editedRecipe.amounts[index]}
                      onChange={(e) => handleAmountChange(index, e.target.value)}
                      className="border rounded px-1 py-0.5 w-20 text-sm"
                    />
                    <input
                      type="text"
                      value={editedRecipe.units[index]}
                      onChange={(e) => handleUnitChange(index, e.target.value)}
                      className="border rounded px-1 py-0.5 w-20 text-sm"
                    />
                  </>
                ) : (
                  <span>
                    {ingredient} - {isScaling ? getScaledAmount(recipe.amounts[index]) : recipe.amounts[index].toFixed(2)} {recipe.units[index]}
                    {isScaling && scaleFactor !== 1 && (
                      <span className="text-gray-500 text-xs ml-1">
                        (original: {recipe.amounts[index].toFixed(2)})
                      </span>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </TableCell>
    </TableRow>
  );
} 