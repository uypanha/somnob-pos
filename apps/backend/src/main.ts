import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix
  const globalPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  // CORS configuration
  app.enableCors({
    origin: [
      process.env.ADMIN_APP_URL || 'http://localhost:3000',
      process.env.POS_APP_URL || 'http://localhost:3001',
      process.env.CUSTOMER_APP_URL || 'http://localhost:3002',
    ],
    credentials: true,
  });

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Somnob POS API')
    .setDescription('Enterprise multi-branch retail POS backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Somnob POS API is running on: http://localhost:${port}/${globalPrefix}`);
  console.log(`📚 Swagger documentation available at: http://localhost:${port}/docs`);
}

bootstrap();
