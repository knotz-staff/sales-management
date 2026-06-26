import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
    
    // SQLite format Date formatting -> PostgreSQL Date objects formatting for JSON output
    // PostgreSQL DATE fields are returned as Date objects by pg driver
    const formattedCustomers = result.rows.map(row => ({
      ...row,
      last_contact_date: row.last_contact_date instanceof Date ? row.last_contact_date.toISOString().split('T')[0] : row.last_contact_date
    }));

    return NextResponse.json(formattedCustomers);
  } catch (error) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company_name, contact_name, manager_name, status, last_contact_date } = body;

    const db = await getDb();
    const result = await db.query(`
      INSERT INTO customers (company_name, contact_name, manager_name, status, last_contact_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [company_name, contact_name, manager_name, status, last_contact_date]);

    return NextResponse.json({ id: result.rows[0].id, success: true }, { status: 201 });
  } catch (error) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
