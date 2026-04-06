import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import EmployeeManagement from './pages/EmployeeManagement'
import InventoryManagement from './pages/InventoryManagement'
import ExpenseManagement from './pages/ExpenseManagement'
import IncomeManagement from './pages/IncomeManagement'
import ProfitAnalysis from './pages/ProfitAnalysis'
import DailyOrders from './pages/DailyOrders'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === 'admin' && password === '123456') {
      setLoggedIn(true)
      setError('')
    } else {
      setError('Invalid credentials')
    }
  }

  if (!loggedIn) {
    return (
      <div className="login-container">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div>
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit">Login</button>
        </form>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<EmployeeManagement />} />
        <Route path="/inventory" element={<InventoryManagement />} />
        <Route path="/expenses" element={<ExpenseManagement />} />
        <Route path="/income" element={<IncomeManagement />} />
        <Route path="/orders" element={<DailyOrders />} />
        <Route path="/profit" element={<ProfitAnalysis />} />
      </Routes>
    </Router>
  )
}

export default App
