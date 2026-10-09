import { createContext, useContext } from 'react'
import type { ApiClient } from './client'
import { httpClient } from './client'

export const ApiContext = createContext<ApiClient>(httpClient)

export function useApi(): ApiClient {
  return useContext(ApiContext)
}
