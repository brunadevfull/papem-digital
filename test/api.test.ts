import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../server/routes';

describe('API Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Notices API', () => {
    it('should get all notices', async () => {
      const response = await request(app)
        .get('/api/notices')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('notices');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('active');
      expect(Array.isArray(response.body.notices)).toBe(true);
    });

    it('should create a new notice', async () => {
      const newNotice = {
        title: 'Test Notice',
        content: 'Test content',
        priority: 'medium',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        active: true
      };

      const response = await request(app)
        .post('/api/notices')
        .send(newNotice)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('notice');
      expect(response.body.notice).toHaveProperty('id');
      expect(response.body.notice.title).toBe(newNotice.title);
    });

    it('should update a notice', async () => {
      // First create a notice
      const newNotice = {
        title: 'Original Title',
        content: 'Original content',
        priority: 'low',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        active: true
      };

      const createResponse = await request(app)
        .post('/api/notices')
        .send(newNotice);

      const noticeId = createResponse.body.notice.id;

      // Then update it
      const updatedData = {
        ...createResponse.body.notice,
        title: 'Updated Title',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/notices/${noticeId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.notice.title).toBe('Updated Title');
      expect(response.body.notice.priority).toBe('high');
    });

    it('should delete a notice', async () => {
      // First create a notice
      const newNotice = {
        title: 'To Delete',
        content: 'Delete me',
        priority: 'medium',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        active: true
      };

      const createResponse = await request(app)
        .post('/api/notices')
        .send(newNotice);

      const noticeId = createResponse.body.notice.id;

      // Then delete it
      const response = await request(app)
        .delete(`/api/notices/${noticeId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify it's deleted
      await request(app)
        .put(`/api/notices/${noticeId}`)
        .send({ title: 'Should not work' })
        .expect(404);
    });

    it('should validate notice data', async () => {
      const invalidNotice = {
        title: '', // Empty title should fail validation
        content: 'Test content'
        // Missing required fields
      };

      await request(app)
        .post('/api/notices')
        .send(invalidNotice)
        .expect(400);
    });
  });

  describe('Documents API', () => {
    it('should get all documents', async () => {
      const response = await request(app)
        .get('/api/documents')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('documents');
      expect(Array.isArray(response.body.documents)).toBe(true);
    });

    it('should create a new document', async () => {
      const newDocument = {
        title: 'Test Document',
        url: 'https://example.com/test.pdf',
        type: 'plasa',
        category: 'oficial',
        active: true
      };

      const response = await request(app)
        .post('/api/documents')
        .send(newDocument)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('document');
      expect(response.body.document).toHaveProperty('id');
      expect(response.body.document.title).toBe(newDocument.title);
    });

    it('should update a document', async () => {
      // First create a document
      const newDocument = {
        title: 'Original Document',
        url: 'https://example.com/original.pdf',
        type: 'escala',
        active: true
      };

      const createResponse = await request(app)
        .post('/api/documents')
        .send(newDocument);

      const documentId = createResponse.body.document.id;

      // Then update it
      const updatedData = {
        ...createResponse.body.document,
        title: 'Updated Document',
        active: false
      };

      const response = await request(app)
        .put(`/api/documents/${documentId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.document.title).toBe('Updated Document');
      expect(response.body.document.active).toBe(false);
    });

    it('should delete a document', async () => {
      // First create a document
      const newDocument = {
        title: 'To Delete',
        url: 'https://example.com/delete.pdf',
        type: 'cardapio',
        active: true
      };

      const createResponse = await request(app)
        .post('/api/documents')
        .send(newDocument);

      const documentId = createResponse.body.document.id;

      // Then delete it
      const response = await request(app)
        .delete(`/api/documents/${documentId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify it's deleted
      await request(app)
        .put(`/api/documents/${documentId}`)
        .send({ title: 'Should not work' })
        .expect(404);
    });
  });
});