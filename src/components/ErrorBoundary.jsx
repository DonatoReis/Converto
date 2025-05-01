import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // We'll implement logging when we create our logger
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log the error to our logging service once it's implemented
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-600 m-2">
          <h3 className="text-lg font-medium mb-2">Algo deu errado</h3>
          <p className="mb-2">Ocorreu um erro ao renderizar este componente.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Recarregar Página
          </button>
          {this.props.debug && (
            <details className="mt-2 text-sm">
              <summary>Detalhes do erro (desenvolvimento)</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  debug: PropTypes.bool,
  onError: PropTypes.func
};

ErrorBoundary.defaultProps = {
  debug: typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production',
};

export default ErrorBoundary;
