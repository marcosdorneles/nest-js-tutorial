import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';

describe('app e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3000');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'marcos@email.com',
      password: '123456',
    };
    describe('SingUp', () => {
      it('should throw error ir email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password })
          .expectStatus(400)
          .inspect();
      });

      it('should throw error if no body is provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({})
          .expectStatus(400)
          .inspect();
      });

      it('should singup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
          .inspect();
      });
    });
    describe('SingIn', () => {
      it('should singin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token')
          .inspect();
      });
    });

    describe('User', () => {
      describe('Get me', () => {
        it('should get me', () => {
          return pactum
            .spec()
            .get('/users/me')
            .withHeaders({
              Authorization: `Bearer $S{userAt}`,
            })
            .expectStatus(200)
            .inspect();
        });
      });

      describe('Update User', () => {});
    });

    describe('Bookmark', () => {
      describe('Create Bookmark', () => {});

      describe('Get Bookmarks', () => {});

      describe('Get BookmarkById', () => {});

      describe('Update Bookmark', () => {});

      describe('Delete Bookmark', () => {});
    });
  });
});
