// app/recipes/page.tsx
import { createClient } from '@/utils/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import AddRecipeForm from '@/components/AddRecipeForm';

export default async function Recipes() {
  // Initialize Supabase client and fetch data
  const supabase = await createClient();
  const { data: recipes, error } = await supabase.from('recipes').select();

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
              <TableRow key={recipe.id}>
                <TableCell>{recipe.id}</TableCell>
                <TableCell>{recipe.user}</TableCell>
                <TableCell>
                  {recipe.ingredients.map((ingredient: string, index: number) => (
                    <div key={index}>
                      <span className="font-semibold">{ingredient}</span>: {recipe.amounts[index]} {recipe.units[index]}
                    </div>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Render the client-side form below the table */}
        <AddRecipeForm />
      </CardContent>
    </Card>
  );
}
