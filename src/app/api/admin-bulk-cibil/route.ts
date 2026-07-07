import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiHubStore, hitMasterApi } from '@/lib/api-hub/simple-store';

type BulkRow = {
  name?: string;
  pan?: string;
  dob?: string;
  mobile?: string;
  address?: string;
  state?: string;
  pincode?: string;
  gender?: string;
};

function clean(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function digits(value: unknown) {
  return clean(value).replace(/\D/g, '');
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function normalizeRow(row: BulkRow) {
  const name = clean(row.name);
  const names = splitName(name);
  return {
    input: {
      name,
      pan: clean(row.pan).toUpperCase(),
      dob: clean(row.dob),
      mobile: digits(row.mobile).slice(-10),
      address: clean(row.address),
      state: clean(row.state).toUpperCase(),
      pincode: digits(row.pincode).slice(0, 6),
      gender: clean(row.gender).toLowerCase(),
    },
    payload: {
      firstName: names.firstName,
      lastName: names.lastName,
      dob: clean(row.dob),
      gender: clean(row.gender).toLowerCase(),
      pan: clean(row.pan).toUpperCase(),
      mobile: digits(row.mobile).slice(-10),
      address: clean(row.address),
      state: clean(row.state).toUpperCase(),
      pincode: digits(row.pincode).slice(0, 6),
    },
  };
}

function readScore(data: any): number | null {
  const candidates = [
    data?.data?.score,
    data?.score,
    data?.data?.data?.score,
    data?.result?.score,
  ];
  const score = candidates.find((item) => item !== undefined && item !== null && item !== '');
  const numeric = Number(score);
  return Number.isFinite(numeric) ? numeric : null;
}

function readReportId(data: any): string | null {
  return clean(data?.data?.reportId || data?.data?.report_id || data?.reportId || data?.report_id || data?.requestId) || null;
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('b2c_report_requests')
      .select('id,full_name,mobile,pan,dob,address,state,pin_code,status,api_status,api_error,credit_score,report_id,report_json,api_request_json,api_response_json,created_at')
      .eq('report_type', 'admin_bulk_cibil')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return NextResponse.json({ success: true, records: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch bulk CIBIL records';
    return NextResponse.json({ success: false, error: message, records: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const batchId = `BULK-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  try {
    const body = await request.json();
    const rows = Array.isArray(body?.rows) ? body.rows as BulkRow[] : [];
    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'No rows received' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { store } = await getApiHubStore(supabase);
    const api = store.apis.find((item) => item.status === 'active' && ['bureau', 'bureau-standard', 'cibil.consumer_score'].includes(item.code));
    if (!api?.master_url) {
      return NextResponse.json({ success: false, error: 'Bureau Standard master API is not configured' }, { status: 400 });
    }

    const results = [];

    for (let index = 0; index < rows.length; index += 1) {
      const { input, payload } = normalizeRow(rows[index]);
      const rowNumber = index + 1;
      const startedAt = Date.now();

      try {
        const missing = ['name', 'pan', 'dob', 'mobile', 'address', 'state', 'pincode'].filter((field) => !(input as any)[field]);
        if (missing.length) throw new Error(`Missing fields: ${missing.join(', ')}`);

        const response = await hitMasterApi(api, payload);
        const rawJson = response.data;
        const status = response.ok ? 'bulk_cibil_success' : 'bulk_cibil_failed';
        const apiError = response.ok ? null : `Master API failed with ${response.status}`;

        const { data: saved, error: saveError } = await supabase
          .from('b2c_report_requests')
          .insert({
            full_name: input.name,
            mobile: input.mobile || `bulk-${batchId}-${rowNumber}`,
            pan: input.pan || null,
            dob: input.dob || null,
            address: input.address || null,
            state: input.state || null,
            pin_code: input.pincode || null,
            consent_given: true,
            consent_at: new Date().toISOString(),
            status,
            report_type: 'admin_bulk_cibil',
            credit_score: readScore(rawJson),
            report_id: readReportId(rawJson),
            report_json: rawJson,
            api_request_json: {
              batch_id: batchId,
              row_number: rowNumber,
              source: 'admin_excel_upload',
              input,
              jaadugar_payload: payload,
            },
            api_response_json: rawJson,
            api_status: response.ok ? 'success' : 'failed',
            api_error: apiError,
          })
          .select('id,status,api_status,api_error,credit_score,report_id')
          .single();

        if (saveError) throw saveError;
        results.push({ row: rowNumber, success: response.ok, status: response.status, ms: Date.now() - startedAt, saved });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Row failed';
        const { data: saved } = await supabase
          .from('b2c_report_requests')
          .insert({
            full_name: input.name || `Row ${rowNumber}`,
            mobile: input.mobile || `bulk-${Date.now()}-${rowNumber}`,
            pan: input.pan || null,
            dob: input.dob || null,
            address: input.address || null,
            state: input.state || null,
            pin_code: input.pincode || null,
            consent_given: true,
            consent_at: new Date().toISOString(),
            status: 'bulk_cibil_failed',
            report_type: 'admin_bulk_cibil',
            report_json: { error: message },
            api_request_json: { batch_id: batchId, row_number: rowNumber, source: 'admin_excel_upload', input, jaadugar_payload: payload },
            api_response_json: { error: message },
            api_status: 'failed',
            api_error: message,
          })
          .select('id,status,api_status,api_error')
          .single();
        results.push({ row: rowNumber, success: false, status: 0, ms: Date.now() - startedAt, saved, error: message });
      }
    }

    return NextResponse.json({
      success: true,
      batch_id: batchId,
      total: results.length,
      success_count: results.filter((item) => item.success).length,
      failed_count: results.filter((item) => !item.success).length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bulk CIBIL upload failed';
    return NextResponse.json({ success: false, batch_id: batchId, error: message }, { status: 500 });
  }
}
