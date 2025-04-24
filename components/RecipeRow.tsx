'use client';
import { useState, useEffect, useRef } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { createPortal } from 'react-dom';

type RecipeRowProps = {
  recipe: {
    id: number;
    // user property can be removed or kept in the type but not displayed
    // user: string; // This is now a UUID but we don't need to display it
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

  // Add these new state variables at the top of your component
  const [isConverting, setIsConverting] = useState(false);
  const [targetUnit, setTargetUnit] = useState('g');

  // Add this state to manage the dropdown
  const [menuOpen, setMenuOpen] = useState(false);

  // Add this state to track dropdown position
  const [showAbove, setShowAbove] = useState(false);

  // Add this ref to the action button
  const actionButtonRef = useRef<HTMLButtonElement>(null);

  // Add this state for portal rendering
  const [dropdownCoordinates, setDropdownCoordinates] = useState({ top: 0, left: 0, width: 0 });

  // Add this state for individual conversion
  const [convertIndices, setConvertIndices] = useState<Record<number, string>>({});

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
    // First turn everything off if we're enabling edit mode
    if (!isEditing) {
      setIsConverting(false);
      setIsScaling(false);
    } else {
      // If we're exiting edit mode, reset to original values
      setEditedRecipe({
        amounts: [...recipe.amounts],
        units: [...recipe.units]
      });
    }
    // Toggle edit mode
    setIsEditing(!isEditing);
  };

  const handleScaleToggle = () => {
    // First turn everything off if we're enabling scale mode
    if (!isScaling) {
      setIsConverting(false);
      setIsEditing(false);
      // Reset scale factor when entering scale mode
      setScaleFactor(1);
    }
    // Toggle scale mode
    setIsScaling(!isScaling);
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

  // Add this conversion function
  const convertUnits = (amount: number, fromUnit: string, toUnit: string): number => {
    // Convert everything to grams first
    const unitToGramMap: Record<string, number> = {
      'g': 1,
      'kg': 1000,
      'oz': 28.35,
      'lb': 453.592
    };
    
    // First convert to grams
    const amountInGrams = amount * (unitToGramMap[fromUnit.toLowerCase()] || 1);
    
    // Then convert to target unit
    const convertedAmount = amountInGrams / (unitToGramMap[toUnit.toLowerCase()] || 1);
    
    return convertedAmount;
  };

  // Add this handler to convert all units
  const handleConvertAll = async () => {
    if (!targetUnit) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const newAmounts = [...recipe.amounts];
      const newUnits = [...recipe.units];
      
      // Convert each amount to the new unit
      recipe.units.forEach((unit, index) => {
        if (unit !== targetUnit) {
          newAmounts[index] = convertUnits(recipe.amounts[index], unit, targetUnit);
          newUnits[index] = targetUnit;
        }
      });
      
      // Update the recipe with converted values
      const response = await fetch('/api/recipes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: recipe.id,
          amounts: newAmounts,
          units: newUnits,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update recipe');
      }
      
      setSuccess(`All units converted to ${targetUnit}`);
      
      // Update local state
      setEditedRecipe({
        amounts: newAmounts,
        units: newUnits
      });
      
      // Reset conversion mode
      setIsConverting(false);
      
      // Reload the page after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (err: any) {
      console.error('Error converting units:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handleConvertToggle function to ensure other modes are turned off
  const handleConvertToggle = () => {
    // First turn everything off if we're enabling convert mode
    if (!isConverting) {
      setIsEditing(false);
      setIsScaling(false);
    }
    // Toggle convert mode
    setIsConverting(!isConverting);
  };

  // Update the toggleMenu function to calculate exact coordinates
  const toggleMenu = () => {
    if (!menuOpen && actionButtonRef.current) {
      const buttonRect = actionButtonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      
      setDropdownCoordinates({
        // If not enough space below, position above
        top: spaceBelow < 200 ? buttonRect.top - 10 : buttonRect.bottom + 10,
        left: buttonRect.left,
        width: buttonRect.width
      });
      
      setShowAbove(spaceBelow < 200);
    }
    
    setMenuOpen(!menuOpen);
  };

  // Add this function to close the menu
  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Update the handleConvertIndividual function to reload after success
  const handleConvertIndividual = async (index: number) => {
    if (!convertIndices[index]) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const newAmounts = [...editedRecipe.amounts];
      const newUnits = [...editedRecipe.units];
      
      // Convert the amount based on current unit to target unit
      const convertedAmount = convertAmount(
        recipe.amounts[index],
        recipe.units[index],
        convertIndices[index]
      );
      
      newAmounts[index] = convertedAmount;
      newUnits[index] = convertIndices[index];
      
      // Save changes to database
      const response = await fetch('/api/recipes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: recipe.id,
          amounts: newAmounts,
          units: newUnits,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update recipe');
      }
      
      // Update local state
      setEditedRecipe({
        amounts: newAmounts,
        units: newUnits
      });
      
      // Clear the conversion selection
      const newConvertIndices = { ...convertIndices };
      delete newConvertIndices[index];
      setConvertIndices(newConvertIndices);
      
      setSuccess(`Converted ${recipe.ingredients[index]} to ${convertIndices[index]}`);
      
      // Reload after 3 seconds to refresh with updated data
      setTimeout(() => window.location.reload(), 3000);
    } catch (err: any) {
      console.error('Error converting unit:', err);
      setError(err.message || 'Failed to save conversion');
    } finally {
      setIsLoading(false);
    }
  };

  // Add the convertAmount helper function
  const convertAmount = (amount: number, fromUnit: string, toUnit: string): number => {
    // Convert everything to grams first
    let grams = amount;
    
    if (fromUnit === 'kg') grams = amount * 1000;
    else if (fromUnit === 'oz') grams = amount * 28.35;
    else if (fromUnit === 'lb') grams = amount * 453.59;
    
    // Then convert from grams to target unit
    if (toUnit === 'g') return parseFloat(grams.toFixed(2));
    if (toUnit === 'kg') return parseFloat((grams / 1000).toFixed(2));
    if (toUnit === 'oz') return parseFloat((grams / 28.35).toFixed(2));
    if (toUnit === 'lb') return parseFloat((grams / 453.59).toFixed(2));
    
    return amount; // Fallback
  };

  return (
    <>
    <TableRow>
      <TableCell>{recipe.id}</TableCell>
      <TableCell>
          <div className="space-y-2">
            {/* Success notification */}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{success}</span>
              </div>
            )}
            
            {/* Error notification */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <div className="flex items-center">
              <div className="flex-grow">
                <h3 className="font-medium mb-2">Ingredients:</h3>
                
                {/* Action mode containers */}
                {isConverting && (
                  <div className="mt-2 p-2 bg-transparent rounded border flex items-center gap-2">
                    <span className="text-sm font-medium">Convert all units to:</span>
                    <select
                      id={`convert-${recipe.id}`}
                      value={targetUnit}
                      onChange={(e) => setTargetUnit(e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="oz">oz</option>
                      <option value="lb">lb</option>
                    </select>
                    <div className="flex-grow"></div>
                    <button 
                      onClick={handleConvertAll}
                      disabled={isLoading}
                      className="px-3 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Converting...' : 'Apply'}
                    </button>
                    <button 
                      onClick={handleConvertToggle}
                      className="px-3 py-1 rounded text-sm bg-gray-600 text-white hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {isScaling && (
                  <div className="mt-2 p-2 bg-transparent rounded border flex items-center gap-2">
                    <span className="text-sm font-medium">Scale by factor:</span>
          <input
                      id={`scale-${recipe.id}`}
            type="number"
            min="0.1"
            step="0.1"
            value={scaleFactor}
                      onChange={handleScaleFactorChange}
                      className="border rounded px-2 py-1 w-20 text-sm"
                    />
                    <div className="flex-grow"></div>
                    <button 
                      onClick={handleScaleToggle}
                      className="px-3 py-1 rounded text-sm bg-gray-600 text-white hover:bg-gray-700"
                    >
                      Exit Scale Mode
                    </button>
                  </div>
                )}

                {isEditing && (
                  <div className="mt-2 p-2 bg-transparent rounded border flex items-center gap-2">
                    <span className="text-sm font-medium">Editing Mode</span>
                    <div className="flex-grow"></div>
                    <button 
                      onClick={handleSave}
                      disabled={isLoading}
                      className="px-3 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      onClick={handleEditToggle}
                      className="px-3 py-1 rounded text-sm bg-gray-600 text-white hover:bg-gray-700"
                    >
                      Cancel
                    </button>
        </div>
                )}
                
                <ul className="list-disc list-inside space-y-1 mt-2">
        {recipe.ingredients.map((ingredient: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 py-1">
                      <span className="flex-grow">
                        {ingredient} - {isScaling ? getScaledAmount(recipe.amounts[index]) : recipe.amounts[index].toFixed(2)} {recipe.units[index]}
                        {isScaling && scaleFactor !== 1 && (
                          <span className="text-gray-500 text-xs ml-1">
                            (original: {recipe.amounts[index].toFixed(2)})
                          </span>
                        )}
                      </span>
                      
                      {isConverting && (
                        <div className="flex items-center gap-2">
                          <select
                            value={convertIndices[index] || ''}
                            onChange={(e) => {
                              const newConvertIndices = { ...convertIndices };
                              if (e.target.value) {
                                newConvertIndices[index] = e.target.value;
                              } else {
                                delete newConvertIndices[index];
                              }
                              setConvertIndices(newConvertIndices);
                            }}
                            className="border rounded px-1 py-0.5 text-sm w-16"
                          >
                            <option value="">Unit</option>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="oz">oz</option>
                            <option value="lb">lb</option>
                          </select>
                          
                          {convertIndices[index] && (
                            <button
                              onClick={() => handleConvertIndividual(index)}
                              className="px-2 py-0.5 rounded text-xs bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Convert
                            </button>
                          )}
                        </div>
                      )}
                      
                      {isEditing && (
                        <div className="flex items-center gap-2">
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
                            className="border rounded px-1 py-0.5 w-16 text-sm"
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="oz">oz</option>
                            <option value="lb">lb</option>
                          </select>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Actions button in a separate div for centering */}
              <div className="pl-4 flex items-center self-center">
                <div className="relative">
                  <button 
                    ref={actionButtonRef}
                    onClick={toggleMenu}
                    className="px-3 py-1.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Actions ▼
                  </button>
                  
                  {menuOpen && (
                    <>
                      {/* Invisible overlay */}
                      <div 
                        className="fixed inset-0 z-50" 
                        onClick={closeMenu}
                      ></div>
                      
                      {/* Portal for dropdown */}
                      {typeof window !== 'undefined' && createPortal(
                        <div 
                          style={{
                            position: 'fixed',
                            top: `${dropdownCoordinates.top}px`,
                            left: `${dropdownCoordinates.left}px`,
                            width: '224px', // Fixed width of 56*4=224px
                            zIndex: 9999,
                          }}
                          className="rounded-md shadow-lg bg-white"
                        >
                          <div className="py-1">
                            <button
                              onClick={() => {
                                handleNutritionModalOpen();
                                closeMenu();
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              View Nutrition
                            </button>
                            
                            <button
                              onClick={() => {
                                handleConvertToggle();
                                closeMenu();
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Convert Units
                            </button>
                            
                            <button
                              onClick={() => {
                                handleScaleToggle();
                                closeMenu();
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Scale Recipe
                            </button>
                            
                            <button
                              onClick={() => {
                                handleEditToggle();
                                closeMenu();
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {isEditing ? 'Cancel Edit' : 'Edit Recipe'}
                            </button>
                            
                            <button
                              onClick={() => {
                                setShowDeleteConfirm(true);
                                closeMenu();
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100"
                            >
                              Remove Recipe
                            </button>
                          </div>
                        </div>,
                        document.body
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
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