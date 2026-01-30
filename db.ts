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
    // Preserve null values (null means the field was cleared in DB)
    return { ...rest, org_icon: orgIcon ?? null } as Venue;
}

// Columns that exist in venues table (match your Supabase schema)
const VENUE_COLUMNS = new Set([
    'name', 'description', 'mtrStation', 'mtrExit', 'walkingDistance', 'address',
    'ceilingHeight', 'startingPrice', 'pricing', 'images', 'amenities', 'whatsapp',
    'socialLink', 'orgIcon', 'coordinates', 'sort_order'
]);

function venueToRow(venue: Record<string, any>): Record<string, any> {
    const { org_icon, ...rest } = venue;
    // Build result object manually to ensure null values are preserved
    const result: Record<string, any> = {};
    
    // Copy all valid columns from rest
    Object.entries(rest).forEach(([key, value]) => {
        if (VENUE_COLUMNS.has(key) && value !== undefined) {
            result[key] = value;
        }
    });
    
    // Handle orgIcon separately - always include if org_icon is defined (even if null)
    if (org_icon !== undefined && VENUE_COLUMNS.has('orgIcon')) {
        result.orgIcon = (org_icon === '' || org_icon === null) ? null : org_icon;
    }
    
    return result;
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
        const needsOrgIconClear = (rest.org_icon === null || rest.org_icon === '');
        const dataToSave = venueToRow(rest);
        
        let query;
        if (id) {
            // Update existing venue
            // Build update object ensuring orgIcon is explicitly included if we need to clear it
            const updateData: Record<string, any> = { ...dataToSave };
            if (needsOrgIconClear) {
                // Explicitly set orgIcon to null - ensure it's in the update object
                updateData.orgIcon = null;
                console.log('Explicitly setting orgIcon to null for venue:', id, 'Update data:', JSON.stringify(updateData));
            }
            query = supabase.from('venues').update(updateData).eq('id', id).select().single();
        } else {
            // Insert new venue
            query = supabase.from('venues').insert(dataToSave).select().single();
        }
        
        const { data, error } = await query;
        if (error) {
            console.error('Error saving venue:', {
                message: error.message,
                details: error.details,
                code: error.code,
                hint: error.hint,
                full: error,
                dataToSave: dataToSave,
                updateData: id ? (needsOrgIconClear ? { ...dataToSave, orgIcon: null } : dataToSave) : undefined
            });
            throw error;
        }
        const result = rowToVenue(data);
        if (needsOrgIconClear) {
            console.log('After save - venue org_icon:', result.org_icon, 'DB orgIcon:', data?.orgIcon);
        }
        return result;
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