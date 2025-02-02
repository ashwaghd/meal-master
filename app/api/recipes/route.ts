// app/api/recipes/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, ingredients, amounts, units } = body;

    // Insert the new recipe into the "recipes" table
    const supabase = await createClient();
    const { data, error } = await supabase.from('recipes').insert([
      { user, ingredients, amounts, units }
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
