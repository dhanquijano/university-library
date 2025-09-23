import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(...classNames: string[]): R;
      toBeDisabled(): R;
      toHaveValue(value: string | number | string[]): R;
      toBeVisible(): R;
      toBeChecked(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveLength(length: number): R;
    }
  }
}

export {};