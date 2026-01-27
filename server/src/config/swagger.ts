import swaggerJsdoc from "swagger-jsdoc"

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Guantanamera Core API",
      version: "1.0.0",
      description: "API de pedidos online para Bar Guantanamera",
    },
    servers: [
      {
        url: "https://api.barguantanamera.com",
        description: "Production",
      },
      {
        url: "http://localhost:8000",
        description: "Development",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"], // aquí leerá los comentarios
})
