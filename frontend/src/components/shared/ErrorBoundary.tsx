import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  // When any value in this array changes identity, the boundary clears its
  // error and retries rendering. Pass the data that drives the children so a
  // fresh payload can recover from a previous bad one.
  resetKeys?: unknown[]
  onError?: (error: Error) => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

// Catches render-time errors in a subtree so one bad component (e.g. a viz
// panel fed malformed AI output) cannot unmount the whole app.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary] caught render error:', error)
    this.props.onError?.(error)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (!this.state.hasError) return
    const prev = prevProps.resetKeys ?? []
    const next = this.props.resetKeys ?? []
    const changed = next.length !== prev.length || next.some((k, i) => k !== prev[i])
    if (changed) this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}
