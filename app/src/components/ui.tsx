import type { ButtonHTMLAttributes } from 'react'

const styles = {
  primaire: 'bg-violet-700 text-white hover:bg-violet-800 shadow-md shadow-violet-300',
  secondaire: 'bg-white text-violet-800 ring-2 ring-violet-200 hover:ring-violet-400',
  danger: 'bg-white text-rose-700 ring-2 ring-rose-200 hover:ring-rose-400',
}

export function Bouton({ variante = 'primaire', className = '', ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variante?: keyof typeof styles }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 font-semibold transition ${styles[variante]} ${className}`}
      {...props}
    />
  )
}

/** Style commun des choix (radio ou case à cocher) présentés en « puces » cliquables. */
export const PUCE =
  'flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl bg-violet-50 px-3 py-2 text-sm font-medium text-violet-950 ring-2 ring-violet-100 hover:ring-violet-300 has-[:checked]:bg-violet-700 has-[:checked]:text-white has-[:checked]:ring-violet-700 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-violet-700 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60'
