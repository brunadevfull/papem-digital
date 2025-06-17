import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../server/routes';

describe('End-to-End Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  describe('Complete Workflow', () => {
    it('should handle complete notice lifecycle', async () => {
      // Create a notice
      const newNotice = {
        title: 'E2E Test Notice',
        content: 'Testing complete workflow',
        priority: 'high',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        active: true
      };

      const createResponse = await request(app)
        .post('/api/notices')
        .send(newNotice)
        .expect(200);

      const noticeId = createResponse.body.notice.id;
      expect(createResponse.body.notice.title).toBe(newNotice.title);

      // Read all notices
      const getAllResponse = await request(app)
        .get('/api/notices')
        .expect(200);

      expect(getAllResponse.body.notices).toHaveLength(1);
      expect(getAllResponse.body.total).toBe(1);
      expect(getAllResponse.body.active).toBe(1);

      // Update the notice
      const updateData = {
        ...createResponse.body.notice,
        title: 'Updated E2E Notice',
        priority: 'low'
      };

      const updateResponse = await request(app)
        .put(`/api/notices/${noticeId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.notice.title).toBe('Updated E2E Notice');

      // Verify update
      const getUpdatedResponse = await request(app)
        .get('/api/notices')
        .expect(200);

      const updatedNotice = getUpdatedResponse.body.notices.find((n: any) => n.id === noticeId);
      expect(updatedNotice.title).toBe('Updated E2E Notice');

      // Delete the notice
      await request(app)
        .delete(`/api/notices/${noticeId}`)
        .expect(200);

      // Verify deletion
      const getFinalResponse = await request(app)
        .get('/api/notices')
        .expect(200);

      expect(getFinalResponse.body.notices).toHaveLength(0);
    });

    it('should handle multiple documents with different types', async () => {
      const documents = [
        {
          title: 'PLASA Document',
          url: 'https://example.com/plasa.pdf',
          type: 'plasa',
          category: 'oficial',
          active: true
        },
        {
          title: 'Escala Document',
          url: 'https://example.com/escala.pdf',
          type: 'escala',
          category: 'praca',
          active: true
        },
        {
          title: 'Cardapio Document',
          url: 'https://example.com/cardapio.pdf',
          type: 'cardapio',
          active: false
        }
      ];

      // Create all documents
      const createdDocs = [];
      for (const doc of documents) {
        const response = await request(app)
          .post('/api/documents')
          .send(doc)
          .expect(200);
        
        createdDocs.push(response.body.document);
      }

      // Verify all documents were created
      const getAllResponse = await request(app)
        .get('/api/documents')
        .expect(200);

      expect(getAllResponse.body.documents).toHaveLength(3);

      // Filter by type would be a useful feature
      const plasaDocs = getAllResponse.body.documents.filter((d: any) => d.type === 'plasa');
      const escalaDocs = getAllResponse.body.documents.filter((d: any) => d.type === 'escala');
      const activeDocs = getAllResponse.body.documents.filter((d: any) => d.active === true);

      expect(plasaDocs).toHaveLength(1);
      expect(escalaDocs).toHaveLength(1);
      expect(activeDocs).toHaveLength(2);

      // Clean up
      for (const doc of createdDocs) {
        await request(app)
          .delete(`/api/documents/${doc.id}`)
          .expect(200);
      }
    });

    it('should handle concurrent operations', async () => {
      // Test concurrent notice creation
      const notices = Array.from({ length: 5 }, (_, i) => ({
        title: `Concurrent Notice ${i + 1}`,
        content: `Content ${i + 1}`,
        priority: 'medium',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        active: true
      }));

      // Create all notices concurrently
      const createPromises = notices.map(notice =>
        request(app).post('/api/notices').send(notice)
      );

      const results = await Promise.all(createPromises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      });

      // Verify all were created
      const getAllResponse = await request(app)
        .get('/api/notices')
        .expect(200);

      expect(getAllResponse.body.notices).toHaveLength(5);

      // Clean up
      const deletePromises = results.map(result =>
        request(app).delete(`/api/notices/${result.body.notice.id}`)
      );

      await Promise.all(deletePromises);
    });
  });
});