import { computed, signal } from '@angular/core';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export function requestStatus<T = unknown>() {
  const status = signal<RequestStatus>('idle');
  const payload = signal<T | any>(null);

  const errorMessage = computed(() => {
    const error = payload() as any;
    return error?.error?.detail || error?.detail || error?.message;
  });

  return {
    status: status.asReadonly(),
    payload: payload.asReadonly(),

    isIdle: computed(() => status() === 'idle'),
    isLoading: computed(() => status() === 'loading'),
    isSuccess: computed(() => status() === 'success'),
    isError: computed(() => status() === 'error'),

    errorMessage,

    idle: (response?: T) => {
      status.set('idle');
      payload.set(response);
    },

    loading: () => {
      status.set('loading');
    },

    success: (response?: T) => {
      status.set('success');
      payload.set(response);
    },

    error: (response?: unknown) => {
      status.set('error');

      const apiError = response as any;

      if (apiError?.status === 0) {
        payload.set({
          status: apiError?.status,
          message: apiError?.statusText || 'Server Unreachable'
        });
        return;
      }

      if (apiError?.status === 404 || apiError?.status === 400) {
        payload.set({
          status: apiError?.status,
          message:
            apiError?.error?.errorMessage?.message ||
            apiError?.title ||
            'Results Not Found'
        });
        return;
      }

      if (apiError?.status === 403 || apiError?.status === 401) {
        payload.set({
          status: apiError?.status,
          message:
            apiError?.error?.errorMessage?.message ||
            apiError?.title ||
            'Access denied'
        });
        return;
      }

      payload.set(apiError);
    }
  };
}