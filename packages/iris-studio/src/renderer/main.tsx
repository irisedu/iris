import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { Provider as StoreProvider } from 'react-redux';
import store from './state/store';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<StoreProvider store={store}>
			<App />
		</StoreProvider>
	</React.StrictMode>
);
