import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lheprzwjxnckwovdivfb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nDvHBgKJ0taX7cMGWo4_6A_1j_H5xmi';

export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
