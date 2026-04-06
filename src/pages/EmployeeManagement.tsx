import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'

export interface AdvanceEntry {
  date: string // YYYY-MM-DD
  amount: number
}

export interface LeaveEntry {
  date: string // YYYY-MM-DD
  type: 'paid' | 'unpaid'
  reason: string
}

export interface SalaryRecord {
  month: string // YYYY-MM
  advances: AdvanceEntry[]
  leaves: LeaveEntry[]
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
  const [leaveMonth, setLeaveMonth] = useState('')
  const [leaveDate, setLeaveDate] = useState('')
  const [leaveType, setLeaveType] = useState<'paid' | 'unpaid'>('unpaid')
  const [leaveReason, setLeaveReason] = useState('')
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
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
      setLeaveMonth(ym)
      setShowAdvanceModal(false)
      setShowLeaveModal(false)
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
        updatedRecords.push({ month: advanceMonth, advances: [{ date: advanceDate, amount: advanceAmount }], leaves: [], paid: false })
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
    setShowAdvanceModal(false)
  }

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !leaveMonth || !leaveDate) return
    const newLeave: LeaveEntry = { date: leaveDate, type: leaveType, reason: leaveReason }
    const updatedRecords = [...selected.salaryRecords]
    const idx = updatedRecords.findIndex((r) => r.month === leaveMonth)
    if (idx >= 0) {
      updatedRecords[idx] = {
        ...updatedRecords[idx],
        leaves: [...(updatedRecords[idx].leaves || []), newLeave],
      }
    } else {
      updatedRecords.push({ month: leaveMonth, advances: [], leaves: [newLeave], paid: false })
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
    setLeaveDate('')
    setLeaveReason('')
    setShowLeaveModal(false)
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
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="employee-details" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            <h3>Details for {selected.name} <span style={{ color: '#888', fontSize: '0.85em' }}>({selected.role})</span></h3>
          <table className="salary-records">
            <thead>
              <tr>
                <th>Month</th>
                <th>Advances</th>
                <th>Leaves</th>
                <th>Paid</th>
                <th>Pending Salary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {selected.salaryRecords
              .slice()
              .sort((a, b) => a.month.localeCompare(b.month))
              .map((rec, idx) => {
                const totalAdvances = rec.advances.reduce((a, e) => a + e.amount, 0)
                const leaves = rec.leaves || []
                const unpaidLeaveDays = leaves.filter((l) => l.type === 'unpaid').length
                const dailyRate = selected.salary / 30
                const leaveDeduction = Math.round(unpaidLeaveDays * dailyRate)
                const pending = selected.salary - totalAdvances - leaveDeduction
                return (
                  <tr key={idx}>
                    <td>{rec.month}</td>
                    <td>
                      {totalAdvances > 0 ? `₹${totalAdvances}` : '—'}
                      {rec.advances.length > 0 && (
                        <ul style={{ margin: '4px 0', paddingLeft: 16 }}>
                          {rec.advances.map((e, i) => (
                            <li key={i}>{e.date}: ₹{e.amount}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td>
                      {leaves.length === 0 ? '—' : `${leaves.length} day(s)`}
                      {leaves.length > 0 && (
                        <ul style={{ margin: '4px 0', paddingLeft: 16 }}>
                          {leaves.map((l, i) => (
                            <li key={i} style={{ color: l.type === 'unpaid' ? '#c0392b' : '#27ae60' }}>
                              {l.date} — {l.type}{l.reason ? ` (${l.reason})` : ''}
                              {l.type === 'unpaid' && ` −₹${Math.round(dailyRate)}`}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td>{rec.paid ? 'Yes' : 'No'}</td>
                    <td>
                      ₹{pending}
                      {leaveDeduction > 0 && (
                        <div style={{ fontSize: '0.8em', color: '#c0392b' }}>Leave deduction: ₹{leaveDeduction}</div>
                      )}
                    </td>
                    <td>
                      {!rec.paid && (
                        <button onClick={() => markPaid(rec.month)}>Mark Paid</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="sub-modal-actions">
            <button className="sub-modal-trigger" onClick={() => setShowAdvanceModal(true)}>+ Add Advance</button>
            <button className="sub-modal-trigger leave" onClick={() => setShowLeaveModal(true)}>+ Add Leave</button>
          </div>
          </div>
        </div>
      )}

      {/* Add Advance Modal */}
      {showAdvanceModal && selected && (
        <div className="modal-overlay" onClick={() => setShowAdvanceModal(false)}>
          <div className="sub-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAdvanceModal(false)}>✕</button>
            <h3>Add Advance — {selected.name}</h3>
            <form onSubmit={handleAddAdvance} className="advance-form">
              <div>
                <label>Month:</label>
                <input type="month" value={advanceMonth} onChange={(e) => setAdvanceMonth(e.target.value)} required />
              </div>
              <div>
                <label>Date:</label>
                <input type="date" value={advanceDate} onChange={(e) => setAdvanceDate(e.target.value)} required />
              </div>
              <div>
                <label>Amount (₹):</label>
                <input type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(Number(e.target.value))} required />
              </div>
              <button type="submit">Save Advance</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Leave Modal */}
      {showLeaveModal && selected && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="sub-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLeaveModal(false)}>✕</button>
            <h3>Add Leave — {selected.name}</h3>
            <form onSubmit={handleAddLeave} className="advance-form">
              <div>
                <label>Month:</label>
                <input type="month" value={leaveMonth} onChange={(e) => setLeaveMonth(e.target.value)} required />
              </div>
              <div>
                <label>Date:</label>
                <input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} required />
              </div>
              <div>
                <label>Type:</label>
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as 'paid' | 'unpaid')}>
                  <option value="unpaid">Unpaid (salary deducted)</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label>Reason:</label>
                <input type="text" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Optional" />
              </div>
              <button type="submit">Save Leave</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeManagement
