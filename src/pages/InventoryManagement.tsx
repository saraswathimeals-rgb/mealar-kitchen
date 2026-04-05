import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export interface Transaction {
  id: string
  inventory_id: string
  type: 'purchase' | 'usage'
  quantity: number
  date: string
  notes: string
  cost: number
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  cost_per_unit: number
  reorder_level: number
  created_at: string
}

const categories = [
  'Vegetables',
  'Grains & Rice',
  'Oils & Condiments',
  'Spices',
  'Dairy',
  'Meat & Poultry',
  'Packaging',
  'Other',
]

const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selected, setSelected] = useState<InventoryItem | null>(null)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<'all'|'low'|'ok'>('all')
  
  const [form, setForm] = useState({
    name: '',
    category: categories[0],
    quantity: 0,
    unit: 'kg',
    cost_per_unit: 0,
    reorder_level: 0,
  })

  const [transactionForm, setTransactionForm] = useState({
    type: 'purchase' as 'purchase' | 'usage',
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    cost: 0,
  })

  // Load inventory items
  const loadInventory = async () => {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .order('name')
    if (data) {
      setItems(data as InventoryItem[])
    }
  }

  // Load transactions for selected item
  const loadTransactions = async (inventoryId: string) => {
    const { data } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('inventory_id', inventoryId)
      .order('date', { ascending: false })
    if (data) {
      setTransactions(data as Transaction[])
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  useEffect(() => {
    if (selected) {
      loadTransactions(selected.id)
    }
  }, [selected])

  const resetForm = () => {
    setForm({
      name: '',
      category: categories[0],
      quantity: 0,
      unit: 'kg',
      cost_per_unit: 0,
      reorder_level: 0,
    })
    setEditing(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await supabase
        .from('inventory')
        .update({
          name: form.name,
          category: form.category,
          quantity: form.quantity,
          unit: form.unit,
          cost_per_unit: form.cost_per_unit,
          reorder_level: form.reorder_level,
        })
        .eq('id', editing.id)
      setItems((prev) =>
        prev.map((item) => (item.id === editing.id ? { ...item, ...form } : item))
      )
      if (selected && editing.id === selected.id) {
        setSelected({ ...selected, ...form })
      }
    } else {
      const { data } = await supabase
        .from('inventory')
        .insert([form])
        .select()
        .single()
      if (data) {
        setItems((prev) => [...prev, data as InventoryItem])
      }
    }
    resetForm()
  }

  const handleEdit = (item: InventoryItem) => {
    setEditing(item)
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      cost_per_unit: item.cost_per_unit,
      reorder_level: item.reorder_level,
    })
  }

  const handleDelete = async (id: string) => {
    await supabase.from('inventory').delete().eq('id', id)
    setItems((prev) => prev.filter((item) => item.id !== id))
    if (selected && selected.id === id) {
      setSelected(null)
    }
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || transactionForm.quantity <= 0) return

    // Validate usage doesn't exceed available quantity
    if (transactionForm.type === 'usage' && transactionForm.quantity > selected.quantity) {
      alert('Usage quantity cannot exceed available quantity')
      return
    }

    const { data } = await supabase
      .from('inventory_transactions')
      .insert([
        {
          inventory_id: selected.id,
          type: transactionForm.type,
          quantity: transactionForm.quantity,
          date: transactionForm.date,
          notes: transactionForm.notes,
          cost: transactionForm.type === 'purchase' ? transactionForm.cost : 0,
        },
      ])
      .select()
      .single()

    if (data) {
      // Update inventory quantity
      const newQuantity =
        selected.quantity +
        (transactionForm.type === 'purchase'
          ? transactionForm.quantity
          : -transactionForm.quantity)
      await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', selected.id)

      setTransactions((prev) => [data as Transaction, ...prev])
      setSelected((prev) =>
        prev ? { ...prev, quantity: newQuantity } : null
      )
      setItems((prev) =>
        prev.map((item) =>
          item.id === selected.id ? { ...item, quantity: newQuantity } : item
        )
      )
      setTransactionForm({
        type: 'purchase',
        quantity: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        cost: 0,
      })
    }
  }

  const filteredItems = items
    .filter((item) => (filterCategory ? item.category === filterCategory : true))
    .filter((item) => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'low') return item.quantity <= item.reorder_level
      if (filterStatus === 'ok') return item.quantity > item.reorder_level
      return true
    })

  const getLowStockItems = () => items.filter((item) => item.quantity <= item.reorder_level).length

  return (
    <div>
      <Link to="/">
        <button>← Back to Dashboard</button>
      </Link>
      <h2>Inventory Management</h2>

      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-number">{items.length}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card alert">
          <div className="stat-number">{getLowStockItems()}</div>
          <div className="stat-label">Low Stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            ₹{(items.reduce((sum, item) => sum + item.quantity * item.cost_per_unit, 0)).toFixed(1)}
          </div>
          <div className="stat-label">Total Value</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="inventory-form">
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
          <label>Quantity:</label>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <label>Unit:</label>
          <input
            type="text"
            placeholder="kg, liter, pieces, etc."
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Cost per Unit:</label>
          <input
            type="number"
            step="0.01"
            value={form.cost_per_unit}
            onChange={(e) => setForm({ ...form, cost_per_unit: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <label>Reorder Level:</label>
          <input
            type="number"
            value={form.reorder_level}
            onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })}
            required
          />
        </div>
        <button type="submit">{editing ? 'Update' : 'Add'} Item</button>
        {editing && <button onClick={resetForm}>Cancel</button>}
      </form>

      <div className="filter-section">
        <label>Filter by Category:</label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label>Filter by Status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all'|'low'|'ok')}
        >
          <option value="all">All Statuses</option>
          <option value="low">Low Stock</option>
          <option value="ok">OK Stock</option>
        </select>
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Cost/Unit</th>
            <th>Total Value</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => (
            <tr
              key={item.id}
              onClick={() => setSelected(item)}
              style={{ cursor: 'pointer' }}
            >
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>{item.quantity}</td>
              <td>{item.unit}</td>
              <td>{item.cost_per_unit}</td>
              <td>₹{(item.quantity * item.cost_per_unit).toFixed(2)}</td>
              <td>
                <span
                  className={`status-badge ${
                    item.quantity <= item.reorder_level ? 'low' : 'ok'
                  }`}
                >
                  {item.quantity <= item.reorder_level ? '🔴 Low' : '🟢 OK'}
                </span>
              </td>
              <td>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(item)
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(item.id)
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div className="inventory-details">
          <h3>{selected.name} - Details</h3>
          <div className="details-info">
            <div>
              <strong>Category:</strong> {selected.category}
            </div>
            <div>
              <strong>Current Stock:</strong> {selected.quantity} {selected.unit}
            </div>
            <div>
              <strong>Reorder Level:</strong> {selected.reorder_level} {selected.unit}
            </div>
            <div>
              <strong>Total Value:</strong> ₹{(selected.quantity * selected.cost_per_unit).toFixed(2)}
            </div>
          </div>

          <h4>Transaction History</h4>
          {transactions.length === 0 ? (
            <p>No transactions yet</p>
          ) : (
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Cost</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>
                      <span className={`type-badge ${t.type}`}>
                        {t.type === 'purchase' ? '📦 Purchase' : '📤 Usage'}
                      </span>
                    </td>
                    <td>{t.quantity}</td>
                    <td>{t.cost > 0 ? t.cost.toFixed(2) : '-'}</td>
                    <td>{t.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <form onSubmit={handleAddTransaction} className="transaction-form">
            <h4>Add Transaction</h4>
            <div>
              <label>Type:</label>
              <select
                value={transactionForm.type}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    type: e.target.value as 'purchase' | 'usage',
                  })
                }
              >
                <option value="purchase">📦 Purchase</option>
                <option value="usage">📤 Usage</option>
              </select>
            </div>
            <div>
              <label>Quantity:</label>
              <input
                type="number"
                value={transactionForm.quantity}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    quantity: Number(e.target.value),
                  })
                }
                required
              />
            </div>
            <div>
              <label>Date:</label>
              <input
                type="date"
                value={transactionForm.date}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    date: e.target.value,
                  })
                }
                required
              />
            </div>
            {transactionForm.type === 'purchase' && (
              <div>
                <label>Cost:</label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionForm.cost}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      cost: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
            )}
            <div>
              <label>Notes:</label>
              <input
                type="text"
                value={transactionForm.notes}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    notes: e.target.value,
                  })
                }
              />
            </div>
            <button type="submit">Add Transaction</button>
          </form>

          <button onClick={() => setSelected(null)}>Close Details</button>
        </div>
      )}
    </div>
  )
}

export default InventoryManagement
