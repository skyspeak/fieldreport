import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { DataProvider } from './data/DataContext'
import { Layout } from './components/Layout'
import { ThemeProvider } from './lib/theme'
import { HomePage } from './pages/HomePage'
import { ResultsPage } from './pages/ResultsPage'
import { MapPage } from './pages/MapPage'
import {
  V3ResultsPage,
  V3ZipPromptPage,
} from './pages/v3/V3Pages'
import { V3ReceiptsPage } from './pages/v3/V3ReceiptsPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

function RedirectV3Results() {
  const { cipCode = '', zip } = useParams()
  if (zip) return <Navigate to={`/results/${cipCode}/${zip}`} replace />
  return <Navigate to={`/results/${cipCode}`} replace />
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter basename={basename}>
        <ThemeProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/receipts" element={<V3ReceiptsPage />} />
              <Route path="/results/:cipCode" element={<ResultsPage />} />
              <Route
                path="/results/:cipCode/place"
                element={<V3ZipPromptPage />}
              />
              <Route
                path="/results/:cipCode/:zip"
                element={<V3ResultsPage />}
              />
              <Route path="/map/:socCode" element={<MapPage />} />

              {/* /v2 aliases keep old links working */}
              <Route path="/v2" element={<HomePage />} />
              <Route path="/v2/receipts" element={<V3ReceiptsPage />} />
              <Route path="/v2/results/:cipCode" element={<ResultsPage />} />
              <Route
                path="/v2/results/:cipCode/place"
                element={<V3ZipPromptPage />}
              />
              <Route
                path="/v2/results/:cipCode/:zip"
                element={<V3ResultsPage />}
              />
              <Route path="/v2/map/:socCode" element={<MapPage />} />

              {/* Legacy /v3 → main */}
              <Route path="/v3" element={<Navigate to="/" replace />} />
              <Route
                path="/v3/receipts"
                element={<Navigate to="/receipts" replace />}
              />
              <Route
                path="/v3/results/:cipCode/:zip"
                element={<RedirectV3Results />}
              />
              <Route
                path="/v3/results/:cipCode"
                element={<RedirectV3Results />}
              />
            </Routes>
          </Layout>
        </ThemeProvider>
      </BrowserRouter>
    </DataProvider>
  )
}
