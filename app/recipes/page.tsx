// app/recipes/page.tsx
import { createClient } from '@/utils/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody } from '@/components/ui/table';
import AddRecipeForm from '@/components/AddRecipeForm';
import RecipeRow from '@/components/RecipeRow';

export default async function Recipes() {
  // Initialize Supabase client and fetch data
  const supabase = await createClient();
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select()
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
        <h1 className="text-xl font-bold mb-4">Recipe List</h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Recipe:</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes?.map((recipe: any) => (
              <RecipeRow key={recipe.id} recipe={recipe} />
            ))}
          </TableBody>
        </Table>
        {/* Render the client-side form below the table */}
        <AddRecipeForm />
      </CardContent>
    </Card>
  );
}
