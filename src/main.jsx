import React, { useState, useEffect, createContext } from 'react'
import ReactDOM from 'react-dom/client'
import { createRoutesFromElements, createBrowserRouter, Route, RouterProvider } from 'react-router-dom'
import useStorage from '$hooks/useStorage.js'

import Layout from './Layout.jsx'
import './index.css'

export const DevContext = createContext(null)

const router = createBrowserRouter(createRoutesFromElements(
  <Route path='/' element={<Layout />}>
    <Route index lazy={() => import('./routes/Landing.jsx')} />
  </Route>
))

function Main () {
  const [devEnabled, setDevEnabled] = useStorage(localStorage, 'dev.enabled', false, JSON.parse)
  const [devHost, setDevHost] = useStorage(localStorage, 'dev.host', '127.0.0.1:58064')
  const [devState, setDevState] = useState('disconnected')
  const [devRetry, setDevRetry] = useState(0)
  const maxRetry = 10

  const [, setRefresh] = useState(0)

  useEffect(() => {
    if (!devEnabled) { return }

    const ws = new WebSocket(`ws://${devHost}/`)
    setDevState('connecting')
    let errored = false

    ws.addEventListener('error', (e) => {
      setDevState('error')
      console.log('WebSocket error: ', e)
      errored = true
    })

    ws.addEventListener('open', () => {
      setDevState('connected')
    })

    ws.addEventListener('close', () => {
      if (!errored) {
        setDevState('disconnected')
      }

      if (devRetry < maxRetry) {
        setTimeout(() => {
          setDevRetry(r => r + 1)
        }, 3000)
      }
    })

    ws.addEventListener('message', (e) => {
      const data = JSON.parse(e.data)
      if (data.event === 'reload') {
        // Trigger a full rerender
        setRefresh(r => r + 1)
      }
    })

    return () => ws.close()
  }, [devHost, devEnabled, devRetry])

  return (
    <React.StrictMode>
      <DevContext.Provider value={{ devEnabled, setDevEnabled, devHost, setDevHost, devState }}>
        <RouterProvider router={router} />
      </DevContext.Provider>
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Main />
)
