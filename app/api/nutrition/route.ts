import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fdcIds } = body;
    
    if (!fdcIds || !Array.isArray(fdcIds) || fdcIds.length === 0) {
      return NextResponse.json({ error: 'Valid fdcIds array is required' }, { status: 400 });
    }

    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'USDA API key is not configured' }, { status: 500 });
    }

    // Fetch nutrition data for each FDC ID
    const nutritionPromises = fdcIds.map(async (fdcId) => {
      if (!fdcId) return null;
      
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        console.error(`Error fetching nutrition for fdcId ${fdcId}:`, response.status);
        return null;
      }

      return response.json();
    });

    const nutritionData = await Promise.all(nutritionPromises);
    const validData = nutritionData.filter(item => item !== null);

    return NextResponse.json({ data: validData });
  } catch (error) {
    console.error('Error in nutrition API route:', error);
    return NextResponse.json({ error: 'Error fetching nutrition data' }, { status: 500 });
  }
} 