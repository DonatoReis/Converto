import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You could also log the error to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      // Render a fallback UI
      return (
        <div className="error-boundary p-4 bg-red-50 border border-red-300 rounded-md">
          <h2 className="text-lg font-medium text-red-800 mb-2">
            {this.props.fallbackText || 'Something went wrong.'}
          </h2>
          {this.props.showDetails && (
            <details className="text-sm text-red-700">
              <summary>Error details</summary>
              <p>{this.state.error && this.state.error.toString()}</p>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </details>
          )}
          {this.props.showResetButton && (
            <button
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => window.location.reload()}
            >
              Reload App
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// src/components/ErrorBoundary.jsx
import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
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
  debug: process.env.NODE_ENV !== 'production',
};

export default ErrorBoundary;

