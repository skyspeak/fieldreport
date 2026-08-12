import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DataProvider } from './data/DataContext'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ResultsPage } from './pages/ResultsPage'
import { MapPage } from './pages/MapPage'
import {
  V3HomePage,
  V3ResultsPage,
  V3ZipPromptPage,
} from './pages/v3/V3Pages'
import { V3ReceiptsPage } from './pages/v3/V3ReceiptsPage'

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

            {/* /v3 employer layer (AOI / WYWM) */}
            <Route path="/v3" element={<V3HomePage />} />
            <Route path="/v3/receipts" element={<V3ReceiptsPage />} />
            <Route path="/v3/results/:cipCode" element={<V3ZipPromptPage />} />
            <Route
              path="/v3/results/:cipCode/:zip"
              element={<V3ResultsPage />}
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </DataProvider>
  )
}
