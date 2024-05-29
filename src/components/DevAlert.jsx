import { useContext } from 'react'
import { DevContext } from '../main.jsx'

import './DevAlert.css'

const devStates = {
  disconnected: ['Disconnected', 'bg-gray-500'],
  error: ['Error', 'bg-red-500'],
  connecting: ['Connecting...', 'bg-yellow-500'],
  connected: ['Connected', 'bg-green-500']
}

function DevAlert ({ className }) {
  const { devEnabled, devHost, devState } = useContext(DevContext)

  return devEnabled &&
    (
      <div className={`dev-alert relative font-sans bg-red-200 p-2 after:contents-[''] after:absolute after:-bottom-1 after:right-1 after:w-24 after:h-2 ${className || ''}`}>
        <p className='my-0 text-red-600'><strong>Developer mode is enabled.</strong></p>
        <p className='my-0'>Host: <code>{devHost}</code></p>
        <div className='flex flex-row items-center gap-2'>
          <div className={`w-2 h-2 rounded-full ${devStates[devState][1]}`} />
          <span>{devStates[devState][0]}</span>
        </div>
      </div>
    )
}

export default DevAlert
