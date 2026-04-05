import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'

export interface AdvanceEntry {
  date: string // YYYY-MM-DD
  amount: number
}

export interface SalaryRecord {
  month: string // YYYY-MM
  advances: AdvanceEntry[]
  paid: boolean
}

export interface Employee {
  id: string
  name: string
  role: string
  salary: number
  joiningDate: string
  salaryRecords: SalaryRecord[]
}

const roles = [
  'Head Cook',
  'Assistant Cook',
  'Helper',
  'Cleaner',
  'Manager',
  'Delivery Boy',
  'Packing Helper',
]

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([])

  // load from supabase
  const loadEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*')
    if (data) {
      const mapped: Employee[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        role: d.role,
        salary: d.salary,
        joiningDate: d.joining_date,
        salaryRecords: d.salary_records || [],
      }))
      setEmployees(mapped)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])
  const [editing, setEditing] = useState<Employee | null>(null)
  const [selected, setSelected] = useState<Employee | null>(null)
  const [advanceMonth, setAdvanceMonth] = useState('')
  const [advanceDate, setAdvanceDate] = useState('')
  const [advanceAmount, setAdvanceAmount] = useState(0)
  const [form, setForm] = useState<Omit<Employee, 'id'>>({
    name: '',
    role: roles[0],
    salary: 0,
    joiningDate: '',
    salaryRecords: [],
  })

  useEffect(() => {
    if (selected) {
      const now = new Date()
      const ym = now.toISOString().slice(0, 7)
      setAdvanceMonth(ym)
    }
  }, [selected])

  const resetForm = () => {
    setForm({
      name: '',
      role: roles[0],
      salary: 0,
      joiningDate: '',
      salaryRecords: [],
    })
    setEditing(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      // update supabase
      await supabase
        .from('employees')
        .update({
          name: form.name,
          role: form.role,
          salary: form.salary,
          joining_date: form.joiningDate,
          salary_records: form.salaryRecords,
        })
        .eq('id', editing.id)
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === editing.id ? { ...emp, ...form } : emp))
      )
      if (selected && editing.id === selected.id) {
        setSelected({ ...selected, ...form })
      }
    } else {
      const { data } = await supabase
        .from('employees')
        .insert([
          {
            name: form.name,
            role: form.role,
            salary: form.salary,
            joining_date: form.joiningDate,
            salary_records: form.salaryRecords,
          },
        ])
        .select()
        .single()
      if (data) {
        const newEmp: Employee = {
          id: data.id,
          name: data.name,
          role: data.role,
          salary: data.salary,
          joiningDate: data.joining_date,
          salaryRecords: data.salary_records || [],
        }
        setEmployees((prev) => [...prev, newEmp])
      }
    }
    resetForm()
  }

  const handleEdit = (emp: Employee) => {
    setEditing(emp)
    setForm({
      name: emp.name,
      role: emp.role,
      salary: emp.salary,
      joiningDate: emp.joiningDate,
      salaryRecords: emp.salaryRecords,
    })
  }

  const handleDelete = async (id: string) => {
    await supabase.from('employees').delete().eq('id', id)
    setEmployees((prev) => prev.filter((emp) => emp.id !== id))
    if (selected && selected.id === id) {
      setSelected(null)
    }
  }

  const handleAddAdvance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !advanceMonth || advanceAmount <= 0) return
    // persist to supabase
    if (selected) {
      const updatedRecords = [...selected.salaryRecords]
      const idx = updatedRecords.findIndex((r) => r.month === advanceMonth)
      if (idx >= 0) {
        updatedRecords[idx].advances.push({ date: advanceDate, amount: advanceAmount })
      } else {
        updatedRecords.push({ month: advanceMonth, advances: [{ date: advanceDate, amount: advanceAmount }], paid: false })
      }
      await supabase
        .from('employees')
        .update({ salary_records: updatedRecords })
        .eq('id', selected.id)
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === selected.id ? { ...emp, salaryRecords: updatedRecords } : emp
        )
      )
      setSelected((prev) => (prev ? { ...prev, salaryRecords: updatedRecords } : null))
    }
    setAdvanceMonth('')
    setAdvanceDate('')
    setAdvanceAmount(0)
  }

  const markPaid = async (month: string) => {
    if (!selected) return
    if (selected) {
      const updated = selected.salaryRecords.map((r) =>
        r.month === month ? { ...r, paid: true } : r
      )
      await supabase
        .from('employees')
        .update({ salary_records: updated })
        .eq('id', selected.id)
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === selected.id ? { ...emp, salaryRecords: updated } : emp
        )
      )
      setSelected((prev) => (prev ? { ...prev, salaryRecords: updated } : null))
    }
  }

  return (
    <div>
      <Link to="/">
        <button>← Back to Dashboard</button>
      </Link>
      <h2>Employee Management</h2>
      <form onSubmit={handleSubmit} className="employee-form">
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Role:</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Joining Date:</label>
          <input
            type="date"
            value={form.joiningDate}
            onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Monthly Salary:</label>
          <input
            type="number"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
            required
          />
        </div>
        <button type="submit">{editing ? 'Update' : 'Add'} Employee</button>
        {editing && <button onClick={resetForm}>Cancel</button>}
      </form>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Salary</th>
            <th>Joining Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} onClick={() => setSelected(emp)} style={{ cursor: 'pointer' }}>
              <td>{emp.name}</td>
              <td>{emp.role}</td>
              <td>{emp.salary}</td>
              <td>{emp.joiningDate}</td>
              <td>
                <button onClick={(e) => {e.stopPropagation(); handleEdit(emp);}}>Edit</button>
                <button onClick={(e) => {e.stopPropagation(); handleDelete(emp.id);}}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selected && (
        <div className="employee-details">
          <h3>Details for {selected.name}</h3>
          <table className="salary-records">
            <thead>
              <tr>
                <th>Month</th>
                <th>Advances</th>
                <th>Paid</th>
                <th>Pending</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {selected.salaryRecords
              .slice()
              .sort((a, b) => a.month.localeCompare(b.month))
              .map((rec, idx) => (
                <tr key={idx}>
                  <td>{rec.month}</td>
                  <td>
                    {rec.advances.reduce((a, e) => a + e.amount, 0)}
                    <ul>
                      {rec.advances.map((e, i) => (
                        <li key={i}>
                          {e.date}: {e.amount}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>{rec.paid ? 'Yes' : 'No'}</td>
                  <td>{selected.salary - rec.advances.reduce((a, e) => a + e.amount, 0)}</td>
                  <td>
                    {!rec.paid && (
                      <button onClick={() => markPaid(rec.month)}>Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <form onSubmit={handleAddAdvance} className="advance-form">
            <h4>Add Advance</h4>
            <div>
              <label>Month:</label>
              <input
                type="month"
                value={advanceMonth}
                onChange={(e) => setAdvanceMonth(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Date:</label>
              <input
                type="date"
                value={advanceDate}
                onChange={(e) => setAdvanceDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Amount:</label>
              <input
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                required
              />
            </div>
            <button type="submit">Add Advance</button>
          </form>
          <button onClick={() => setSelected(null)}>Close Details</button>
        </div>
      )}
    </div>
  )
}

export default EmployeeManagement
