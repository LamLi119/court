// venues table: sort_order (int), org_icon (text), social_link (text) – see supabase-migrations/add_venue_columns.sql
import { createClient } from '@supabase/supabase-js';
import { Venue } from './types';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase configuration. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your environment.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Your DB uses quoted camelCase ("mtrStation", "socialLink", "orgIcon"). App uses org_icon.
function rowToVenue(row: any): Venue {
    if (!row) return row;
    const { orgIcon, ...rest } = row;
    return { ...rest, org_icon: orgIcon } as Venue;
}

// Columns that exist in venues table (match your Supabase schema)
const VENUE_COLUMNS = new Set([
    'name', 'description', 'mtrStation', 'mtrExit', 'walkingDistance', 'address',
    'ceilingHeight', 'startingPrice', 'pricing', 'images', 'amenities', 'whatsapp',
    'socialLink', 'orgIcon', 'coordinates', 'sort_order'
]);

function venueToRow(venue: Record<string, any>): Record<string, any> {
    const { org_icon, ...rest } = venue;
    const row: Record<string, any> = { ...rest, ...(org_icon !== undefined && org_icon !== '' && { orgIcon: org_icon }) };
    const defined = Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));
    // Only send keys that exist in the DB to avoid 400 from unknown column
    return Object.fromEntries(Object.entries(defined).filter(([k]) => VENUE_COLUMNS.has(k)));
}

export const db = {
    async getVenues(): Promise<Venue[]> {
        const { data, error } = await supabase
            .from('venues')
            .select('*')
            .order('sort_order', { ascending: true, nullsFirst: false })
            .order('name', { ascending: true });
        if (error) {
            console.error('Error fetching venues:', error);
            throw error;
        }
        return ((data || []) as any[]).map(rowToVenue);
    },

    async upsertVenue(venue: Partial<Venue>): Promise<Venue> {
        const { sort_order: _so, id, ...rest } = venue as any;
        const dataToSave = venueToRow(rest);
        const query = id
            ? supabase.from('venues').update(dataToSave).eq('id', id).select().single()
            : supabase.from('venues').insert(dataToSave).select().single();
        const { data, error } = await query;
        if (error) {
            console.error('Error saving venue:', {
                message: error.message,
                details: error.details,
                code: error.code,
                hint: error.hint,
                full: error
            });
            throw error;
        }
        return rowToVenue(data);
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
    },

    async updateVenueOrder(orderedIds: number[]): Promise<void> {
        await Promise.all(
            orderedIds.map((id, index) =>
                supabase.from('venues').update({ sort_order: index }).eq('id', id)
            )
        );
    }
};