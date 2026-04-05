# Mealar Kitchen Management App

A React-based web application for managing a cloud kitchen, built with Vite and Supabase.

## Features

- Admin-only login
- Employee leave and salary management (add/edit employees, track salary, advances, leaves, payments)
  - Add joining date and role
  - Track monthly salary records with advances (with date) and paid status via employee detail view
  - Add advance amount per month and see pending salary
- Inventory management
  - Add/edit/delete inventory items with categories
  - Track low stock items with alerts
  - Record purchases and usage transactions with dates
  - View transaction history per item
  - Total inventory value tracking
- Expense tracking
  - Categories include Provision Wholesale, Provision Retail, Vegetable Wholesale, Vegetable Retail, Gas, Packing Material, Petrol, Scooter EMI, Scooter Maintenance, Kitchen Maintenance, Chicken, Fish, Idiyappam, Chappathi, Egg
- Income tracking
  - Sources: App Order, Cash
- Profit analysis
  - View total income and expenses for a period and calculate net profit

## Tech Stack

- Frontend: React with TypeScript
- Build Tool: Vite
- Backend: Supabase (database and auth)

## Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`
3. **Set up Supabase** (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions):
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Get your Project URL and anon key
   - Update `src/supabaseClient.ts` with your credentials
   - Run the SQL setup script from `supabase-setup.sql` in the Supabase SQL Editor
   - Verify all three tables are created: `employees`, `inventory`, `inventory_transactions`
4. Run the development server: `npm run dev`
5. Open [http://localhost:5173](http://localhost:5173) in your browser.
6. Login with username: `admin`, password: `123456`
7. Start managing employees, inventory, and expenses!

## Project Structure

```
src/
  ├── pages/
  │   ├── Dashboard.tsx          # Main dashboard with navigation
  │   ├── EmployeeManagement.tsx # Employee payroll & leaves
  │   └── InventoryManagement.tsx # Inventory tracking & transactions
  ├── App.tsx                    # Main app with routing
  ├── App.css                    # Light orange & white theme
  ├── index.css                  # Global styles
  ├── main.tsx                   # React entry point
  └── supabaseClient.ts          # Supabase initialization

Database:
  ├── employees                  # Employee records with salary data
  ├── inventory                  # Inventory items with stock levels
  └── inventory_transactions     # Purchase & usage history
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
