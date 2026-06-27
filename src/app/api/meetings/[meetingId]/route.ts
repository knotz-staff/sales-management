import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    const db = await getDb();
    
    // 이력을 삭제하고 해당 이력의 고객 ID를 반환받음
    const result = await db.query('DELETE FROM meetings WHERE id = $1 RETURNING customer_id', [meetingId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const customerId = result.rows[0].customer_id;

    // 고객의 남은 이력 중 가장 최신 날짜를 찾아서 customers 테이블의 last_contact_date 업데이트
    const latestMeeting = await db.query('SELECT meeting_date FROM meetings WHERE customer_id = $1 ORDER BY meeting_date DESC LIMIT 1', [customerId]);
    
    if (latestMeeting.rows.length > 0) {
        await db.query('UPDATE customers SET last_contact_date = $1 WHERE id = $2', [latestMeeting.rows[0].meeting_date, customerId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
  }
}
