import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

// Mock the resend module
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'email-123' }),
    },
  })),
}));

const { Resend } = jest.requireMock('resend') as { Resend: jest.Mock };

describe('EmailService', () => {
  let service: EmailService;

  function buildModule(resendApiKey: string | undefined) {
    return Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'RESEND_API_KEY') return resendApiKey;
              if (key === 'EMAIL_FROM') return undefined;
              if (key === 'FRONTEND_URL') return undefined;
              return undefined;
            },
          },
        },
      ],
    }).compile();
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when RESEND_API_KEY is not set', () => {
    beforeEach(async () => {
      const module: TestingModule = await buildModule(undefined);
      service = module.get<EmailService>(EmailService);
    });

    it('sendWelcomeEmail should return without calling Resend', async () => {
      await service.sendWelcomeEmail('test@example.com', 'Alice');
      expect(Resend).not.toHaveBeenCalled();
    });

    it('sendSearchCompleteEmail should return without calling Resend', async () => {
      await service.sendSearchCompleteEmail('test@example.com', 'Alice', 'search-1', 5, 'My idea');
      expect(Resend).not.toHaveBeenCalled();
    });
  });

  describe('when RESEND_API_KEY is set', () => {
    let mockSend: jest.Mock;

    beforeEach(async () => {
      mockSend = jest.fn().mockResolvedValue({ id: 'email-123' });
      (Resend as jest.Mock).mockImplementation(() => ({ emails: { send: mockSend } }));
      const module: TestingModule = await buildModule('re_test_key');
      service = module.get<EmailService>(EmailService);
    });

    it('sendWelcomeEmail should call resend.emails.send with correct subject', async () => {
      await service.sendWelcomeEmail('founder@startup.com', 'Alice');
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'founder@startup.com',
          subject: 'Welcome to InvestorMatch — find your investors',
        }),
      );
    });

    it('sendWelcomeEmail uses name in greeting when provided', async () => {
      await service.sendWelcomeEmail('founder@startup.com', 'Alice');
      const call = mockSend.mock.calls[0][0] as { html: string };
      expect(call.html).toContain('Welcome, Alice!');
    });

    it('sendWelcomeEmail uses generic greeting when name is null', async () => {
      await service.sendWelcomeEmail('founder@startup.com', null);
      const call = mockSend.mock.calls[0][0] as { html: string };
      expect(call.html).toContain('Welcome to InvestorMatch!');
    });

    it('sendSearchCompleteEmail should call resend.emails.send with result count in subject', async () => {
      await service.sendSearchCompleteEmail('founder@startup.com', 'Alice', 'search-123', 12, 'AI SaaS for fintech');
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'founder@startup.com',
          subject: 'Your investor search is ready — 12 investors found',
        }),
      );
    });

    it('sendSearchCompleteEmail truncates rawInput longer than 100 chars', async () => {
      const longInput = 'A'.repeat(150);
      await service.sendSearchCompleteEmail('founder@startup.com', null, 'search-1', 3, longInput);
      const call = mockSend.mock.calls[0][0] as { html: string };
      expect(call.html).toContain('A'.repeat(100) + '…');
      expect(call.html).not.toContain('A'.repeat(101));
    });

    it('sendSearchCompleteEmail includes link to search', async () => {
      await service.sendSearchCompleteEmail('founder@startup.com', null, 'search-abc', 5, 'idea');
      const call = mockSend.mock.calls[0][0] as { html: string };
      expect(call.html).toContain('/search/search-abc');
    });
  });
});
