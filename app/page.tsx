'use client';

import { useEffect, useState } from 'react';
import { CameraDeviceSelect } from '@/components/CameraDeviceSelect';
import { FaceAutoFill } from '@/components/FaceAutoFill';
import { ShelfQrScanner } from '@/components/ShelfQrScanner';
import { RentalCommitPanel } from '@/components/RentalCommitPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import { ITEM_MAP } from '@/lib/constants';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { InventoryStatusPanel } from '@/components/InventoryStatusPanel';
import { EmployeeRegisterPanel } from '@/components/EmployeeRegisterPanel';
import { ItemConfigPanel, type ItemRow } from '@/components/ItemConfigPanel';

interface Employee {
  id: string;
  name: string;
  team: string;
  title: string;
  is_active?: boolean;
}

interface Rental {
  id: string;
  employee_id: string;
  items_taken: string[];
  note: string | null;
  created_at: string;
  employees: Employee;
}

export default function HomePage() {
  const [faceCameraId, setFaceCameraId] = useState<string>('');
  const [shelfCameraId, setShelfCameraId] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');
  const [selectedEmployeeTeam, setSelectedEmployeeTeam] = useState<string>('');
  const [itemsTaken, setItemsTaken] = useState<string[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [activeTab, setActiveTab] = useState<'status' | 'take' | 'register' | 'history'>('status');
  const [supabaseLoadError, setSupabaseLoadError] = useState<string>('');

  const hasSupabaseEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const formatSupabaseError = (scope: string, err: unknown) => {
    const e = err as Record<string, unknown> | null;
    const message =
      (e && typeof e.message === 'string' && e.message) ||
      (e && typeof e.error === 'string' && e.error) ||
      'Unknown error';
    const details = e && typeof e.details === 'string' ? e.details : '';
    const hint = e && typeof e.hint === 'string' ? e.hint : '';
    const code = e && typeof e.code === 'string' ? e.code : '';

    const parts = [
      `[${scope}] ${message}`,
      details ? `details: ${details}` : '',
      hint ? `hint: ${hint}` : '',
      code ? `code: ${code}` : '',
    ].filter(Boolean);

    return parts.join(' | ');
  };

  const loadEmployees = async () => {
    try {
      if (!hasSupabaseEnv) return;
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) {
        const msg = formatSupabaseError('employees.select', error);
        setSupabaseLoadError(msg);
        console.error('Failed to load employees:', {
          error,
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        });
        return;
      }
      if (data) setEmployees(data as Employee[]);
    } catch (error) {
      const msg = formatSupabaseError('employees.select.catch', error);
      setSupabaseLoadError(msg);
      console.error('Failed to load employees:', error);
    }
  };

  const loadItems = async () => {
    try {
      if (!hasSupabaseEnv) return;
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('id');
      if (error) {
        const msg = formatSupabaseError('items.select', error);
        setSupabaseLoadError(msg);
        console.error('Failed to load items:', {
          error,
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        });
        return;
      }
      if (data) setItems(data as ItemRow[]);
    } catch (error) {
      const msg = formatSupabaseError('items.select.catch', error);
      setSupabaseLoadError(msg);
      console.error('Failed to load items:', error);
    }
  };

  // 최근 대여 기록 로드
  const loadRentals = async () => {
    try {
      if (!hasSupabaseEnv) return;

      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          employees (*)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        const msg = formatSupabaseError('rentals.select', error);
        setSupabaseLoadError(msg);
        console.error('Failed to load rentals:', {
          error,
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          code: (error as any)?.code,
        });
        return;
      }
      if (data) {
        setRentals(data as Rental[]);
      }
    } catch (error) {
      const msg = formatSupabaseError('rentals.select.catch', error);
      setSupabaseLoadError(msg);
      console.error('Failed to load rentals:', error);
    }
  };

  useEffect(() => {
    void loadItems();
    void loadEmployees();
    void loadRentals();
  }, []);

  const handleFaceRecognized = (employee: { id: string; name: string; team: string; confidence: number }) => {
    setSelectedEmployeeId(employee.id);
    setSelectedEmployeeName(employee.name);
    setSelectedEmployeeTeam(employee.team);
  };

  const handleManualOverride = () => {
    // 수동 입력 시 자동 덮어쓰기 중단 (FaceAutoFill에서 처리)
  };

  const handleItemsDetected = (items: string[]) => {
    setItemsTaken(items);
  };

  const handleRentalSuccess = () => {
    setSelectedEmployeeId(null);
    setSelectedEmployeeName('');
    setSelectedEmployeeTeam('');
    setItemsTaken([]);
    void loadRentals();
  };

  const displayRentals = rentals.slice(0, 20);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">자산/소모품 메인 대시보드</h1>
            <p className="text-gray-600 mt-2">
              현황 · 등록 · 가져가기 · 확인을 한 화면에서 처리합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                void loadItems();
                void loadEmployees();
                void loadRentals();
              }}
              disabled={!hasSupabaseEnv}
            >
              새로고침
            </Button>
            <Button onClick={() => setActiveTab('take')}>가져가기</Button>
          </div>
        </div>
      </div>

      {!hasSupabaseEnv && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Supabase 설정 필요</CardTitle>
            <CardDescription>
              `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 설정해야 현황/등록/이력이 동작합니다.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {hasSupabaseEnv && supabaseLoadError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Supabase 데이터 로드 실패</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-mono text-xs break-all">{supabaseLoadError}</div>
              <div className="text-xs">
                - Supabase SQL Editor에서 `supabase/schema.sql`을 실행했는지 확인하세요.<br />
                - 테이블 RLS가 켜져있다면(운영 권장) MVP에서는 비활성화 또는 정책이 필요합니다.<br />
                - 프로젝트 URL/Anon Key가 올바른지 확인하세요.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="status">현황</TabsTrigger>
          <TabsTrigger value="take">가져가기</TabsTrigger>
          <TabsTrigger value="register">등록</TabsTrigger>
          <TabsTrigger value="history">확인</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <InventoryStatusPanel
            items={items}
            rentals={rentals.map(r => ({ id: r.id, created_at: r.created_at, items_taken: r.items_taken }))}
            employeesCount={employees.length}
          />
        </TabsContent>

        <TabsContent value="take">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>가져가기(대여/반출)</CardTitle>
                <CardDescription>얼굴 자동입력 + 선반 QR 전후 비교로 품목을 자동 기록합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <CameraDeviceSelect
                  faceCameraId={faceCameraId}
                  shelfCameraId={shelfCameraId}
                  onFaceCameraChange={setFaceCameraId}
                  onShelfCameraChange={setShelfCameraId}
                />

                <FaceAutoFill
                  employees={employees}
                  faceCameraId={faceCameraId}
                  onRecognized={handleFaceRecognized}
                  onManualOverride={handleManualOverride}
                />

                <div>
                  <Label htmlFor="employee-select">직원 선택 (수동)</Label>
                  <Select
                    value={selectedEmployeeId || ''}
                    onValueChange={(value) => {
                      const emp = employees.find(e => e.id === value);
                      if (emp) {
                        setSelectedEmployeeId(emp.id);
                        setSelectedEmployeeName(emp.name);
                        setSelectedEmployeeTeam(emp.team);
                      }
                    }}
                  >
                    <SelectTrigger id="employee-select">
                      <SelectValue placeholder="직원을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.team} {emp.name} {emp.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ShelfQrScanner
                  shelfCameraId={shelfCameraId}
                  faceCameraId={faceCameraId}
                  onItemsDetected={handleItemsDetected}
                />

                <RentalCommitPanel
                  employeeId={selectedEmployeeId}
                  employeeName={selectedEmployeeName}
                  employeeTeam={selectedEmployeeTeam}
                  itemsTaken={itemsTaken}
                  onSuccess={handleRentalSuccess}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>최근 기록(요약)</CardTitle>
                <CardDescription>최근 20건을 빠르게 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                {displayRentals.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">대여 내역이 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    {displayRentals.map(rental => (
                      <div key={rental.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">
                              {rental.employees?.team ?? '-'} {rental.employees?.name ?? '-'} {rental.employees?.title ?? ''}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(rental.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {rental.items_taken.map((itemId, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                            >
                              {ITEM_MAP[itemId] || itemId}
                            </span>
                          ))}
                        </div>
                        {rental.note && (
                          <p className="text-sm text-gray-600 mt-2">메모: {rental.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="register">
          <div className="grid gap-6 md:grid-cols-2">
            <EmployeeRegisterPanel onCreated={loadEmployees} />
            <ItemConfigPanel items={items} onSaved={loadItems} />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>대여/반출 이력</CardTitle>
              <CardDescription>최근 200건까지 로드되며 화면에는 20건을 표시합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {displayRentals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">대여 내역이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {displayRentals.map(rental => (
                    <div key={rental.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">
                            {rental.employees?.team ?? '-'} {rental.employees?.name ?? '-'} {rental.employees?.title ?? ''}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(rental.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {rental.items_taken.map((itemId, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                          >
                            {ITEM_MAP[itemId] || itemId}
                          </span>
                        ))}
                      </div>
                      {rental.note && (
                        <p className="text-sm text-gray-600 mt-2">메모: {rental.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
