
import { createClient } from '@supabase/supabase-js';
import { Venue } from './types';

// REPLACE THESE with your actual project values from Supabase Settings > API
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase configuration. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your environment.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const db = {
    async getVenues(): Promise<Venue[]> {
        const { data, error } = await supabase
            .from('venues')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) {
            console.error('Error fetching venues:', error);
            throw error;
        }
        return (data || []) as Venue[];
    },

    async upsertVenue(venue: Partial<Venue>): Promise<Venue> {
        // Strict separation of insert/update to handle GENERATED ALWAYS identity columns
        const { id, ...dataToSave } = venue;
        
        let query;
        if (id) {
            // Updating existing venue
            query = supabase
                .from('venues')
                .update(dataToSave)
                .eq('id', id)
                .select()
                .single();
        } else {
            // Creating new venue - do NOT include id in the payload
            query = supabase
                .from('venues')
                .insert(dataToSave)
                .select()
                .single();
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error saving venue:', error);
            throw error;
        }
        return data as Venue;
    },

    async deleteVenue(id: number): Promise<void> {
        const { error } = await supabase
            .from('venues')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting venue:', error);
            throw error;
        }
    }
};