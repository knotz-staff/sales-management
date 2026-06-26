import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');

  try {
    const db = await getDb();
    let result;
    if (customerId) {
        result = await db.query('SELECT * FROM meetings WHERE customer_id = $1 ORDER BY meeting_date DESC, id DESC', [customerId]);
    } else {
        result = await db.query('SELECT * FROM meetings ORDER BY meeting_date DESC, id DESC');
    }

    const formattedMeetings = result.rows.map(row => ({
      ...row,
      meeting_date: row.meeting_date instanceof Date ? row.meeting_date.toISOString().split('T')[0] : row.meeting_date
    }));

    return NextResponse.json(formattedMeetings);
  } catch (error) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_id, meeting_date, details } = body;

    const db = await getDb();
    const result = await db.query(`
      INSERT INTO meetings (customer_id, meeting_date, details)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [customer_id, meeting_date, details]);
    
    // Also update the customer's last_contact_date automatically when a new meeting is added
    // PostgreSQL uses $1, $2, etc.
    await db.query(`
      UPDATE customers 
      SET last_contact_date = $1 
      WHERE id = $2 AND last_contact_date < $3
    `, [meeting_date, customer_id, meeting_date]);

    return NextResponse.json({ id: result.rows[0].id, success: true }, { status: 201 });
  } catch (error) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
}
