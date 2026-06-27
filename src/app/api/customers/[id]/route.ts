import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    const customer = result.rows[0];

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = await getDb();

    const updates: string[] = [];
    const values: any[] = [];
    let queryIndex = 1;

    if (body.status !== undefined) {
      updates.push(`status = $${queryIndex++}`);
      values.push(body.status);
    }
    if (body.phone !== undefined) {
      updates.push(`phone = $${queryIndex++}`);
      values.push(body.phone);
    }
    if (body.email !== undefined) {
      updates.push(`email = $${queryIndex++}`);
      values.push(body.email);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const query = `UPDATE customers SET ${updates.join(', ')} WHERE id = $${queryIndex}`;
    
    const result = await db.query(query, values);

    if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.query('DELETE FROM customers WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
