export interface Artist {
  id: string
  name: string
  bio: string
  avatar_url: string | null
  instagram: string | null
  created_at: string
}

export interface Style {
  id: string
  name: string
  slug: string
}

export interface Tattoo {
  id: string
  artist_id: string
  image_url: string
  title: string
  style: string
  tags: string[]
  view_count: number
  created_at: string
  artist?: Artist
}
