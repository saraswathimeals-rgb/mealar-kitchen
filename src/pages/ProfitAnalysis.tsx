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

export interface Income {
  id: string
  date: string
  source: string
  amount: number
  notes: string
}

const ProfitAnalysis: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])

  const [filterMonth, setFilterMonth] = useState<string>('')
  const [filterStartDate, setFilterStartDate] = useState<string>('')
  const [filterEndDate, setFilterEndDate] = useState<string>('')

  const loadData = async () => {
    // build common date filter logic
    const applyDateFilters = (query: any) => {
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
      return query
    }

    let expQuery = supabase.from('expenses').select('*').order('date', { ascending: false })
    expQuery = applyDateFilters(expQuery)
    const expRes = await expQuery
    if (expRes.data) setExpenses(expRes.data as Expense[])

    let incQuery = supabase.from('incomes').select('*').order('date', { ascending: false })
    incQuery = applyDateFilters(incQuery)
    const incRes = await incQuery
    if (incRes.data) setIncomes(incRes.data as Income[])
  }

  useEffect(() => {
    loadData()
  }, [filterMonth, filterStartDate, filterEndDate])

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
  const profit = totalIncome - totalExpense

  return (
    <div>
      <Link to="/">
        <button>← Back to Dashboard</button>
      </Link>
      <h2>Profit Analysis</h2>

      <div className="filter-section">
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
        <div className="stat-number">₹{totalIncome.toFixed(2)}</div>
        <div className="stat-label">Total Income</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">₹{totalExpense.toFixed(2)}</div>
        <div className="stat-label">Total Expense</div>
      </div>
      <div className="stat-card">
        <div className="stat-number" style={{ color: profit >= 0 ? 'green' : 'red' }}>
          ₹{profit.toFixed(2)}
        </div>
        <div className="stat-label">Profit</div>
      </div>

    </div>
  )
}

export default ProfitAnalysis
