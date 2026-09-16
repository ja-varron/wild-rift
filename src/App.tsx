import AppRouter from '@/Router';
import { AuthProvider } from './services/authentication/AuthProvider';

function App() {
	return (
		<AuthProvider>
			<AppRouter />
		</AuthProvider>
	)
}

export default App;

