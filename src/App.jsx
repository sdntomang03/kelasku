import { BrowserRouter, HashRouter } from 'react-router-dom'
import './App.css'
import './components/content/richContent.css'
import AppRoutes from './routes/AppRoutes'

function App() {
  const Router = window.location.protocol === 'app:' ? HashRouter : BrowserRouter

  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App
