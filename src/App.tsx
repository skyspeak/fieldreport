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
import { V4HomePage } from './pages/v4/V4HomePage'
import { V4AtlasPage } from './pages/v4/V4AtlasPage'
import { V4ResultsPage } from './pages/v4/V4ResultsPage'
import { V4FootprintPage } from './pages/v4/V4FootprintPage'
import {
  V4BadgesPage,
  V4ComparePage,
  V4IndustriesPage,
  V4PathwaysPage,
  V4VersusPage,
} from './pages/v4/V4MorePages'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

function RedirectV3Results() {
  const { cipCode = '', zip } = useParams()
  if (zip) return <Navigate to={`/results/${cipCode}/${zip}`} replace />
  return <Navigate to={`/results/${cipCode}`} replace />
}

function V4AtlasRedirect() {
  const { cipCode = '' } = useParams()
  return <Navigate to={`/v4/map/${cipCode}`} replace />
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

              <Route path="/v4" element={<V4HomePage />} />
              <Route path="/v4/map/:cipCode" element={<V4AtlasPage />} />
              <Route
                path="/v4/results/:cipCode/:zip"
                element={<V4ResultsPage />}
              />
              <Route
                path="/v4/results/:cipCode"
                element={<V4AtlasRedirect />}
              />
              <Route
                path="/v4/company/:cipCode/:companyName"
                element={<V4FootprintPage />}
              />
              <Route
                path="/v4/compare/:cipCode/:zipA/:zipB"
                element={<V4ComparePage />}
              />
              <Route path="/v4/pathways/:cipCode" element={<V4PathwaysPage />} />
              <Route path="/v4/badges/:cipCode" element={<V4BadgesPage />} />
              <Route path="/v4/versus/:cipA/:cipB" element={<V4VersusPage />} />
              <Route
                path="/v4/industries/:cipCode"
                element={<V4IndustriesPage />}
              />

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
