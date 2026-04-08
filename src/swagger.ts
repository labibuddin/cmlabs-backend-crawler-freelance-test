import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Crawler Web API',
      version: '1.0.0',
      description: 'API Documentation for the Headless Playwright Web Crawler',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development Server',
      },
    ],
  },
  // Automatically look for JSDoc comments in all API route files
  apis: ['./src/routes/*.ts'], 
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
  // Serve Swagger UI at /api/docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Crawler API Documentation"
  }));

  // Endpoint to get the swagger JSON
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('📄 Swagger UI exposed at http://localhost:3001/api/docs');
};
