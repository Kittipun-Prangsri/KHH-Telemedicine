const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { authMiddleware } = require('./auth');

router.use(authMiddleware);

// Google Sheets synchronization helper
async function syncToGoogleSheet(action, payload) {
  const url = process.env.GOOGLE_SHEET_WEBAPP_URL;
  if (!url || url === 'YOUR_GOOGLE_SHEET_WEBAPP_URL_HERE' || !url.startsWith('http')) {
    return; // Sync is disabled or not configured
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, ...payload })
    });
    const result = await response.json();
    if (!result.success) {
      console.error('❌ Google Sheet Sync failed:', result.error);
    } else {
      console.log(`✅ Google Sheet Sync successful [${action}]`);
    }
  } catch (err) {
    console.error('❌ Google Sheet Sync connection error:', err.message);
  }
}


// Helper functions to map database (snake_case) to client (camelCase)
function toSnake(p) {
  return {
    id: p.id,
    hn: p.hn,
    name: p.name,
    clinic_tags: p.clinicTags || [],
    bp: p.bp || '',
    fbs: p.fbs || '',
    rights: p.rights || '',
    order_date: p.orderDate || null,
    next_appt: p.nextAppt || null,
    facility: p.facility || '',
    sent_to: p.sentTo || '',
    dispatch_date: p.dispatchDate || null,
    pharmacist: p.pharmacist || '',
    injection: p.injection || '',
    received_by: p.receivedBy || '',
    patient_received_date: p.patientReceivedDate || null,
    notes: p.notes || ''
  };
}

function toCamel(r) {
  return {
    id: r.id,
    hn: r.hn,
    name: r.name,
    clinicTags: r.clinic_tags || [],
    bp: r.bp || '',
    fbs: r.fbs || '',
    rights: r.rights || '',
    orderDate: r.order_date || '',
    nextAppt: r.next_appt || '',
    facility: r.facility || '',
    sentTo: r.sent_to || '',
    dispatchDate: r.dispatch_date || '',
    pharmacist: r.pharmacist || '',
    injection: r.injection || '',
    receivedBy: r.received_by || '',
    patientReceivedDate: r.patient_received_date || '',
    notes: r.notes || ''
  };
}

// GET all patients
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(toCamel));
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST single patient
router.post('/', async (req, res) => {
  try {
    const record = toSnake(req.body);
    const { data, error } = await supabase
      .from('patients')
      .insert([record])
      .select();

    if (error) throw error;
    const clientData = toCamel(data[0]);
    syncToGoogleSheet('upsert', { data: clientData });
    res.status(201).json(clientData);
  } catch (err) {
    console.error('Error creating patient:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update patient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const record = toSnake(req.body);
    // Remove id from update payload
    delete record.id;
    record.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('patients')
      .update(record)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    const clientData = toCamel(data[0]);
    syncToGoogleSheet('upsert', { data: clientData });
    res.json(clientData);
  } catch (err) {
    console.error('Error updating patient:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE patient
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    syncToGoogleSheet('delete', { id });
    res.json({ success: true, message: 'Patient deleted successfully' });
  } catch (err) {
    console.error('Error deleting patient:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST bulk insert (Excel Import)
router.post('/bulk', async (req, res) => {
  try {
    const patients = req.body;
    if (!Array.isArray(patients)) {
      return res.status(400).json({ error: 'Invalid data format. Expected array.' });
    }

    const records = patients.map(toSnake);
    
    // Using upsert to handle existing records or simply insert
    const { data, error } = await supabase
      .from('patients')
      .upsert(records, { onConflict: 'id' })
      .select();

    if (error) throw error;
    const clientData = data.map(toCamel);
    syncToGoogleSheet('bulk', { data: clientData });
    res.json(clientData);
  } catch (err) {
    console.error('Error bulk upserting patients:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
