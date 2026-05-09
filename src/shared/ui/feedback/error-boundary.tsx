import { Component, ErrorInfo, PropsWithChildren, ReactNode } from 'react';
import { captureFrontendError } from '../../lib/observability';
import { Button } from '../buttons/button';
import { translate } from '../../i18n/i18n';

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<PropsWithChildren<{ fallback?: ReactNode }>, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureFrontendError(error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="ui-state ui-state--error">
        <span className="ui-state__eyebrow">{translate('common.applicationError')}</span>
        <h3>{translate('common.somethingWentWrong')}</h3>
        <p>{this.state.error.message || translate('common.renderFailed')}</p>
        <Button type="button" variant="secondary" onClick={() => this.setState({ error: null })}>
          {translate('common.tryAgain')}
        </Button>
      </div>
    );
  }
}
