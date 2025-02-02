import { createClient } from '@/utils/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

export default async function Countries() {
  // Initialize Supabase client and fetch data
  const supabase = await createClient();
  const { data: countries, error } = await supabase.from('countries').select();

  if (error) {
    return <div>Error fetching countries: {error.message}</div>;
  }

  return (
    <Card className="p-4">
      <CardContent>
        <h1 className="text-xl font-bold mb-4">Countries</h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Population</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countries?.map((country: any) => (
              <TableRow key={country.id}>
                <TableCell>{country.id}</TableCell>
                <TableCell>{country.name}</TableCell>
                <TableCell>{country.population}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
