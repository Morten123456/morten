from app import create_app

app = create_app()
client = app.test_client()

hr = client.get('/healthz')
print('healthz', hr.status_code, hr.json)

sr = client.post('/api/slot/spin_anon')
print('spin_anon', sr.status_code, sr.json)

if sr.status_code == 200 and isinstance(sr.json, dict) and 'anon_uuid' in sr.json:
    anon_uuid = sr.json['anon_uuid']
    import time
    email = f"test+{int(time.time())}@example.com"
    rr = client.post('/api/leads/register_from_spin', json={
        'anon_uuid': anon_uuid,
        'email': email,
        'name': 'Test User',
        'consent': True
    })
    print('register_from_spin', rr.status_code, rr.json)

    rs = client.post('/api/slot/spin', json={'email': email})
    print('spin_registered', rs.status_code, rs.json)

# admin endpoints
headers = {'Authorization': 'Bearer changeme-admin-token'}
la = client.get('/api/admin/leads', headers=headers)
print('admin_leads', la.status_code, (la.json and len(la.json.get('leads', []))))

csv = client.get('/api/admin/export.csv', headers=headers)
print('admin_export', csv.status_code, len(csv.data) if hasattr(csv, 'data') else None)
