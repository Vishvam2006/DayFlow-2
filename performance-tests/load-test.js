import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp-up to 20 users over 30s
    { duration: '1m', target: 20 },  // stay at 20 users for 1m
    { duration: '20s', target: 0 },  // ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],    // less than 1% errors
  },
};

const BASE_URL = 'http://localhost:5001/api';

export default function () {
  // 1. Authentication
  const loginPayload = JSON.stringify({
    email: 'admin@dayflow.com',
    password: 'admin123',
  });

  const loginHeaders = {
    'Content-Type': 'application/json',
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: loginHeaders,
  });

  const isLoginSuccessful = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has token': (r) => r.json().token !== undefined,
  });

  if (!isLoginSuccessful) {
    console.error(`Login failed for VU ${__VU}: ${loginRes.body}`);
    return;
  }

  const token = loginRes.json().token;
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
  };

  // 2. Fetch Employees
  const employeesRes = http.get(`${BASE_URL}/employee/get`, {
    headers: authHeaders,
  });

  check(employeesRes, {
    'get employees status is 200': (r) => r.status === 200,
  });

  // 3. Fetch Departments
  const departmentsRes = http.get(`${BASE_URL}/department`, {
    headers: authHeaders,
  });

  check(departmentsRes, {
    'get departments status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
