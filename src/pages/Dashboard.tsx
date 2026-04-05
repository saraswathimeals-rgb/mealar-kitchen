import React from 'react'
import { Link } from 'react-router-dom'

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <h1>Cloud Kitchen Management Dashboard</h1>
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
