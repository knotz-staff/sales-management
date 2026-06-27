"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Customer = {
  id: number;
  company_name: string;
  contact_name: string;
  manager_name: string;
  status: 'new' | 'existing' | 'prospective';
  last_contact_date: string;
  phone?: string;
  email?: string;
  latest_meeting_details?: string;
};

export default function Home() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    phone: '',
    email: '',
    manager_name: '',
    status: 'new',
    last_contact_date: new Date().toISOString().split('T')[0],
  });

  const [visibleCounts, setVisibleCounts] = useState({
    new: 10,
    existing: 10,
    prospective: 10
  });

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers();
  }, [fetchCustomers]);

  const getStatusColor = (lastContactDate: string) => {
    const today = new Date();
    const contactDate = new Date(lastContactDate);
    const diffTime = Math.abs(today.getTime() - contactDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 15) return 'status-green';
    if (diffDays <= 30) return 'status-yellow';
    return 'status-red';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCustomers();
        setFormData({
          company_name: '',
          contact_name: '',
          phone: '',
          email: '',
          manager_name: '',
          status: 'new',
          last_contact_date: new Date().toISOString().split('T')[0],
        });
      }
    } catch (error) {
      console.error('Failed to add customer:', error);
    }
  };

  const handleLoadMore = (statusKey: 'new' | 'existing' | 'prospective') => {
    setVisibleCounts(prev => ({
      ...prev,
      [statusKey]: prev[statusKey] + 10
    }));
  };

  const prospectiveCustomers = customers.filter(c => c.status === 'prospective');
  
  const sortByOldestContact = (a: Customer, b: Customer) => {
    return new Date(a.last_contact_date).getTime() - new Date(b.last_contact_date).getTime();
  };

  const newCustomers = customers.filter(c => c.status === 'new').sort(sortByOldestContact);
  const existingCustomers = customers.filter(c => c.status === 'existing').sort(sortByOldestContact);

  const renderTable = (data: Customer[], title: string, statusKey: 'new' | 'existing' | 'prospective', showDetails: boolean = false) => {
    const visibleData = data.slice(0, visibleCounts[statusKey]);
    const hasMore = data.length > visibleCounts[statusKey];

    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 className="card-title">{title} ({data.length})</h2>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>상태</th>
                <th>업체명</th>
                <th>담당자</th>
                <th>최근 대응일</th>
                {showDetails && <th>최근 대응 내용</th>}
              </tr>
            </thead>
            <tbody>
              {visibleData.length === 0 ? (
                <tr>
                  <td colSpan={showDetails ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>데이터가 없습니다.</td>
                </tr>
              ) : (
                visibleData.map((customer) => (
                  <Link href={`/customer/${customer.id}`} key={customer.id} legacyBehavior>
                    <tr style={{ cursor: 'pointer' }}>
                      <td>
                        <span className={`status-indicator ${getStatusColor(customer.last_contact_date)}`} title="최근 대응 상태"></span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{customer.company_name}</td>
                      <td>{customer.manager_name}</td>
                      <td>{customer.last_contact_date}</td>
                      {showDetails && (
                        <td style={{ 
                          maxWidth: '200px', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }} title={customer.latest_meeting_details || '-'}>
                          {customer.latest_meeting_details || '-'}
                        </td>
                      )}
                    </tr>
                  </Link>
                ))
              )}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-secondary" onClick={() => handleLoadMore(statusKey)}>
              더보기 ▾
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="container" style={{ maxWidth: '1400px' }}>
      <div className="header">
        <h1 className="title">영업관리 대시보드</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + 신규 고객 등록
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
        {renderTable(existingCustomers, "프로젝트 현황", 'existing', true)}
        {renderTable(newCustomers, "신규 사업 대응 현황", 'new', true)}
        {renderTable(prospectiveCustomers, "잠정 고객 현황", 'prospective', false)}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">신규 고객 등록</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">업체명</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.company_name}
                  onChange={e => setFormData({...formData, company_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">고객명 (상대 담당자)</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.contact_name}
                  onChange={e => setFormData({...formData, contact_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">고객 휴대폰 번호</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">고객 이메일 주소</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">내부 담당자 (영업 사원)</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.manager_name}
                  onChange={e => setFormData({...formData, manager_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">고객 상태</label>
                <select 
                  className="form-select"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as 'new' | 'existing' | 'prospective'})}
                >
                  <option value="prospective">잠정 고객</option>
                  <option value="new">신규 대응</option>
                  <option value="existing">진행중</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">최근 대응일</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={formData.last_contact_date}
                  onChange={e => setFormData({...formData, last_contact_date: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>취소</button>
                <button type="submit" className="btn btn-primary">등록하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
