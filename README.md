![Screenshot from 2025-04-29 16-11-19](https://github.com/user-attachments/assets/ce088c86-a1c7-4d34-843b-95795aa04c0d)
# Meal-Master – Recipe Management App

**Live Demo:** [https://meal-master-sand.vercel.app](https://meal-master-sand.vercel.app)

## Overview

Meal-Master is a personal recipe management application built with Next.js and Supabase.  
It allows users to store, convert, and scale their recipes, as well as view nutritional information.

## Features

- **User Authentication**: Secure login and registration with Supabase Auth  
- **Recipe Management**: Add, edit, and delete your personal recipes  
- **Unit Conversion**: Convert between different measurement units (g, kg, oz, lb)  
- **Recipe Scaling**: Easily scale recipes up or down based on serving needs  
- **Nutritional Information**: View USDA nutrition data for your recipes  
- **Dark/Light Mode**: Toggle between dark and light themes  

## Technology Stack

- Frontend: Next.js (App Router & Pages Router)  
- Styling: Tailwind CSS & shadcn/ui components  
- Backend: Supabase (PostgreSQL + Auth + RLS)  
- Deployment: Vercel  

## Getting Started

### Prerequisites

- Node.js v18 or higher  
- npm or yarn  
- A Supabase account and project  

### Installation

1. Clone the repository  
   ```bash
   git clone https://github.com/ashwaghd/meal-master.git
   cd meal-master
   ```

2. Install dependencies  
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the project root with your Supabase credentials:  
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the development server  
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Open http://localhost:3000 in your browser.

## Usage

1. Sign up for a Meal-Master account or log in.  
2. Add recipes by specifying ingredients, amounts, units, and USDA FDC IDs.  
3. Convert individual units or convert all units at once.  
4. Scale your recipe by any factor (e.g., double or halve).  
5. View detailed nutritional information pulled from USDA FoodData Central.  
6. Toggle between dark and light modes.

## Author

Ash Wagner ([@ashwaghd](https://github.com/ashwaghd))

## License

This project is licensed under the MIT License.
