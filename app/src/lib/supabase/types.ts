// ---------------------------------------------------------------------------
// Supabase Database Types
// ---------------------------------------------------------------------------
// These types mirror the database schema defined in schema.sql.
// They provide full type safety for all Supabase operations.
// ---------------------------------------------------------------------------

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          scent_genome: ScentGenomeJson | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          scent_genome?: ScentGenomeJson | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          scent_genome?: ScentGenomeJson | null;
          updated_at?: string;
        };
      };
      scents: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          description: string | null;
          prompt: string | null;
          formula: Json;
          tags: string[] | null;
          mood: string | null;
          season: string | null;
          intensity: number | null;
          is_public: boolean;
          is_remix: boolean;
          original_scent_id: string | null;
          like_count: number;
          remix_count: number;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          name: string;
          description?: string | null;
          prompt?: string | null;
          formula: Json;
          tags?: string[] | null;
          mood?: string | null;
          season?: string | null;
          intensity?: number | null;
          is_public?: boolean;
          is_remix?: boolean;
          original_scent_id?: string | null;
          like_count?: number;
          remix_count?: number;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          name?: string;
          description?: string | null;
          prompt?: string | null;
          formula?: Json;
          tags?: string[] | null;
          mood?: string | null;
          season?: string | null;
          intensity?: number | null;
          is_public?: boolean;
          is_remix?: boolean;
          original_scent_id?: string | null;
          like_count?: number;
          remix_count?: number;
          version?: number;
          updated_at?: string;
        };
      };
      scent_iterations: {
        Row: {
          id: string;
          scent_id: string;
          iteration_number: number;
          prompt: string | null;
          formula: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          scent_id: string;
          iteration_number: number;
          prompt?: string | null;
          formula: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          scent_id?: string;
          iteration_number?: number;
          prompt?: string | null;
          formula?: Json;
        };
      };
      likes: {
        Row: {
          user_id: string;
          scent_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          scent_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          scent_id?: string;
        };
      };
      favorites: {
        Row: {
          user_id: string;
          scent_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          scent_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          scent_id?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          scent_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          scent_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          scent_id?: string;
          user_id?: string;
          content?: string;
        };
      };
    };
    Functions: {
      get_trending_scents: {
        Args: { limit_count: number };
        Returns: Database["public"]["Tables"]["scents"]["Row"][];
      };
      search_scents: {
        Args: { query: string };
        Returns: Database["public"]["Tables"]["scents"]["Row"][];
      };
    };
  };
}

// ---------------------------------------------------------------------------
// Convenience row types
// ---------------------------------------------------------------------------

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type ScentRow = Database["public"]["Tables"]["scents"]["Row"];
export type ScentInsert = Database["public"]["Tables"]["scents"]["Insert"];
export type ScentUpdate = Database["public"]["Tables"]["scents"]["Update"];

export type ScentIterationRow = Database["public"]["Tables"]["scent_iterations"]["Row"];
export type ScentIterationInsert = Database["public"]["Tables"]["scent_iterations"]["Insert"];
export type ScentIterationUpdate = Database["public"]["Tables"]["scent_iterations"]["Update"];

export type LikeRow = Database["public"]["Tables"]["likes"]["Row"];
export type LikeInsert = Database["public"]["Tables"]["likes"]["Insert"];

export type FavoriteRow = Database["public"]["Tables"]["favorites"]["Row"];
export type FavoriteInsert = Database["public"]["Tables"]["favorites"]["Insert"];

export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
export type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
export type CommentUpdate = Database["public"]["Tables"]["comments"]["Update"];

// ---------------------------------------------------------------------------
// Scent genome JSON shape
// ---------------------------------------------------------------------------

export interface ScentGenomeJson {
  citrus: number;
  floral: number;
  woody: number;
  fresh: number;
  oriental: number;
  gourmand: number;
  spicy: number;
  aquatic: number;
  green: number;
  fruity: number;
  [key: string]: number;
}

// ---------------------------------------------------------------------------
// Composite types used in the API layer
// ---------------------------------------------------------------------------

export interface ScentWithCreator extends ScentRow {
  users: Pick<UserRow, "id" | "username" | "display_name" | "avatar_url"> | null;
}

export interface CommentWithUser extends CommentRow {
  users: Pick<UserRow, "id" | "username" | "display_name" | "avatar_url"> | null;
}

export interface ScentFilters {
  mood?: string;
  season?: string;
  intensity_min?: number;
  intensity_max?: number;
  search?: string;
  creator_id?: string;
  is_public?: boolean;
  sort_by?: "created_at" | "like_count" | "remix_count" | "name";
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}
