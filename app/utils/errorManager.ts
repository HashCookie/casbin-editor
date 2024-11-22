interface ErrorInfo {
  source: 'model' | 'policy';
  message: string;
}

let currentError: ErrorInfo | null = null;

export const setError = (error: string | null, source: 'model' | 'policy') => {
  if (error === null) {
    currentError = null;
  } else {
    currentError = {
      source,
      message: error,
    };
  }
};

export const getError = () => {
  return currentError;
};
