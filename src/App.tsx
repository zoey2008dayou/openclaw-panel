import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Welcome from './pages/Welcome'
import ModelConfig from './pages/ModelConfig'
import FeishuConfig from './pages/FeishuConfig'
import GatewayStatus from './pages/GatewayStatus'
import './index.css'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/app" element={<Layout />}>
            <Route path="model" element={<ModelConfig />} />
            <Route path="feishu" element={<FeishuConfig />} />
            <Route path="gateway" element={<GatewayStatus />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App