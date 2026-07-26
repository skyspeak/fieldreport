import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DataProvider } from './data/DataContext'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ResultsPage } from './pages/ResultsPage'
import { MapPage } from './pages/MapPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter basename={basename}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/results/:cipCode" element={<ResultsPage />} />
            <Route path="/map/:socCode" element={<MapPage />} />

            {/* /v2 aliases keep old links working; same combined Field Report. */}
            <Route path="/v2" element={<HomePage />} />
            <Route path="/v2/results/:cipCode" element={<ResultsPage />} />
            <Route path="/v2/map/:socCode" element={<MapPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </DataProvider>
  )
}
