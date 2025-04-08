'use client';
import { useState, useEffect } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

type RecipeRowProps = {
  recipe: {
    id: number;
    user: number;
    ingredients: string[];
    amounts: number[];
    units: string[];
    fdcIds: string[];
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
  
  // State for scaling feature
  const [isScaling, setIsScaling] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  
  // State for nutrition modal
  const [nutritionModalOpen, setNutritionModalOpen] = useState(false);
  const [nutritionData, setNutritionData] = useState<any[]>([]);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionError, setNutritionError] = useState('');

  // Add these state variables to your component
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add a success state variable
  const [success, setSuccess] = useState('');

  // Add useEffect to auto-clear success messages
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success) {
      timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [success]);

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
    setSuccess(''); // Reset success message
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
        // Success - show success message
        setSuccess('Recipe updated successfully!');
        
        // Exit edit mode
        setIsEditing(false);
        
        // Update local state with server data
        if (result.data && result.data.length > 0) {
          const updatedRecipe = result.data[0];
          setEditedRecipe({
            amounts: updatedRecipe.amounts,
            units: updatedRecipe.units
          });
        }
        
        // Reload the page after 3 seconds to show the success message
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error updating recipe:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch nutrition data
  const fetchNutritionData = async () => {
    setNutritionLoading(true);
    setNutritionError('');
    setNutritionData([]);
    
    try {
      // Only fetch for valid FDC IDs
      const validFdcIds = recipe.fdcIds.filter(id => id !== null && id !== undefined && id !== '');
      
      if (validFdcIds.length === 0) {
        setNutritionError('No FDC IDs available for this recipe');
        return;
      }
      
      // Update the API call to ensure we get the full format which includes food portions
      const response = await fetch('/api/nutrition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fdcIds: validFdcIds,
          format: 'full' // Ensure we get full format
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch nutrition data');
      }

      const result = await response.json();
      setNutritionData(result.data || []);
    } catch (err: any) {
      console.error('Error fetching nutrition data:', err);
      setNutritionError(err.message || 'Failed to load nutrition information');
    } finally {
      setNutritionLoading(false);
    }
  };

  const handleNutritionModalOpen = () => {
    setNutritionModalOpen(true);
    fetchNutritionData();
  };

  // Updating the convertToGrams function to use foodPortions from the API
  const convertToGrams = (amount: number, unit: string, foodData: any): number => {
    // First, handle standard weight units
    unit = unit.toLowerCase().trim();
    
    // Mass unit conversions to grams
    const unitToGramMap: Record<string, number> = {
      'g': 1,
      'gram': 1,
      'grams': 1,
      'kg': 1000,
      'kilogram': 1000,
      'kilograms': 1000,
      'oz': 28.35,
      'ounce': 28.35,
      'ounces': 28.35,
      'lb': 453.592,
      'pound': 453.592,
      'pounds': 453.592
    };

    // If it's a standard weight unit, do a direct conversion
    if (unitToGramMap[unit]) {
      return amount * unitToGramMap[unit];
    }
    
    // If we have foodData with foodPortions, try to find a matching portion
    if (foodData && foodData.foodPortions && foodData.foodPortions.length > 0) {
      // Log available portions for debugging
      console.log(`Available portions for ${foodData.description}:`, 
        foodData.foodPortions.map((p: any) => `${p.portionDescription}: ${p.gramWeight}g`));
      
      // Try to find an exact match first (e.g., "cup" matches "1 cup")
      const exactMatch = foodData.foodPortions.find((portion: any) => 
        portion.portionDescription && 
        portion.portionDescription.toLowerCase().includes(unit)
      );
      
      if (exactMatch && exactMatch.gramWeight) {
        console.log(`Found exact portion match: ${exactMatch.portionDescription} = ${exactMatch.gramWeight}g`);
        return amount * exactMatch.gramWeight;
      }
      
      // If no exact match, use the first portion as fallback (better than nothing)
      if (foodData.foodPortions[0].gramWeight) {
        const defaultPortion = foodData.foodPortions[0];
        console.log(`Using default portion: ${defaultPortion.portionDescription} = ${defaultPortion.gramWeight}g`);
        return amount * defaultPortion.gramWeight;
      }
    }
    
    // If we get here, we couldn't find a conversion - use weight as-is (assuming grams)
    console.log(`Warning: Could not convert ${unit} to grams. Assuming grams.`);
    return amount;
  };

  // Update the getTotalNutrientValue function to use the improved converter
  const getTotalNutrientValue = (nutrientName: string) => {
    let total = 0;
    
    nutritionData.forEach((food, index) => {
      const nutrient = food.foodNutrients?.find(
        (n: any) => n.nutrient?.name === nutrientName
      );
      
      if (nutrient) {
        // Get the original or scaled amount
        let amount = recipe.amounts[index] || 1;
        if (isScaling) {
          amount = amount * scaleFactor;
        }
        
        // Convert to grams using the enhanced function
        const amountInGrams = convertToGrams(amount, recipe.units[index], food);
        
        // USDA provides values per 100g
        const value = nutrient.amount || 0;
        total += (amountInGrams / 100) * value;
      }
    });
    
    return total.toFixed(2);
  };

  // Add this function to handle deletion
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/recipes?id=${recipe.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete recipe');
      }
      
      // On successful deletion, refresh the page to show updated list
      window.location.reload();
    } catch (err: any) {
      console.error('Error deleting recipe:', err);
      setError(err.message);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TableRow 
        className=""
      >
        <TableCell>{recipe.id}</TableCell>
        <TableCell>{recipe.user}</TableCell>
        <TableCell>
          <div className="space-y-2">
            {/* Success notification */}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{success}</span>
              </div>
            )}
            
            {/* Error notification - update styling to match */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Ingredients:</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleNutritionModalOpen}
                  className="hidden"
                >
                  Debug: Open Modal
                </button>
                
                <button 
                  onClick={handleNutritionModalOpen}
                  className="px-3 py-1.5 rounded text-sm bg-teal-600 text-white hover:bg-teal-700"
                >
                  View
                </button>
                
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
                    Scale
                  </button>
                )}
                
                <button 
                  onClick={handleEditToggle}
                  className={`px-3 py-1.5 rounded text-sm ${
                    isEditing 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  }`}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
                
                {isEditing && (
                  <button 
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                )}
                
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 rounded text-sm bg-red-600 text-white hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
            
            <ul className="list-disc list-inside space-y-1">
              {recipe.ingredients.map((ingredient: string, index: number) => (
                <li key={index} className={isEditing ? "flex items-center gap-2" : ""}>
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <span>{ingredient}</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={editedRecipe.amounts[index]}
                        onChange={(e) => handleAmountChange(index, e.target.value)}
                        className="border rounded px-1 py-0.5 w-20 text-sm"
                      />
                      <select
                        value={editedRecipe.units[index]}
                        onChange={(e) => handleUnitChange(index, e.target.value)}
                        className="border rounded px-1 py-0.5 w-20 text-sm"
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="oz">oz</option>
                        <option value="lb">lb</option>
                      </select>
                    </div>
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

      <Dialog open={nutritionModalOpen} onOpenChange={setNutritionModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isScaling ? `Nutritional Information (Scaled ${scaleFactor}x)` : 'Nutritional Information'}
            </DialogTitle>
            <DialogDescription>
              Nutritional details for {isScaling ? 'scaled' : 'all'} ingredients in your recipe.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {nutritionLoading && (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading nutritional data...</p>
              </div>
            )}
            
            {nutritionError && (
              <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
                Error: {nutritionError}
              </div>
            )}
            
            {!nutritionLoading && !nutritionError && nutritionData.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Total Nutrition Facts</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 border rounded">
                    <h4 className="font-medium">Macronutrients</h4>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <div>Calories:</div>
                      <div className="text-right">{getTotalNutrientValue('Energy')} kcal</div>
                      <div>Protein:</div>
                      <div className="text-right">{getTotalNutrientValue('Protein')} g</div>
                      <div>Total Fat:</div>
                      <div className="text-right">{getTotalNutrientValue('Total lipid (fat)')} g</div>
                      <div>Carbohydrates:</div>
                      <div className="text-right">{getTotalNutrientValue('Carbohydrate, by difference')} g</div>
                      <div>Fiber:</div>
                      <div className="text-right">{getTotalNutrientValue('Fiber, total dietary')} g</div>
                      <div>Sugars:</div>
                      <div className="text-right">{getTotalNutrientValue('Sugars, total including NLEA')} g</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 p-4 border rounded">
                    <h4 className="font-medium">Minerals & Vitamins</h4>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <div>Calcium:</div>
                      <div className="text-right">{getTotalNutrientValue('Calcium, Ca')} mg</div>
                      <div>Iron:</div>
                      <div className="text-right">{getTotalNutrientValue('Iron, Fe')} mg</div>
                      <div>Potassium:</div>
                      <div className="text-right">{getTotalNutrientValue('Potassium, K')} mg</div>
                      <div>Sodium:</div>
                      <div className="text-right">{getTotalNutrientValue('Sodium, Na')} mg</div>
                      <div>Vitamin C:</div>
                      <div className="text-right">{getTotalNutrientValue('Vitamin C, total ascorbic acid')} mg</div>
                      <div>Vitamin D:</div>
                      <div className="text-right">{getTotalNutrientValue('Vitamin D (D2 + D3)')} µg</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  <p>Data source: USDA FoodData Central</p>
                  <p>Note: Values are estimates based on standard serving sizes and may vary.</p>
                </div>
              </div>
            )}
            
            {!nutritionLoading && !nutritionError && nutritionData.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                No nutrition data available for this recipe.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this recipe? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 