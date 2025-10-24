import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    prepareHeaders: (headers, { getState }) => {
      // Add auth token if available
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Dashboard', 'Users', 'Orders', 'Payments'],
  endpoints: (builder) => ({
    getDashboardMetrics: builder.query({
      query: () => '/admin/dashboard',
      providesTags: ['Dashboard'],
    }),
    getUsers: builder.query({
      query: ({ page = 1, limit = 10, search = '' }) => 
        `/admin/users?page=${page}&limit=${limit}&search=${search}`,
      providesTags: ['Users'],
    }),
    getOrders: builder.query({
      query: ({ page = 1, limit = 10, status = '' }) => 
        `/admin/orders?page=${page}&limit=${limit}&status=${status}`,
      providesTags: ['Orders'],
    }),
    getPayments: builder.query({
      query: ({ page = 1, limit = 10, type = '' }) => 
        `/admin/payments?page=${page}&limit=${limit}&type=${type}`,
      providesTags: ['Payments'],
    }),
  }),
});

export const {
  useGetDashboardMetricsQuery,
  useGetUsersQuery,
  useGetOrdersQuery,
  useGetPaymentsQuery,
} = api;