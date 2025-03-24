'use client';
import { useState } from 'react';
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
      
      const response = await fetch('/api/nutrition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fdcIds: validFdcIds,
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

  // Helper function to sum up nutrient values across ingredients
  const getTotalNutrientValue = (nutrientName: string) => {
    let total = 0;
    
    nutritionData.forEach((food, index) => {
      const nutrient = food.foodNutrients?.find(
        (n: any) => n.nutrient?.name === nutrientName
      );
      
      if (nutrient) {
        // Apply the appropriate quantity based on recipe amounts
        const amount = recipe.amounts[index] || 1;
        const value = nutrient.amount || 0;
        total += value * amount;
      }
    });
    
    return total.toFixed(2);
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
            {error && <div className="text-red-500 text-sm">{error}</div>}
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
                      <input
                        type="text"
                        value={editedRecipe.units[index]}
                        onChange={(e) => handleUnitChange(index, e.target.value)}
                        className="border rounded px-1 py-0.5 w-20 text-sm"
                      />
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
            <DialogTitle>Nutritional Information</DialogTitle>
            <DialogDescription>
              Nutritional details for all ingredients in your recipe.
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
    </>
  );
} 