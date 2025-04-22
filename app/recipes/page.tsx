// app/recipes/page.tsx
import { createClient } from '@/utils/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody } from '@/components/ui/table';
import AddRecipeForm from '@/components/AddRecipeForm';
import RecipeRow from '@/components/RecipeRow';
import { redirect } from 'next/navigation';

export default async function Recipes() {
  // Initialize Supabase client
  const supabase = await createClient();
  
  // Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Redirect to login if not authenticated
  if (!user) {
    return redirect('/sign-in?redirect=/recipes');
  }
  
  // Fetch only the current user's recipes
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select()
    .eq('user', user.id)
    .order('id', { ascending: true });

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <h2 className="text-lg font-semibold text-red-700">Error Loading Recipes</h2>
        <p className="text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <Card className="p-4">
      <CardContent>
        <h1 className="text-xl font-bold mb-4">Your Recipes</h1>
        {recipes && recipes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Recipe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.map((recipe: any) => (
                <RecipeRow key={recipe.id} recipe={recipe} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            You haven't created any recipes yet. Use the form below to add your first recipe!
          </div>
        )}
        {/* Render the client-side form below the table */}
        <AddRecipeForm />
      </CardContent>
    </Card>
  );
}
