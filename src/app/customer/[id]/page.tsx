"use client";

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Customer = {
  id: number;
  company_name: string;
  contact_name: string;
  manager_name: string;
  status: 'new' | 'existing' | 'prospective';
  last_contact_date: string;
  phone?: string;
  email?: string;
};

type Meeting = {
  id: number;
  customer_id: number;
  meeting_date: string;
  details: string;
  created_at: string;
};

export default function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [_customer, _setCustomer] = useState<Customer | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [newMeeting, setNewMeeting] = useState({
    meeting_date: new Date().toISOString().split('T')[0],
    details: ''
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ phone: '', email: '' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchCustomer = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        const data = await res.json();
        _setCustomer(data);
        setContactForm({ phone: data.phone || '', email: data.email || '' });
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
    }
  }, [id, router]);

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings?customerId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomer();
    fetchMeetings();
  }, [fetchCustomer, fetchMeetings]);

  const handleStatusChange = async (newStatus: 'new' | 'existing' | 'prospective') => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchCustomer();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 고객과 모든 미팅 내역을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/');
      } else {
        alert('삭제에 실패했습니다.');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
      setIsDeleting(false);
    }
  };

  const handleContactUpdate = async () => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: contactForm.phone, email: contactForm.email })
      });
      if (res.ok) {
        fetchCustomer();
        setIsEditingContact(false);
      } else {
        alert('연락처 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  const handleDeleteMeeting = async (meetingId: number) => {
    if (!confirm('이 이력을 정말 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMeetings();
        fetchCustomer();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete meeting:', error);
    }
  };

  const handleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: id,
          ...newMeeting
        })
      });
      
      if (res.ok) {
        setNewMeeting({
          meeting_date: new Date().toISOString().split('T')[0],
          details: ''
        });
        fetchMeetings();
        fetchCustomer();
        setCurrentPage(1); // Reset to first page when new meeting is added
      }
    } catch (error) {
      console.error('Failed to add meeting:', error);
    }
  };

  if (!_customer) return <div className="container">Loading...</div>;

  const sortedMeetings = [...meetings].sort((a, b) => {
    if (a.meeting_date !== b.meeting_date) {
      return new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime();
    }
    return b.id - a.id; // Same date -> newest entered first
  });

  const totalPages = Math.ceil(sortedMeetings.length / itemsPerPage);
  const currentMeetings = sortedMeetings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <main className="container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>&larr;</span> 목록으로 돌아가기
        </Link>
        <button 
          className="btn" 
          style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? '삭제 중...' : '고객 삭제'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 className="title" style={{ marginBottom: '0.5rem' }}>{_customer.company_name}</h1>
            <div style={{ color: 'var(--text-secondary)' }}>
              담당자: {_customer.contact_name} | 내부 담당: {_customer.manager_name}
            </div>
            {isEditingContact ? (
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="휴대폰 번호" 
                  value={contactForm.phone} 
                  onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                  style={{ width: '150px', padding: '0.25rem 0.5rem', minHeight: 'auto' }}
                />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="이메일 주소" 
                  value={contactForm.email} 
                  onChange={e => setContactForm({...contactForm, email: e.target.value})}
                  style={{ width: '200px', padding: '0.25rem 0.5rem', minHeight: 'auto' }}
                />
                <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem' }} onClick={handleContactUpdate}>저장</button>
                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }} onClick={() => setIsEditingContact(false)}>취소</button>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {(_customer.phone || _customer.email) ? (
                  <>
                    {_customer.phone && <span>휴대폰: {_customer.phone} </span>}
                    {_customer.phone && _customer.email && <span>| </span>}
                    {_customer.email && <span>이메일: {_customer.email}</span>}
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>연락처 정보가 없습니다.</span>
                )}
                <button 
                  onClick={() => setIsEditingContact(true)}
                  style={{ 
                    background: 'none', border: 'none', color: 'var(--primary-color)', 
                    cursor: 'pointer', fontSize: '0.875rem', padding: '0 0.25rem' 
                  }}
                >
                  [수정]
                </button>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>고객 상태:</span>
            <select 
              className="form-select" 
              style={{ width: 'auto', padding: '0.25rem 2rem 0.25rem 0.5rem' }}
              value={_customer.status}
              onChange={(e) => handleStatusChange(e.target.value as 'new' | 'existing' | 'prospective')}
              disabled={isUpdatingStatus}
            >
              <option value="prospective">잠정 고객</option>
              <option value="new">신규 대응</option>
              <option value="existing">진행중</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 className="card-title">미팅 및 대응 이력 추가</h2>
        <form onSubmit={handleMeetingSubmit}>
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 3fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">미팅/대응 일자</label>
              <input 
                type="date" 
                className="form-input" 
                required
                value={newMeeting.meeting_date}
                onChange={e => setNewMeeting({...newMeeting, meeting_date: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">대응 내용</label>
              <input 
                type="text" 
                className="form-input" 
                required
                placeholder="미팅 또는 대응 내용을 간략히 입력하세요"
                value={newMeeting.details}
                onChange={e => setNewMeeting({...newMeeting, details: e.target.value})}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">내역 추가</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="card-title">이력 리스트</h2>
        {meetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            아직 등록된 미팅/대응 이력이 없습니다.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {currentMeetings.map((meeting) => (
                <div key={meeting.id} style={{ 
                  padding: '1rem', 
                  borderLeft: '4px solid var(--primary-color)', 
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      {meeting.meeting_date}
                    </div>
                    <div style={{ fontWeight: 500 }}>
                      {meeting.details}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteMeeting(meeting.id)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#ef4444', 
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      padding: '0.25rem'
                    }}
                    title="이력 삭제"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {currentPage} / {totalPages}
                </span>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
