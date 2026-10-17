import { GridMap } from './components/GridMap'
import { GridTileLab } from './pages/GridTileLab'
import { isGridTileLabRoute, useAppRoute } from './lib/useAppRoute'
import './App.css'

function App() {
  const route = useAppRoute()

  if (isGridTileLabRoute(route)) {
    return <GridTileLab />
  }

  return <GridMap />
}

export default App
