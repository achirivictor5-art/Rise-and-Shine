import authController from '../../../../server/controllers/authController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = (request) => authController.login(request);
