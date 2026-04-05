import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export interface Income {
  id: string
  date: string
  source: 'App Order' | 'Cash'
  amount: number
  notes: string
}

const sources: Income['source'][] = ['App Order', 'Cash']

const IncomeManagement: React.FC = () => {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [filterSource, setFilterSource] = useState<Income['source'] | ''>('')
  const [filterStartDate, setFilterStartDate] = useState<string>('')
  const [filterEndDate, setFilterEndDate] = useState<string>('')
  const [editing, setEditing] = useState<Income | null>(null)
  const [form, setForm] = useState<Omit<Income, 'id'>>({
    date: new Date().toISOString().slice(0, 10),
    source: sources[0],
    amount: 0,
    notes: '',
  })

  const loadIncomes = async () => {
    let query = supabase.from('incomes').select('*').order('date', { ascending: false })
    if (filterSource) query = query.eq('source', filterSource)
    if (filterStartDate) query = query.gte('date', filterStartDate)
    if (filterEndDate) query = query.lte('date', filterEndDate)
    const { data } = await query
    if (data) setIncomes(data as Income[])
  }

  useEffect(() => {
    loadIncomes()
  }, [filterSource, filterStartDate, filterEndDate])

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().slice(0, 10),
      source: sources[0],
      amount: 0,
      notes: '',
    })
    setEditing(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await supabase.from('incomes').update(form).eq('id', editing.id)
      loadIncomes()
    } else {
      const { data } = await supabase.from('incomes').insert([form]).select().single()
      if (data) setIncomes((prev) => [data as Income, ...prev])
    }
    resetForm()
  }

  const handleEdit = (inc: Income) => {
    setEditing(inc)
    setForm({ date: inc.date, source: inc.source, amount: inc.amount, notes: inc.notes })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this income record?')) return
    await supabase.from('incomes').delete().eq('id', id)
    setIncomes((prev) => prev.filter((i) => i.id !== id))
  }

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div>
      <Link to="/">
        <button>← Back to Dashboard</button>
      </Link>
      <h2>Income Tracking</h2>

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
          <label>Source:</label>
          <select
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value as Income['source'] })}
          >
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
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
        <button type="submit">{editing ? 'Update' : 'Add'} Income</button>
        {editing && <button onClick={resetForm}>Cancel</button>}
      </form>

      <div className="filter-section">
        <label>Source:</label>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value as Income['source'])}
        >
          <option value="">All</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
        <div className="stat-number">₹{totalIncome.toFixed(2)}</div>
        <div className="stat-label">Total Income</div>
      </div>

      <table className="expense-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Source</th>
            <th>Amount</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {incomes.map((i) => (
            <tr key={i.id}>
              <td>{i.date}</td>
              <td>{i.source}</td>
              <td>₹{i.amount.toFixed(2)}</td>
              <td>{i.notes || '-'}</td>
              <td>
                <button onClick={() => handleEdit(i)}>Edit</button>
                <button onClick={() => handleDelete(i.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default IncomeManagement
