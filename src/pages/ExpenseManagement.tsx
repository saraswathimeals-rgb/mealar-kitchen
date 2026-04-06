import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export interface Expense {
  id: string
  date: string
  category: string
  amount: number
  notes: string
}

const categories = [
  'Provision Wholesale',
  'Provision Retail',
  'Vegetable Wholesale',
  'Vegetable Retail',
  'Gas',
  'Packing Material',
  'Petrol',
  'Scooter EMI',
  'Scooter Maintenance',
  'Kitchen Maintenance',
  'Chicken',
  'Fish',
  'Idiyappam',
  'Chappathi',
  'Egg',
  'Salary'
]

const ExpenseManagement: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterMonth, setFilterMonth] = useState<string>('')
  const [filterStartDate, setFilterStartDate] = useState<string>('')
  const [filterEndDate, setFilterEndDate] = useState<string>('')
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState<Omit<Expense, 'id'>>({
    date: new Date().toISOString().slice(0, 10),
    category: categories[0],
    amount: 0,
    notes: '',
  })

  const loadExpenses = async () => {
    let query = supabase.from('expenses').select('*').order('date', { ascending: false })
    if (filterCategory) query = query.eq('category', filterCategory)
    // apply date range if provided, otherwise fallback to month filter
    if (filterStartDate || filterEndDate) {
      if (filterStartDate) query = query.gte('date', filterStartDate)
      if (filterEndDate) query = query.lte('date', filterEndDate)
    } else if (filterMonth) {
      const [y, m] = filterMonth.split('-')
      const start = `${y}-${m}-01`
      const endDate = new Date(Number(y), Number(m), 0)
      const end = endDate.toISOString().slice(0, 10)
      query = query.gte('date', start).lte('date', end)
    }
    const { data } = await query
    if (data) {
      setExpenses(data as Expense[])
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [filterCategory, filterMonth, filterStartDate, filterEndDate])

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      category: categories[0],
      amount: 0,
      notes: '',
    })
    setEditing(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await supabase
        .from('expenses')
        .update(form)
        .eq('id', editing.id)
      loadExpenses()
    } else {
      const { data } = await supabase.from('expenses').insert([form]).select().single()
      if (data) {
        setExpenses((prev) => [data as Expense, ...prev])
      }
    }
    resetForm()
  }

  const handleEdit = (exp: Expense) => {
    setEditing(exp)
    setForm({
      date: exp.date,
      category: exp.category,
      amount: exp.amount,
      notes: exp.notes,
    })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this expense?')) return
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      <Link to="/">
        <button>← Back to Dashboard</button>
      </Link>
      <h2>Expense Tracking</h2>

      <form onSubmit={handleSubmit} className="expense-form">
        <div>
          <label>Date:</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Category:</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Amount:</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <label>Notes:</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <button type="submit">{editing ? 'Update' : 'Add'} Expense</button>
        {editing && <button onClick={resetForm}>Cancel</button>}
      </form>

      <div className="filter-section">
        <label>Category:</label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label>Month:</label>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        />
        <label>Start Date:</label>
        <input
          type="date"
          value={filterStartDate}
          onChange={(e) => setFilterStartDate(e.target.value)}
        />
        <label>End Date:</label>
        <input
          type="date"
          value={filterEndDate}
          onChange={(e) => setFilterEndDate(e.target.value)}
        />
      </div>

      <div className="stat-card">
        <div className="stat-number">₹{totalAmount.toFixed(2)}</div>
        <div className="stat-label">Total</div>
      </div>

      <table className="expense-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td>{e.date}</td>
              <td>{e.category}</td>
              <td>₹{e.amount.toFixed(2)}</td>
              <td>{e.notes || '-'}</td>
              <td>
                <button onClick={() => handleEdit(e)}>Edit</button>
                <button onClick={() => handleDelete(e.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ExpenseManagement
