import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

interface AdvanceEntry {
  amount: number
}

interface LeaveEntry {
  type: 'paid' | 'unpaid'
}

interface SalaryRecord {
  month: string
  advances: AdvanceEntry[]
  leaves?: LeaveEntry[]
  paid: boolean
}

interface EmployeeRow {
  name: string
  salary: number
  salary_records: SalaryRecord[] | null
}

const Dashboard: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('employees')
        .select('name, salary, salary_records')

      setEmployees((data as EmployeeRow[]) || [])
      setLoading(false)
    }

    loadEmployees()
  }, [])

  const currentMonth = new Date().toISOString().slice(0, 7)

  const { totalPending, pendingCount } = useMemo(() => {
    const summary = employees.reduce(
      (acc, emp) => {
        const record = (emp.salary_records || []).find((r) => r.month === currentMonth)
        if (!record) {
          acc.totalPending += emp.salary
          acc.pendingCount += 1
          return acc
        }

        if (record.paid) {
          return acc
        }

        const totalAdvances = (record.advances || []).reduce((sum, a) => sum + (a.amount || 0), 0)
        const unpaidLeaveDays = (record.leaves || []).filter((l) => l.type === 'unpaid').length
        const leaveDeduction = Math.round((emp.salary / 30) * unpaidLeaveDays)
        const pending = Math.max(0, emp.salary - totalAdvances - leaveDeduction)

        acc.totalPending += pending
        acc.pendingCount += 1
        return acc
      },
      { totalPending: 0, pendingCount: 0 }
    )

    return summary
  }, [employees, currentMonth])

  return (
    <div className="dashboard">
      <h1>Cloud Kitchen Management Dashboard</h1>
      <div className="pending-summary">
        <h2>Current Month Pending Salary</h2>
        <p className="pending-amount">{loading ? 'Loading...' : `₹${totalPending}`}</p>
        <p className="pending-meta">{loading ? 'Fetching employees...' : `${pendingCount} employee(s) pending for ${currentMonth}`}</p>
      </div>
      <div className="sections">
        <div className="section">
          <h2>Employee Management</h2>
          <p>Leave and Salary Management</p>
          <Link to="/employees">
            <button>Go to Employee Management</button>
          </Link>
        </div>
        <div className="section">
          <h2>Inventory Management</h2>
          <p>Track stock and supplies</p>
          <Link to="/inventory">
            <button>Go to Inventory Management</button>
          </Link>
        </div>
        <div className="section">
          <h2>Expense Tracking</h2>
          <p>Monitor costs</p>
          <Link to="/expenses">
            <button>Go to Expense Tracking</button>
          </Link>
        </div>
        <div className="section">
          <h2>Income Tracking</h2>
          <p>Record incoming cash and app orders</p>
          <Link to="/income">
            <button>Go to Income Tracking</button>
          </Link>
        </div>
        <div className="section">
          <h2>Daily Orders</h2>
          <p>Track customer meal counts and daily order value</p>
          <Link to="/orders">
            <button>Go to Daily Orders</button>
          </Link>
        </div>
        <div className="section">
          <h2>Profit Analysis</h2>
          <p>See total income, expenses and net profit</p>
          <Link to="/profit">
            <button>Go to Profit Analysis</button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
