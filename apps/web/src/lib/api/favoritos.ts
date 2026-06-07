import type { AddFavoritoRequest, ListFavoritosResponse } from '@ecobairro/contracts'
import { fetchJson } from '@/lib/http/fetch-json'
import { clientEnv } from '@/lib/env'

// Fix #3: sem Authorization headers — cookie HttpOnly enviado automaticamente

export async function listFavoritos(): Promise<ListFavoritosResponse> {
  return fetchJson<ListFavoritosResponse>('/v1/cidadaos/me/favoritos', {
    baseUrl: clientEnv.apiBaseUrl,
  })
}

export async function addFavorito(ecopontoId: string): Promise<ListFavoritosResponse> {
  const body: AddFavoritoRequest = { ecoponto_id: ecopontoId }
  return fetchJson<ListFavoritosResponse>('/v1/cidadaos/me/favoritos', {
    baseUrl: clientEnv.apiBaseUrl,
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function removeFavorito(ecopontoId: string): Promise<ListFavoritosResponse> {
  return fetchJson<ListFavoritosResponse>(
    `/v1/cidadaos/me/favoritos/${encodeURIComponent(ecopontoId)}`,
    {
      baseUrl: clientEnv.apiBaseUrl,
      method: 'DELETE',
    },
  )
}
