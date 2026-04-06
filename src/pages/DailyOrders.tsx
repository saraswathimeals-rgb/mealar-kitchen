import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

interface Customer {
  id: string
  name: string
  breakfast_rate: number
  lunch_rate: number
  dinner_rate: number
}

interface DailyOrder {
  id: string
  date: string
  customer_id: string
  breakfast_count: number
  lunch_count: number
  dinner_count: number
  total_value: number
  payment_status?: 'Paid' | 'Pending'
  customer?: Customer
}

const today = new Date().toISOString().slice(0, 10)

const DailyOrders: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<DailyOrder[]>([])
  const [editingOrder, setEditingOrder] = useState<DailyOrder | null>(null)
  const [selectedDate, setSelectedDate] = useState(today)
  const [rangeCustomerId, setRangeCustomerId] = useState('')
  const [rangeStartDate, setRangeStartDate] = useState('')
  const [rangeEndDate, setRangeEndDate] = useState('')
  const [showCustomerModal, setShowCustomerModal] = useState(false)

  const [orderForm, setOrderForm] = useState({
    date: today,
    customer_id: '',
    breakfast_count: 0,
    lunch_count: 0,
    dinner_count: 0,
    payment_status: 'Pending' as 'Paid' | 'Pending',
  })

  const [customerForm, setCustomerForm] = useState({
    name: '',
    breakfast_rate: 0,
    lunch_rate: 0,
    dinner_rate: 0,
  })

  const loadCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('name')
    if (data) {
      const list = data as Customer[]
      setCustomers(list)
      if (!orderForm.customer_id && list.length > 0) {
        setOrderForm((prev) => ({ ...prev, customer_id: list[0].id }))
      }
      if (!rangeCustomerId && list.length > 0) {
        setRangeCustomerId(list[0].id)
      }
    }
  }

  const loadOrders = async () => {
    const { data } = await supabase
      .from('daily_orders')
      .select('*, customer:customers(*)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (data) {
      setOrders(data as DailyOrder[])
    }
  }

  useEffect(() => {
    loadCustomers()
    loadOrders()
  }, [])

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === orderForm.customer_id),
    [customers, orderForm.customer_id]
  )

  const calculatedTotal = useMemo(() => {
    if (!selectedCustomer) return 0
    return (
      orderForm.breakfast_count * selectedCustomer.breakfast_rate +
      orderForm.lunch_count * selectedCustomer.lunch_rate +
      orderForm.dinner_count * selectedCustomer.dinner_rate
    )
  }, [orderForm, selectedCustomer])

  const dailyOrders = useMemo(
    () => orders.filter((o) => o.date === selectedDate),
    [orders, selectedDate]
  )

  const dayTotal = useMemo(
    () => dailyOrders.reduce((sum, o) => sum + o.total_value, 0),
    [dailyOrders]
  )

  const pendingTotal = useMemo(
    () =>
      dailyOrders
        .filter((o) => (o.payment_status || 'Pending') === 'Pending')
        .reduce((sum, o) => sum + o.total_value, 0),
    [dailyOrders]
  )

  const customerRangeOrders = useMemo(() => {
    return orders
      .filter((o) => (rangeCustomerId ? o.customer_id === rangeCustomerId : true))
      .filter((o) => (rangeStartDate ? o.date >= rangeStartDate : true))
      .filter((o) => (rangeEndDate ? o.date <= rangeEndDate : true))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [orders, rangeCustomerId, rangeStartDate, rangeEndDate])

  const customerRangeTotal = useMemo(
    () => customerRangeOrders.reduce((sum, o) => sum + o.total_value, 0),
    [customerRangeOrders]
  )

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerForm.name.trim()) return

    const { data } = await supabase
      .from('customers')
      .insert([{ ...customerForm, name: customerForm.name.trim() }])
      .select()
      .single()

    if (data) {
      const created = data as Customer
      setCustomers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setOrderForm((prev) => ({ ...prev, customer_id: created.id }))
      setCustomerForm({ name: '', breakfast_rate: 0, lunch_rate: 0, dinner_rate: 0 })
      setShowCustomerModal(false)
    }
  }

  const resetOrderForm = () => {
    setOrderForm((prev) => ({
      ...prev,
      breakfast_count: 0,
      lunch_count: 0,
      dinner_count: 0,
      payment_status: 'Pending',
    }))
    setEditingOrder(null)
  }

  const handleEditOrder = (order: DailyOrder) => {
    setEditingOrder(order)
    setOrderForm({
      date: order.date,
      customer_id: order.customer_id,
      breakfast_count: order.breakfast_count,
      lunch_count: order.lunch_count,
      dinner_count: order.dinner_count,
      payment_status: order.payment_status || 'Pending',
    })
  }

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderForm.customer_id) return

    const payload = {
      ...orderForm,
      total_value: calculatedTotal,
    }

    if (editingOrder) {
      const { data } = await supabase
        .from('daily_orders')
        .update(payload)
        .eq('id', editingOrder.id)
        .select('*, customer:customers(*)')
        .single()

      if (data) {
        setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? (data as DailyOrder) : o)))
        resetOrderForm()
      }
    } else {
      const { data } = await supabase
        .from('daily_orders')
        .insert([payload])
        .select('*, customer:customers(*)')
        .single()

      if (data) {
        setOrders((prev) => [data as DailyOrder, ...prev])
        resetOrderForm()
      }
    }
  }

  const handleTogglePaymentStatus = async (order: DailyOrder) => {
    const nextStatus = (order.payment_status || 'Pending') === 'Paid' ? 'Pending' : 'Paid'
    const { data } = await supabase
      .from('daily_orders')
      .update({ payment_status: nextStatus })
      .eq('id', order.id)
      .select('*, customer:customers(*)')
      .single()

    if (data) {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? (data as DailyOrder) : o)))
    }
  }

  return (
    <div>
      <Link to="/">
        <button>← Back to Dashboard</button>
      </Link>
      <h2>Daily Orders</h2>

      <form onSubmit={handleAddOrder} className="expense-form">
        <div>
          <label>Date:</label>
          <input
            type="date"
            value={orderForm.date}
            onChange={(e) => setOrderForm((prev) => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>
        <div>
          <label>Customer:</label>
          <select
            value={orderForm.customer_id}
            onChange={(e) => setOrderForm((prev) => ({ ...prev, customer_id: e.target.value }))}
            required
          >
            {customers.length === 0 ? (
              <option value="">No customers</option>
            ) : (
              customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label>Breakfast Count:</label>
          <input
            type="number"
            min={0}
            value={orderForm.breakfast_count}
            onChange={(e) =>
              setOrderForm((prev) => ({ ...prev, breakfast_count: Number(e.target.value) }))
            }
          />
        </div>
        <div>
          <label>Lunch Count:</label>
          <input
            type="number"
            min={0}
            value={orderForm.lunch_count}
            onChange={(e) => setOrderForm((prev) => ({ ...prev, lunch_count: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label>Dinner Count:</label>
          <input
            type="number"
            min={0}
            value={orderForm.dinner_count}
            onChange={(e) => setOrderForm((prev) => ({ ...prev, dinner_count: Number(e.target.value) }))}
          />
        </div>
        <div>
          <label>Payment Status:</label>
          <select
            value={orderForm.payment_status}
            onChange={(e) =>
              setOrderForm((prev) => ({
                ...prev,
                payment_status: e.target.value as 'Paid' | 'Pending',
              }))
            }
          >
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
        <div className="readonly-total">
          <label>Total Value:</label>
          <div className="readonly-value">₹{calculatedTotal.toFixed(2)}</div>
        </div>
        <button type="submit" disabled={customers.length === 0}>
          {editingOrder ? 'Update Order' : 'Add Daily Order'}
        </button>
        {editingOrder && (
          <button type="button" onClick={resetOrderForm}>
            Cancel
          </button>
        )}
        <button type="button" onClick={() => setShowCustomerModal(true)}>
          + Add Customer
        </button>
      </form>

      <div className="filter-section">
        <label>Show Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="stat-card">
        <div className="stat-number">₹{dayTotal.toFixed(2)}</div>
        <div className="stat-label">Total Order Value ({selectedDate})</div>
      </div>

      <div className="stat-card alert">
        <div className="stat-number">₹{pendingTotal.toFixed(2)}</div>
        <div className="stat-label">Pending Collection ({selectedDate})</div>
      </div>

      <table className="expense-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Breakfast</th>
            <th>Lunch</th>
            <th>Dinner</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {dailyOrders.map((o) => (
            <tr key={o.id}>
              <td>{o.date}</td>
              <td>{o.customer?.name || '-'}</td>
              <td>{o.breakfast_count}</td>
              <td>{o.lunch_count}</td>
              <td>{o.dinner_count}</td>
              <td>₹{o.total_value.toFixed(2)}</td>
              <td>
                <span
                  style={{
                    color: (o.payment_status || 'Pending') === 'Paid' ? '#1e8449' : '#c0392b',
                    fontWeight: 600,
                  }}
                >
                  {o.payment_status || 'Pending'}
                </span>
              </td>
              <td>
                <button onClick={() => handleTogglePaymentStatus(o)}>
                  Mark {(o.payment_status || 'Pending') === 'Paid' ? 'Pending' : 'Paid'}
                </button>
                {(o.payment_status || 'Pending') === 'Pending' && (
                  <button onClick={() => handleEditOrder(o)} style={{ marginLeft: '0.5rem' }}>
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
          {dailyOrders.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center' }}>
                No orders for selected date
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <h3 style={{ marginTop: '2rem', color: '#FF9800' }}>Customer Orders by Date Range</h3>
      <div className="filter-section">
        <label>Customer:</label>
        <select
          value={rangeCustomerId}
          onChange={(e) => setRangeCustomerId(e.target.value)}
        >
          <option value="">All Customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label>Start Date:</label>
        <input
          type="date"
          value={rangeStartDate}
          onChange={(e) => setRangeStartDate(e.target.value)}
        />
        <label>End Date:</label>
        <input
          type="date"
          value={rangeEndDate}
          onChange={(e) => setRangeEndDate(e.target.value)}
        />
      </div>

      <div className="stat-card">
        <div className="stat-number">₹{customerRangeTotal.toFixed(2)}</div>
        <div className="stat-label">Range Total ({customerRangeOrders.length} order(s))</div>
      </div>

      <table className="expense-table" style={{ marginBottom: '2rem' }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Breakfast</th>
            <th>Lunch</th>
            <th>Dinner</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {customerRangeOrders.map((o) => (
            <tr key={`range-${o.id}`}>
              <td>{o.date}</td>
              <td>{o.customer?.name || '-'}</td>
              <td>{o.breakfast_count}</td>
              <td>{o.lunch_count}</td>
              <td>{o.dinner_count}</td>
              <td>₹{o.total_value.toFixed(2)}</td>
              <td>{o.payment_status || 'Pending'}</td>
            </tr>
          ))}
          {customerRangeOrders.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center' }}>
                No orders found for selected filters
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="sub-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCustomerModal(false)}>
              ✕
            </button>
            <h3>Add New Customer</h3>
            <form onSubmit={handleAddCustomer} className="advance-form">
              <div>
                <label>Customer Name:</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label>Breakfast Rate (₹):</label>
                <input
                  type="number"
                  min={0}
                  value={customerForm.breakfast_rate}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({ ...prev, breakfast_rate: Number(e.target.value) }))
                  }
                  required
                />
              </div>
              <div>
                <label>Lunch Rate (₹):</label>
                <input
                  type="number"
                  min={0}
                  value={customerForm.lunch_rate}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({ ...prev, lunch_rate: Number(e.target.value) }))
                  }
                  required
                />
              </div>
              <div>
                <label>Dinner Rate (₹):</label>
                <input
                  type="number"
                  min={0}
                  value={customerForm.dinner_rate}
                  onChange={(e) =>
                    setCustomerForm((prev) => ({ ...prev, dinner_rate: Number(e.target.value) }))
                  }
                  required
                />
              </div>
              <button type="submit">Save Customer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DailyOrders
