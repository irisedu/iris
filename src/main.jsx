import React from 'react'
import ReactDOM from 'react-dom/client'
import { createRoutesFromElements, createBrowserRouter, Route, RouterProvider } from 'react-router-dom'

import Layout from './Layout.jsx'
import './index.css'

const router = createBrowserRouter(createRoutesFromElements(
  <Route path='/' element={<Layout />}>
    <Route index lazy={() => import('./routes/Landing.jsx')} />
  </Route>
))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
