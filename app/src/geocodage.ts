import { z } from 'zod'
import { obtenirJson } from './net'

export const CommuneSchema = z
  .object({
    nom: z.string().min(1).max(100),
    code: z.string().regex(/^[0-9AB]{5}$/), // code INSEE (2A/2B pour la Corse)
    cp: z.string().max(10),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  })
  .strict()
export type Commune = z.infer<typeof CommuneSchema>

const ReponseSchema = z.object({
  features: z.array(z.object({
    geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
    properties: z.object({ name: z.string(), citycode: z.string(), postcode: z.string().optional(), context: z.string().optional() }),
  })),
})

/** Ce que l'élève peut chercher : un nom de commune ou un code postal, rien d'autre. */
export const RechercheSchema = z
  .string()
  .trim()
  .min(2, 'Tape au moins 2 caractères.')
  .max(60, '60 caractères au maximum.')
  .regex(/^[\p{L}0-9' -]+$/u, 'Utilise seulement des lettres, des chiffres, des espaces, des tirets ou des apostrophes.')

export async function chercherCommunes(recherche: string, signal?: AbortSignal): Promise<(Commune & { contexte: string })[]> {
  const q = RechercheSchema.parse(recherche)
  const url = `https://data.geopf.fr/geocodage/search?${new URLSearchParams({ q, type: 'municipality', limit: '5' })}`
  return ReponseSchema.parse(await obtenirJson(url, signal)).features.map((f) => ({
    nom: f.properties.name,
    code: f.properties.citycode,
    cp: f.properties.postcode ?? '',
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    contexte: f.properties.context ?? '',
  }))
}
