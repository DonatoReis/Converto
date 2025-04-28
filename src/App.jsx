// src/App.jsx
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import ThemeProvider from './context/ThemeContext';
import AuthProvider from './context/AuthContext';
import EncryptionProvider from './context/EncryptionContext';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <EncryptionProvider>
            <AppRoutes />
          </EncryptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;