// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.SESSION_SECRET = 'test-session-secret-at-least-32-chars-long'
process.env.HUGGINGFACE_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3001'
