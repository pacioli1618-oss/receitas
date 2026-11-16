// GENERATED — do not edit by hand. Regenerate after every migration: `npm run db:types`.
// Only the public rc_* functions matter here: the app talks to the database through them.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      rc_create_book: {
        Args: { p_device_id?: string; p_locale?: string; p_title: string }
        Returns: Json
      }
      rc_create_recipe: {
        Args: {
          p_author?: string
          p_category?: string
          p_device_id?: string
          p_ingredients?: string
          p_slug: string
          p_steps?: string
          p_tip?: string
          p_title: string
        }
        Returns: string
      }
      rc_delete_recipe: {
        Args: { p_recipe_id: string; p_slug: string }
        Returns: undefined
      }
      rc_get_book: {
        Args: { p_slug: string; p_with_details?: boolean }
        Returns: Json
      }
      rc_get_recipe: {
        Args: { p_recipe_id: string; p_slug: string }
        Returns: Json
      }
      rc_get_trash: { Args: { p_slug: string }; Returns: Json }
      rc_restore_recipe: {
        Args: { p_recipe_id: string; p_slug: string }
        Returns: undefined
      }
      rc_set_recipe_photo: {
        Args: { p_photo_path: string; p_recipe_id: string; p_slug: string }
        Returns: undefined
      }
      rc_update_book: {
        Args: { p_slug: string; p_title: string }
        Returns: undefined
      }
      rc_update_recipe: {
        Args: {
          p_author?: string
          p_category?: string
          p_ingredients?: string
          p_recipe_id: string
          p_slug: string
          p_steps?: string
          p_tip?: string
          p_title: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
