# Supabase Setup Instructions

## Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Choose your region and set a password
5. Wait for the project to be ready (2-3 minutes)

## Step 2: Get Your Credentials
1. Go to **Project Settings** (bottom left)
2. Click **API** tab
3. Copy:
   - **Project URL** (supabaseUrl)
   - **anon public key** (supabaseKey)
4. Update `src/supabaseClient.ts` with these values

## Step 3: Create Database Tables
1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the contents of `supabase-setup.sql` (it includes `employees`, `inventory`, `inventory_transactions`, `expenses`, `incomes`, `customers`, and `daily_orders` tables)
4. Click **Run** to execute all SQL statements

## Step 4: Verify Tables Created
1. Go to **Table Editor** (left sidebar)
2. You should see:
   - `employees`
   - `inventory`
   - `inventory_transactions`
   - `expenses`
   - `incomes`
   - `customers`
   - `daily_orders`

## Daily Orders Payment Status (if table already exists)
If you created `daily_orders` before this update, run this SQL once:

ALTER TABLE daily_orders
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Pending'
CHECK (payment_status IN ('Paid', 'Pending'));

## Step 5: (Optional) Enable Row Level Security (RLS)
For production:
1. Go to **Authentication** → **Policies**
2. Create policies to restrict access to logged-in users only
3. Uncomment the RLS statements in `supabase-setup.sql` and run them

## Step 6: Test the Application
1. Run `npm run dev`
2. Log in with **admin / 123456**
3. Add an employee or inventory item
4. Data should appear in Supabase Table Editor in real-time

## Troubleshooting

**"Error: relation 'employees' does not exist"**
- Tables haven't been created yet
- Run the SQL setup script in Supabase SQL Editor

**"Error: Invalid API key"**
- Update `src/supabaseClient.ts` with correct URL and key
- Double-check you copied the anon key, not the service role key

**Data not persisting**
- Check browser console for errors
- Verify Supabase URL and key are correct
- Ensure tables exist in Supabase

**CORS Error**
- This shouldn't happen with Supabase's default CORS settings
- If it does, go to Supabase Project Settings → API → CORS and add your domain
